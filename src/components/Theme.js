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
    trigger: undefined,
    parent: document.documentElement,
    mode: undefined,
    toggle: false,
    autoModeName: 'system',
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

    // --- Core

    _init() {
        this.storage = new DataStorage({ jsonEncode: false });
        this._modes = {
            light: 'light',
            dark: 'dark',
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

        this._getTriggers().forEach(trigger => {
            if (this._isClickable(trigger)) {
                this.addListener(trigger, 'click', _onTrigger);
            }

            if (this._isChangeable(trigger)) {
                this.addListener(trigger, 'change', _onTrigger);
            }
        });

        this.addListener(window.matchMedia('(prefers-color-scheme: dark)'), 'change', (e) => {
            if (this._getTheme() === this._modes.auto) {
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
                this.change(mode || this._modes.auto);
            }
        });

        // Set initial attributes
        setAttributes(this.options.parent, {
            [this.options.attributeName]: this._getTheme()
        });

        // Set initial theme based on stored value or system preference
        const isDarkPreferred = window.matchMedia('(prefers-color-scheme: dark)').matches;

        if ((this._getTheme() === this._modes.auto && isDarkPreferred) || this._getTheme() === this._modes.dark) {
            addClasses(this.options.parent, this.options.className);
        }

        // Update trigger state on initialization
        this._updateTriggerState(this._getTheme());
    }

    _onDestroy() {
        this.storage.remove(this.options.storageKey);
        removeClasses(this.options.parent, this.options.className);
        removeAttributes(this.options.parent, [this.options.attributeName]);

        this._getTriggers().forEach(trigger => {
            if (this._isClickable(trigger)) {
                removeAttributes(trigger, ['aria-pressed', 'aria-current']);
            }

            if (this._isChangeable(trigger)) {
                if (trigger.type === 'select-one') trigger.selectedIndex = 0;
                if (trigger.type === 'radio' || trigger.type === 'checkbox') trigger.checked = false;
            }
        });
    }

    _getTriggers() {
        return queryAll(this.options.trigger);
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
        if (el.type === 'checkbox') {
            return el.checked ? this._modes.dark : this._modes.light;
        }

        // Handle clickable toggle
        if (this._isClickable(el) && !hasAttribute(el, this.options.modeAttributeName)) {
            return !hasAttribute(el, 'aria-pressed') || getAttribute(el, 'aria-pressed') !== 'true' 
                ? this._modes.dark 
                : this._modes.light;
        }

        // Get mode from value or attribute
        const mode = !isEmpty(el.value) ? el.value : getAttribute(el, this.options.modeAttributeName);

        // Return valid mode or default to auto
        return objectHasValue(this._modes, mode) ? mode : this._modes.auto;
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

    /** 
     * @param {HTMLElement} el 
     * @returns {boolean}
     */
    _isToggleable(el) {
        return (el.type === 'checkbox' || (this._isClickable(el)) && !hasAttribute(el, this.options.modeAttributeName));
    }

    _updateClickableStateAttributes(el, mode) {
        setAttributes(el, {
            ariaPressed: mode === this._modes.dark,
            ariaCurrent: mode === this._modes.dark
        });
    }

    _updateTriggerState(mode) {
        this._getTriggers().forEach(trigger => {
            if (trigger.type === 'checkbox') trigger.checked = mode === this._modes.dark;
            if (trigger.type === 'radio') trigger.checked = mode === this._getMode(trigger);
            if (trigger.type === 'select-one') trigger.value = mode;

            if (this._isClickable(trigger) && hasAttribute(trigger, this.options.modeAttributeName)) {
                const triggerMode = this._getMode(trigger);

                setAttributes(trigger, {
                    ariaPressed: triggerMode === mode,
                    ariaCurrent: triggerMode === mode
                });
            }

            if (this._isClickable(trigger) && this._isToggleable(trigger)) {
                setAttributes(trigger, {
                    ariaPressed: mode === this._modes.dark,
                    ariaCurrent: mode === this._modes.dark
                });
            }
        });
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
        const shouldAddDarkClass = mode === this._modes.dark || (mode === this._modes.auto && isDarkPreferred);

        // Update storage
        if (mode === this._modes.auto) {
            this.storage.remove(this.options.storageKey);
        } else {
            this.storage.set(this.options.storageKey, mode);
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
        this._updateTriggerState(mode);

        this.emit('change', this);
    }
}