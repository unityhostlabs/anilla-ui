import { isString, isEmpty } from './utils.js';

/**
 * DataStorage
 *
 * A simplified Web Storage class for storing data in local or session storage.
 */
export class DataStorage {

    /** @type {string|undefined} */
    #prefix = undefined;

    /** @type {string} */
    #delimiter = ':';

    /** @type {Storage} */
    #storage = localStorage

    /**
     * @param {string} [keyPrefix] 
     * @param {'local'|'session'} [storageType]
     */
    constructor(keyPrefix, storageType) {
        this.#prefix = isString(keyPrefix) ? `${keyPrefix}` : '';
        if (storageType === 'session') this.#storage = sessionStorage;
    }

    // --- Core

    /**
     * Get a prefixed or direct key.
     * 
     * @param {string} key 
     * @returns {string|null}
     * */
    #key(key) {
        return isString(key) ? `${this.#prefix}${this.#delimiter}${key}` : key;
    }

    // --- Public API

    /**
     * Check for existing key in storage.
     * 
     * @param {string} key 
     * @returns {boolean}
     */
    has(key) {
        return this.#key(key) in this.#storage;
    }

    /**
     * Add or update a key in storage.
     * 
     * @param {string} key 
     * @param {any} value 
     */
    set(key, value) {
        this.#storage.setItem(this.#key(key), JSON.stringify(value));
    }

    /**
     * Get a value from storage.
     * 
     * @param {string} key 
     * @param {any} [defaultValue=null] 
     * @returns {any}
     */
    get(key, defaultValue = null) {
        const item = this.#storage.getItem(this.#key(key));

        return item ? JSON.parse(item) : defaultValue;
    }

    /**
     * Remove one or more keys from storage.
     * 
     * Example: `DataStorage.remove('key1')` or `DataStorage.remove(['key1', 'key2'])`
     * 
     * @param {string|string[]} key 
     */
    remove(key) {
        let items = key instanceof Array ? key : [key];
        items = items.map((x) =>  this.#key(x));

        for (const item of items) {
            this.#storage.removeItem(item);
        }
    }

    /**
     * Clear all keys from storage, or only those with the specified prefix.
     * 
     * @param {string} [keyPrefix] Optional prefix to clear only matching keys.
     */
    clear(keyPrefix) {
        if (!isEmpty(keyPrefix)) {
            for (const key in this.#storage) {
                if (key.startsWith(`${this.#prefix}${this.#delimiter}`)) {
                    this.#storage.removeItem(key);
                }
            }  

            return;
        }

        this.#storage.clear();
    }
}