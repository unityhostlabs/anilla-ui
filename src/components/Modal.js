import { BaseComponent } from '../core/BaseComponent.js';
import { config } from '../core/config.js';

/**
 * Modal
 *
 * ── Activation ───────────────────────────────────────────────────────────────
 *   <div id="my-modal" data-flowlib-modal="true">...</div>
 *
 * ── Data attribute options ───────────────────────────────────────────────────
 * - data-modal-trigger="#selector"        One or more trigger elements (comma-separated selectors)
 * - data-modal-dismiss="#selector"        One or more dismiss/close elements inside the modal
 * - data-modal-active-class="is-open"     CSS class toggled when the modal is open
 * - data-modal-backdrop-close="false"     Disable closing on backdrop click
 * - data-modal-esc-close="false"          Disable closing on Escape key
 *
 * ── Programmatic ────────────────────────────────────────────────────────────
 * - const modal = new Modal('#my-modal', { backdropClose: false });
 * - modal.show(); modal.hide(); modal.toggle();
 *
 * ── Events ───────────────────────────────────────────────────────────────────
 *   show · shown · hide · hidden · destroy
 */
export class Modal extends BaseComponent {
    static get componentName() {
        return 'Modal';
    }

    static get defaults() {
        return {
            /** CSS class toggled on the element when visible */
            activeClass: 'is-open',
            /** Selector string for trigger element(s) that open the modal */
            trigger: null,
            /** Selector string for dismiss element(s) inside the modal */
            dismiss: null,
            /** Close when the backdrop is clicked */
            backdropClose: true,
            /** Close when Escape is pressed */
            escClose: true,
        };
    }

    // ─── Lifecycle ────────────────────────────────────────────────────────────

    _init() {
        this._backdrop = null;
        this._isVisible = false;
        this._onKeydown = (e) => {
            if (e.key === 'Escape' && this._isVisible) this.hide();
        };

        this.el.setAttribute('aria-hidden', 'true');
        this.el.setAttribute('role', 'dialog');

        this._bindTriggers();
        this._bindDismiss();

        if (this.options.escClose) {
            this.addListener(document, 'keydown', this._onKeydown);
        }
    }

    _onDestroy() {
        this._removeBackdrop();
    }

    // ─── Public API ───────────────────────────────────────────────────────────

    get isVisible() {
        return this._isVisible;
    }

    show() {
        if (this._isVisible) return;
        this.emit('show', this);

        this.el.classList.add(this.options.activeClass);
        this.el.setAttribute('aria-hidden', 'false');
        this._isVisible = true;

        if (this.options.backdropClose) this._createBackdrop();

        if (this.transition.exists()) {
            this.transition.enter(this.el, () => this.emit('shown', this));
        } else {
            this.emit('shown', this);
        }
    }

    hide() {
        if (!this._isVisible) return;
        this.emit('hide', this);

        if (this.transition.exists()) {
            this.transition.leave(this.el, () => {
                this._applyHide();
            });
        } else {
            this._applyHide();
        }
    }

    toggle() {
        this._isVisible ? this.hide() : this.show();
    }

    // ─── Internals ────────────────────────────────────────────────────────────

    _applyHide() {
        this.el.classList.remove(this.options.activeClass);
        this.el.setAttribute('aria-hidden', 'true');
        this._isVisible = false;
        this._removeBackdrop();
        this.emit('hidden', this);
    }

    /**
     * Bind trigger elements. Supports three sources (all coexist):
     *   1. data-modal-trigger="#selector"  (option set via data attr or JS)
     *   2. data-{prefix}-toggle="{modal-id}" on external buttons (legacy)
     */
    _bindTriggers() {
        // 1. Options-based trigger selector
        if (this.options.trigger) {
            document.querySelectorAll(this.options.trigger).forEach((el) => {
                this.addListener(el, 'click', () => this.toggle());
            });
        }

        // 2. Legacy attribute: data-{prefix}-toggle="{id}" on any button
        const id = this.el.id;
        if (id) {
            const toggleAttr = `data-${config.dataPrefix}-toggle`;
            document.querySelectorAll(`[${toggleAttr}="${id}"]`).forEach((el) => {
                this.addListener(el, 'click', () => this.toggle());
            });
        }
    }

    /**
     * Bind dismiss elements inside the modal.
     * Supports two sources:
     *   1. data-modal-dismiss="#selector" (option — any selector)
     *   2. [data-{prefix}-dismiss] elements found inside this.el
     */
    _bindDismiss() {
        // 1. Options-based dismiss selector
        if (this.options.dismiss) {
            document.querySelectorAll(this.options.dismiss).forEach((el) => {
                this.addListener(el, 'click', () => this.hide());
            });
        }

        // 2. Implicit: any [data-{prefix}-dismiss] inside the modal element
        const dismissAttr = `data-${config.dataPrefix}-dismiss`;
        this.el.querySelectorAll(`[${dismissAttr}]`).forEach((el) => {
            this.addListener(el, 'click', () => this.hide());
        });
    }

    _createBackdrop() {
        if (this._backdrop) return;
        this._backdropClick = () => this.hide();
        this._backdrop = document.createElement('div');
        this._backdrop.className = `${config.dataPrefix}-backdrop`;
        this._backdrop.style.cssText =
            'position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:40;';
        document.body.appendChild(this._backdrop);
        this.addListener(this._backdrop, 'click', this._backdropClick);
    }

    _removeBackdrop() {
        if (!this._backdrop) return;
        this.removeListener(this._backdrop, 'click', this._backdropClick);
        this._backdrop.remove();
        this._backdrop = null;
    }
}