import { BaseComponent } from '../core/BaseComponent.js';
import { query, queryAll, addClasses, removeClasses } from '../core/utils.js';
// import { computePosition, offset, flip, shift, limitShift, autoUpdate } from '@floating-ui/dom';

/**
 * @typedef {Object} DropdownEvents
 * @property {{instance: Dropdown}} change Fired when the dropdown changes.
 */

/**
 * @typedef {typeof import('@floating-ui/dom')} FloatingUI
 */

/**
 * @typedef {Object} DropdownOptions
 * @property {string | HTMLElement} [target] The CSS selector string or element for the dropdown.
 * @property {FloatingUI} [floatingUI] - The official Floating UI DOM module instance.
 * @property {string} [hiddenClass] The CSS class name for the hidden state.
 */

/** @type {DropdownOptions} */
const defaults = {
    target: undefined,
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

    // --- Public API

    destroy() {
        super.destroy();
    }

    // --- Public Accessors

    get accessorName() {
        return 'accessor';
    }
}