import { EventBus } from './EventBus.js';
import { DOMEventStore } from './DOMEventStore.js';
import { Registry } from './Registry.js';
import { Transition } from './Transition.js';
import { config, logger } from './config.js';
import { parseComponentDataAttributes } from './utils.js';

/**
 * Shortcut for all standard browser events including Window-specific ones
 * @typedef {GlobalEventHandlersEventMap & WindowEventHandlersEventMap} BrowserEvents
 */

/**
 * Reusable handler using the shortcut
 * @template {keyof BrowserEvents} K
 * @typedef {(this: any, ev: BrowserEvents[K]) => any} DOMEventHandler
 */

/**
 * Dynamically creates callback hooks from an event map.
 * Takes 'change' and turns it into 'onChange?: (payload: { instance: any } & T['change']) => void'
 * 
 * @template {Record<string, any>} T
 * @template ComponentInstance
 * @typedef {{ [K in Extract<keyof T, string> as `on${Capitalize<K>}`]?: (payload: { instance: ComponentInstance } & T[K]) => void } & { onDestroy?: (payload: { instance: ComponentInstance }) => void }} EventCallbacks
 */

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
     * @param {HTMLElement} el
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

    /** @type {HTMLElement} */
    #el;

    /** @type {O & EventCallbacks<T, any>} */
    #options;

    /**
     * Merged defaults from Transition and the component subclass.
     * Computed once at construction and reused by setOptions().
     * 
     * @type {O & EventCallbacks<T, any>}
     */
    #allDefaults;

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
    constructor(target, options = /** @type {O} */ ({})) {
        // Resolve element
        if (typeof target === 'string') {
            const el = document.querySelector(target);

            if (!el) {
                throw new Error(
                    `[${config.name} / ${this.name}] No element found for selector "${target}".`
                );
            }

            this.#el = /** @type {HTMLElement} */ (el);
        } else if (target instanceof Element) {
            this.#el = /** @type {HTMLElement} */ (target);
        } else {
            throw new TypeError(
                `[${config.name} / ${this.name}] First argument must be a CSS selector string or an Element.`
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
        const staticConstructor = /** @type {typeof BaseComponent} */ (this.constructor);
        const dataOptions = staticConstructor.parseDataAttributes(this.#el);
        
        this.#options = {
            ...staticConstructor.defaults,
            ...options,
            ...dataOptions,
        };

        // Build a Transition instance from any transition-related options
        this.#transition = new Transition(this.#options);

        // Register in global store so it can be retrieved later
        Registry.set(this.#el, this.name, this);

        logger.info(`${this.name}: initialized`, this.#el);
    }

    // --- Public Accessors

    /**
     * Get the component name dynamically from the constructor.
     * 
     * @type {string}
     */
    get name() {
        // @ts-ignore - tells the IDE to ignore static constructor properties
        return this.constructor.componentName;
    }

    /** The root DOM element this component is bound to. */
    get el() {
        return this.#el;
    }

    /**
     * @typedef {O & EventCallbacks<T, any> & import('./Transition.js').TransitionOptions} OptionsPayload
     */

    /** 
     * Merged options object (static defaults + user options).
     * 
     * @returns {OptionsPayload}
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

    /**
     * Merge new values into the current options and emit an 'optionsUpdated'
     * event. Only keys already present in the component's defaults (plus
     * transition keys) are accepted — unknown keys are warned and discarded,
     * keeping the same validation contract as data attribute parsing.
     *
     * If the update includes options that have DOM side effects (e.g. adding or
     * removing a keydown listener because escClose changed), override
     * _onOptionsUpdate(changed) in the subclass to handle those re-applications.
     *
     * @param {OptionsPayload} [newOptions]
     * @returns {OptionsPayload} The updated options object
     *
     * @example
     * // Disable dismissal during a form submission
     * modal.setOptions({ backdropClose: false, escClose: false });
     *
     * // Re-enable after submission completes
     * modal.setOptions({ backdropClose: true, escClose: true });
     *
     * // Update transition classes at runtime
     * modal.setOptions({ transitionEnter: 'transition duration-500' });
     */
    setOptions(newOptions = /** @type {OptionsPayload} */ ({})) {
        if (this.#destroyed) {
            logger.warn(`${this.name}: setOptions() called after destroy() — ignored.`);

            return this.#options;
        }

        const allDefaults = this.#allDefaults;

        // Validate — only accept keys declared in defaults
        const valid = {};
        const invalid = [];

        for (const [key, value] of Object.entries(newOptions)) {
            if (key in allDefaults) {
                valid[key] = value;
            } else {
                invalid.push(key);
            }
        }

        if (invalid.length) {
            logger.warn(
                `${this.name}: setOptions() received unknown keys: ${invalid.join(', ')} — ignored.`
            );
        }

        if (Object.keys(valid).length === 0) return this.#options;

        const previous = { ...this.#options };
        Object.assign(this.#options, valid);

        // Rebuild the Transition instance if any transition option changed
        const transitionKeys = Object.keys(Transition.defaults);
        const transitionChanged = Object.keys(valid).some((k) => transitionKeys.includes(k));

        if (transitionChanged) {
            this.#transition = new Transition(this.#options);
        }

        // Let the subclass react to specific option changes
        this._onOptionsUpdate(
            /** @type {any} */ (valid), 
            /** @type {any} */ (previous)
        );

        this.emit('optionsUpdated', { options: this.#options, changed: valid, previous });

        return this.#options;
    }

    /**
     * Called by setOptions() after the options object has been updated.
     * Override in subclasses to re-apply any side effects that depend on
     * the changed options (e.g. rebinding or removing DOM listeners).
     *
     * @param {OptionsPayload} changed   Only the keys that were updated
     * @param {OptionsPayload} previous  The full options object before the update
     */
    _onOptionsUpdate(changed, previous) { }

    // --- Publish/Subscribe (component event bus)

    /**
     * Subscribe to a component lifecycle / custom event.
     * 
     * @param {Extract<keyof T, string> | 'destroy'} event
     * @param {(...args: any[]) => void} handler
     * @returns {() => void}
     */
    on(event, handler) {
        return this.#bus.on(event, handler);
    }

    /**
     * Subscribe to a component event exactly once.
     * 
     * @param {Extract<keyof T, string> | 'destroy'} event
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
     * @param {Extract<keyof T, string> | 'destroy'} event
     * @param {(...args: any[]) => void} [handler]
     */
    off(event, handler) {
        this.#bus.off(event, handler);
    }

    /**
     * Emit a component event using a unified payload object.
     *
     * Fires on three pipelines simultaneously:
     *   1. Internal EventBus  — reaches listeners registered via this.on()
     *   2. Native DOM event   — reaches listeners registered via element.addEventListener()
     *   3. Config Callbacks   — reaches hooks declared in configuration (e.g., onChange)
     *
     * Every pipeline receives a single, flattened payload object. The base class 
     * automatically injects the component instance as the `instance` property.
     * 
     * The native event name is prefixed with config.dataPrefix + ':' to avoid
     * collisions with built-in DOM events:
     * -  'change' → 'ui:change'
     * -  'destroy' → 'ui:destroy'
     *
     * The CustomEvent bubbles by default so parent elements can also listen.
     * 
     * @example
     *   this.emit('change', { from: 'light', to: 'dark' });
     *
     *   // 1. EventBus listener (using object destructuring)
     *   theme.on('change', ({ instance, from, to }) => { ... });
     *
     *   // 2. Native DOM listener (reads directly from e.detail)
     *   el.addEventListener('ui:change', (e) => {
     *       const { instance, from, to } = e.detail;
     *   });
     *
     *   // 3. Programmatic Configuration Callback
     *   new Theme('#el', {
     *       onChange: ({ instance, from, to }) => { ... }
     *   });
     *
     * @param {Extract<keyof T, string> | 'destroy' | 'optionsUpdated'} event - Custom event name or core lifecycle event
     * @param {Record<string, any>} [payload={}] - Additional event parameters to merge alongside the instance
     */
    emit(event, payload = {}) {
        // Build the unified payload object, ensuring the instance is always included
        const unifiedPayload = Object.assign({ instance: this }, payload);

        // Fire on the internal event bus with the object payload
        this.#bus.emit(String(event), unifiedPayload);

        // Dispatch the native browser CustomEvent carrying the exact same payload
        this.#el.dispatchEvent(
            new CustomEvent(`${config.dataPrefix}:${String(event)}`, {
                detail: unifiedPayload,
                bubbles: true,
                cancelable: true,
            })
        );

        // Automatically trigger matching options callback (e.g., 'change' -> 'onChange')
        const eventStr = String(event);
        const callbackKey = `on${eventStr.charAt(0).toUpperCase()}${eventStr.slice(1)}`;
        
        const callback = /** @type {any} */ (this.options)[callbackKey];
        if (typeof callback === 'function') {
            callback(unifiedPayload);
        }
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
     * @param {Element | Window | Document} el
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
     * @returns {Readonly<Array<{ el: Element | Window | Document | MediaQueryList, type: string, handler: EventListenerOrEventListenerObject, options?: any }>>}
     */
    get domEvents() {
        return this.#domEvents.getAll();
    }

    // ---Lifecycle

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

        this.emit('destroy', this);

        // Tear down listeners
        this.#domEvents.removeAll();
        this.#bus.clear();

        // Remove from registry
        Registry.delete(this.#el, this.name);
        logger.info(`${this.name}: destroyed`, this.#el);
    }

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