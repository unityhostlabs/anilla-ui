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
                `You must set a target or reference element for the dropdown.`
            );
        }

        this.#dropdown = this.#getTargetElement();
        if (this.options.floatingUI) this.#floatingUI = this.options.floatingUI;

        /** @param {Event} e */
        const _onToggle = (e) => {
            e.preventDefault();
            this.toggle();
        };

        /** @param {Event} e */
        const _onClick = (e) => {
            const isFocus = e.type === 'focusout';
            const target = /** @type {HTMLElement} */ (e.target);

            if (!this.#isVisible && this.el.contains(target)) {
                this.show();

                return;
            }

            if (this.#isVisible) {
                if (![true, 'outside'].includes(this.options.autoClose) && !this.#dropdown.contains(target)) return;

                // if (target === this.#dropdown || this.#dropdown.contains(target)) return;

                this.hide();
            }
        };

        // this.addListener(this.el, 'click', _onToggle);
        this.addListener(document, 'click', _onClick);
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
            console.log(rect);
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