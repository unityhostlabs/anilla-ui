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
 * @param {HTMLElement}              el        The DOM element to read from
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
 * Replaces placeholders in a template string with provided values.
 * 
 * @param {string} template - The string containing placeholders.
 * @param {Record<string, string|number>} [placeholders={}] - Key-value pairs to replace.
 * @returns {string} The formatted string with placeholders replaced.
 * 
 * @example
 * // Single replacement
 * interpolate("Hello, :name!", { name: "Alex" }); // returns "Hello, Alex!"
 * 
 * @example
 * // Multiple replacements
 * interpolate("Item :id is :status", { id: 4, status: "active" }); // returns "Item 4 is active"
 */
export function interpolate(template, placeholders = {}) {
    return Object.keys(placeholders).reduce((result, token) => {
        // Force the value to a string using String() to safely satisfy replaceAll()
        const value = String(placeholders[token]);
        return result.replaceAll(`:${token}`, value);
    }, template);
}


/**
 * Split a space-separated class string and add each token.
 * 
 * @param {HTMLElement} el
 * @param {string} classString
 */
export function addClasses(el, classString) {
	classString.trim().split(/\s+/).forEach((cls) => el.classList.add(cls));
}

/**
 * Split a space-separated class string and remove each token.
 * 
 * @param {HTMLElement} el
 * @param {string} classString
 */
export function removeClasses(el, classString) {
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
    if (selectorOrElement instanceof HTMLElement) {
        return /** @type {any} */ (selectorOrElement);
    }

    try {
        return context.querySelector(selectorOrElement);
    } catch (error) {
        return null;
    }
}


/**
 * Finds DOM elements by selector or returns from element map.
 * 
 * @template {keyof HTMLElementTagNameMap | string} K
 * @param {K | Map<string, HTMLElement>} selectorOrMap - CSS selector or Map of elements
 * @param {ParentNode} [context=document] - The root element to search within
 * @returns {Array<K extends keyof HTMLElementTagNameMap ? HTMLElementTagNameMap[K] : HTMLElement>}
 */
