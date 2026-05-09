import { BaseComponent } from '../core/BaseComponent.js';
import { DataStorage } from '../core/DataStorage.js';
import { 
    query, 
    queryAll,
    isEmpty, 
    objectHasValue, 
    getAttribute,
    setAttributes,
    removeAttributes,
    hasAttribute,
    addClasses,
    removeClasses
} from '../core/utils.js';
import { config, logger } from '../core/config.js';

/**
 * @typedef {'light' | 'dark' | 'auto'} ThemeMode
 */

/**
 * @typedef {Object} ThemeOptions
 * @property {HTMLElement | string} trigger The element or selector that triggers the theme change.
 * @property {HTMLElement | string} parent The parent element or selector to apply the theme class to.
 * @property {ThemeMode} [mode] The theme mode to set (e.g. 'light', 'dark', 'system'). If undefined and there is a value attribute on the trigger element, its value will be used or fallback on the defaultMode.
 * @property {boolean} [toggle] If true, the theme mode will toggled between light and dark.
 * @property {string} autoModeName The name of the auto mode.
 * @property {string} attributeName The data attribute name to store the current theme mode.
 * @property {string} modeAttributeName The data attribute name to store the current theme mode on the trigger element.
 * @property {string} storageKey The key used to store the theme mode in localStorage.
 * @property {string} className The CSS class name for the dark theme.
 */

/** @type {ThemeOptions} */
const defaults = {
    trigger: undefined,
    parent: document.documentElement,
    mode: undefined,
    toggle: false,
    autoModeName: 'auto',
    attributeName: 'data-theme',
    modeAttributeName: 'data-mode',
    storageKey: 'theme',
    className: 'dark'
};

/**
 * @typedef {Object} ThemeEvents
 * @property {[Theme]} change Fired when the theme changes.
 */

/**
 * @extends {BaseComponent<ThemeEvents, typeof defaults>}
 */
export class Theme extends BaseComponent {
    static get componentName() {
        return 'Theme';
    }

    static get defaults() {
        return defaults;
    }

    /** @private */
    #storage = new DataStorage({ jsonEncode: false });

    /** @private */
    #modes = {
        light: 'light',
        dark: 'dark',
        auto: 'auto'
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

    // --- Core

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

        this.#getTriggers().forEach(trigger => {
            if (this.#isClickable(trigger)) {
                this.addListener(trigger, 'click', _onTrigger);
            }

