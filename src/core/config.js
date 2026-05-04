/**
 * Global Configuration
 *
 * This is the single source of truth for all library-wide settings.
 * Import `config` anywhere inside the library to read values, or call
 * `configure()` at app boot time to override defaults before any
 * components are initialized.
 *
 * Usage (consumer):
 *   import { configure } from '@anilla/ui';
 *   configure({ name: 'AnillaUI', dataPrefix: 'ui' });
 *
 * Usage (internal):
 *   import { config } from './config.js';
 *   element.setAttribute(`data-${config.dataPrefix}-id`, uid);
 */

/**
 * @typedef {Object} AnillaUIConfig
 *
 * @property {string} name
 *   Human-readable library name used in error messages and logs.
 *
 * @property {string} version
 *   Library version string.
 *
 * @property {string} dataPrefix
 *   Prefix for all `data-*` attributes stamped on elements.
 *   e.g. 'ui' → `data-ui-id`, `data-ui-toggle`.
 *   Change this if the default clashes with another library.
 *
 * @property {boolean} autoInit
 *   When true, components scan the DOM for their data attributes and
 *   self-initialize on DOMContentLoaded.
 *   Set to false if you prefer fully manual initialization.
 *
 * @property {'silent'|'warn'|'error'} logLevel
 *   Controls what the library prints to the console.
 *   'silent' → nothing
 *   'warn'   → warnings only
 *   'error'  → warnings + errors (default)
 *
 * @property {boolean} debug
 *   When true, enables verbose internal logging. Overrides logLevel to
 *   print everything including lifecycle events and registry operations.
 */

/** @type {AnillaUIConfig} */
const defaults = {
    name: 'AnillaUI',
    version: '0.1.0',
    dataPrefix: 'ui',
    autoInit: false,
    logLevel: 'error',
    debug: false,
};

/** @type {AnillaUIConfig} */
export const config = { ...defaults };

/**
 * Merge user-supplied overrides into the global config.
 * Call this once at app boot, before any components are initialized.
 *
 * @param {Partial<AnillaUIConfig>} overrides
 * @returns {AnillaUIConfig} The updated config object
 *
 * @example
 * import { configure } from '@anilla/ui';
 * configure({
 *   name:       'MyLibName',
 *   dataPrefix: 'my',
 *   autoInit:   true,
 *   debug:      true,
 * });
 */
export function configure(overrides = {}) {
    const invalid = Object.keys(overrides).filter((k) => !(k in defaults));
    if (invalid.length) {
        logger.warn(`configure() received unknown keys: ${invalid.join(', ')}`);
    }

    Object.assign(config, overrides);

    // If autoInit is enabled, call the registered boot handler (set by AutoInit).
    // This avoids a circular import — config does not import AutoInit directly.
    if (config.autoInit && config._autoInitBoot) {
        config._autoInitBoot();
    }

    return config;
}

/**
 * Reset the global config back to its built-in defaults.
 * Mainly useful in tests.
 *
 * @returns {AnillaUIConfig}
 */
export function resetConfig() {
    Object.assign(config, defaults);

    return config;
}

/**
 * Internal logger
 * 
 * Used by all modules inside the library. Respects config.logLevel and
 * config.debug so consumers can control verbosity without touching source.
 */
export const logger = {
    /**
     * Print an informational message (only when debug is enabled).
     * 
     * @param {...any} args
     */
    info(...args) {
        if (config.debug) {
            console.info(`[${config.name}]`, ...args);
        }
    },

    /**
     * Print a warning (suppressed when logLevel is 'silent').
     * 
     * @param {...any} args
     */
    warn(...args) {
        if (config.logLevel !== 'silent') {
            console.warn(`[${config.name}]`, ...args);
        }
    },

    /**
     * Print an error (suppressed only when logLevel is 'silent').
     * 
     * @param {...any} args
     */
    error(...args) {
        if (config.logLevel !== 'silent') {
            console.error(`[${config.name}]`, ...args);
        }
    },
};