export function queryAll(selectorOrMap, context = document) {
    if (selectorOrMap instanceof Map) {
        return /** @type {any} */ (Array.from(selectorOrMap.values()));
    }

    try {
        return Array.from(context.querySelectorAll(selectorOrMap));
    } catch (error) {
        return [];
    }
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
    const arr = typeof value === 'string' 
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
export function hasAttribute(element, name) {
    return !!element?.hasAttribute(name ?? '');
}

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
export function getAttribute(element, name) {
    return element?.getAttribute(name ?? '') ?? null;
}

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
// export function setAttributes(element, attributes) {
//     if (!element?.getAttributeNames) return;

//     const entries = Object.entries(attributes);
//     if (!entries.length) return;

//     for (const [key, value] of entries) {
//         element.setAttribute(
//             key.replace(/([A-Z])/g, '-$1').toLowerCase(),
//             value
//         );
//     }
// }

/**
 * Sets attributes on a DOM element, with support for conditional attribute setting.
 * 
 * Converts camelCase attribute names to kebab-case (e.g., dataId -> data-id).
 * 
 * @param {HTMLElement | null} element - The target DOM element to set attributes on.
 * @param {Object.<string, *|{condition: boolean, value: *}>} attributes - Key-value pairs of attributes to set. 
 * Values can be direct or objects with a condition. If an object has a falsy condition, the attribute will be skipped.
 * 
 * @example
 * // Basic usage - always sets attributes
 * const button = document.querySelector('button');
 * setAttributes(button, {
 *     dataId: '123',
 *     ariaLabel: 'Close button'
 * });
 * // Result: data-id="123" aria-label="Close button"
 * 
 * @example
 * // With conditional attributes
 * const isDisabled = true;
 * const hasError = false;
 * 
 * setAttributes(button, {
 *     dataId: '123',
 *     disabled: { condition: isDisabled, value: '' },
 *     ariaInvalid: { condition: hasError, value: 'true' }
 * });
 * // Result: data-id="123" disabled (aria-invalid not set because hasError is false)
 * 
 * @example
 * // Mixed conditional and unconditional
 * setAttributes(element, {
 *     id: 'my-element',
 *     dataCount: { condition: showCount, value: itemCount.toString() },
 *     role: 'button'
 * });
 */
export function setAttributes(element, attributes) {
    if (!element?.getAttributeNames) return;

    const entries = Object.entries(attributes);
    if (!entries.length) return;

    for (const [key, value] of entries) {
        // Check if value is an object with a condition property
        if (typeof value === 'object' && value !== null && 'condition' in value) {
            if (!value.condition) continue; // Skip if condition is falsy
            const actualValue = value.value ?? '';
            element.setAttribute(
                key.replace(/([A-Z])/g, '-$1').toLowerCase(),
                actualValue
            );
        } else {
            // Set attribute normally if no condition
            element.setAttribute(
                key.replace(/([A-Z])/g, '-$1').toLowerCase(),
                value
            );
        }
    }
}

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
export function removeAttributes(element, attributes) {
    if (!element?.removeAttribute || !attributes?.length) return;

    for (const attribute of attributes) {
        element.removeAttribute(
            attribute.replace(/([A-Z])/g, '-$1').toLowerCase()
        );
    }
}

/**
 * Sets CSS styles on a DOM element, with support for conditional style setting and removal.
 * 
 * When a value is null or undefined, the style property is removed instead of being set.
 * Empty strings are valid and will be set as-is. Standard string-based CSS variables starting 
 * with '--' are preserved exactly as written.
 * 
 * @param {HTMLElement | null} element - The target DOM element to set styles on.
 * @param {Record<string, string | null | undefined | {condition: any, value: string | null | undefined}>} styleProps - 
 *   Key-value pairs of CSS properties to set. Keys can be in camelCase (e.g., backgroundColor), kebab-case (e.g., background-color),
 *   or CSS custom property format (e.g., --theme-color).
 *   Values can be direct strings/nullish values, or objects with a condition. If an object has a falsy condition, 
 *   the style property modification is skipped entirely.
 *   If a value or its conditional value resolves to null or undefined, the style property is removed from the element.
 * 
 * @example
 * // Basic usage - always sets styles
 * const box = document.querySelector('.box');
 * setStyles(box, {
 *     backgroundColor: 'blue',
 *     padding: '10px',
 *     '--local-accent': 'orange'
 * });
 * // Result: style="background-color: blue; padding: 10px; --local-accent: orange;"
 * 
 * @example
 * // Removing styles with null/undefined
 * setStyles(box, {
 *     backgroundColor: null,  // Removes background-color
 *     padding: undefined      // Removes padding
 * });
 * 
 * @example
 * // With conditional styles
 * const isHidden = true;
 * const isActive = false;
 * 
 * setStyles(box, {
 *     display: { condition: isHidden, value: 'none' },
 *     opacity: { condition: isActive, value: '1' },
 *     color: 'red'
 * });
 * // Result: display="none" and color="red" are handled (opacity is skipped entirely)
 * 
 * @example
 * // Mixed with empty strings
 * setStyles(box, {
 *     backgroundColor: '',    // Valid - sets empty string
 *     marginTop: { condition: true, value: '' }  // Valid - sets empty string
 * });
 */
export function setStyles(element, styleProps) {
    if (!element?.style || !styleProps) return;

    for (const key in styleProps) {
        if (!Object.prototype.hasOwnProperty.call(styleProps, key)) continue;

        const propValue = styleProps[key];
        let finalValue = propValue;

        // Process conditional wrapper objects
        if (propValue && typeof propValue === 'object' && 'condition' in propValue) {
            if (!propValue.condition) continue;
            finalValue = propValue.value;
        }

        // Convert key names from camelCase to kebab-case, preserving explicit CSS variables
        const kebabKey = key.startsWith('--') 
            ? key 
            : key.replace(/([A-Z])/g, '-$1').toLowerCase();

        if (finalValue === null || finalValue === undefined) {
            element.style.removeProperty(kebabKey);
        } else {
            // Inline cast explicitly tells the compiler finalValue is a string here
            element.style.setProperty(kebabKey, /** @type {string} */ (finalValue));
        }
    }
}

/**
 * Removes an array of CSS properties or custom variables from a DOM element.
 * 
 * @param {HTMLElement | null} element - The target DOM element to remove styles from.
 * @param {string[]} properties - An array of property names to remove. Supports camelCase, kebab-case, and CSS variables.
 * 
 * @example
 * // Basic removal using mixed naming conventions
 * const box = document.querySelector('.box');
 * removeStyles(box, ['backgroundColor', 'padding', '--local-accent']);
 * // Result: background-color, padding, and the CSS variable are removed from the style attribute
 */
export function removeStyles(element, properties) {
    if (!element?.style || !Array.isArray(properties)) return;

    for (let i = 0; i < properties.length; i++) {
        const key = properties[i];
        if (!key) continue;

        const kebabKey = key.startsWith('--') 
            ? key 
            : key.replace(/([A-Z])/g, '-$1').toLowerCase();

        element.style.removeProperty(kebabKey);
    }
}
