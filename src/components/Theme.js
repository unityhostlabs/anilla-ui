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
    removeClasses,
    interpolate
} from '../core/utils.js';

/**
 * @typedef {'light' | 'dark' | 'auto'} ThemeMode
 */

/**
 * @typedef {Object} ThemeOptions
 * @property {string} [trigger] The element or selector that triggers the theme change.
 * @property {ThemeMode | string} [autoModeName] The name of the auto mode.
 * @property {string} [attributeName] The data attribute name to store the current theme mode.
 * @property {string} [modeAttributeName] The data attribute name to store the current theme mode on the trigger element.
 * @property {string} [label] The label template for the trigger element, where :mode will be replaced with the current mode.
 * @property {boolean} [showTitle] Whether to show the title attribute on the trigger element.
 * @property {boolean} [listenToStorage] Whether to listen to storage events for theme changes across tabs.
 * @property {string} [storageKey] The key used to store the theme mode in localStorage.
 * @property {string} [className] The CSS class name for the dark theme.
 */

/** @type {ThemeOptions} */
const defaults = {
    trigger: undefined,
    autoModeName: 'auto',
    attributeName: 'data-theme',
    modeAttributeName: 'data-mode',
    label: 'Switch to :mode theme',
    showTitle: false,
    listenToStorage: true,
    storageKey: 'theme',
    className: 'dark'
};

