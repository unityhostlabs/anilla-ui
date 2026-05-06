Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
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
*/
/** @type {AnillaUIConfig} */
const defaults$3 = {
	name: "AnillaUI",
	version: "0.1.0",
	dataPrefix: "ui",
	autoInit: false,
	logLevel: "error",
	debug: false
};
/** @type {AnillaUIConfig} */
const config = { ...defaults$3 };
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
	const invalid = Object.keys(overrides).filter((k) => !(k in defaults$3));
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
	Object.assign(config, defaults$3);
	return config;
}
/**
* Internal logger
* 
* Used by all modules inside the library. Respects config.logLevel and
* config.debug so consumers can control verbosity without touching source.
*/
const logger = {
	info(...args) {
		if (config.debug) console.info(`[${config.name}]`, ...args);
	},
	warn(...args) {
		if (config.logLevel !== "silent") console.warn(`[${config.name}]`, ...args);
	},
	error(...args) {
		if (config.logLevel !== "silent") console.error(`[${config.name}]`, ...args);
	}
};
//#endregion
//#region src/core/AutoInit.js
/**
* AutoInit
*
* Scans the DOM for elements that have a component enable attribute and
* automatically initializes the matching component class with options read
* from the element's data attributes.
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
	register(ComponentClass) {
		const name = ComponentClass.componentName;
		if (!name || name === "BaseComponent") {
			logger.warn(`AutoInit.register(): "${ComponentClass.name}" does not define a static componentName — skipped.`);
			return;
		}
		componentMap.set(name.toLowerCase(), ComponentClass);
		logger.info(`AutoInit: registered "${name}" → data-${config.dataPrefix}-${name.toLowerCase()}`);
	},
	registerAll(classes) {
		classes.forEach((cls) => AutoInit.register(cls));
	},
	init(root = document) {
		if (componentMap.size === 0) {
			logger.warn("AutoInit.init(): no components are registered. Call AutoInit.registerAll() first.");
			return [];
		}
		const created = [];
		for (const [slug, ComponentClass] of componentMap) {
			const enableAttr = `data-${config.dataPrefix}-${slug}`;
			root.querySelectorAll(`[${enableAttr}="true"]`).forEach((el) => {
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
	registeredNames() {
		return [...componentMap.keys()];
	},
	unregister(nameOrSlug) {
		componentMap.delete(nameOrSlug.toLowerCase());
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
		for (const { el, type, handler, options } of this.#entries) el.removeEventListener(type, handler, options);
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
/** @type {Map<string, BaseComponent>} */
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
	set(el, componentName, instance) {
		const key = makeKey(el, componentName);
		if (store.has(key)) {
			logger.warn(`Registry: <${componentName}> is already initialised on this element. Call destroy() on the existing instance before re-initialising.`);
			return;
		}
		store.set(key, instance);
		logger.info(`Registry: registered <${componentName}>`);
	},
	getByElement(el, componentName) {
		const attr = el.getAttribute(idAttr());
		if (!attr) return void 0;
		return store.get(`${componentName}::${attr}`);
	},
	getBySelector(selector, componentName) {
		const el = document.querySelector(selector);
		if (!el) return void 0;
		return Registry.getByElement(el, componentName);
	},
	get(target, componentName) {
		if (typeof target === "string") return Registry.getBySelector(target, componentName);
		if (target instanceof Element) return Registry.getByElement(target, componentName);
	},
	getAllOfType(componentName) {
		const prefix = `${componentName}::`;
		return [...store.entries()].filter(([key]) => key.startsWith(prefix)).map(([, instance]) => instance);
	},
	getAll() {
		return [...store.values()];
	},
	delete(el, componentName) {
		const attr = el.getAttribute(idAttr());
		if (!attr) return;
		store.delete(`${componentName}::${attr}`);
		el.removeAttribute(idAttr());
		logger.info(`Registry: unregistered <${componentName}>`);
	},
	clear() {
		store.clear();
	},
	debug() {
		return new Map(store);
	}
};
//#endregion
//#region src/core/utils.js
var utils_exports = /* @__PURE__ */ __exportAll({
	addClasses: () => addClasses,
	coerceType: () => coerceType,
	getAttribute: () => getAttribute,
	hasAttribute: () => hasAttribute,
	isEmpty: () => isEmpty,
	objectHasValue: () => objectHasValue,
	parseComponentDataAttributes: () => parseComponentDataAttributes,
	query: () => query,
	queryAll: () => queryAll,
	removeAttributes: () => removeAttributes,
	removeClasses: () => removeClasses,
	setAttributes: () => setAttributes,
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
* @param {Element}              el        The DOM element to read from
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
* Split a space-separated class string and add each token.
* 
* @param {HTMLElement} el
* @param {string} classString
*/
const addClasses = (el, classString) => {
	classString.trim().split(/\s+/).forEach((cls) => el.classList.add(cls));
};
/**
* Split a space-separated class string and remove each token.
* 
* @param {HTMLElement} el
* @param {string} classString
*/
const removeClasses = (el, classString) => {
	classString.trim().split(/\s+/).forEach((cls) => el.classList.remove(cls));
};
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
function queryAll(selectorOrMap, context = document) {
	if (selectorOrMap instanceof Map) return Array.from(selectorOrMap.values());
	return Array.from(context.querySelectorAll(selectorOrMap));
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
	const arr = isString(value) ? value.split(separator).map((x) => x.trim()).filter((x) => x !== "") : value;
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
const hasAttribute = (element, name) => {
	return !!element?.hasAttribute(name ?? "");
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
const getAttribute = (element, name) => {
	return element?.getAttribute(name ?? "") ?? null;
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
const setAttributes = (element, attributes) => {
	if (!element?.getAttributeNames) return;
	const entries = Object.entries(attributes);
	if (!entries.length) return;
	for (const [key, value] of entries) element.setAttribute(key.replace(/([A-Z])/g, "-$1").toLowerCase(), value);
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
const removeAttributes = (element, attributes) => {
	if (!element?.removeAttribute || !attributes?.length) return;
	for (const attribute of attributes) element.removeAttribute(attribute.replace(/([A-Z])/g, "-$1").toLowerCase());
};
//#endregion
//#region src/core/Transition.js
/** @type {TransitionOptions} */
const defaults$2 = {
	transitionEnter: null,
	transitionEnterFrom: null,
	transitionEnterTo: null,
	transitionLeave: null,
	transitionLeaveFrom: null,
	transitionLeaveTo: null
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
var Transition = class {
	/**
	* Default values for all transition options.
	* Merged into the validation whitelist in BaseComponent.parseDataAttributes
	* so that data-{component}-transition-* attributes are never filtered out.
	* 
	* @returns {Record<string, null>}
	*/
	static get defaults() {
		return defaults$2;
	}
	/** @type {Record<string, string>} */
	#config = {};
	/** @type {'transition'|'animation'} */
	type = "transition";
	/** Transition/animation duration in seconds (read from computed styles). */
	duration = 0;
	/** Timing function (read from computed styles). */
	timing = "ease";
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
		const styles = window.getComputedStyle(element);
		const isAnimation = styles.animationName !== "none" && parseFloat(styles.animationDuration) > 0;
		this.type = isAnimation ? "animation" : "transition";
		this.duration = parseFloat(isAnimation ? styles.animationDuration : styles.transitionDuration);
		this.timing = isAnimation ? styles.animationTimingFunction : styles.transitionTimingFunction;
		element.addEventListener(`${this.type}start`, () => {
			this.busy = true;
			this.effect = effect;
			this.target = element;
		}, { once: true });
		element.addEventListener(`${this.type}cancel`, () => {
			this.busy = false;
			this.effect = null;
			this.target = null;
		}, { once: true });
		element.addEventListener(`${this.type}end`, (e) => {
			this.busy = false;
			this.initialized = false;
			this.effect = null;
			this.target = null;
			if (typeof callback === "function") callback(e);
			removeClasses(element, base);
			if (to) removeClasses(element, to);
		}, { once: true });
		window.requestAnimationFrame(() => {
			if (from) removeClasses(element, from);
			if (to) addClasses(element, to);
		});
		this.initialized = true;
		return true;
	}
	/**
	* Run the enter transition.
	* 
	* @param {HTMLElement} element
	* @param {(e: TransitionEvent|AnimationEvent) => void} [callback]
	*/
	enter(element, callback) {
		return this._execute("transitionEnter", element, callback);
	}
	/**
	* Run the leave transition.
	* 
	* @param {HTMLElement} element
	* @param {(e: TransitionEvent|AnimationEvent) => void} [callback]
	*/
	leave(element, callback) {
		return this._execute("transitionLeave", element, callback);
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
};
//#endregion
//#region src/core/BaseComponent.js
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
	* @param {Element} el
	* @returns {Record<string, any>}
	*/
	static parseDataAttributes(el) {
		return parseComponentDataAttributes(el, this.componentName.toLowerCase(), {
			...Transition.defaults,
			...this.defaults
		});
	}
	/** @type {Element} */
	#el;
	/** @type {O} */
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
			if (!el) throw new Error(`[${config.name} / ${this.constructor.componentName}] No element found for selector "${target}".`);
			this.#el = el;
		} else if (target instanceof Element) this.#el = target;
		else throw new TypeError(`[${config.name} / ${this.constructor.componentName}] First argument must be a CSS selector string or an Element.`);
		const dataOptions = this.constructor.parseDataAttributes(this.#el);
		this.#options = {
			...this.constructor.defaults,
			...options,
			...dataOptions
		};
		this.#transition = new Transition(this.#options);
		Registry.set(this.#el, this.constructor.componentName, this);
		logger.info(`${this.constructor.componentName}: initialized`, this.#el);
	}
	/** The root DOM element this component is bound to. */
	get el() {
		return this.#el;
	}
	/** 
	* Merged options object (static defaults + user options).
	* 
	* @returns {O & TransitionOptions} 
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
	* @param {keyof T} event
	* @param {(...args: any[]) => void} handler
	* @returns {() => void}
	*/
	on(event, handler) {
		return this.#bus.on(event, handler);
	}
	/**
	* Subscribe to a component event exactly once.
	* 
	* @param {keyof T} event
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
	* @param {keyof T} event
	* @param {(...args: any[]) => void} [handler]
	*/
	off(event, handler) {
		this.#bus.off(event, handler);
	}
	/**
	* Emit a component event.
	* Event handlers will receive any additional arguments passed to emit() after the event name.
	* For example: this.emit('open', data) will pass data to all handlers subscribed to 'open'.
	* 
	* @param {keyof T} event 
	* @param {...any} args
	*/
	/**
	* Emit a component event.
	*
	* Fires on two pipelines simultaneously:
	*   1. Internal EventBus  — reaches listeners registered via this.on()
	*   2. Native DOM event   — reaches listeners registered via element.addEventListener()
	*
	* The native CustomEvent carries all extra arguments merged into a
	* `detail` object alongside the component instance:
	*
	*   this.emit('change', { from: 'a', to: 'b' })
	*
	*   // EventBus listener
	*   modal.on('change', (payload) => payload)  // { from: 'a', to: 'b' }
	*
	*   // DOM listener
	*   el.addEventListener('ui:change', (e) => e.detail)
	*   // { instance: modal, from: 'a', to: 'b' }
	*
	* The native event name is prefixed with config.dataPrefix + ':' to avoid
	* collisions with built-in DOM events:
	*   'change' → 'ui:change'
	*   'shown'  → 'ui:shown'
	*
	* The CustomEvent bubbles by default so parent elements can also listen.
	*
	* @param {keyof T} event
	* @param {...any} args
	*/
	emit(event, ...args) {
		this.#bus.emit(event, ...args);
		const detail = Object.assign({ instance: this }, ...args.map((arg) => arg !== null && typeof arg === "object" && !Array.isArray(arg) ? arg : { data: arg }));
		this.#el.dispatchEvent(new CustomEvent(`${config.dataPrefix}:${event}`, {
			detail,
			bubbles: true,
			cancelable: true
		}));
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
	* @param {Element|Window|Document} el
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
	* @returns {Readonly<Array<{el: Element, type: string, handler: Function}>>}
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
		Registry.delete(this.#el, this.constructor.componentName);
		logger.info(`${this.constructor.componentName}: destroyed`, this.#el);
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
* @property {string} prefix The prefix for the storage keys.
* @property {string} delimiter The delimiter for the storage keys.
* @property {boolean} jsonEncode Whether to JSON encode values before storing.
* @property {'local' | 'session'} storageType The type of storage to use.
*/
/** @type {Options} */
const defaults$1 = {
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
			...defaults$1,
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
	_getKey(key) {
		return `${this.options.prefix}${this.options.delimiter}${key}`;
	}
	/**
	* Get the value to store, optionally JSON encoded.
	* 
	* @param {any} value 
	* @returns {string}
	*/
	_getValue(value) {
		return this.options.jsonEncode ? JSON.stringify(value) : value;
	}
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
		this.storage.setItem(this._getKey(key), this._getValue(value));
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
		return item ? this._getValue(item) : defaultValue;
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
		items = items.map((x) => this._getKey(x));
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
//#region src/components/Theme.js
/**
* @typedef {Object} ThemeOptions
* @property {HTMLElement | string} trigger The element or selector that triggers the theme change.
* @property {HTMLElement | string} parent The parent element or selector to apply the theme class to.
* @property {string} [mode] The theme mode to set (e.g. 'light', 'dark', 'system'). If undefined and there is a value attribute on the trigger element, its value will be used or fallback on the defaultMode.
* @property {boolean} [toggle] If true, the theme mode will toggled between light and dark.
* @property {string} autoModeName The name of the auto mode.
* @property {string} attributeName The data attribute name to store the current theme mode.
* @property {string} modeAttributeName The data attribute name to store the current theme mode on the trigger element.
* @property {string} storageKey The key used to store the theme mode in localStorage.
* @property {string} className The CSS class name for the dark theme.
*/
/** @type {ThemeOptions} */
const defaults = {
	trigger: void 0,
	parent: document.documentElement,
	mode: void 0,
	toggle: false,
	autoModeName: "system",
	attributeName: "data-theme",
	modeAttributeName: "data-mode",
	storageKey: "theme",
	className: "dark"
};
/**
* @typedef {Object} ThemeEvents
* @property {[Theme]} change Fired when the theme changes.
*/
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
	#storage = new DataStorage({ jsonEncode: false });
	constructor(target, options = {}) {
		super(target, options);
		this._init();
	}
	_init() {
		this._modes = {
			light: "light",
			dark: "dark",
			auto: this.options.autoModeName
		};
		this.options.parent = query(this.options.parent);
		const _onTrigger = (e) => {
			e.preventDefault();
			e.stopPropagation();
			const trigger = e.target;
			const mode = this._getMode(trigger);
			this.change(mode);
		};
		this._getTriggers().forEach((trigger) => {
			if (this._isClickable(trigger)) this.addListener(trigger, "click", _onTrigger);
			if (this._isChangeable(trigger)) this.addListener(trigger, "change", _onTrigger);
		});
		this.addListener(window.matchMedia("(prefers-color-scheme: dark)"), "change", (e) => {
			if (this._getTheme() === this._modes.auto) if (e.matches) addClasses(this.options.parent, this.options.className);
			else removeClasses(this.options.parent, this.options.className);
		});
		this.addListener(window, "storage", (e) => {
			if (this.options.storageKey === e.key) {
				const mode = JSON.parse(e.newValue);
				this.change(mode || this._modes.auto);
			}
		});
		setAttributes(this.options.parent, { [this.options.attributeName]: this._getTheme() });
		const isDarkPreferred = window.matchMedia("(prefers-color-scheme: dark)").matches;
		if (this._getTheme() === this._modes.auto && isDarkPreferred || this._getTheme() === this._modes.dark) addClasses(this.options.parent, this.options.className);
		this._updateTriggerState(this._getTheme());
	}
	_getTriggers() {
		return queryAll(this.options.trigger);
	}
	/** @returns {string} */
	_getTheme() {
		return this.#storage.get("theme", this._modes.auto);
	}
	/**
	* Determine the theme mode from an element.
	* 
	* @param {HTMLElement} el
	* @returns {string}
	*/
	_getMode(el) {
		if (el.type === "checkbox") return el.checked ? this._modes.dark : this._modes.light;
		if (this._isClickable(el) && !hasAttribute(el, this.options.modeAttributeName)) return !hasAttribute(el, "aria-pressed") || getAttribute(el, "aria-pressed") !== "true" ? this._modes.dark : this._modes.light;
		const mode = !isEmpty(el.value) ? el.value : getAttribute(el, this.options.modeAttributeName);
		return objectHasValue(this._modes, mode) ? mode : this._modes.auto;
	}
	/** 
	* @param {HTMLElement} el 
	* @returns {boolean}
	*/
	_isChangeable(el) {
		return [
			"select-one",
			"radio",
			"checkbox"
		].includes(el.type);
	}
	/** 
	* @param {HTMLElement} el 
	* @returns {boolean}
	*/
	_isClickable(el) {
		return ["button", "a"].includes(el.localName);
	}
	/** 
	* @param {HTMLElement} el 
	* @returns {boolean}
	*/
	_isToggleable(el) {
		return el.type === "checkbox" || this._isClickable(el) && !hasAttribute(el, this.options.modeAttributeName);
	}
	_updateClickableStateAttributes(el, mode) {
		setAttributes(el, {
			ariaPressed: mode === this._modes.dark,
			ariaCurrent: mode === this._modes.dark
		});
	}
	_updateTriggerState(mode) {
		this._getTriggers().forEach((trigger) => {
			if (trigger.type === "checkbox") trigger.checked = mode === this._modes.dark;
			if (trigger.type === "radio") trigger.checked = mode === this._getMode(trigger);
			if (trigger.type === "select-one") trigger.value = mode;
			if (this._isClickable(trigger) && hasAttribute(trigger, this.options.modeAttributeName)) {
				const triggerMode = this._getMode(trigger);
				setAttributes(trigger, {
					ariaPressed: triggerMode === mode,
					ariaCurrent: triggerMode === mode
				});
			}
			if (this._isClickable(trigger) && this._isToggleable(trigger)) setAttributes(trigger, {
				ariaPressed: mode === this._modes.dark,
				ariaCurrent: mode === this._modes.dark
			});
		});
	}
	/** @returns {string} */
	get theme() {
		return this._theme;
	}
	/**
	* Change the theme mode and update DOM accordingly.
	* 
	* @param {string} mode
	*/
	change(mode) {
		const isDarkPreferred = window.matchMedia("(prefers-color-scheme: dark)").matches;
		const shouldAddDarkClass = mode === this._modes.dark || mode === this._modes.auto && isDarkPreferred;
		if (mode === this._modes.auto) this.#storage.remove(this.options.storageKey);
		else this.#storage.set(this.options.storageKey, mode);
		if (shouldAddDarkClass) addClasses(this.options.parent, this.options.className);
		else removeClasses(this.options.parent, this.options.className);
		setAttributes(this.options.parent, { [this.options.attributeName]: mode });
		this._updateTriggerState(mode);
		this.emit("change", this);
	}
	destroy() {
		this.#storage.remove(this.options.storageKey);
		removeClasses(this.options.parent, this.options.className);
		removeAttributes(this.options.parent, [this.options.attributeName]);
		this._getTriggers().forEach((trigger) => {
			if (this._isClickable(trigger)) removeAttributes(trigger, ["aria-pressed", "aria-current"]);
			if (this._isChangeable(trigger)) {
				if (trigger.type === "select-one") trigger.selectedIndex = 0;
				if (trigger.type === "radio" || trigger.type === "checkbox") trigger.checked = false;
			}
		});
		super.destroy();
	}
};
//#endregion
exports.AutoInit = AutoInit;
exports.BaseComponent = BaseComponent;
exports.DOMEventStore = DOMEventStore;
exports.DataStorage = DataStorage;
exports.EventBus = EventBus;
exports.Registry = Registry;
exports.Theme = Theme;
exports.Transition = Transition;
exports.bootAutoInit = bootAutoInit;
exports.config = config;
exports.configure = configure;
exports.logger = logger;
exports.resetConfig = resetConfig;
Object.defineProperty(exports, "utils", {
	enumerable: true,
	get: function() {
		return utils_exports;
	}
});

//# sourceMappingURL=index.cjs.map