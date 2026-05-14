import { isEmpty } from './utils.js';

/**
 * @typedef {Object} Options
 * @property {string} prefix The prefix for the storage keys.
 * @property {string} delimiter The delimiter for the storage keys.
 * @property {boolean} jsonEncode Whether to JSON encode values before storing.
 * @property {'local' | 'session'} storageType The type of storage to use.
 */

/** @type {Options} */
const defaults = {
    prefix: '',
    delimiter: ':',
    jsonEncode: true,
    storageType: 'local'
};

/**
 * DataStorage
 *
 * A simplified Web Storage class for storing data in local or session storage.
 */
export class DataStorage {

    /**
     * Constructor
     * 
     * @param {Options} [options]
     */
    constructor(options = {}) {
        this.options = { ...defaults, ...options };
        this.storage = this.options.storageType === 'session' ? sessionStorage : localStorage;
        this.options.delimiter = isEmpty(this.options.prefix) ? '' : this.options.delimiter;
    }

    // --- Core

    /**
     * Get a prefixed or direct key.
     * 
     * @param {string} key 
     * @returns {string}
     * */
    _getKey(key) {
        return `${this.options.prefix}${this.options.delimiter}${key}`;
    }

    /**
     * Set a JSON encoded value or return as-is.
     * 
     * @param {any} value 
     * @returns {string}
     */
    _encode(value) {
        return this.options.jsonEncode ? JSON.stringify(value) : value;
    }

    /**
     * Get a JSON encoded value or return as-is.
     * 
     * @param {any} value 
     * @returns {string}
     */
    _decode(value) {
        return this.options.jsonEncode ? JSON.parse(value) : value;
    }

    // --- Public API

    /**
     * Check for existing key in storage.
     * 
     * @param {string} key 
     * @returns {boolean}
     */
    has(key) {
        return this._getKey(key) in this.storage;
    }

    /**
     * Add or update a key in storage.
     * 
     * @param {string} key 
     * @param {any} value 
     */
    set(key, value) {
        this.storage.setItem(this._getKey(key), this._encode(value));
    }

    /**
     * Get a value from storage.
     * 
     * @param {string} key 
     * @param {any} [defaultValue=null] 
     * @returns {any}
     */
    get(key, defaultValue = null) {
        const item = this.storage.getItem(this._getKey(key));

        return item ? this._decode(item) : defaultValue;
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
        items = items.map((x) =>  this._getKey(x));

        for (const item of items) {
            this.storage.removeItem(item);
        }
    }

    /**
     * Clear all keys from storage, or only those with the specified prefix.
     * 
     * @param {string} [keyPrefix] Optional prefix to clear only matching keys.
     */
    clear(keyPrefix) {
        if (!isEmpty(keyPrefix)) {
            for (const key in this.storage) {
                if (key.startsWith(`${this.options.prefix}${this.options.delimiter}`)) {
                    this.storage.removeItem(key);
                }
            }  

            return;
        }

        this.storage.clear();
    }
}