/**
 * @typedef {Object} ThemeEvents
 * @property {(instance: Theme) => void} change Fired when the theme changes.
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

    #storage = new DataStorage({ jsonEncode: false });

    /** @type {Record<ThemeMode, ThemeMode>} */
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
        this.#modes.auto = /** @type {ThemeMode} */ (this.options.autoModeName);

         /** @param {Event} e */
        const _onTrigger = (e) => {
            e.preventDefault();
            e.stopPropagation();

            const trigger = /** @type {HTMLElement} */ (e.target);
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

        const mediaQuery = /** @type {any} */ (window.matchMedia('(prefers-color-scheme: dark)'));

        this.addListener(mediaQuery, 'change', (event) => {
            const e = /** @type {MediaQueryListEvent} */ (event);
            
            if (this.#getTheme() === this.#modes.auto) {
                if (e.matches) {
                    addClasses(this.el, this.options.className);
                } else {
                    removeClasses(this.el, this.options.className);
                }
            }
        });

        if (this.options.listenToStorage) {            
            this.addListener(window, 'storage', (e) => {
                if (this.options.storageKey === e.key) {
                    const mode = /** @type {ThemeMode} */ (e.newValue || this.#modes.auto);
                    this.change(mode);
                }
            });
        }
     
        // Set initial attributes
        setAttributes(this.el, {
            [this.options.attributeName]: this.#getTheme()
        });

        this.#getTriggers().forEach(trigger => {
            if (this.#isClickable(trigger)) {
                setAttributes(trigger, {
                    role: 'button',
                });
            }

            const type = 'type' in trigger ? trigger.type : '';

            if (this.#isClickable(trigger) || ['checkbox', 'radio'].includes(type)) {
                const label = interpolate(this.options.label, { mode: this.#getMode(trigger) });
                setAttributes(trigger, {
                    ariaLabel: label,
                    title: { condition: this.options.showTitle, value: label }
                });
            }
        });

        // Set initial theme based on stored value or system preference
        const isDarkPreferred = window.matchMedia('(prefers-color-scheme: dark)').matches;

        if ((this.#getTheme() === this.#modes.auto && isDarkPreferred) || this.#getTheme() === this.#modes.dark) {
            addClasses(this.el, this.options.className);
        }

        // Update trigger state on initialization
        this.#updateTriggerState(this.#getTheme());
    }

    /**
     * Retrieves all trigger elements for this instance.
     * 
     * @returns {Array<HTMLAnchorElement | HTMLButtonElement | HTMLInputElement | HTMLSelectElement>}
     */
    #getTriggers() {
        return /** @type {any} */ (queryAll(this.options.trigger));
    }

    /** @returns {ThemeMode} */
    #getTheme() {
        return this.#storage.get(this.options.storageKey, this.#modes.auto);
    }

    /**
     * Determine the theme mode from an element's value or data attribute.
     * 
     * @param {HTMLElement} el
     * @returns {ThemeMode}
     */
    #getMode(el) {
        // Handle checkbox toggle
        if (el instanceof HTMLInputElement && el.type === 'checkbox') {
            return el.checked ? this.#modes.dark : this.#modes.light;
        }

        // Handle clickable toggle
        if (this.#isClickable(el) && !hasAttribute(el, this.options.modeAttributeName)) {
            return !hasAttribute(el, 'aria-pressed') || getAttribute(el, 'aria-pressed') !== 'true' 
                ? this.#modes.dark 
                : this.#modes.light;
        }

        // Get mode from value or attribute
        const val = 'value' in el ? /** @type {HTMLInputElement | HTMLSelectElement} */ (el).value : '';
        const mode = /** @type {ThemeMode} */ (!isEmpty(val) ? val : getAttribute(el, this.options.modeAttributeName));

        // Return valid mode or default to auto
        return objectHasValue(this.#modes, mode) ? mode : this.#modes.auto;
    }

    /** 
     * @param {HTMLElement} el 
     * @returns {boolean}
     */
    #isChangeable(el) {
        const type = 'type' in el ? /** @type {any} */ (el).type : '';

        return ['select-one', 'radio', 'checkbox'].includes(type);
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
        const type = 'type' in el ? /** @type {any} */ (el).type : '';
        
        return (type === 'checkbox' || (this.#isClickable(el)) && !hasAttribute(el, this.options.modeAttributeName));
    }

    /** @param {ThemeMode} mode  */
    #updateTriggerState(mode) {
        this.#getTriggers().forEach(trigger => {
            if (trigger instanceof HTMLInputElement) {
                if (trigger.type === 'checkbox') trigger.checked = mode === this.#modes.dark;
                if (trigger.type === 'radio') trigger.checked = mode === this.#getMode(trigger);
            }
            
            if (trigger instanceof HTMLSelectElement) {
                if (trigger.type === 'select-one') trigger.value = mode;
            }

            if (this.#isClickable(trigger) && hasAttribute(trigger, this.options.modeAttributeName)) {
                const triggerMode = this.#getMode(trigger);

                setAttributes(trigger, {
                    ariaPressed: triggerMode === mode
                });
            }

            if (this.#isClickable(trigger) && this.#isToggleable(trigger)) {
                setAttributes(trigger, {
                    ariaPressed: mode === this.#modes.dark
                });
            }

            if (this.#isToggleable(trigger)) {
                const label = interpolate(this.options.label, { 
                        mode: mode === this.#modes.dark ? this.#modes.light : this.#modes.dark
                    });
                setAttributes(trigger, {
                    ariaLabel: label,
                    title: { condition: this.options.showTitle, value: label }
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
            addClasses(this.el, this.options.className);
        } else {
            removeClasses(this.el, this.options.className);
        }

        // Update attribute
        setAttributes(this.el, {
            [this.options.attributeName]: mode
        });

        // Update trigger state
        this.#updateTriggerState(mode);

        this.emit('change', this);
    }

    destroy() {
        this.#storage.remove(this.options.storageKey);
        removeClasses(this.el, this.options.className);
        removeAttributes(this.el, [this.options.attributeName]);

        this.#getTriggers().forEach(trigger => {
            if (this.#isClickable(trigger)) {
                removeAttributes(trigger, ['aria-pressed', 'aria-label']);
            }

            if (this.#isChangeable(trigger)) {
                if (trigger instanceof HTMLSelectElement) {
                    if (trigger.type === 'select-one') trigger.selectedIndex = 0;
                }

                if (trigger instanceof HTMLInputElement) {
                    if (trigger.type === 'radio' || trigger.type === 'checkbox') trigger.checked = false;
                }
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