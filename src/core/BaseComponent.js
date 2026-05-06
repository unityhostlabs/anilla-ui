import { EventBus } from './EventBus.js';
import { DOMEventStore } from './DOMEventStore.js';
import { Registry } from './Registry.js';
import { Transition } from './Transition.js';
import { config, logger } from './config.js';
import { parseComponentDataAttributes } from './utils.js';

/**
 * BaseComponent
 *
 * The foundation every component extends. Handles:
 *  - Element resolution (string selector → Element)
 *  - Option merging with defaults
 *  - Internal publish/subscribe event bus (on / once / off / emit)
 *  - Native DOM event tracking (addListener / removeListener)
 *  - Auto-registration in the global Registry
 *  - Lifecycle hooks (init, destroy)
 *
 * @template {Record<string, any>} T - Event Map
 * @template {Record<string, any>} [O=Record<string, any>] - Options Map
 * @abstract
 */
export class BaseComponent {
    /**
     * Override in subclasses to declare default option values.
     * These will be merged with user options passed to the constructor 
     * and options read from data attributes.
     * 
     * @returns {Record<string, any>}
     */
    static get defaults() {
        return {};
    }

    /**
     * The unique name used as the registry key.
     * Override in every subclass.
     * 
     * @returns {string}
     */
    static get componentName() {
        return 'BaseComponent';
    }

    /**
     * Read all `data-{componentSlug}-*` attributes off an element and return
     * a plain options object. The browser's dataset API handles kebab → camelCase
     * conversion automatically, so no manual attribute map is needed.
     *
     * Called automatically by AutoInit. Can also be used manually:
     *   const opts = Modal.parseDataAttributes(el);
     *
     * @param {Element} el
     * @returns {Record<string, any>}
     */
    static parseDataAttributes(el) {
        const slug = this.componentName.toLowerCase();
        // Merge Transition.defaults so transition-* attributes always pass the
        // whitelist check, regardless of what each component declares in defaults.
        const allDefaults = { ...Transition.defaults, ...this.defaults };

        return parseComponentDataAttributes(el, slug, allDefaults);
    }

    // --- Private State

    /** @type {Element} */
    #el;

    /** @type {O} */
    #options;

    /** @type {EventBus} */
    #bus = new EventBus();

    /** @type {DOMEventStore} */
    #domEvents = new DOMEventStore();

    /** @type {Transition} */
    #transition;

    /** @type {boolean} */
    #destroyed = false;

