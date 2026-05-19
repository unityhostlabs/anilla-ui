import { BaseComponent } from '../core/BaseComponent.js';
import { queryAll, addClasses, removeClasses } from '../core/utils.js';

/**
 * @typedef {Object} DropdownEvents
 * @property {{instance: Dropdown}} change Fired when the dropdown changes.
 */

/**
 * @typedef {Object} DropdownOptions
 * @property {string} [displayClass] The CSS class name for the display state.
 */

/** @type {DropdownOptions} */
const defaults = {
    displayClass: 'hidden'
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
        // initialize
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