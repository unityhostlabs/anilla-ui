import { addClasses, removeClasses } from './utils.js';

/** @type {TransitionOptions} */
const defaults = {
    transitionEnter: null,
    transitionEnterFrom: null,
    transitionEnterTo: null,
    transitionLeave: null,
    transitionLeaveFrom: null,
    transitionLeaveTo: null,
};

/**
 * Transition
 *
 * Orchestrates CSS transitions and animations using a class-swapping strategy
 * inspired by Alpine.js / Tailwind UI:
 *
 *   1. Add  `<effect>`      — the base class (e.g. "transition duration-300")
 *   2. Add  `<effect>From`  — the starting state (e.g. "opacity-0 scale-95")
 *   3. Remove `<effect>From`,  add `<effect>To` — the ending state (e.g. "opacity-100 scale-100")
 *   4. On transitionend / animationend — remove base + To classes, fire callback
 *
 * Config key convention:
 * 
 *   - transitionEnter      — base classes applied for the whole enter transition
 *   - transitionEnterFrom  — enter start state
 *   - transitionEnterTo    — enter end state
 *   - transitionLeave      — base classes applied for the whole leave transition
 *   - transitionLeaveFrom  — leave start state
 *   - transitionLeaveTo    — leave end state
 *
 * @example
 *   {
 *     transitionEnter:     'transition duration-300 ease-out',
 *     transitionEnterFrom: 'opacity-0 scale-95',
 *     transitionEnterTo:   'opacity-100 scale-100',
 *     transitionLeave:     'transition duration-200 ease-in',
 *     transitionLeaveFrom: 'opacity-100 scale-100',
 *     transitionLeaveTo:   'opacity-0 scale-95',
 *   }
 */
export class Transition {
    /**
     * Default values for all transition options.
     * Merged into the validation whitelist in BaseComponent.parseDataAttributes
     * so that data-{component}-transition-* attributes are never filtered out.
     * 
     * @returns {Record<string, null>}
     */
    static get defaults() {
        return defaults;
    }

    /** @type {Record<string, string>} */
    #config = {};

    /** @type {'transition'|'animation'} */
    type = 'transition';

    /** Transition/animation duration in seconds (read from computed styles). */
    duration = 0;

    /** Timing function (read from computed styles). */
    timing = 'ease';

    /** Whether _execute has been called and classes have been applied. */
    initialized = false;

    /** Whether a transition/animation is currently running. */
    busy = false;

    /**
     * The active effect name.
     * 
     * @type {'transitionEnter'|'transitionLeave'|null}
     */
    effect = null;

    /** The element currently being transitioned. */
    target = null;

    /** @param {Record<string, string>} config */
    constructor(config) {
        this.#config = config;
    }

    // --- Core

    /**
     * Run a named transition effect on an element.
     *
     * @param {'transitionEnter'|'transitionLeave'} effect
     * @param {HTMLElement} element
     * @param {(e: TransitionEvent|AnimationEvent) => void} [callback]
     * @returns {boolean} false if the effect is not configured
     */
    _execute(effect, element, callback) {
        const base = this.#config[effect];
        const from = this.#config[`${effect}From`];
        const to = this.#config[`${effect}To`];

        if (!base) return false;

        this.initialized = false;

        addClasses(element, base);
        if (from) addClasses(element, from);

        // Detect whether CSS transition or animation is driving this
        const styles = window.getComputedStyle(element);
        const isAnimation =
            styles.animationName !== 'none' &&
            parseFloat(styles.animationDuration) > 0;

        this.type = isAnimation ? 'animation' : 'transition';
        this.duration = parseFloat(
            isAnimation ? styles.animationDuration : styles.transitionDuration
        );
        this.timing = isAnimation
            ? styles.animationTimingFunction
            : styles.transitionTimingFunction;

        element.addEventListener(
            `${this.type}start`,
            () => {
                this.busy = true;
                this.effect = effect;
                this.target = element;
            },
            { once: true }
        );

        element.addEventListener(
            `${this.type}cancel`,
            () => {
                this.busy = false;
                this.effect = null;
                this.target = null;
            },
            { once: true }
        );

        element.addEventListener(
            `${this.type}end`,
            (e) => {
                this.busy = false;
                this.initialized = false;
                this.effect = null;
                this.target = null;

                if (typeof callback === 'function') {
                    callback(e);
                }

                removeClasses(element, base);
                if (to) removeClasses(element, to);
            },
            { once: true }
        );

        // Swap From → To on the next frame to trigger the CSS transition
        window.requestAnimationFrame(() => {
            if (from) removeClasses(element, from);
            if (to) addClasses(element, to);
        });

        this.initialized = true;
        return true;
    }

    // --- Public API

    /**
     * Run the enter transition.
     * 
     * @param {HTMLElement} element
     * @param {(e: TransitionEvent|AnimationEvent) => void} [callback]
     */
    enter(element, callback) {
        return this._execute('transitionEnter', element, callback);
    }

    /**
     * Run the leave transition.
     * 
     * @param {HTMLElement} element
     * @param {(e: TransitionEvent|AnimationEvent) => void} [callback]
     */
    leave(element, callback) {
        return this._execute('transitionLeave', element, callback);
    }

    /**
     * Whether either an enter or leave transition is configured.
     * 
     * @returns {boolean}
     */
    exists() {
        return !!(this.#config.transitionEnter || this.#config.transitionLeave);
    }

    /**
     * Immediately cancel the active transition and strip all applied classes.
     */
    cancel() {
        if (!this.effect || !this.target) return;

        const base = this.#config[this.effect];
        const from = this.#config[`${this.effect}From`];
        const to = this.#config[`${this.effect}To`];

        if (base) removeClasses(this.target, base);
        if (from) removeClasses(this.target, from);
        if (to) removeClasses(this.target, to);

        this.busy = false;
        this.effect = null;
        this.target = null;
    }

    /**
     * Returns the full DOM event name for a given transition phase.
     * 
     * @param {'start'|'end'|'cancel'} phase
     * @returns {string} e.g. 'transitionend' | 'animationend'
     */
    event(phase) {
        return `${this.type}${phase}`;
    }
}