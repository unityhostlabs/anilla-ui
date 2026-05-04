import { BaseComponent } from '../core/BaseComponent.js';
import { DataStorage } from '../core/DataStorage.js';
import { 
    query, 
    queryAll, 
    isString, 
    isEmpty, 
    objectHasValue, 
    getAttribute,
    setAttributes,
    addClasses,
    removeClasses
} from '../core/utils.js';
import { config } from '../core/config.js';

/**
 * @typedef {Object} ThemeOptions
 * @property {HTMLElement | string} parent The parent element or selector to apply the theme class to.
 * @property {string} [mode] The theme mode to set (e.g. 'light', 'dark', 'system'). If undefined and there is a value attribute on the trigger element, its value will be used or fallback on the defaultMode.
 * @property {boolean} [toggle] If true, the theme mode will toggled between light and dark.
 * @property {string} autoModeName The name of the auto mode.
 * @property {string} attributeName The data attribute name to store the current theme mode.
 * @property {string} modeAttributeName The data attribute name to store the current theme mode on the trigger element.
 * @property {string} className The CSS class name for the dark theme.
 */

/** @type {ThemeOptions} */
const defaults = {
    parent: 'html',
    mode: undefined,
    toggle: false,
    autoModeName: 'system',
    attributeName: 'data-theme',
    modeAttributeName: 'data-mode',
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

    // --- Core

    _init() {
        this._storageKey = 'theme';
        this.storage = new DataStorage(this.constructor.componentName);
        this._modes = {
            light: 'light',
            dark: 'dark',
            auto: this.options.autoModeName
        };
        this.options.parent = isString(this.options.parent) ? query(this.options.parent) : this.options.parent;
        if (this.el.type === 'checkbox') this.options.toggle = true;
        
        const _onTrigger = (e) => {
            e.preventDefault();
            e.stopPropagation();

            const trigger = e.target;

            this.change(this._getMode(trigger));

            if (this._isClickable(trigger)) {
                setAttributes(trigger, {
                    ariaPressed: this._getTheme() === this._modes.dark,
                    ariaCurrent: this._getTheme() === this._modes.dark
                });
            }
        };
  
        if (this._isClickable(this.el)) {
            this.addListener(this.el, 'click', _onTrigger);
        }

        if (this._isChangeable(this.el)) {
            if (this.el.type === 'radio') {
                this._getRadioGroup().forEach((radio) => {
                    this.addListener(radio, 'change', _onTrigger);
                });
            } else {
                this.addListener(this.el, 'change', _onTrigger);
            }
        }

        this.addListener(window.matchMedia('(prefers-color-scheme: dark)'), 'change', (e) => {
            if (this._getTheme() === this._modes.auto) {
                if (e.matches) {
                    addClasses(this.options.parent, this.options.className);
                } else {
                    removeClasses(this.options.parent, this.options.className);
                }
            }
        });

        // Set initial attributes
        setAttributes(this.options.parent, {
            [this.options.attributeName]: this._getTheme()
        });
        // if (this._isClickable(this.el)) {
        //     setAttributes(this.el, {
        //         ariaPressed: this.options.toggle 
        //             ? this._getTheme() === this._modes.dark 
        //             : this._getTheme() === this._getMode(this.el),
        //         ariaCurrent: this.options.toggle 
        //             ? this._getTheme() === this._modes.dark 
        //             : this._getTheme() === this._getMode(this.el),
        //         role: 'button'
        //     });
        // }
        if (this._getTheme() === this._modes.auto && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            addClasses(this.options.parent, this.options.className);
        }
    }

    /** @returns {string} */
    _getTheme() {
        return this.storage.get('theme', this._modes.auto);
    }

    /**
     * Determine the theme mode from an element.
     * 
     * @param {HTMLElement} el
     * @returns {string}
     */
    _getMode(el) {
        // Handle checkbox toggle
        if (el.type === 'checkbox' && this.options.toggle) {
            return el.checked ? this._modes.dark : this._modes.light;
        }

        // Handle clickable toggle (button, etc.)
        if (this._isClickable(el) && this.options.toggle) {
            return getAttribute(el, 'aria-pressed') === 'true' 
                ? this._modes.dark 
                : this._modes.light;
        }

        // Get mode from value or attribute
        const mode = !isEmpty(el.value) ? el.value : getAttribute(el, this.options.modeAttributeName);

        // Return valid mode or default to auto
        return objectHasValue(this._modes, mode) ? mode : this._modes.auto;
    }

    _getRadioGroup() {
        return queryAll(`[type="radio"][name="${this.el.name}"]`);
    }

    /** 
     * @param {HTMLElement} el 
     * @returns {boolean}
     */
    _isChangeable(el) {
        return ['select-one', 'radio', 'checkbox'].includes(el.type);
    }

    /** 
     * @param {HTMLElement} el 
     * @returns {boolean}
     */
    _isClickable(el) {
        return ['button', 'a'].includes(el.localName);
    }

    // --- Public API

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
        const isDarkPreferred = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const shouldAddDarkClass = mode === this._modes.dark || 
            (mode === this._modes.auto && isDarkPreferred);

        // Update storage
        if (mode === this._modes.auto) {
            this.storage.remove(this._storageKey);
        } else {
            this.storage.set(this._storageKey, mode);
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
    }
}