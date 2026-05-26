//#region \0rolldown/runtime.js
var __defProp = Object.defineProperty;
var __exportAll = (all, no_symbols) => {
	let target = {};
	for (var name in all) __defProp(target, name, {
		get: all[name],
		enumerable: true
	});
	if (!no_symbols) __defProp(target, Symbol.toStringTag, { value: "Module" });
	return target;
};
//#endregion
//#region src/core/config.js
/**
* Global Configuration
*
* This is the single source of truth for all library-wide settings.
* Import `config` anywhere inside the library to read values, or call
* `configure()` at app boot time to override defaults before any
* components are initialized.
*
* Usage (consumer):
*   import { configure } from '@anilla/ui';
*   configure({ name: 'AnillaUI', dataPrefix: 'ui' });
*
* Usage (internal):
*   import { config } from './config.js';
*   element.setAttribute(`data-${config.dataPrefix}-id`, uid);
*/
/**
* @typedef {Object} AnillaUIConfig
*
* @property {string} name
*   Human-readable library name used in error messages and logs.
*
* @property {string} version
*   Library version string.
*
* @property {string} dataPrefix
*   Prefix for all `data-*` attributes stamped on elements.
*   e.g. 'ui' → `data-ui-id`, `data-ui-toggle`.
*   Change this if the default clashes with another library.
*
* @property {boolean} autoInit
*   When true, components scan the DOM for their data attributes and
*   self-initialize on DOMContentLoaded.
*   Set to false if you prefer fully manual initialization.
*
* @property {'silent'|'warn'|'error'} logLevel
*   Controls what the library prints to the console.
*   'silent' → nothing
*   'warn'   → warnings only
*   'error'  → warnings + errors (default)
*
* @property {boolean} debug
*   When true, enables verbose internal logging. Overrides logLevel to
*   print everything including lifecycle events and registry operations.
* 
* @property {Function} _autoInitBoot
*   Internal callback used by AutoInit to trigger a scan when the app boots.
*   This is set by AutoInit and called by configure() if autoInit is enabled.
*   Not intended for external use.
*/
/** @type {AnillaUIConfig} */
const defaults$4 = {
	name: "AnillaUI",
	version: "0.1.0",
	dataPrefix: "ui",
	autoInit: false,
	logLevel: "error",
	debug: false,
	_autoInitBoot: () => void 0
};
/** @type {AnillaUIConfig} */
const config = { ...defaults$4 };
/**
* Merge user-supplied overrides into the global config.
* Call this once at app boot, before any components are initialized.
*
* @param {Partial<AnillaUIConfig>} overrides
* @returns {AnillaUIConfig} The updated config object
*
* @example
* import { configure } from '@anilla/ui';
* configure({
*   name:       'MyLibName',
*   dataPrefix: 'my',
*   autoInit:   true,
*   debug:      true,
* });
*/
function configure(overrides = {}) {
	const invalid = Object.keys(overrides).filter((k) => !(k in defaults$4));
	if (invalid.length) logger.warn(`configure() received unknown keys: ${invalid.join(", ")}`);
	Object.assign(config, overrides);
	if (config.autoInit && config._autoInitBoot) config._autoInitBoot();
	return config;
}
/**
* Reset the global config back to its built-in defaults.
* Mainly useful in tests.
*
* @returns {AnillaUIConfig}
*/
function resetConfig() {
	Object.assign(config, defaults$4);
	return config;
}
/**
* Internal logger
* 
* Used by all modules inside the library. Respects config.logLevel and
* config.debug so consumers can control verbosity without touching source.
*/
const logger = {
	/**
	* Print an informational message (only when debug is enabled).
	* 
	* @param {...any} args
	*/
	info(...args) {
		if (config.debug) console.info(`[${config.name}]`, ...args);
	},
	/**
	* Print a warning (suppressed when logLevel is 'silent').
	* 
	* @param {...any} args
	*/
	warn(...args) {
		if (config.logLevel !== "silent") console.warn(`[${config.name}]`, ...args);
	},
	/**
	* Print an error (suppressed only when logLevel is 'silent').
	* 
	* @param {...any} args
	*/
	error(...args) {
		if (config.logLevel !== "silent") console.error(`[${config.name}]`, ...args);
	}
};
//#endregion
//#region src/core/utils.js
var utils_exports = /* @__PURE__ */ __exportAll({
	addClasses: () => addClasses,
	coerceType: () => coerceType,
	getAttribute: () => getAttribute,
	hasAttribute: () => hasAttribute,
	interpolate: () => interpolate,
	isEmpty: () => isEmpty,
	objectHasValue: () => objectHasValue,
	parseComponentDataAttributes: () => parseComponentDataAttributes,
	query: () => query,
	queryAll: () => queryAll,
	removeAttributes: () => removeAttributes,
	removeClasses: () => removeClasses,
	removeStyles: () => removeStyles,
	setAttributes: () => setAttributes,
	setStyles: () => setStyles,
	slug: () => slug,
	toArray: () => toArray
});
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
function coerceType(value) {
	if (value === "true") return true;
	if (value === "false") return false;
	if (value === "null") return null;
	if (value !== "" && !isNaN(Number(value))) return Number(value);
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
function parseComponentDataAttributes(el, slug, defaults) {
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
function interpolate(template, placeholders = {}) {
	return Object.keys(placeholders).reduce((result, token) => {
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
function addClasses(el, classString) {
	classString.trim().split(/\s+/).forEach((cls) => el.classList.add(cls));
}
/**
* Split a space-separated class string and remove each token.
* 
* @param {HTMLElement} el
* @param {string} classString
*/
function removeClasses(el, classString) {
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
function query(selectorOrElement, context = document) {
	if (selectorOrElement instanceof HTMLElement) return selectorOrElement;
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
function queryAll(selectorOrMap, context = document) {
	if (selectorOrMap instanceof Map) return Array.from(selectorOrMap.values());
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
function slug(value) {
	return value.toLowerCase().trim().replace(/[^\w\s-]/g, "").replace(/[\s_-]+/g, "-").replace(/^-+|-+$/g, "");
}
/**
* Converts a comma-separated string into an array of trimmed values.
* If the input is already an array, it is returned as-is.
* 
* @param {string | Array} value
* @param {string} separator
* @returns {Array}
*/
function toArray(value, separator = ",") {
	const arr = typeof value === "string" ? value.split(separator).map((x) => x.trim()).filter((x) => x !== "") : value;
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
function isEmpty(value) {
	return value === null || value === void 0 || typeof value === "string" && value.trim() === "" || value instanceof Array && value.length === 0 || value instanceof Object && Object.keys(value).length === 0;
}
/**
* Checks if an object has a specific value (including nested objects).
* 
* @param {Object} obj 
* @param {any} value 
* @returns {boolean}
*/
function objectHasValue(obj, value) {
	for (let key in obj) {
		if (obj[key] === value) return true;
		if (typeof obj[key] === "object" && obj[key] !== null) {
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
function hasAttribute(element, name) {
	return !!element?.hasAttribute(name ?? "");
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
function getAttribute(element, name) {
	return element?.getAttribute(name ?? "") ?? null;
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
function setAttributes(element, attributes) {
	if (!element?.getAttributeNames) return;
	const entries = Object.entries(attributes);
	if (!entries.length) return;
	for (const [key, value] of entries) if (typeof value === "object" && value !== null && "condition" in value) {
		if (!value.condition) continue;
		const actualValue = value.value ?? "";
		element.setAttribute(key.replace(/([A-Z])/g, "-$1").toLowerCase(), actualValue);
	} else element.setAttribute(key.replace(/([A-Z])/g, "-$1").toLowerCase(), value);
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
function removeAttributes(element, attributes) {
	if (!element?.removeAttribute || !attributes?.length) return;
	for (const attribute of attributes) element.removeAttribute(attribute.replace(/([A-Z])/g, "-$1").toLowerCase());
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
function setStyles(element, styleProps) {
	if (!element?.style || !styleProps) return;
	for (const key in styleProps) {
		if (!Object.prototype.hasOwnProperty.call(styleProps, key)) continue;
		const propValue = styleProps[key];
		let finalValue = propValue;
		if (propValue && typeof propValue === "object" && "condition" in propValue) {
			if (!propValue.condition) continue;
			finalValue = propValue.value;
		}
		const kebabKey = key.startsWith("--") ? key : key.replace(/([A-Z])/g, "-$1").toLowerCase();
		if (finalValue === null || finalValue === void 0) element.style.removeProperty(kebabKey);
		else element.style.setProperty(kebabKey, finalValue);
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
function removeStyles(element, properties) {
	if (!element?.style || !Array.isArray(properties)) return;
	for (let i = 0; i < properties.length; i++) {
		const key = properties[i];
		if (!key) continue;
		const kebabKey = key.startsWith("--") ? key : key.replace(/([A-Z])/g, "-$1").toLowerCase();
		element.style.removeProperty(kebabKey);
	}
}
//#endregion
//#region src/core/AutoInit.js
/**
* AutoInit
*
* Scan within a root element (default: document) for component enable
* attributes and initialize matching descendant elements.
*
* Note:
* The root element itself is not evaluated — only its descendants.
* This is intentional to support container-based rescans such as
* dynamically injected DOM fragments.
*
* --- Enable Attribute
* Each component is activated on an element with:
*
*   data-{prefix}-{componentSlug}="true"
*
* Examples (default prefix "ui"):
*   data-ui-modal="true"
*   data-ui-dropdown="true"
*   data-ui-tabs="true"
*
* --- Component Option Attributes
* Options are declared on the same element using:
*
*   data-{componentSlug}-{option-in-kebab-case}="value"
*
* Examples:
*   data-modal-esc-close="false"
*   data-modal-backdrop-close="false"
*   data-modal-trigger="#open-btn"
*   data-dropdown-trigger="#menu-btn"
*   data-dropdown-active-class="open"
*   data-dropdown-close-on-outside-click="false"
*
* ── Multiple components on one element ──────────────────────────────────────
* Add multiple enable attributes — each component is independent:
*
*   <div data-ui-modal="true"
*        data-modal-trigger="#btn"
*        data-ui-dropdown="true"
*        data-dropdown-active-class="open">
*   </div>
*
* ── Re-scanning ──────────────────────────────────────────────────────────────
* AutoInit.init() is idempotent. Already-initialized elements (detected via
* the Registry) are skipped — safe to call after dynamic DOM insertions.
*/
/** @type {Map<string, typeof import('./BaseComponent.js').BaseComponent>} */
const componentMap = /* @__PURE__ */ new Map();
const AutoInit = {
	/**
	* Register a component class so AutoInit can activate it from the DOM.
	* The component's `componentName` is lowercased to form the attribute slug.
	*
	*   Modal     → listens for data-{dataPrefix}-modal="true"
	*   Dropdown  → listens for data-{dataPrefix}-dropdown="true"
	*
	* @param {typeof import('./BaseComponent.js').BaseComponent} ComponentClass
	*/
	register(ComponentClass) {
		const name = ComponentClass.componentName;
		if (!name || name === "BaseComponent") {
			logger.warn(`AutoInit.register(): "${ComponentClass.name}" does not define a static componentName — skipped.`);
			return;
		}
		componentMap.set(name.toLowerCase(), ComponentClass);
		logger.info(`AutoInit: registered "${name}" → data-${config.dataPrefix}-${name.toLowerCase()}`);
	},
	/**
	* Register multiple component classes at once.
	* 
	* @param {Array<typeof import('./BaseComponent.js').BaseComponent>} classes
	*/
	registerAll(classes) {
		classes.forEach((cls) => AutoInit.register(cls));
	},
	/**
	* Scan a root element (default: document) for component enable attributes
	* and initialize every component found that has not yet been initialized.
	*
	* @param {Document|Element} [root=document]
	* @returns {import('./BaseComponent.js').BaseComponent[]} All newly created instances
	*/
	init(root = document) {
		if (componentMap.size === 0) {
			logger.warn("AutoInit.init(): no components are registered. Call AutoInit.registerAll() first.");
			return [];
		}
		const created = [];
		for (const [slug, ComponentClass] of componentMap) {
			const enableAttr = `data-${config.dataPrefix}-${slug}`;
			root.querySelectorAll(`[${enableAttr}]`).forEach((el) => {
				if (coerceType(el.getAttribute(enableAttr)) !== true) return;
				if (ComponentClass.getInstance(el)) {
					logger.info(`AutoInit: <${ComponentClass.componentName}> already initialized — skipped`, el);
					return;
				}
				logger.info(`AutoInit: initializing <${ComponentClass.componentName}>`, el);
				try {
					const instance = new ComponentClass(el);
					created.push(instance);
				} catch (err) {
					logger.error(`AutoInit: failed to initialize <${ComponentClass.componentName}>`, el, err);
				}
			});
		}
		logger.info(`AutoInit: scan complete — ${created.length} component(s) initialized`);
		return created;
	},
	/**
	* Returns all currently registered component slugs.
	* 
	* @returns {string[]}
	*/
	registeredNames() {
		return [...componentMap.keys()];
	},
	/**
	* Remove a component from the registry by name or slug (mainly for testing).
	* 
	* @param {string} nameOrSlug  e.g. 'Modal' or 'modal'
	*/
	unregister(nameOrSlug) {
		if (!componentMap.delete(nameOrSlug.toLowerCase())) logger.warn(`AutoInit.unregister(): "${nameOrSlug}" was not registered.`);
	}
};
/**
* Called internally when autoInit: true is set in the global config.
* Waits for DOMContentLoaded if the document is not yet ready.
*
* @param {Array<typeof import('./BaseComponent.js').BaseComponent>} [classes]
*/
function bootAutoInit(classes = []) {
	if (classes.length) AutoInit.registerAll(classes);
	const run = () => AutoInit.init();
	if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", run, { once: true });
	else run();
}
config._autoInitBoot = bootAutoInit;
//#endregion
//#region src/core/EventBus.js
/**
* EventBus
*
* Lightweight publish/subscribe event system scoped to each component instance.
* Tracks every listener so they can be mass-removed on destroy().
*/
var EventBus = class {
	/** @type {Map<string, Set<Function>>} */
	#listeners = /* @__PURE__ */ new Map();
	/**
	* Subscribe to an event.
	* 
	* @param {string} event
	* @param {Function} handler
	* @returns {() => void}
	*/
	on(event, handler) {
		if (!this.#listeners.has(event)) this.#listeners.set(event, /* @__PURE__ */ new Set());
		this.#listeners.get(event).add(handler);
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
			if (this.#listeners.get(event).size === 0) this.#listeners.delete(event);
		} else this.#listeners.delete(event);
	}
	/**
	* Emit an event, passing arbitrary data to every subscriber.
	* 
	* @param {string} event
	* @param {...any} args
	*/
	emit(event, ...args) {
		if (!this.#listeners.has(event)) return;
		for (const handler of this.#listeners.get(event)) handler(...args);
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
};
//#endregion
//#region src/core/DOMEventStore.js
/**
* DOMEventStore
*
* Wraps addEventListener / removeEventListener and keeps a record of every
* native listener attached through this store so they can all be cleaned up
* at once on component destroy.
*/
var DOMEventStore = class {
	/** @type {Array<{el: Element | Window | Document, type: string, handler: EventListenerOrEventListenerObject, options: any}>} */
	#entries = [];
	/**
	* Attach a native DOM listener and record it.
	* 
	* @param {Element | Window | Document} el
	* @param {string} type
	* @param {EventListenerOrEventListenerObject} handler
	* @param {boolean | AddEventListenerOptions} [options]
	*/
	add(el, type, handler, options) {
		el.addEventListener(type, handler, options);
		this.#entries.push({
			el,
			type,
			handler,
			options
		});
	}
	/**
	* Remove a specific listener that was previously added through this store.
	* 
	* @param {Element | Window | Document} el
	* @param {string} type
	* @param {EventListenerOrEventListenerObject} handler
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
		for (const { el, type, handler, options } of this.#entries) el.removeEventListener(type, handler, options);
		this.#entries = [];
	}
	/**
	* Return a snapshot of all recorded entries (read-only, for debugging).
	* 
	* @returns {Readonly<Array<{el: Element | Window | Document, type: string, handler: EventListenerOrEventListenerObject, options: any}>>}
	*/
	getAll() {
		return Object.freeze([...this.#entries]);
	}
};
//#endregion
//#region src/core/Registry.js
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
let _uid = 0;
/** @type {Map<string, import('./BaseComponent.js').BaseComponent>} */
const store = /* @__PURE__ */ new Map();
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
	if (!el.hasAttribute(attr)) el.setAttribute(attr, `${config.dataPrefix}-${++_uid}`);
	logger.info(`Registry: resolving key for <${componentName}>`, el.getAttribute(attr));
	return `${componentName}::${el.getAttribute(attr)}`;
}
const Registry = {
	/**
	* Store a component instance.
	* 
	* @param {Element} el
	* @param {string} componentName
	* @param {import('./BaseComponent.js').BaseComponent} instance
	*/
	set(el, componentName, instance) {
		const key = makeKey(el, componentName);
		if (store.has(key)) throw new Error(`${componentName} is already initialized on this element`);
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
		if (!attr) return void 0;
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
		if (!el) return void 0;
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
		if (typeof target === "string") return Registry.getBySelector(target, componentName);
		if (target instanceof Element) return Registry.getByElement(target, componentName);
	},
	/**
	* Return all registered instances of a given component type.
	* 
	* @param {string} componentName
	* @returns {import('./BaseComponent.js').BaseComponent[]}
	*/
	getAllOfType(componentName) {
		const prefix = `${componentName}::`;
		return [...store.entries()].filter(([key]) => key.startsWith(prefix)).map(([, instance]) => instance);
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
		el.removeAttribute(idAttr());
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
	}
};
//#endregion
//#region src/core/Transition.js
/**
* @typedef {Object} TransitionOptions
* @property {string | null} [transitionEnter]
* @property {string | null} [transitionEnterFrom]
* @property {string | null} [transitionEnterTo]
* @property {string | null} [transitionLeave]
* @property {string | null} [transitionLeaveFrom]
* @property {string | null} [transitionLeaveTo]
*/
/** @type {TransitionOptions} */
const defaults$3 = {
	transitionEnter: null,
	transitionEnterFrom: null,
	transitionEnterTo: null,
	transitionLeave: null,
	transitionLeaveFrom: null,
	transitionLeaveTo: null
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
var Transition = class {
	/**
	* Default transition option values.
	* 
	* @returns {TransitionOptions}
	*/
	static get defaults() {
		return defaults$3;
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
	type = "transition";
	/** Transition/animation duration in seconds. */
	duration = 0;
	/** Timing function. */
	timing = "ease";
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
	state = "idle";
	/** 
	* Constructor
	* 
	* @param {Record<string, string>} config 
	* */
	constructor(config) {
		this.#config = config;
	}
	/**
	* @param {TransitionState} state
	*/
	#setState(state) {
		this.state = state;
	}
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
	#execute(effect, element, callback) {
		const base = this.#config[effect];
		const from = this.#config[`${effect}From`];
		const to = this.#config[`${effect}To`];
		if (!base) return false;
		this.cancel();
		const transitionId = ++this.#transitionId;
		const controller = new AbortController();
		this.#controller = controller;
		this.effect = effect;
		this.target = element;
		this.#setState(effect === "transitionEnter" ? "entering" : "leaving");
		addClasses(element, base);
		if (from) addClasses(element, from);
		const styles = window.getComputedStyle(element);
		const isAnimation = styles.animationName !== "none" && parseFloat(styles.animationDuration) > 0;
		this.type = isAnimation ? "animation" : "transition";
		this.duration = parseFloat(isAnimation ? styles.animationDuration : styles.transitionDuration);
		this.timing = isAnimation ? styles.animationTimingFunction : styles.transitionTimingFunction;
		element.addEventListener(this.event("cancel"), () => {
			if (transitionId !== this.#transitionId) return;
			this.#reset();
			this.#setState("cancelled");
		}, {
			once: true,
			signal: controller.signal
		});
		element.addEventListener(this.event("end"), (e) => {
			const evt = e;
			if (transitionId !== this.#transitionId) return;
			this.#cleanup(effect, element);
			this.#reset();
			this.#setState(effect === "transitionEnter" ? "entered" : "idle");
			if (typeof callback === "function") callback(evt);
		}, {
			once: true,
			signal: controller.signal
		});
		window.requestAnimationFrame(() => {
			if (transitionId !== this.#transitionId) return;
			if (from) removeClasses(element, from);
			if (to) addClasses(element, to);
			this.initialized = true;
		});
		return true;
	}
	/**
	* Run enter transition.
	* 
	* @param {HTMLElement} element
	* @param {(e: TransitionEvent|AnimationEvent) => void} [callback]
	* @returns {boolean}
	*/
	enter(element, callback) {
		return this.#execute("transitionEnter", element, callback);
	}
	/**
	* Run leave transition.
	* 
	* @param {HTMLElement} element
	* @param {(e: TransitionEvent|AnimationEvent) => void} [callback]
	* @returns {boolean}
	*/
	leave(element, callback) {
		return this.#execute("transitionLeave", element, callback);
	}
	/**
	* Whether either an enter or leave transition exists.
	* 
	* @returns {boolean}
	*/
	exists() {
		return !!(this.#config.transitionEnter || this.#config.transitionLeave);
	}
	/**
	* Immediately cancel the active transition.
	*/
	cancel() {
		if (!this.effect || !this.target) return;
		this.#transitionId++;
		this.#controller?.abort();
		this.#cleanup(this.effect, this.target);
		this.#controller = null;
		this.#reset();
		this.#setState("cancelled");
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
	/**
	* @returns {boolean}
	*/
	get isIdle() {
		return this.state === "idle";
	}
	/**
	* @returns {boolean}
	*/
	get isEntering() {
		return this.state === "entering";
	}
	/**
	* @returns {boolean}
	*/
	get isEntered() {
		return this.state === "entered";
	}
	/**
	* @returns {boolean}
	*/
	get isLeaving() {
		return this.state === "leaving";
	}
	/**
	* @returns {boolean}
	*/
	get isCancelled() {
		return this.state === "cancelled";
	}
	/**
	* Whether a transition is currently active.
	* 
	* @returns {boolean}
	*/
	get isBusy() {
		return this.isEntering || this.isLeaving;
	}
};
//#endregion
//#region src/core/BaseComponent.js
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
var BaseComponent = class {
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
		return "BaseComponent";
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
		return parseComponentDataAttributes(el, this.componentName.toLowerCase(), {
			...Transition.defaults,
			...this.defaults
		});
	}
	/** @type {HTMLElement} */
	#el;
	/** @type {O & EventCallbacks<T, any>} */
	#options;
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
	constructor(target, options = {}) {
		if (typeof target === "string") {
			const el = document.querySelector(target);
			if (!el) throw new Error(`[${config.name} / ${this.name}] No element found for selector "${target}".`);
			this.#el = el;
		} else if (target instanceof Element) this.#el = target;
		else throw new TypeError(`[${config.name} / ${this.name}] First argument must be a CSS selector string or an Element.`);
		const staticConstructor = this.constructor;
		const dataOptions = staticConstructor.parseDataAttributes(this.#el);
		this.#options = {
			...staticConstructor.defaults,
			...options,
			...dataOptions
		};
		this.#transition = new Transition(this.#options);
		Registry.set(this.#el, this.name, this);
		logger.info(`${this.name}: initialized`, this.#el);
	}
	/**
	* Get the component name dynamically from the constructor.
	* 
	* @type {string}
	*/
	get name() {
		return this.constructor.componentName;
	}
	/** The root DOM element this component is bound to. */
	get el() {
		return this.#el;
	}
	/** 
	* Merged options object (static defaults + user options).
	* 
	* @returns {O & EventCallbacks<T, any> & import('./Transition.js').TransitionOptions}
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
	* @param {Extract<keyof T, string> | 'destroy'} event - Custom event name or core lifecycle event
	* @param {Record<string, any>} [payload={}] - Additional event parameters to merge alongside the instance
	*/
	emit(event, payload = {}) {
		const unifiedPayload = Object.assign({ instance: this }, payload);
		this.#bus.emit(String(event), unifiedPayload);
		this.#el.dispatchEvent(new CustomEvent(`${config.dataPrefix}:${String(event)}`, {
			detail: unifiedPayload,
			bubbles: true,
			cancelable: true
		}));
		const eventStr = String(event);
		const callbackKey = `on${eventStr.charAt(0).toUpperCase()}${eventStr.slice(1)}`;
		const callback = this.options[callbackKey];
		if (typeof callback === "function") callback(unifiedPayload);
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
		this.emit("destroy", this);
		this.#domEvents.removeAll();
		this.#bus.clear();
		Registry.delete(this.#el, this.name);
		logger.info(`${this.name}: destroyed`, this.#el);
	}
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
		return [...document.querySelectorAll(selector)].map((el) => new this(el, options));
	}
};
//#endregion
//#region src/core/DataStorage.js
/**
* @typedef {Object} Options
* @property {string} [prefix] The prefix for the storage keys.
* @property {string} [delimiter] The delimiter for the storage keys.
* @property {boolean} [jsonEncode] Whether to JSON encode values before storing.
* @property {'local' | 'session'} [storageType] The type of storage to use.
*/
/** @type {Options} */
const defaults$2 = {
	prefix: "",
	delimiter: ":",
	jsonEncode: true,
	storageType: "local"
};
/**
* DataStorage
*
* A simplified Web Storage class for storing data in local or session storage.
*/
var DataStorage = class {
	/**
	* Constructor
	* 
	* @param {Options} [options]
	*/
	constructor(options = {}) {
		this.options = {
			...defaults$2,
			...options
		};
		this.storage = this.options.storageType === "session" ? sessionStorage : localStorage;
		this.options.delimiter = isEmpty(this.options.prefix) ? "" : this.options.delimiter;
	}
	/**
	* Get a prefixed or direct key.
	* 
	* @param {string} key 
	* @returns {string}
	* */
	#getKey(key) {
		return `${this.options.prefix}${this.options.delimiter}${key}`;
	}
	/**
	* Set a JSON encoded value or return as-is.
	* 
	* @param {any} value 
	* @returns {string}
	*/
	#encode(value) {
		return this.options.jsonEncode ? JSON.stringify(value) : value;
	}
	/**
	* Get a JSON encoded value or return as-is.
	* 
	* @param {any} value 
	* @returns {string}
	*/
	#decode(value) {
		return this.options.jsonEncode ? JSON.parse(value) : value;
	}
	/**
	* Check for existing key in storage.
	* 
	* @param {string} key 
	* @returns {boolean}
	*/
	has(key) {
		return this.#getKey(key) in this.storage;
	}
	/**
	* Add or update a key in storage.
	* 
	* @param {string} key 
	* @param {any} value 
	*/
	set(key, value) {
		this.storage.setItem(this.#getKey(key), this.#encode(value));
	}
	/**
	* Get a value from storage.
	* 
	* @param {string} key 
	* @param {any} [defaultValue=null] 
	* @returns {any}
	*/
	get(key, defaultValue = null) {
		const item = this.storage.getItem(this.#getKey(key));
		return item ? this.#decode(item) : defaultValue;
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
		items = items.map((x) => this.#getKey(x));
		for (const item of items) this.storage.removeItem(item);
	}
	/**
	* Clear all keys from storage, or only those with the specified prefix.
	* 
	* @param {string} [keyPrefix] Optional prefix to clear only matching keys.
	*/
	clear(keyPrefix) {
		if (!isEmpty(keyPrefix)) {
			for (const key in this.storage) if (key.startsWith(`${this.options.prefix}${this.options.delimiter}`)) this.storage.removeItem(key);
			return;
		}
		this.storage.clear();
	}
};
//#endregion
//#region src/components/Dropdown.js
/**
* @typedef {Object} DropdownEvents
* @property {{instance: Dropdown}} change Fired when the dropdown changes.
*/
/**
* @typedef {object} Placements
* @property {'top' | 'top-start' | 'top-end'} top
* @property {'right' | 'right-start' | 'right-end'} right
* @property {'bottom' | 'bottom-start' | 'bottom-end'} bottom
* @property {'left' | 'left-start' | 'left-end'} left
*/
/**
* @typedef {typeof import('@floating-ui/dom')} FloatingUI
*/
/**
* @typedef {Object} DropdownOptions
* @property {string | HTMLElement} [target] The CSS selector string or element for the dropdown.
* @property {boolean | 'inside' | 'outside'} [autoClose=true] Whether the dropdown should automatically close when clicking inside or outside.
* @property {number} [offsetDistance=8] The distance in pixels between the dropdown and the reference element.
* @property {number} [offsetSkidding=0] The horizontal offset in pixels for the dropdown.
* @property {Placements[keyof Placements]} [placement='bottom-start'] The placement of the dropdown relative to the reference element (e.g., 'top', 'bottom', 'left', 'right', 'top-start', etc.).
* @property {FloatingUI} [floatingUI] - The official Floating UI DOM module instance.
* @property {string} [hiddenClass] The CSS class name for the hidden state.
*/
/** @type {DropdownOptions} */
const defaults$1 = {
	target: void 0,
	autoClose: true,
	offsetDistance: 8,
	offsetSkidding: 0,
	placement: "bottom-start",
	floatingUI: void 0,
	hiddenClass: "hidden"
};
/**
* @extends {BaseComponent<DropdownEvents, typeof defaults>}
*/
var Dropdown = class extends BaseComponent {
	static get componentName() {
		return "Dropdown";
	}
	static get defaults() {
		return defaults$1;
	}
	/** @type {HTMLElement} */
	#dropdown;
	/** @type {FloatingUI} */
	#floatingUI;
	#isVisible = false;
	/**
	* Constructor
	* 
	* @param {string|Element} target CSS selector string or DOM Element.
	* @param {DropdownOptions} [options]
	*/
	constructor(target, options = {}) {
		super(target, options);
		this.#init();
	}
	#init() {
		if (!this.#getTargetElement()) throw new Error(`You must set a target or reference element for the dropdown.`);
		this.#dropdown = this.#getTargetElement();
		if (this.options.floatingUI) this.#floatingUI = this.options.floatingUI;
		/** @param {Event} e */
		const _onClick = (e) => {
			e.type;
			const target = e.target;
			if (!this.#isVisible && this.el.contains(target)) {
				this.show();
				return;
			}
			if (this.#isVisible) {
				if (![true, "outside"].includes(this.options.autoClose) && !this.#dropdown.contains(target)) return;
				this.hide();
			}
		};
		this.addListener(document, "click", _onClick);
	}
	/** @returns {HTMLElement | null} */
	#getTargetElement() {
		if (this.options.target instanceof HTMLElement) return this.options.target;
		let target = null;
		if (typeof this.options.target === "string" && this.options.target.trim() !== "") target = query(this.options.target);
		if (!target && this.el.nextElementSibling instanceof HTMLElement) target = this.el.nextElementSibling;
		return target;
	}
	#hasFloatingUI() {
		if (!this.#floatingUI || typeof this.#floatingUI !== "object") return false;
		const hasComputePosition = typeof this.#floatingUI.computePosition === "function";
		if (this.#floatingUI && !hasComputePosition) console.warn("Dropdown: The object provided to the \"floatingUI\" option is not a valid Floating UI module.");
		return hasComputePosition;
	}
	#setPosition() {
		if (!this.#hasFloatingUI()) {
			const rect = this.el.getBoundingClientRect();
			console.log(rect);
			setStyles(this.#dropdown, {
				position: "absolute",
				top: `${rect.bottom + this.options.offsetDistance}px`,
				left: `${rect.left + this.options.offsetSkidding}px`
			});
			return;
		}
	}
	show() {
		this.#setPosition();
		removeClasses(this.#dropdown, this.options.hiddenClass);
		this.#isVisible = true;
		console.log("show");
	}
	hide() {
		addClasses(this.#dropdown, this.options.hiddenClass);
		removeStyles(this.#dropdown, [
			"position",
			"top",
			"left"
		]);
		this.#isVisible = false;
		console.log("hide");
	}
	toggle() {
		if (this.#isVisible) {
			this.hide();
			return;
		}
		this.show();
	}
	destroy() {
		super.destroy();
	}
	get isVisible() {
		return this.#isVisible;
	}
};
//#endregion
//#region src/components/Theme.js
/**
* @typedef {'light' | 'dark' | 'auto'} ThemeMode
*/
/**
* @typedef {Object} ThemeEvents
* @property {{instance: Theme}} change Fired when the theme changes.
*/
/**
* @typedef {Object} ThemeOptions
* @property {string} [trigger] The element or selector that triggers the theme change.
* @property {ThemeMode | string} [autoModeName] The name of the auto mode.
* @property {string} [attributeName] The data attribute name to store the current theme mode.
* @property {string} [modeAttributeName] The data attribute name to store the current theme mode on the trigger element.
* @property {string} [label] The label template for the trigger element, where :mode will be replaced with the current mode.
* @property {boolean} [showTitle] Whether to show the title attribute on the trigger element.
* @property {boolean} [enableStorage] Whether to enable localStorage to persist the theme mode.
* @property {string} [storageKey] The key used to store the theme mode in localStorage.
* @property {'local' | 'session'} [storageType] The type of storage to use for persisting the theme mode.
* @property {string} [className] The CSS class name for the dark theme.
*/
/** @type {ThemeOptions} */
const defaults = {
	trigger: void 0,
	autoModeName: "auto",
	attributeName: "data-theme",
	modeAttributeName: "data-mode",
	label: "Switch to :mode theme",
	showTitle: false,
	enableStorage: true,
	storageKey: "theme",
	storageType: "local",
	className: "dark"
};
/**
* @extends {BaseComponent<ThemeEvents, typeof defaults>}
*/
var Theme = class extends BaseComponent {
	static get componentName() {
		return "Theme";
	}
	static get defaults() {
		return defaults;
	}
	/** @type {DataStorage} */
	#storage;
	/** @type {Record<ThemeMode, ThemeMode>} */
	#modes = {
		light: "light",
		dark: "dark",
		auto: "auto"
	};
	#theme = this.#modes.auto;
	/**
	* Constructor
	* 
	* @param {string|Element} target CSS selector string or DOM Element.
	* @param {ThemeOptions} [options]
	*/
	constructor(target, options = {}) {
		super(target, options);
		this.#init();
	}
	#init() {
		this.#storage = new DataStorage({
			jsonEncode: false,
			storageType: this.options.storageType === "session" ? "session" : "local"
		});
		this.#modes.auto = this.options.autoModeName;
		if (this.options.enableStorage) this.#theme = this.#storage.get(this.options.storageKey, this.#modes.auto);
		else this.#storage.remove(this.options.storageKey);
		/** @param {Event} e */
		const _onTrigger = (e) => {
			e.preventDefault();
			e.stopPropagation();
			const trigger = e.target;
			const mode = this.#getMode(trigger);
			this.change(mode);
		};
		this.#getTriggers().forEach((trigger) => {
			if (this.#isClickable(trigger)) this.addListener(trigger, "click", _onTrigger);
			if (this.#isChangeable(trigger)) this.addListener(trigger, "change", _onTrigger);
		});
		const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
		this.addListener(mediaQuery, "change", (event) => {
			if (this.#getTheme() === this.#modes.auto) this.change(this.#getTheme());
		});
		this.addListener(window, "storage", (e) => {
			if (this.options.storageKey === e.key) {
				const mode = e.newValue || this.#modes.auto;
				this.change(mode);
			}
		});
		setAttributes(this.el, { [this.options.attributeName]: this.#getTheme() });
		this.#getTriggers().forEach((trigger) => {
			if (this.#isClickable(trigger)) setAttributes(trigger, { role: "button" });
			const type = "type" in trigger ? trigger.type : "";
			if (this.#isClickable(trigger) || ["checkbox", "radio"].includes(type)) {
				const label = interpolate(this.options.label, { mode: this.#getMode(trigger) });
				setAttributes(trigger, {
					ariaLabel: label,
					title: {
						condition: this.options.showTitle,
						value: label
					}
				});
			}
		});
		this.#shouldAddDarkClass(this.#getTheme());
		this.#updateTriggerState(this.#getTheme());
	}
	/**
	* Retrieves all trigger elements for this instance.
	* 
	* @returns {Array<HTMLAnchorElement | HTMLButtonElement | HTMLInputElement | HTMLSelectElement>}
	*/
	#getTriggers() {
		return queryAll(this.options.trigger);
	}
	/** @returns {ThemeMode} */
	#getTheme() {
		return this.#storage.get(this.options.storageKey, this.#theme);
	}
	/**
	* Determine the theme mode from an element's value or data attribute.
	* 
	* @param {HTMLElement} el
	* @returns {ThemeMode}
	*/
	#getMode(el) {
		if (el instanceof HTMLInputElement && el.type === "checkbox") return el.checked ? this.#modes.dark : this.#modes.light;
		if (this.#isClickable(el) && !hasAttribute(el, this.options.modeAttributeName)) return !hasAttribute(el, "aria-pressed") || getAttribute(el, "aria-pressed") !== "true" ? this.#modes.dark : this.#modes.light;
		const val = "value" in el ? el.value : "";
		const mode = !isEmpty(val) ? val : getAttribute(el, this.options.modeAttributeName);
		return objectHasValue(this.#modes, mode) ? mode : this.#modes.auto;
	}
	/** 
	* @param {HTMLElement} el 
	* @returns {boolean}
	*/
	#isChangeable(el) {
		const type = "type" in el ? el.type : "";
		return [
			"select-one",
			"radio",
			"checkbox"
		].includes(type);
	}
	/** 
	* @param {HTMLElement} el 
	* @returns {boolean}
	*/
	#isClickable(el) {
		return ["button", "a"].includes(el.localName);
	}
	/** 
	* @param {HTMLElement} el 
	* @returns {boolean}
	*/
	#isToggleable(el) {
		return ("type" in el ? el.type : "") === "checkbox" || this.#isClickable(el) && !hasAttribute(el, this.options.modeAttributeName);
	}
	/** @param {ThemeMode} mode  */
	#shouldAddDarkClass(mode) {
		const isDarkPreferred = window.matchMedia("(prefers-color-scheme: dark)").matches;
		const shouldAddDarkClass = mode === this.#modes.auto && isDarkPreferred || mode === this.#modes.dark;
		this.el.classList.toggle(this.options.className, shouldAddDarkClass);
	}
	/** @param {ThemeMode} mode  */
	#updateTriggerState(mode) {
		const isDarkPreferred = window.matchMedia("(prefers-color-scheme: dark)").matches;
		this.#getTriggers().forEach((trigger) => {
			if (trigger instanceof HTMLInputElement) {
				if (trigger.type === "radio") trigger.checked = mode === this.#getMode(trigger);
				if (trigger.type === "checkbox") trigger.checked = mode === this.#modes.auto ? isDarkPreferred : mode === this.#modes.dark;
			}
			if (trigger instanceof HTMLSelectElement) {
				if (trigger.type === "select-one") trigger.value = mode;
			}
			if (this.#isClickable(trigger) && hasAttribute(trigger, this.options.modeAttributeName)) setAttributes(trigger, { ariaPressed: this.#getMode(trigger) === mode });
			if (this.#isClickable(trigger) && this.#isToggleable(trigger)) setAttributes(trigger, { ariaPressed: mode === this.#modes.auto ? isDarkPreferred : mode === this.#modes.dark });
			if (this.#isToggleable(trigger)) {
				const label = interpolate(this.options.label, { mode: mode === this.#modes.dark ? this.#modes.light : this.#modes.dark });
				setAttributes(trigger, {
					ariaLabel: label,
					title: {
						condition: this.options.showTitle,
						value: label
					}
				});
			}
		});
	}
	/**
	* Change the theme mode and update DOM accordingly.
	* 
	* @param {ThemeMode} mode
	*/
	change(mode) {
		if (!(mode in this.#modes)) mode = this.#modes.auto;
		if (this.options.enableStorage) if (mode === this.#modes.auto) this.#storage.remove(this.options.storageKey);
		else this.#storage.set(this.options.storageKey, mode);
		this.#shouldAddDarkClass(mode);
		this.#theme = mode;
		setAttributes(this.el, { [this.options.attributeName]: mode });
		this.#updateTriggerState(mode);
		this.emit("change");
	}
	destroy() {
		this.#storage.remove(this.options.storageKey);
		this.el.classList.remove(this.options.className);
		removeAttributes(this.el, [this.options.attributeName]);
		this.#getTriggers().forEach((trigger) => {
			if (this.#isClickable(trigger)) removeAttributes(trigger, ["aria-pressed", "aria-label"]);
			if (this.#isChangeable(trigger)) {
				if (trigger instanceof HTMLSelectElement) {
					if (trigger.type === "select-one") trigger.selectedIndex = 0;
				}
				if (trigger instanceof HTMLInputElement) {
					if (trigger.type === "radio" || trigger.type === "checkbox") trigger.checked = false;
				}
			}
		});
		super.destroy();
	}
	/** @returns {string} */
	get theme() {
		return this.#getTheme();
	}
	get modes() {
		return this.#modes;
	}
};
//#endregion
export { AutoInit, BaseComponent, DOMEventStore, DataStorage, Dropdown, EventBus, Registry, Theme, Transition, bootAutoInit, config, configure, logger, resetConfig, utils_exports as utils };

//# sourceMappingURL=index.js.map