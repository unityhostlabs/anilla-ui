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
 * @typedef {'idle'|'entering'|'entered'|'leaving'|'cancelled'} TransitionState
 */

/**
 * Transition
 *
 * Orchestrates CSS transitions and animations using a class-swapping strategy
 * inspired by Alpine.js / Tailwind UI.
 */
export class Transition {
    /**
     * Default transition option values.
     * 
     * @returns {Record<string, null>}
     */
    static get defaults() {
        return defaults;
    }

    /** @type {Record<string, string>} */
    #config = {};

    /** @type {AbortController|null} */
    #controller = null;

    /**
     * Incremented for every transition execution.
     * Used to invalidate stale async callbacks.
     * 
     * @type {number}
     */
    #transitionId = 0;

    /** @type {'transition'|'animation'} */
    type = 'transition';

    /** Transition/animation duration in seconds. */
    duration = 0;

    /** Timing function. */
    timing = 'ease';

    /** Whether transition classes have been initialized. */
    initialized = false;

    /**
     * Active effect name.
     * 
     * @type {'transitionEnter'|'transitionLeave'|null}
     */
    effect = null;

    /** Active transition target element. */
    target = null;

    /**
     * Current transition state.
     * 
     * @type {TransitionState}
     */
    state = 'idle';

    /** @param {Record<string, string>} config */
    constructor(config) {
        this.#config = config;
    }

    // -------------------------------------------------------------------------
    // State Helpers
    // -------------------------------------------------------------------------

    /**
     * @param {TransitionState} state
     */
    #setState(state) {
        this.state = state;
    }

    /**
     * @returns {boolean}
     */
    isIdle() {
        return this.state === 'idle';
    }

    /**
     * @returns {boolean}
     */
    isEntering() {
        return this.state === 'entering';
    }

    /**
     * @returns {boolean}
     */
    isEntered() {
        return this.state === 'entered';
    }

    /**
     * @returns {boolean}
     */
    isLeaving() {
        return this.state === 'leaving';
    }

    /**
     * @returns {boolean}
     */
    isCancelled() {
        return this.state === 'cancelled';
    }

    /**
     * Whether a transition is currently active.
     * 
     * @returns {boolean}
     */
    isBusy() {
        return (
            this.isEntering() ||
            this.isLeaving()
        );
    }

    // -------------------------------------------------------------------------
    // Internal Helpers
    // -------------------------------------------------------------------------

    /**
     * Remove all classes associated with an effect.
     * 
     * @param {'transitionEnter'|'transitionLeave'} effect
     * @param {HTMLElement} element
     */
    #cleanup(effect, element) {
        const base = this.#config[effect];
        const from = this.#config[`${effect}From`];
        const to = this.#config[`${effect}To`];

        if (base) removeClasses(element, base);
        if (from) removeClasses(element, from);
        if (to) removeClasses(element, to);
    }

    /**
     * Reset transition runtime state.
     */
    #reset() {
        this.initialized = false;
        this.effect = null;
        this.target = null;
    }

    /**
     * Run a transition effect.
     * 
     * @param {'transitionEnter'|'transitionLeave'} effect
     * @param {HTMLElement} element
     * @param {(e: TransitionEvent|AnimationEvent) => void} [callback]
     * @returns {boolean}
     */
    _execute(effect, element, callback) {
        const base = this.#config[effect];
        const from = this.#config[`${effect}From`];
        const to = this.#config[`${effect}To`];

        if (!base) return false;

        // Fully invalidate any currently running transition.
        this.cancel();

        const transitionId = ++this.#transitionId;

        const controller = new AbortController();
        this.#controller = controller;

        this.effect = effect;
        this.target = element;

        this.#setState(
            effect === 'transitionEnter'
                ? 'entering'
                : 'leaving'
        );

        addClasses(element, base);

        if (from) {
            addClasses(element, from);
        }

        // Detect whether transition or animation is active.
        const styles = window.getComputedStyle(element);

        const isAnimation =
            styles.animationName !== 'none' &&
            parseFloat(styles.animationDuration) > 0;

        this.type = isAnimation ? 'animation' : 'transition';

        this.duration = parseFloat(
            isAnimation
                ? styles.animationDuration
                : styles.transitionDuration
        );

        this.timing = isAnimation
            ? styles.animationTimingFunction
            : styles.transitionTimingFunction;

        element.addEventListener(
            this.event('cancel'),
            () => {
                // Ignore stale transitions.
                if (transitionId !== this.#transitionId) return;

                this.#reset();
                this.#setState('cancelled');
            },
            {
                once: true,
                signal: controller.signal,
            }
        );

        element.addEventListener(
            this.event('end'),
            (e) => {
                // Ignore stale transitions.
                if (transitionId !== this.#transitionId) return;

                this.#cleanup(effect, element);
                this.#reset();

                this.#setState(
                    effect === 'transitionEnter'
                        ? 'entered'
                        : 'idle'
                );

                if (typeof callback === 'function') {
                    callback(e);
                }
            },
            {
                once: true,
                signal: controller.signal,
            }
        );

        // Trigger transition on next frame.
        window.requestAnimationFrame(() => {
            // Ignore stale transitions.
            if (transitionId !== this.#transitionId) return;

            if (from) {
                removeClasses(element, from);
            }

            if (to) {
                addClasses(element, to);
            }

            this.initialized = true;
        });

        return true;
    }

    // -------------------------------------------------------------------------
    // Public API
    // -------------------------------------------------------------------------

    /**
     * Run enter transition.
     * 
     * @param {HTMLElement} element
     * @param {(e: TransitionEvent|AnimationEvent) => void} [callback]
     * @returns {boolean}
     */
    enter(element, callback) {
        return this._execute('transitionEnter', element, callback);
    }

    /**
     * Run leave transition.
     * 
     * @param {HTMLElement} element
     * @param {(e: TransitionEvent|AnimationEvent) => void} [callback]
     * @returns {boolean}
     */
    leave(element, callback) {
        return this._execute('transitionLeave', element, callback);
    }

    /**
     * Whether either an enter or leave transition exists.
     * 
     * @returns {boolean}
     */
    exists() {
        return !!(
            this.#config.transitionEnter ||
            this.#config.transitionLeave
        );
    }

    /**
     * Immediately cancel the active transition.
     */
    cancel() {
        if (!this.effect || !this.target) return;

        // Invalidate all active async work.
        this.#transitionId++;

        // Abort all listeners associated with this transition.
        this.#controller?.abort();

        this.#cleanup(this.effect, this.target);

        this.#controller = null;

        this.#reset();
        this.#setState('cancelled');
    }

    /**
     * Returns the full DOM event name for a transition phase.
     * 
     * @param {'start'|'end'|'cancel'} phase
     * @returns {string}
     */
    event(phase) {
        return `${this.type}${phase}`;
    }
}