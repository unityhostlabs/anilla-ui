import { BaseComponent } from '../core/BaseComponent.js';
import { query } from '../core/utils.js';

/**
 * @typedef {Object} DropdownOptions
 * @property {string|null} [trigger=null] Selector for the trigger button/link.
 * @property {string} [activeClass='is-open'] CSS class added to the panel when open.
 * @property {boolean} [closeOnOutsideClick=true] Close the dropdown when clicking outside.
 * @property {boolean} [closeOnItemClick=true] Close the dropdown when an item inside is clicked.
 */

/** @type {DropdownOptions} */
const defaults = {
    trigger: null,
    activeClass: 'is-open',
    closeOnOutsideClick: true,
    closeOnItemClick: true,
};

/**
 * @typedef {Object} DropdownEvents
 * @property {[Dropdown]} show Fired immediately when the show instance method is called.
 * @property {[Dropdown]} shown Fired when the dropdown has been made visible to the user.
 * @property {[Dropdown]} hide Fired immediately when the hide instance method is called.
 * @property {[Dropdown]} hidden Fired when the dropdown has been hidden from the user.
 * @property {[Dropdown]} destroy Fired when the dropdown instance is destroyed.
 */

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

    // --- Lifecycle

    _init() {
        this._trigger = null;
        this._isOpen = false;

        this._onDocumentClick = (e) => {
            if (
                !this.el.contains(e.target) &&
                this._trigger !== e.target &&
                !this._trigger?.contains(e.target)
            ) {
                this.hide();
            }
        };

        this._onItemClick = (e) => {
            if (e.target !== this.el) this.hide();
        };
        
        this.el.setAttribute('role', 'menu');
        this.el.setAttribute('aria-hidden', 'true');

        // Resolve trigger: options.trigger selector takes priority,
        // then fall back to the legacy data-{prefix}-dropdown-trigger attribute.
        if (this.options.trigger) {
            this._trigger = query(this.options.trigger);
        } else {
            const panelId = this.el.id;
            if (panelId) {
                // Legacy attribute kept for backward compat
                this._trigger = query(`[data-ui-dropdown-trigger="${panelId}"]`);
            }
        }

        if (this._trigger) {
            this._trigger.setAttribute('aria-expanded', 'false');
            this._trigger.setAttribute('aria-haspopup', 'true');
            this.addListener(this._trigger, 'click', (e) => {
                e.stopPropagation();
                this.toggle();
            });
        }
        
        if (this.options.closeOnOutsideClick) {
            this.addListener(document, 'click', this._onDocumentClick);
        }

        if (this.options.closeOnItemClick) {
            this.addListener(this.el, 'click', this._onItemClick);
        }
    }

    _onDestroy() {
        if (this._trigger) {
            this._trigger.removeAttribute('aria-expanded');
            this._trigger.removeAttribute('aria-haspopup');
        }
    }

    // ─── Public API ───────────────────────────────────────────────────────────

    get isOpen() {
        return this._isOpen;
    }

    get trigger() {
        return this._trigger;
    }

    show() {
        if (this._isOpen) return;
        this.emit('show', this);
        this.el.classList.add(this.options.activeClass);
        this.el.setAttribute('aria-hidden', 'false');
        this._trigger?.setAttribute('aria-expanded', 'true');
        this._isOpen = true;

        if (this.transition.exists()) {
            this.transition.enter(this.el, () => this.emit('shown', this));
        } else {
            this.emit('shown', this);
        }
    }

    hide() {
        if (!this._isOpen) return;
        this.emit('hide', this);

        if (this.transition.exists()) {
            this.transition.leave(this.el, () => this._applyHide());
        } else {
            this._applyHide();
        }
    }

    toggle() {
        this._isOpen ? this.hide() : this.show();
    }

    // ─── Internals ────────────────────────────────────────────────────────────

    _applyHide() {
        this.el.classList.remove(this.options.activeClass);
        this._trigger?.focus();
        this.el.setAttribute('aria-hidden', 'true');
        this._trigger?.setAttribute('aria-expanded', 'false');
        this._isOpen = false;
        this.emit('hidden', this);
    }
}