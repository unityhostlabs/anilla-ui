/**
 * AutoInit
 *
 * Scans the DOM for elements that have a component enable attribute and
 * automatically initializes the matching component class with options read
 * from the element's data attributes.
 *
 * --- Enable Attribute
 * Each component is activated on an element with:
 *
 *   data-{prefix}-{componentSlug}="true"
 *
 * Examples (default prefix "ui"):
 *   data-ui-modal="true"
 *   data-ui-dropdown="true"
 *   data-ui-tabs="true"
 *
 * --- Component Option Attributes
 * Options are declared on the same element using:
 *
 *   data-{componentSlug}-{option-in-kebab-case}="value"
 *
 * Examples:
 *   data-modal-esc-close="false"
 *   data-modal-backdrop-close="false"
 *   data-modal-trigger="#open-btn"
 *   data-dropdown-trigger="#menu-btn"
 *   data-dropdown-active-class="open"
 *   data-dropdown-close-on-outside-click="false"
 *
 * ── Multiple components on one element ──────────────────────────────────────
 * Add multiple enable attributes — each component is independent:
 *
 *   <div data-ui-modal="true"
 *        data-modal-trigger="#btn"
 *        data-ui-dropdown="true"
 *        data-dropdown-active-class="open">
 *   </div>
 *
 * ── Re-scanning ──────────────────────────────────────────────────────────────
 * AutoInit.init() is idempotent. Already-initialized elements (detected via
 * the Registry) are skipped — safe to call after dynamic DOM insertions.
 */

import { config, logger } from './config.js';

/** @type {Map<string, typeof import('./BaseComponent.js').BaseComponent>} */
const componentMap = new Map();

export const AutoInit = {
    /**
     * Register a component class so AutoInit can activate it from the DOM.
     * The component's `componentName` is lowercased to form the attribute slug.
     *
     *   Modal     → listens for data-{dataPrefix}-modal="true"
     *   Dropdown  → listens for data-{dataPrefix}-dropdown="true"
     *
     * @param {typeof import('./BaseComponent.js').BaseComponent} ComponentClass
     */
    register(ComponentClass) {
        const name = ComponentClass.componentName;

        if (!name || name === 'BaseComponent') {
            logger.warn(
                `AutoInit.register(): "${ComponentClass.name}" does not define a ` +
                `static componentName — skipped.`
            );
            return;
        }

        componentMap.set(name.toLowerCase(), ComponentClass);
        logger.info(`AutoInit: registered "${name}" → data-${config.dataPrefix}-${name.toLowerCase()}`);
    },

    /**
     * Register multiple component classes at once.
     * 
     * @param {Array<typeof import('./BaseComponent.js').BaseComponent>} classes
     */
    registerAll(classes) {
        classes.forEach((cls) => AutoInit.register(cls));
    },

    /**
     * Scan a root element (default: document) for component enable attributes
     * and initialize every component found that has not yet been initialized.
     *
     * @param {Document|Element} [root=document]
     * @returns {import('./BaseComponent.js').BaseComponent[]} All newly created instances
     */
    init(root = document) {
        if (componentMap.size === 0) {
            logger.warn('AutoInit.init(): no components are registered. Call AutoInit.registerAll() first.');
            return [];
        }

        const created = [];

        // Each registered component gets its own attribute-based query so that
        // multiple components on the same element are handled independently.
        for (const [slug, ComponentClass] of componentMap) {
            const enableAttr = `data-${config.dataPrefix}-${slug}`;
            const elements = root.querySelectorAll(`[${enableAttr}="true"]`);

            elements.forEach((el) => {
                // Skip if this specific component type is already initialized on el.
                if (ComponentClass.getInstance(el)) {
                    logger.info(`AutoInit: <${ComponentClass.componentName}> already initialized — skipped`, el);
                    return;
                }

                // Data attributes are merged automatically inside the BaseComponent
                // constructor, so we just pass an empty options object here.
                logger.info(`AutoInit: initializing <${ComponentClass.componentName}>`, el);

                try {
                    const instance = new ComponentClass(el);
                    created.push(instance);
                } catch (err) {
                    logger.error(
                        `AutoInit: failed to initialize <${ComponentClass.componentName}>`, el, err
                    );
                }
            });
        }

        logger.info(`AutoInit: scan complete — ${created.length} component(s) initialized`);
        return created;
    },

    /**
     * Returns all currently registered component slugs.
     * 
     * @returns {string[]}
     */
    registeredNames() {
        return [...componentMap.keys()];
    },

    /**
     * Remove a component from the registry by name or slug (mainly for testing).
     * 
     * @param {string} nameOrSlug  e.g. 'Modal' or 'modal'
     */
    unregister(nameOrSlug) {
        componentMap.delete(nameOrSlug.toLowerCase());
    },
};

/**
 * Called internally when autoInit: true is set in the global config.
 * Waits for DOMContentLoaded if the document is not yet ready.
 *
 * @param {Array<typeof import('./BaseComponent.js').BaseComponent>} [classes]
 */
export function bootAutoInit(classes = []) {
    if (classes.length) {
        AutoInit.registerAll(classes);
    }

    const run = () => AutoInit.init();

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', run, { once: true });
    } else {
        run();
    }
}

// Register boot handler on config so configure({ autoInit: true }) can trigger
// this without config needing to import AutoInit (which would be circular).
config._autoInitBoot = bootAutoInit;