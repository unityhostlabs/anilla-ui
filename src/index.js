/**
 * AnillaUI — ES Module entry point
 *
 * Import what you need:
 *   import { Modal, Dropdown, Tabs, BaseComponent, Registry } from '@anilla/ui';
 *
 * Or grab everything:
 *   import * as AnillaUI from '@anilla/ui';
 */

// --- Configuration

export { config, configure, resetConfig, logger } from './core/config.js';
export { AutoInit, bootAutoInit }                 from './core/AutoInit.js';

// --- Core

export { BaseComponent }                        from './core/BaseComponent.js';
export { Registry }                             from './core/Registry.js';
export { EventBus }                             from './core/EventBus.js';
export { DOMEventStore }                        from './core/DOMEventStore.js';
export { DataStorage }                          from './core/DataStorage.js';
export { Transition }                           from './core/Transition.js';
export * as utils                               from './core/utils.js';

// --- Components

// export { Dropdown } from './components/Dropdown.js';
// export { Modal }    from './components/Modal.js';
// export { Tabs }     from './components/Tabs.js';
export { Theme }            from './components/Theme.js';