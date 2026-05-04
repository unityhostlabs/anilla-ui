/**
 * DOMEventStore
 *
 * Wraps addEventListener / removeEventListener and keeps a record of every
 * native listener attached through this store so they can all be cleaned up
 * at once on component destroy.
 */
export class DOMEventStore {
    /** @type {Array<{el: Element, type: string, handler: Function, options: any}>} */
    #entries = [];

    /**
     * Attach a native DOM listener and record it.
     * 
     * @param {Element|Window|Document} el
     * @param {string} type
     * @param {Function} handler
     * @param {boolean|AddEventListenerOptions} [options]
     */
    add(el, type, handler, options) {
        el.addEventListener(type, handler, options);
        this.#entries.push({ el, type, handler, options });
    }

    /**
     * Remove a specific listener that was previously added through this store.
     * 
     * @param {Element|Window|Document} el
     * @param {string} type
     * @param {Function} handler
     */
    remove(el, type, handler) {
        this.#entries = this.#entries.filter((entry) => {
            if (entry.el === el && entry.type === type && entry.handler === handler) {
                el.removeEventListener(type, handler, entry.options);
                return false;
            }
            return true;
        });
    }

    /**
     * Remove all tracked DOM listeners.
     */
    removeAll() {
        for (const { el, type, handler, options } of this.#entries) {
            el.removeEventListener(type, handler, options);
        }
        this.#entries = [];
    }

    /**
     * Return a snapshot of all recorded entries (read-only, for debugging).
     * 
     * @returns {Readonly<Array<{el: Element, type: string, handler: Function, options: any}>>}
     */
    getAll() {
        return Object.freeze([...this.#entries]);
    }
}