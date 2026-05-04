/**
 * Registry
 *
 * Global singleton that maps every initialized component to a stable key
 * derived from its root element. Allows retrieval of any instance by CSS
 * selector string, Element reference, or the auto-generated data attribute.
 *
 * Key format: `<dataPrefix>-{uid}` (reads dataPrefix from global config)
 * A `data-<dataPrefix>-id` attribute is stamped on the element for lookup.
 */

import { config, logger } from './config.js';

let _uid = 0;

/** @type {Map<string, BaseComponent>} */
const store = new Map();

/**
 * Return the current id attribute name derived from config.
 * e.g. 'data-mylib-id'
 * 
 * @returns {string}
 */
function idAttr() {
    return `data-${config.dataPrefix}-id`;
}

/**
 * Generate or retrieve the stable library ID for a DOM element.
 * 
 * @param {Element} el
 * @param {string} componentName
 * @returns {string}
 */
function makeKey(el, componentName) {
    const attr = idAttr();

    if (!el.hasAttribute(attr)) {
        el.setAttribute(attr, `${config.dataPrefix}-${++_uid}`);
    }

    logger.info(`Registry: resolving key for <${componentName}>`, el.getAttribute(attr));

    return `${componentName}::${el.getAttribute(attr)}`;
}

export const Registry = {
    /**
     * Store a component instance.
     * 
     * @param {Element} el
     * @param {string} componentName
     * @param {import('./BaseComponent.js').BaseComponent} instance
     */
    set(el, componentName, instance) {
        const key = makeKey(el, componentName);

        if (store.has(key)) {
            logger.warn(
                `Registry: <${componentName}> is already initialised on this element. ` +
                `Call destroy() on the existing instance before re-initialising.`
            );

            return;
        }

        store.set(key, instance);
        logger.info(`Registry: registered <${componentName}>`);
    },

    /**
     * Retrieve a component instance by Element reference.
     * 
     * @param {Element} el
     * @param {string} componentName
     * @returns {import('./BaseComponent.js').BaseComponent|undefined}
     */
    getByElement(el, componentName) {
        const attr = el.getAttribute(idAttr());
        if (!attr) return undefined;

        return store.get(`${componentName}::${attr}`);
    },

    /**
     * Retrieve a component instance by CSS selector string.
     * Resolves the first matching element in the document.
     * 
     * @param {string} selector
     * @param {string} componentName
     * @returns {import('./BaseComponent.js').BaseComponent|undefined}
     */
    getBySelector(selector, componentName) {
        const el = document.querySelector(selector);
        if (!el) return undefined;

        return Registry.getByElement(el, componentName);
    },

    /**
     * Retrieve a component instance by either a CSS selector string or Element.
     * 
     * @param {string|Element} target
     * @param {string} componentName
     * @returns {import('./BaseComponent.js').BaseComponent|undefined}
     */
    get(target, componentName) {
        if (typeof target === 'string') {
            return Registry.getBySelector(target, componentName);
        }

        if (target instanceof Element) {
            return Registry.getByElement(target, componentName);
        }

        return undefined;
    },

    /**
     * Return all registered instances of a given component type.
     * 
     * @param {string} componentName
     * @returns {import('./BaseComponent.js').BaseComponent[]}
     */
    getAllOfType(componentName) {
        const prefix = `${componentName}::`;
        
        return [...store.entries()]
            .filter(([key]) => key.startsWith(prefix))
            .map(([, instance]) => instance);
    },

    /**
     * Return every instance across all component types.
     * 
     * @returns {import('./BaseComponent.js').BaseComponent[]}
     */
    getAll() {
        return [...store.values()];
    },

    /**
     * Remove a component instance from the registry (called by destroy()).
     * 
     * @param {Element} el
     * @param {string} componentName
     */
    delete(el, componentName) {
        const attr = el.getAttribute(idAttr());
        if (!attr) return;
        store.delete(`${componentName}::${attr}`);
        logger.info(`Registry: unregistered <${componentName}>`);
    },

    /**
     * Remove all instances from the registry.
     */
    clear() {
        store.clear();
    },

    /**
     * Dump the raw store map (for debugging).
     * 
     * @returns {Map<string, import('./BaseComponent.js').BaseComponent>}
     */
    debug() {
        return new Map(store);
    },
};