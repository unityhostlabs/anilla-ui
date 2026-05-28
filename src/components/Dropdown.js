import { BaseComponent } from '../core/BaseComponent.js';
import { query, addClasses, removeClasses, setStyles, removeStyles } from '../core/utils.js';
// import { computePosition, offset, flip, shift, limitShift, autoUpdate } from '@floating-ui/dom';

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
const defaults = {
    target: undefined,
    autoClose: true,
    offsetDistance: 8,
    offsetSkidding: 0,
    placement: 'bottom-start',
    floatingUI: undefined,
    hiddenClass: 'hidden'
};

/**
 * @extends {BaseComponent<DropdownEvents, typeof defaults>}
 */
export class Dropdown extends BaseComponent {
    static get componentName() {
        return 'Dropdown';
    }

    static get defaults() {
        return defaults;
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

    // --- Core

    #init() {
        if (!this.#getTargetElement()) {
            throw new Error(
                `Target element or dropdown not found.`
            );
        }

        this.#dropdown = this.#getTargetElement();
        if (this.options.floatingUI) this.#floatingUI = this.options.floatingUI;

        /** @param {Event} e */
        const _onToggle = (e) => {
            e.preventDefault();
            this.toggle();
        };

        /** @param {KeyboardEvent} e */
        const _onKeydown = (e) => {
            if (['Escape'].includes(e.key) && this.#isVisible) {
                this.hide();
            }
        };

        /** @param {FocusEvent} e */
        const _onClose = (e) => {
            const isFocus = e.type === 'focusout' && e.relatedTarget !== null;
            const clicked = /** @type {HTMLElement} */ (isFocus ? e.relatedTarget : e.target);

            if (!this.#isVisible) return;

            // Return if the interaction is inside the main element container
            if (this.el.contains(clicked)) return;

            const isInsideDropdown = this.#dropdown.contains(clicked);
            const autoClose = this.options.autoClose;

            // Return for keyboard focusout inside the dropdown
            if (isFocus && isInsideDropdown) return;

            // Return for keyboard focusout when autoClose is not configured for outside
            if (isFocus && ![true, 'outside'].includes(autoClose)) return;

            // Return for mouse clicks when autoClose conditions are not met
            if (!isFocus) {
                if (isInsideDropdown && ![true, 'inside'].includes(autoClose)) return;
                if (!isInsideDropdown && ![true, 'outside'].includes(autoClose)) return;
            }

            this.hide();
        };

        this.addListener(this.el, 'click', _onToggle);
        this.addListener(window, 'click', _onClose);
        this.addListener(this.el, 'keydown', _onKeydown);
        this.addListener(this.#dropdown, 'keydown', _onKeydown);
        this.addListener(this.el, 'focusout', _onClose);
        this.addListener(this.#dropdown, 'focusout', _onClose);
    }

    /** @returns {HTMLElement | null} */
    #getTargetElement() {
        if (this.options.target instanceof HTMLElement) return this.options.target;
        let target = null;
        
        if (typeof this.options.target === 'string' && this.options.target.trim() !== '') {
            target = query(this.options.target);
        }

        if (!target && this.el.nextElementSibling instanceof HTMLElement) {
            target = this.el.nextElementSibling;
        }
        
        return target;
    }

    #hasFloatingUI() {
        if (!this.#floatingUI || typeof this.#floatingUI !== 'object') {
            return false;
        }

        const hasComputePosition = typeof this.#floatingUI.computePosition === 'function';

        if (this.#floatingUI && !hasComputePosition) {
            console.warn('Dropdown: The object provided to the "floatingUI" option is not a valid Floating UI module.');
        }

        return hasComputePosition;
    }

    #setPosition() {
        if (!this.#hasFloatingUI()) {
            const rect = this.el.getBoundingClientRect();
            setStyles(this.#dropdown, {
                position: 'absolute',
                top: `${rect.bottom + this.options.offsetDistance}px`,
                left: `${rect.left + this.options.offsetSkidding}px`
            });

            return;
        }
    }

    // --- Public API

    show() {
        this.#setPosition();
        removeClasses(this.#dropdown, this.options.hiddenClass);
        this.#isVisible = true;
        console.log('show');
    }

    hide() {
        addClasses(this.#dropdown, this.options.hiddenClass);
        removeStyles(this.#dropdown, ['position', 'top', 'left']);
        this.#isVisible = false;
        console.log('hide');
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

    // --- Public Accessors

    get isVisible() {
        return this.#isVisible;
    }
}