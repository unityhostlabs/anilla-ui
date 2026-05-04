/**
 * EventBus
 *
 * Lightweight publish/subscribe event system scoped to each component instance.
 * Tracks every listener so they can be mass-removed on destroy().
 */
export class EventBus {
    /** @type {Map<string, Set<Function>>} */
    #listeners = new Map();

    /**
     * Subscribe to an event.
     * 
     * @param {string} event
     * @param {Function} handler
     * @returns {() => void}
     */
    on(event, handler) {
        if (!this.#listeners.has(event)) {
            this.#listeners.set(event, new Set());
        }
        this.#listeners.get(event).add(handler);

        // Return a convenient unsubscribe shortcut
        return () => this.off(event, handler);
    }

    /**
     * Subscribe to an event exactly once.
     * 
     * @param {string} event
     * @param {Function} handler
     * @returns {() => void}
     */
    once(event, handler) {
        const wrapper = (...args) => {
            handler(...args);
            this.off(event, wrapper);
        };

        return this.on(event, wrapper);
    }

    /**
     * Unsubscribe a specific handler (or all handlers) from an event.
     * 
     * @param {string} event
     * @param {Function} [handler] Omit to remove all handlers for this event.
     */
    off(event, handler) {
        if (!this.#listeners.has(event)) return;

        if (handler) {
            this.#listeners.get(event).delete(handler);

            if (this.#listeners.get(event).size === 0) {
                this.#listeners.delete(event);
            }
        } else {
            this.#listeners.delete(event);
        }
    }

    /**
     * Emit an event, passing arbitrary data to every subscriber.
     * 
     * @param {string} event
     * @param {...any} args
     */
    emit(event, ...args) {
        if (!this.#listeners.has(event)) return;

        for (const handler of this.#listeners.get(event)) {
            handler(...args);
        }
    }

    /**
     * Return all registered event names (useful for debugging).
     * 
     * @returns {string[]}
     */
    eventNames() {
        return [...this.#listeners.keys()];
    }

    /**
     * Remove every listener for every event.
     */
    clear() {
        this.#listeners.clear();
    }
}