            if (this.#isChangeable(trigger)) {
                this.addListener(trigger, 'change', _onTrigger);
            }
        });

        this.addListener(window.matchMedia('(prefers-color-scheme: dark)'), 'change', (e) => {
            if (this.#getTheme() === this.#modes.auto) {
                if (e.matches) {
                    addClasses(this.options.parent, this.options.className);
                } else {
                    removeClasses(this.options.parent, this.options.className);
                }
            }
        });

        this.addListener(window, 'storage', (e) => {
            if (this.options.storageKey === e.key) {
                const mode = JSON.parse(e.newValue);
                this.change(mode || this.#modes.auto);
            }
        });

        // Set initial attributes
        setAttributes(this.options.parent, {
            [this.options.attributeName]: this.#getTheme()
        });

        // Set initial theme based on stored value or system preference
        const isDarkPreferred = window.matchMedia('(prefers-color-scheme: dark)').matches;

        if ((this.#getTheme() === this.#modes.auto && isDarkPreferred) || this.#getTheme() === this.#modes.dark) {
            addClasses(this.options.parent, this.options.className);
        }

        // Update trigger state on initialization
        this.#updateTriggerState(this.#getTheme());
    }

    #getTriggers() {
        return queryAll(this.options.trigger);
    }

    /** @returns {string} */
    #getTheme() {
        return this.#storage.get('theme', this.#modes.auto);
    }

    /**
     * Determine the theme mode from an element's value or data attribute.
     * 
     * @param {HTMLElement} el
     * @returns {string}
     */
    #getMode(el) {
        // Handle checkbox toggle
        if (el.type === 'checkbox') {
            return el.checked ? this.#modes.dark : this.#modes.light;
        }

        // Handle clickable toggle
        if (this.#isClickable(el) && !hasAttribute(el, this.options.modeAttributeName)) {
            return !hasAttribute(el, 'aria-pressed') || getAttribute(el, 'aria-pressed') !== 'true' 
                ? this.#modes.dark 
                : this.#modes.light;
        }

        // Get mode from value or attribute
        const mode = !isEmpty(el.value) ? el.value : getAttribute(el, this.options.modeAttributeName);

        // Return valid mode or default to auto
        return objectHasValue(this.#modes, mode) ? mode : this.#modes.auto;
    }

    /** 
     * @param {HTMLElement} el 
     * @returns {boolean}
     */
    #isChangeable(el) {
        return ['select-one', 'radio', 'checkbox'].includes(el.type);
    }

    /** 
     * @param {HTMLElement} el 
     * @returns {boolean}
     */
    #isClickable(el) {
        return ['button', 'a'].includes(el.localName);
    }

    /** 
     * @param {HTMLElement} el 
     * @returns {boolean}
     */
    #isToggleable(el) {
        return (el.type === 'checkbox' || (this.#isClickable(el)) && !hasAttribute(el, this.options.modeAttributeName));
    }

    #updateTriggerState(mode) {
        this.#getTriggers().forEach(trigger => {
            if (trigger.type === 'checkbox') trigger.checked = mode === this.#modes.dark;
            if (trigger.type === 'radio') trigger.checked = mode === this.#getMode(trigger);
            if (trigger.type === 'select-one') trigger.value = mode;

            if (this.#isClickable(trigger) && hasAttribute(trigger, this.options.modeAttributeName)) {
                const triggerMode = this.#getMode(trigger);

                setAttributes(trigger, {
                    ariaPressed: triggerMode === mode,
                    ariaCurrent: triggerMode === mode
                });
            }

            if (this.#isClickable(trigger) && this.#isToggleable(trigger)) {
                setAttributes(trigger, {
                    ariaPressed: mode === this.#modes.dark,
                    ariaCurrent: mode === this.#modes.dark
                });
            }
        });
    }

    // --- Public API

    /**
     * Change the theme mode and update DOM accordingly.
     * 
     * @param {ThemeMode} mode
     */
    change(mode) {
        const isDarkPreferred = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const shouldAddDarkClass = mode === this.#modes.dark || (mode === this.#modes.auto && isDarkPreferred);

        // Update storage
        if (mode === this.#modes.auto) {
            this.#storage.remove(this.options.storageKey);
        } else {
            this.#storage.set(this.options.storageKey, mode);
        }

        // Update DOM classes
        if (shouldAddDarkClass) {
            addClasses(this.options.parent, this.options.className);
        } else {
            removeClasses(this.options.parent, this.options.className);
        }

        // Update attribute
        setAttributes(this.options.parent, {
            [this.options.attributeName]: mode
        });

        // Update trigger state
        this.#updateTriggerState(mode);

        this.emit('change', this);
    }

    destroy() {
        this.#storage.remove(this.options.storageKey);
        removeClasses(this.options.parent, this.options.className);
        removeAttributes(this.options.parent, [this.options.attributeName]);

        this.#getTriggers().forEach(trigger => {
            if (this.#isClickable(trigger)) {
                removeAttributes(trigger, ['aria-pressed', 'aria-current']);
            }

            if (this.#isChangeable(trigger)) {
                if (trigger.type === 'select-one') trigger.selectedIndex = 0;
                if (trigger.type === 'radio' || trigger.type === 'checkbox') trigger.checked = false;
            }
        });

        super.destroy();
    }

    // --- Public Accessors

    /** @returns {string} */
    get theme() {
        return this.#getTheme();
    }

    get modes() {
        return this.#modes;
    }
}