import { BaseComponent } from '../core/BaseComponent.js';

/**
 * Tabs
 *
 * ── Activation ───────────────────────────────────────────────────────────────
 *   <div id="my-tabs" data-flowlib-tabs="true">...</div>
 *
 * ── Data attribute options ───────────────────────────────────────────────────
 * - data-tabs-active-tab-class="is-active"     CSS class on the active tab button
 * - data-tabs-active-panel-class="is-active"   CSS class on the visible panel
 * - data-tabs-default-tab="panel-b"            Panel ID to activate on init
 *
 * ── Tab buttons (inside the tabs element) ───────────────────────────────────
 *   <button data-tab="panel-a">Tab A</button>
 *
 * ── Events ───────────────────────────────────────────────────────────────────
 *   change  →  { previousTab, activeTab }
 */
export class Tabs extends BaseComponent {
    static get componentName() {
        return 'Tabs';
    }

    static get defaults() {
        return {
            activeTabClass: 'is-active',
            activePanelClass: 'is-active',
            /** Optionally force a specific panel open on init */
            defaultTab: null,
        };
    }

    // ─── Lifecycle ────────────────────────────────────────────────────────────

    _init() {
        this._activeTabId = null;

        this.el.setAttribute('role', 'tablist');

        this._tabs.forEach((tab) => {
            tab.setAttribute('role', 'tab');
            const panelId = tab.dataset.tab;
            tab.setAttribute('aria-controls', panelId);

            if (tab.classList.contains(this.options.activeTabClass)) {
                this._activeTabId = panelId;
                tab.setAttribute('aria-selected', 'true');
            } else {
                tab.setAttribute('aria-selected', 'false');
            }

            this.addListener(tab, 'click', () => this.show(panelId));
        });

        this._panels.forEach((panel) => {
            panel.setAttribute('role', 'tabpanel');
        });

        // data-tabs-default-tab overrides whatever is marked active in the HTML
        if (this.options.defaultTab) {
            this.show(this.options.defaultTab);
        }
    }

    // ─── Public API ───────────────────────────────────────────────────────────

    get activeTabId() {
        return this._activeTabId;
    }

    show(panelId) {
        if (this._activeTabId === panelId) return;

        const previousTab = this._activeTabId;
        this._activeTabId = panelId;

        this._tabs.forEach((tab) => {
            const isActive = tab.dataset.tab === panelId;
            tab.classList.toggle(this.options.activeTabClass, isActive);
            tab.setAttribute('aria-selected', String(isActive));
        });

        this._panels.forEach((panel) => {
            panel.classList.toggle(this.options.activePanelClass, panel.id === panelId);
        });

        this.emit('change', { previousTab, activeTab: panelId });
    }

    // ─── Internals ────────────────────────────────────────────────────────────

    get _tabs() {
        return [...this.el.querySelectorAll('[data-tab]')];
    }

    get _panels() {
        return this._tabs
            .map((t) => document.getElementById(t.dataset.tab))
            .filter(Boolean);
    }
}