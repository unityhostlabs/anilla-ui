import { BaseComponent } from '../core/BaseComponent.js';
import { 
    query, 
    addClasses, 
    removeClasses, 
    setStyles, 
    removeStyles, 
    setAttributes, 
    removeAttributes 
} from '../core/utils.js';

/**
 * @typedef {Object} DropdownEvents
 * @property {{instance: Dropdown}} show Emitted when the dropdown show method is called.
 * @property {{instance: Dropdown}} shown Emitted when the dropdown is shown.
 * @property {{instance: Dropdown}} hide Emitted when the dropdown hide method is called.
 * @property {{instance: Dropdown}} hidden Emitted when the dropdown is hidden.
 * @property {{instance: Dropdown}} toggle Emitted when the dropdown is toggled.
 * @property {{instance: Dropdown}} destroy Emitted when the dropdown instance is destroyed.
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
 * @property {function(DropdownEvents['show']): void} [onShow] Called when the dropdown show method is called.
 * @property {function(DropdownEvents['shown']): void} [onShown] Called when the dropdown is shown.
 * @property {function(DropdownEvents['hide']): void} [onHide] Called when the dropdown hide method is called.
 * @property {function(DropdownEvents['hidden']): void} [onHidden] Called when the dropdown is hidden.
 * @property {function(DropdownEvents['toggle']): void} [onToggle] Called when the dropdown is toggled.
 * @property {function(DropdownEvents['destroy']): void} [onDestroy] Called when the dropdown instance is destroyed.
 */

/** @type {DropdownOptions} */
const defaults = {
    target: undefined,
    autoClose: true,
    offsetDistance: 8,
    offsetSkidding: 0,
    placement: 'bottom-start',
    floatingUI: undefined,
    hiddenClass: 'hidden',
    onShow: undefined,
    onShown: undefined,
    onHide: undefined,
    onHidden: undefined,
    onToggle: undefined,
    onDestroy: undefined
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

    /** @type {() => void | null} */
    #cleanupPositioner = null;

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

        setAttributes(this.el, {
            ariaHaspopup: 'true',
            ariaExpanded: 'false'
        });
        
        if (this.#dropdown.id) {
            setAttributes(this.el, { ariaControls: this.#dropdown.id });
        }

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
        // Always kill any existing autoUpdate loop before configuring a new one
        if (typeof this.#cleanupPositioner === 'function') {
            this.#cleanupPositioner();
            this.#cleanupPositioner = null; 
        }

        // Clear out any previous positioning artifacts so the element calculates cleanly
        setStyles(this.#dropdown, { top: null, left: null });

        if (!this.#hasFloatingUI()) {
            setStyles(this.#dropdown, {
                top: `${this.el.offsetHeight + this.options.offsetDistance}px`,
                left: `${this.options.offsetSkidding}px`
            });

            return;
        }

        const { computePosition, offset, flip, shift, autoUpdate } = this.#floatingUI;

        const updatePosition = async () => {
            computePosition(this.el, this.#dropdown, {
                placement: this.options.placement,
                middleware: [
                    offset({
                        mainAxis: this.options.offsetDistance,
                        crossAxis: this.options.offsetSkidding
                    }),
                    flip(),
                    shift({ padding: 8 })
                ]
            }).then(({ x, y }) => {
                setStyles(this.#dropdown, {
                    left: `${x}px`,
                    top: `${y}px`
                });
            });
        };
        
        if (typeof autoUpdate === 'function') {
            this.#cleanupPositioner = autoUpdate(this.el, this.#dropdown, updatePosition);
        } else {
            updatePosition();
        }
    }

    /**
     * @param {Parameters<BaseComponent["_onOptionsUpdate"]>[0] & DropdownOptions} changed
     * @param {Parameters<BaseComponent["_onOptionsUpdate"]>[1] & DropdownOptions} previous
     */
    _onOptionsUpdate(changed, previous) {
        const hasFloatingUIOptions = ['placement', 'offsetDistance', 'offsetSkidding'].some(key => Object.hasOwn(changed, key));

        if (hasFloatingUIOptions && this.#isVisible) {
            // Halt ongoing active frame transitions before resetting positions
            if (this.transition.exists && this.transition.isBusy) {
                this.transition.cancel();
            }

            this.#setPosition();
        }
    }

    // --- Public API

    show() {
        if (this.transition.isBusy) return;

        this.emit('show');
        this.#setPosition();
        removeClasses(this.#dropdown, this.options.hiddenClass);
        this.el.setAttribute('aria-expanded', 'true');
        this.#isVisible = true;

        if (this.transition.exists) {
            this.transition.enter(this.#dropdown, () => this.emit('shown'));
        } else {
            this.emit('shown');
        }
    }

    hide() {
        if (this.transition.isBusy) return;

        this.emit('hide');

        const hideDropdown = () => {
            addClasses(this.#dropdown, this.options.hiddenClass);
            removeStyles(this.#dropdown, ['top', 'left']);
            this.el.setAttribute('aria-expanded', 'false');
            this.#isVisible = false;

            // Remove Floating UI's autoUpdate window loop listeners
            if (this.#cleanupPositioner) {
                this.#cleanupPositioner();
                this.#cleanupPositioner = null;
            }

            this.emit('hidden');           
        };

        if (this.transition.exists) {
            this.transition.leave(this.#dropdown, () => hideDropdown());
        } else {
            hideDropdown();
        }
    }

    toggle() {
        if (this.#isVisible) {
            this.hide();
            this.emit('toggle');

            return;
        }

        this.show();
        this.emit('toggle');
    }

    destroy() {
        if (this.#cleanupPositioner) {
            this.#cleanupPositioner();
        }

        removeAttributes(this.el, ['aria-haspopup', 'aria-expanded', 'aria-controls']);
        super.destroy();
    }

    // --- Public Accessors

    get isVisible() {
        return this.#isVisible;
    }
}