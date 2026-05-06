/**
 * Utilities
 * 
 * Reusable helper functions that can be used across multiple components or library.
 */

/**
 * Convert a raw data attribute string into the most appropriate JS type.
 * The browser always gives us strings from dataset — this restores intent.
 *
 *   "true"  / "false" → boolean
 *   "42"    / "3.14"  → number  (only purely numeric strings)
 *   "null"            → null
 *   anything else     → string  (selectors, class names, etc.)
 *
 * @param {string} value
 * @returns {boolean | number | null | string}
 */
export function coerceType(value) {
    if (value === 'true') return true;
    if (value === 'false') return false;
    if (value === 'null') return null;
    if (value !== '' && !isNaN(Number(value))) return Number(value);
    return value;
}

/**
 * Reads all `data-{componentSlug}-*` attributes off an element, converts them
 * to camelCase option names via the browser's built-in dataset API, and
 * validates each key against the component's declared defaults.
 *
 * Any attribute that does not correspond to a key in a component's `defaults` is silently
 * discarded — this catches typos and unsupported attributes early.
 *
 * How the name conversion works:
 *   The browser converts data attribute names to camelCase automatically.
 *   `data-modal-active-class` → `el.dataset.modalActiveClass`
 *   We then strip the component slug prefix and lowercase the first character:
 *   "modalActiveClass" → strip "modal" → "ActiveClass" → "activeClass" ✓
 *
 * @param {Element}              el        The DOM element to read from
 * @param {string}               slug      Lowercase component name, e.g. 'modal'
 * @param {Record<string, any>}  defaults  The component's declared default options
 * @returns {Record<string, any>}
 */
export function parseComponentDataAttributes(el, slug, defaults) {
    const options = {};

    for (const [datasetKey, rawValue] of Object.entries(el.dataset)) {
        if (!datasetKey.startsWith(slug)) continue;

        const rest = datasetKey.slice(slug.length);
        if (!rest) continue;

        const optionName = rest.charAt(0).toLowerCase() + rest.slice(1);

        if (!(optionName in defaults)) continue;

        options[optionName] = coerceType(rawValue);
    }
    
    return options;
}

/**
 * Split a space-separated class string and add each token.
 * 
 * @param {HTMLElement} el
 * @param {string} classString
 */
export const addClasses = (el, classString) => {
	classString.trim().split(/\s+/).forEach((cls) => el.classList.add(cls));
}

/**
 * Split a space-separated class string and remove each token.
 * 
 * @param {HTMLElement} el
 * @param {string} classString
 */
export const removeClasses = (el, classString) => {
	classString.trim().split(/\s+/).forEach((cls) => el.classList.remove(cls));
}

/**
 * Finds the first DOM element matching the selector or returns a direct element reference.
 * 
 * @template {keyof HTMLElementTagNameMap | string} K
 * @param {K | HTMLElement} selectorOrElement - CSS selector (e.g. 'button', '.class', '#id') or a direct element reference
 * @param {ParentNode} [context=document] - The root element to search within
 * @returns {(K extends keyof HTMLElementTagNameMap ? HTMLElementTagNameMap[K] : HTMLElement) | null}
 */
export function query(selectorOrElement, context = document) {
    if (selectorOrElement instanceof HTMLElement) return selectorOrElement;

    return context.querySelector(selectorOrElement);
}

/**
 * Finds DOM elements by selector or returns from element map.
 * 
 * @template {keyof HTMLElementTagNameMap | string} K
 * @param {K | Map<string, HTMLElement>} selectorOrMap - CSS selector or Map of elements
 * @param {ParentNode} [context=document] - The root element to search within
 * @returns {Array<HTMLElement>}
 */
export function queryAll(selectorOrMap, context = document) {
    if (selectorOrMap instanceof Map) return Array.from(selectorOrMap.values());

    return Array.from(context.querySelectorAll(selectorOrMap));
}

/**
 * Converts a string to a URL-friendly slug
 * 
 * @param {string} value
 * @returns {string}
 */
export function slug(value) {
    return value
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

/**
 * Converts a comma-separated string into an array of trimmed values.
 * If the input is already an array, it is returned as-is.
 * 
 * @param {string | Array} value
 * @param {string} separator
 * @returns {Array}
 */
export function toArray(value, separator = ',') {
    const arr = isString(value) 
        ? value.split(separator).map(x => x.trim()).filter(x => x !== '')
        : value;

	return arr instanceof Array ? arr : [];
}

/**
 * Checks if a value is empty.
 * 
 * Empty values include: null, undefined, empty strings, empty arrays, and empty objects.
 * 
 * @param {any} value
 * @returns {boolean}
 */
export function isEmpty(value) {
    return value === null 
        || value === undefined 
        || typeof value === 'string' && value.trim() === '' 
        || value instanceof Array && value.length === 0 
        || value instanceof Object && Object.keys(value).length === 0;
}

/**
 * Checks if an object has a specific value (including nested objects).
 * 
 * @param {Object} obj 
 * @param {any} value 
 * @returns {boolean}
 */
export function objectHasValue(obj, value) {
    for (let key in obj) {
        if (obj[key] === value) return true;
        if (typeof obj[key] === 'object' && obj[key] !== null) {
            if (objectHasValue(obj[key], value)) return true;
        }
    }

    return false;
}

/**
 * Check if an HTML element has a specific attribute.
 * 
 * @param {HTMLElement | null} element
 * @param {string | null} name
 * @returns {boolean}
 * @example
 * const el = document.getElementById('my-element');
 * hasAttribute(el, 'disabled'); // true or false
 * hasAttribute(el, 'data-id'); // true or false
 */
export const hasAttribute = (element, name) => {
    return !!element?.hasAttribute(name ?? '');
};

/**
 * Get the value of a specific attribute from an HTML element.
 * 
 * @param {HTMLElement | null} element
 * @param {string | null} name
 * @returns {string | null}
 * @example
 * const el = document.getElementById('my-element');
 * getAttribute(el, 'data-id'); // '123'
 * getAttribute(el, 'disabled'); // '' or null
 */
export const getAttribute = (element, name) => {
    return element?.getAttribute(name ?? '') ?? null;
};

/**
 * Set multiple attributes on an HTML element.
 * 
 * @param {HTMLElement | null} element
 * @param {Record<string, any>} attributes
 * @throws Will silently return if element is null/undefined or attributes is empty
 * @example
 * const el = document.getElementById('my-element');
 * setAttributes(el, {
 *   dataId: '123',
 *   ariaLabel: 'My Label',
 *   role: 'button'
 * });
 * // Results in: data-id="123" aria-label="My Label" role="button"
 */
export const setAttributes = (element, attributes) => {
    if (!element?.getAttributeNames) return;

    const entries = Object.entries(attributes);
    if (!entries.length) return;

    for (const [key, value] of entries) {
        element.setAttribute(
            key.replace(/([A-Z])/g, '-$1').toLowerCase(),
            value
        );
    }
};

/**
 * Remove multiple attributes from an HTML element.
 * 
 * @param {HTMLElement | null} element
 * @param {string[] | null} attributes
 * @example
 * const el = document.getElementById('my-element');
 * removeAttributes(el, ['dataId', 'ariaLabel', 'disabled']);
 * // Removes: data-id, aria-label, disabled attributes
 */
export const removeAttributes = (element, attributes) => {
    if (!element?.removeAttribute || !attributes?.length) return;

    for (const attribute of attributes) {
        element.removeAttribute(
            attribute.replace(/([A-Z])/g, '-$1').toLowerCase()
        );
    }
};