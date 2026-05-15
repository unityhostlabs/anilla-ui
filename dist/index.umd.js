(function(global, factory) {
	typeof exports === "object" && typeof module !== "undefined" ? factory(exports) : typeof define === "function" && define.amd ? define(["exports"], factory) : (global = typeof globalThis !== "undefined" ? globalThis : global || self, factory(global.AnillaUI = {}));
})(this, function(exports) {
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
			return result.replaceAll(`:${token}`, placeholders[token]);
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
		registeredNames() {
			return [...componentMap.keys()];
		},
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
			if (store.has(key)) throw new Error(`${componentName} is already initialized on this element`);
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
		* @returns {Record<string, null>}
		*/
		static get defaults() {
			return defaults$2;
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
		/** @param {Record<string, string>} config */
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
		* @returns {boolean}
		*/
		isIdle() {
			return this.state === "idle";
		}
		/**
		* @returns {boolean}
		*/
		isEntering() {
			return this.state === "entering";
		}
		/**
		* @returns {boolean}
		*/
		isEntered() {
			return this.state === "entered";
		}
		/**
		* @returns {boolean}
		*/
		isLeaving() {
			return this.state === "leaving";
		}
		/**
		* @returns {boolean}
		*/
		isCancelled() {
			return this.state === "cancelled";
		}
		/**
		* Whether a transition is currently active.
		* 
		* @returns {boolean}
		*/
		isBusy() {
			return this.isEntering() || this.isLeaving();
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
		_execute(effect, element, callback) {
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
				if (transitionId !== this.#transitionId) return;
				this.#cleanup(effect, element);
				this.#reset();
				this.#setState(effect === "transitionEnter" ? "entered" : "idle");
				if (typeof callback === "function") callback(e);
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
			return this._execute("transitionEnter", element, callback);
		}
		/**
		* Run leave transition.
		* 
		* @param {HTMLElement} element
		* @param {(e: TransitionEvent|AnimationEvent) => void} [callback]
		* @returns {boolean}
		*/
		leave(element, callback) {
			return this._execute("transitionLeave", element, callback);
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
	* @typedef {'light' | 'dark' | 'auto'} ThemeMode
	*/
	/**
	* @typedef {Object} ThemeOptions
	* @property {HTMLElement | string} trigger The element or selector that triggers the theme change.
	* @property {HTMLElement | string} parent The parent element or selector to apply the theme class to.
	* @property {string} autoModeName The name of the auto mode.
	* @property {string} attributeName The data attribute name to store the current theme mode.
	* @property {string} modeAttributeName The data attribute name to store the current theme mode on the trigger element.
	* @property {string} label The label template for the trigger element, where :mode will be replaced with the current mode.
	* @property {boolean} showTitle Whether to show the title attribute on the trigger element.
	* @property {string} storageKey The key used to store the theme mode in localStorage.
	* @property {string} className The CSS class name for the dark theme.
	*/
	/** @type {ThemeOptions} */
	const defaults = {
		trigger: void 0,
		parent: document.documentElement,
		autoModeName: "auto",
		attributeName: "data-theme",
		modeAttributeName: "data-mode",
		label: "Switch to :mode theme",
		showTitle: false,
		storageKey: "theme",
		className: "dark"
	};
	/**
	* @typedef {Object} ThemeEvents
	* @property {(instance: Theme) => void} change Fired when the theme changes.
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
		/** @private */
		#storage = new DataStorage({ jsonEncode: false });
		/** @private */
		#modes = {
			light: "light",
			dark: "dark",
			auto: "auto"
		};
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
			this.#modes.auto = this.options.autoModeName;
			this.options.parent = query(this.options.parent);
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
			this.addListener(window.matchMedia("(prefers-color-scheme: dark)"), "change", (e) => {
				if (this.#getTheme() === this.#modes.auto) if (e.matches) addClasses(this.options.parent, this.options.className);
				else removeClasses(this.options.parent, this.options.className);
			});
			this.addListener(window, "storage", (e) => {
				if (this.options.storageKey === e.key) {
					const mode = e.newValue;
					this.change(mode || this.#modes.auto);
				}
			});
			setAttributes(this.options.parent, { [this.options.attributeName]: this.#getTheme() });
			this.#getTriggers().forEach((trigger) => {
				if (this.#isClickable(trigger)) setAttributes(trigger, { role: "button" });
				if (this.#isClickable(trigger) || ["checkbox", "radio"].includes(trigger.type)) {
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
			const isDarkPreferred = window.matchMedia("(prefers-color-scheme: dark)").matches;
			if (this.#getTheme() === this.#modes.auto && isDarkPreferred || this.#getTheme() === this.#modes.dark) addClasses(this.options.parent, this.options.className);
			this.#updateTriggerState(this.#getTheme());
		}
		#getTriggers() {
			return queryAll(this.options.trigger);
		}
		/** @returns {string} */
		#getTheme() {
			return this.#storage.get(this.options.storageKey, this.#modes.auto);
		}
		/**
		* Determine the theme mode from an element's value or data attribute.
		* 
		* @param {HTMLElement} el
		* @returns {string}
		*/
		#getMode(el) {
			if (el.type === "checkbox") return el.checked ? this.#modes.dark : this.#modes.light;
			if (this.#isClickable(el) && !hasAttribute(el, this.options.modeAttributeName)) return !hasAttribute(el, "aria-pressed") || getAttribute(el, "aria-pressed") !== "true" ? this.#modes.dark : this.#modes.light;
			const mode = !isEmpty(el.value) ? el.value : getAttribute(el, this.options.modeAttributeName);
			return objectHasValue(this.#modes, mode) ? mode : this.#modes.auto;
		}
		/** 
		* @param {HTMLElement} el 
		* @returns {boolean}
		*/
		#isChangeable(el) {
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
		#isClickable(el) {
			return ["button", "a"].includes(el.localName);
		}
		/** 
		* @param {HTMLElement} el 
		* @returns {boolean}
		*/
		#isToggleable(el) {
			return el.type === "checkbox" || this.#isClickable(el) && !hasAttribute(el, this.options.modeAttributeName);
		}
		#updateTriggerState(mode) {
			this.#getTriggers().forEach((trigger) => {
				if (trigger.type === "checkbox") trigger.checked = mode === this.#modes.dark;
				if (trigger.type === "radio") trigger.checked = mode === this.#getMode(trigger);
				if (trigger.type === "select-one") trigger.value = mode;
				if (this.#isClickable(trigger) && hasAttribute(trigger, this.options.modeAttributeName)) setAttributes(trigger, { ariaPressed: this.#getMode(trigger) === mode });
				if (this.#isClickable(trigger) && this.#isToggleable(trigger)) setAttributes(trigger, { ariaPressed: mode === this.#modes.dark });
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
			const isDarkPreferred = window.matchMedia("(prefers-color-scheme: dark)").matches;
			const shouldAddDarkClass = mode === this.#modes.dark || mode === this.#modes.auto && isDarkPreferred;
			if (mode === this.#modes.auto) this.#storage.remove(this.options.storageKey);
			else this.#storage.set(this.options.storageKey, mode);
			if (shouldAddDarkClass) addClasses(this.options.parent, this.options.className);
			else removeClasses(this.options.parent, this.options.className);
			setAttributes(this.options.parent, { [this.options.attributeName]: mode });
			this.#updateTriggerState(mode);
			this.emit("change", this);
		}
		destroy() {
			this.#storage.remove(this.options.storageKey);
			removeClasses(this.options.parent, this.options.className);
			removeAttributes(this.options.parent, [this.options.attributeName]);
			this.#getTriggers().forEach((trigger) => {
				if (this.#isClickable(trigger)) removeAttributes(trigger, ["aria-pressed", "aria-label"]);
				if (this.#isChangeable(trigger)) {
					if (trigger.type === "select-one") trigger.selectedIndex = 0;
					if (trigger.type === "radio" || trigger.type === "checkbox") trigger.checked = false;
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
});

//# sourceMappingURL=index.umd.js.map