    /**
     * Constructor
     * 
     * @param {string|Element} target CSS selector string or DOM Element.
     * @param {O} [options]
     */
    constructor(target, options = {}) {
        // Resolve element
        if (typeof target === 'string') {
            const el = document.querySelector(target);

            if (!el) {
                throw new Error(
                    `[${config.name} / ${this.constructor.componentName}] No element found for selector "${target}".`
                );
            }

            this.#el = el;
        } else if (target instanceof Element) {
            this.#el = target;
        } else {
            throw new TypeError(
                `[${config.name} / ${this.constructor.componentName}] First argument must be a CSS selector string or an Element.`
            );
        }

        // Merge options in priority order (lowest → highest):
        //   1. static defaults         — baseline values declared on the class
        //   2. constructor options     — values passed programmatically via new Component(el, opts)
        //   3. data attribute options  — values read from the element's data-* attributes
        //
        // Data attributes will always override JS options because they are scoped to the specific
        // element in the HTML, making them the most intentional declaration.
        // This means data-dropdown-trigger="#btn" will always override
        // new Dropdown(el, { trigger: '#other' }) for that element.
        const dataOptions = this.constructor.parseDataAttributes(this.#el);
        this.#options = {
            ...this.constructor.defaults,
            ...options,
            ...dataOptions,
        };

        // Build a Transition instance from any transition-related options
        this.#transition = new Transition(this.#options);

        // Register in global store so it can be retrieved later
        Registry.set(this.#el, this.constructor.componentName, this);

        logger.info(`${this.constructor.componentName}: initialized`, this.#el);

        // Call subclass hook
        this._init();
    }

    // --- Public Accessors

    /** The root DOM element this component is bound to. */
    get el() {
        return this.#el;
    }

    /** 
     * Merged options object (static defaults + user options).
     * 
     * @returns {O & TransitionOptions} 
     */
    get options() {
        return this.#options;
    }

    /**
     * The Transition instance for this component.
     * Use transition.enter(el) / transition.leave(el) to run CSS transitions.
     */
    get transition() {
        return this.#transition;
    }

    /** Whether destroy() has been called. */
    get isDestroyed() {
        return this.#destroyed;
    }

    // --- Publish/Subscribe (component event bus)

    /**
     * Subscribe to a component lifecycle / custom event.
     * 
     * @param {keyof T} event
     * @param {(...args: any[]) => void} handler
     * @returns {() => void}
     */
    on(event, handler) {
        return this.#bus.on(event, handler);
    }

    /**
     * Subscribe to a component event exactly once.
     * 
     * @param {keyof T} event
     * @param {(...args: any[]) => void} handler
     * @returns {() => void}
     */
    once(event, handler) {
        return this.#bus.once(event, handler);
    }

    /**
     * Unsubscribe from a component event.
     * If handler is omitted, all handlers for the event will be removed.
     * 
     * @param {keyof T} event
     * @param {(...args: any[]) => void} [handler]
     */
    off(event, handler) {
        this.#bus.off(event, handler);
    }

    /**
     * Emit a component event.
     * Event handlers will receive any additional arguments passed to emit() after the event name.
     * For example: this.emit('open', data) will pass data to all handlers subscribed to 'open'.
     * 
     * @param {keyof T} event 
     * @param {...any} args
     */
    // emit(event, ...args) {
    //     this.#bus.emit(event, ...args);
    // }

    /**
     * Emit a component event.
     *
     * Fires on two pipelines simultaneously:
     *   1. Internal EventBus  — reaches listeners registered via this.on()
     *   2. Native DOM event   — reaches listeners registered via element.addEventListener()
     *
     * The native CustomEvent carries all extra arguments merged into a
     * `detail` object alongside the component instance:
     *
     *   this.emit('change', { from: 'a', to: 'b' })
     *
     *   // EventBus listener
     *   modal.on('change', (payload) => payload)  // { from: 'a', to: 'b' }
     *
     *   // DOM listener
     *   el.addEventListener('ui:change', (e) => e.detail)
     *   // { instance: modal, from: 'a', to: 'b' }
     *
     * The native event name is prefixed with config.dataPrefix + ':' to avoid
     * collisions with built-in DOM events:
     *   'change' → 'ui:change'
     *   'shown'  → 'ui:shown'
     *
     * The CustomEvent bubbles by default so parent elements can also listen.
     *
     * @param {keyof T} event
     * @param {...any} args
     */
    emit(event, ...args) {
        // Fire on the internal bus
        this.#bus.emit(event, ...args);

        // Dispatch a native CustomEvent on the element
        // Merge all extra args + the component instance into the detail object.
        const detail = Object.assign({ instance: this }, ...args.map((arg) =>
            arg !== null && typeof arg === 'object' && !Array.isArray(arg) ? arg : { data: arg }
        ));

        this.#el.dispatchEvent(
            new CustomEvent(`${config.dataPrefix}:${event}`, {
                detail,
                bubbles: true,
                cancelable: true,
            })
        );
    }

    /**
     * Return all currently subscribed event names on this instance's bus.
     * Useful for debugging or introspection.
     * 
     * @returns {string[]}
     */
    get events() {
        return this.#bus.eventNames();
    }

    // --- Native DOM Event Tracking

    /**
     * Attach a native DOM listener and track it for cleanup.
     * Prefer this over bare addEventListener inside subclasses.
     *
     * @template {keyof BrowserEvents} K
     * @param {Element|Window|Document} el
     * @param {K} type
     * @param {DOMEventHandler<K>} handler
     * @param {boolean|AddEventListenerOptions} [options]
     */
    addListener(el, type, handler, options) {
        this.#domEvents.add(el, type, handler, options);
    }

    /**
     * Remove a specific tracked native DOM listener.
     * Prefer this over bare removeEventListener inside subclasses.
     * 
     * @template {keyof BrowserEvents} K
     * @param {Element|Window|Document} el
     * @param {K} type
     * @param {DOMEventHandler<K>} handler
     */
    removeListener(el, type, handler) {
        this.#domEvents.remove(el, type, handler);
    }

    /**
     * Return a read-only snapshot of all tracked DOM listeners.
     * Useful for debugging or introspection.
     * 
     * @returns {Readonly<Array<{el: Element, type: string, handler: Function}>>}
     */
    get domEvents() {
        return this.#domEvents.getAll();
    }

    // ---Lifecycle

    /**
     * Called automatically by the constructor after the instance is set up.
     * Override in subclasses to perform initialization work.
     * @protected
     */
    _init() { }

    /**
     * Teardown the component:
     *  1. Call _onDestroy() hook for subclass cleanup
     *  2. Remove all tracked DOM listeners
     *  3. Clear the internal event bus
     *  4. Unregister from the global Registry
     *  5. Remove the data attribute from the element
     */
    destroy() {
        if (this.#destroyed) return;
        this.#destroyed = true;

        // Let subclasses do their own cleanup first
        this._onDestroy();

        this.emit('destroy', this);

        // Tear down listeners
        this.#domEvents.removeAll();
        this.#bus.clear();

        // Remove from registry
        Registry.delete(this.#el, this.constructor.componentName);
        logger.info(`${this.constructor.componentName}: destroyed`, this.#el);
    }

    /**
     * Override in subclasses for component-specific teardown logic.
     * Called before listeners / bus are cleared.
     * 
     * @protected
     */
    _onDestroy() { }

    // --- Static Factory Helpers 

    /**
     * Retrieve an existing instance by CSS selector or Element.
     * 
     * @param {string|Element} target
     * @returns {BaseComponent|undefined}
     */
    static getInstance(target) {
        return Registry.get(target, this.componentName);
    }

    /**
     * Return every existing instance of this component type.
     * Useful for debugging or introspection.
     * 
     * @returns {BaseComponent[]}
     */
    static getInstances() {
        return Registry.getAllOfType(this.componentName);
    }

    /**
     * Initialize the component on every element matching the selector.
     * The same options object is passed to every instance, but data attributes on each element will override these options on a per-instance basis.
     * 
     * @param {string} selector CSS selector
     * @param {Record<string, any>} [options]
     * @returns {BaseComponent[]} All created instances
     */
    static initAll(selector, options = {}) {
        return [...document.querySelectorAll(selector)].map(
            (el) => new this(el, options)
        );
    }
}