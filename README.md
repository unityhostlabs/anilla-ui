# AnillaUI

A highly customizable and unopinionated UI components library, for faster web development..

## Features

| Feature | Description |
|---|---|
| **BaseComponent** | Shared base class every component extends |
| **Global Registry** | Retrieve any instance by CSS selector or `Element` reference |
| **Event Bus** | `on / once / off / emit` scoped per instance |
| **DOM Event Tracking** | All native listeners tracked and auto-removed on `destroy()` |
| **Transition Engine** | CSS class-swap transitions and animations (Alpine.js / Tailwind UI style) |
| **Data Attribute Init** | Enable and configure components entirely from HTML |
| **AutoInit** | Automatic DOM scanning on `DOMContentLoaded` |
| **Global Config** | Customise prefix, name, log level, and more |
| **Rolldown bundled** | ESM + CJS + UMD outputs |

---

## Table of Contents

- [Installation](#installation)
- [Usage](#usage)
  - [ES Module](#es-module)
  - [UMD — browser script tag](#umd--browser-script-tag)
  - [CommonJS](#commonjs)
- [Global Configuration](#global-configuration)
- [AutoInit](#autoinit)
- [Components](#components)
  - [Modal](#modal)
  - [Dropdown](#dropdown)
  - [Tabs](#tabs)
- [Transitions](#transitions)
- [Writing a Custom Component](#writing-a-custom-component)
- [Registry API](#registry-api)
- [Building](#building)

---

## Installation

The package is not yet published to npm. Install it locally using one of these approaches:

**Local path**
```bash
npm install /path/to/anilla-ui
```

**npm link** (best for active development — changes reflect immediately)
```bash
# Inside the anilla-ui directory
npm link

# Then in your consuming project
npm link @anilla/ui
```

**Tarball**
```bash
# Inside the anilla-ui directory
npm pack

# Then in your consuming project
npm install ../anilla-ui/anilla-ui-0.1.0.tgz
```

**GitHub repo**
```bash
npm install your-username/anilla-ui
```

Once published:
```bash
npm install @anilla/ui
```

---

## Usage

### ES Module

```js
import { configure, AutoInit, Modal, Dropdown, Tabs } from '@anilla/ui';

// 1. Configure the library (optional — before anything else)
configure({ debug: true });

// 2. Register components with AutoInit
AutoInit.registerAll([Modal, Dropdown, Tabs]);

// 3. Scan the DOM (or use autoInit: true in configure to do this automatically)
AutoInit.init();
```

### UMD — browser script tag

Load the UMD bundle directly. Everything is exposed on `window.AnillaUI`.
The bundle tag must appear **before** your inline script.

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>AnillaUI</title>
  <script src="dist/index.umd.js"></script>
  <style>
    #my-modal  { display: none; }
    #my-modal.is-open  { display: block; }
    #my-menu   { display: none; }
    #my-menu.is-open   { display: block; }
  </style>
</head>
<body>

  <button data-ui-toggle="my-modal">Open Modal</button>

  <div id="my-modal" data-ui-modal="true" data-modal-backdrop-close="true">
    <h2>Hello!</h2>
    <button data-ui-dismiss>Close</button>
  </div>

  <button id="menu-btn" data-dropdown-trigger="#my-menu">Menu ▾</button>
  <ul id="my-menu" data-ui-dropdown="true">
    <li><a href="#">Item 1</a></li>
    <li><a href="#">Item 2</a></li>
  </ul>

  <script>
    const { configure, AutoInit, Modal, Dropdown, Registry } = AnillaUI;

    AutoInit.registerAll([Modal, Dropdown]);
    configure({ autoInit: true });

    // Retrieve an instance after AutoInit has run
    document.addEventListener('DOMContentLoaded', () => {
      const modal = Modal.getInstance('#my-modal');
      modal.on('shown', () => console.log('modal open'));
    });
  </script>

</body>
</html>
```

### CommonJS

```js
const { Modal, Dropdown, Tabs } = require('@anilla/ui');

const modal = new Modal('#my-modal');
```

---

## Global Configuration

Call `configure()` once at the very top of your app, before any components are initialised.

```js
import { configure } from '@anilla/ui';

configure({
  name:       'MyLib',   // Used in error messages and logs. Default: 'AnillaUI'
  dataPrefix: 'my',      // Prefix for all data-* attributes.  Default: 'ui'
  autoInit:   true,      // Auto-scan DOM on DOMContentLoaded.  Default: false
  logLevel:   'warn',    // 'silent' | 'warn' | 'error'.        Default: 'error'
  debug:      true,      // Verbose lifecycle logging.          Default: false
});
```

### `logLevel` and `debug`

| Setting | Effect |
|---|---|
| `debug: true` | Prints all lifecycle events, registry operations, and AutoInit activity via `console.info` |
| `logLevel: 'error'` | Prints warnings and errors (default) |
| `logLevel: 'warn'` | Prints warnings only |
| `logLevel: 'silent'` | Suppresses everything |

### Changing the data prefix

If you change `dataPrefix` to `'my'`, all attributes shift accordingly:

| Default | Custom (`dataPrefix: 'my'`) |
|---|---|
| `data-ui-modal="true"` | `data-my-modal="true"` |
| `data-ui-id` | `data-my-id` |
| `data-ui-dismiss` | `data-my-dismiss` |

Component option attributes are always prefixed by the component slug and are unaffected by `dataPrefix`:

```html
data-modal-trigger="#btn"       <!-- always data-{componentSlug}-{option} -->
data-dropdown-active-class="open"
```

### Reading the live config

```js
import { config } from '@anilla/ui';

console.log(config.dataPrefix); // 'ui'
```

### Resetting to defaults (useful in tests)

```js
import { resetConfig } from '@anilla/ui';
resetConfig();
```

---

## AutoInit

AutoInit scans the DOM for component enable attributes and instantiates the
matching component class, reading its options from sibling data attributes.

### Setup

```js
import { configure, AutoInit, Modal, Dropdown, Tabs } from '@anilla/ui';

// Register which components AutoInit should look for
AutoInit.registerAll([Modal, Dropdown, Tabs]);

// Option A — auto-scan on DOMContentLoaded
configure({ autoInit: true });

// Option B — manual scan (useful in SPAs after injecting new HTML)
AutoInit.init();

// Option B (scoped) — scan only a specific container
AutoInit.init(document.querySelector('#dynamic-section'));
```

### Enable attribute

Each component is activated on an element with:

```
data-{prefix}-{componentSlug}="true"
```

```html
<div  data-ui-modal="true">...</div>
<ul   data-ui-dropdown="true">...</ul>
<div  data-ui-tabs="true">...</div>
```

### Option attributes

Options are set on the same element using:

```
data-{componentSlug}-{option-in-kebab-case}="value"
```

Types are coerced automatically — `"true"` / `"false"` become booleans,
numeric strings become numbers, everything else stays a string.
Any attribute that does not match a declared option in the component's
`defaults` is silently discarded, so typos have no effect.

### Multiple components on one element

Each component has its own enable attribute and option namespace, so they
are fully independent:

```html
<div data-ui-modal="true"
     data-modal-backdrop-close="false"
     data-ui-dropdown="true"
     data-dropdown-active-class="open">
</div>
```

### Idempotent re-scanning

`AutoInit.init()` skips elements that already have an instance registered.
Safe to call repeatedly after dynamic DOM insertions.

### Registering a custom component

```js
import { AutoInit } from '@anilla/ui';
import { Accordion } from './components/Accordion.js';

AutoInit.register(Accordion);
AutoInit.init(); // picks up [data-ui-accordion="true"]
```

---

## Components

### Modal

#### Activation

```html
<div id="my-modal" data-ui-modal="true">
  ...
</div>
```

#### Data attribute options

| Attribute | Type | Default | Description |
|---|---|---|---|
| `data-modal-trigger` | string | `null` | CSS selector for element(s) that open the modal |
| `data-modal-dismiss` | string | `null` | CSS selector for element(s) that close the modal |
| `data-modal-active-class` | string | `'is-open'` | Class toggled on the modal element when open |
| `data-modal-backdrop-close` | boolean | `true` | Close when the backdrop is clicked |
| `data-modal-esc-close` | boolean | `true` | Close when Escape is pressed |

#### Dismiss shortcuts

Any element inside the modal that carries `data-{prefix}-dismiss` will close
the modal on click — no selector needed:

```html
<div id="my-modal" data-ui-modal="true">
  <button data-ui-dismiss>×</button>
</div>
```

#### Legacy toggle attribute

External buttons can also use `data-{prefix}-toggle="{modal-id}"`:

```html
<button data-ui-toggle="my-modal">Open</button>
```

#### Full HTML example

```html
<button data-ui-toggle="my-modal">Open Modal</button>
<button data-modal-trigger="#my-modal" id="another-trigger">Also opens it</button>

<div id="my-modal"
     data-ui-modal="true"
     data-modal-backdrop-close="true"
     data-modal-esc-close="true"
     data-modal-active-class="is-open">

  <h2>Modal Title</h2>
  <p>Modal content.</p>

  <!-- Either of these will dismiss the modal -->
  <button data-ui-dismiss>Close</button>
  <button data-modal-dismiss="#my-modal">Also closes</button>
</div>
```

#### Programmatic usage

```js
import { Modal } from '@anilla/ui';

const modal = new Modal('#my-modal', {
  backdropClose: false,
  escClose:      false,
  activeClass:   'is-open',
});

modal.show();
modal.hide();
modal.toggle();

console.log(modal.isVisible); // boolean

// Events — all receive the instance as the first argument
modal.on('show',    (instance) => { /* before shown   */ });
modal.on('shown',   (instance) => { /* after shown    */ });
modal.on('hide',    (instance) => { /* before hidden  */ });
modal.on('hidden',  (instance) => { /* after hidden   */ });
modal.on('destroy', (instance) => { /* on destroy()   */ });
```

---

### Dropdown

#### Activation

```html
<ul id="my-menu" data-ui-dropdown="true">...</ul>
```

#### Data attribute options

| Attribute | Type | Default | Description |
|---|---|---|---|
| `data-dropdown-trigger` | string | `null` | CSS selector for the toggle button |
| `data-dropdown-active-class` | string | `'is-open'` | Class added to the panel when open |
| `data-dropdown-close-on-outside-click` | boolean | `true` | Close when clicking outside |
| `data-dropdown-close-on-item-click` | boolean | `true` | Close when an item inside is clicked |

#### Full HTML example

```html
<button id="menu-btn">Menu ▾</button>

<ul id="my-menu"
    data-ui-dropdown="true"
    data-dropdown-trigger="#menu-btn"
    data-dropdown-active-class="is-open"
    data-dropdown-close-on-item-click="false">
  <li><a href="#">Item 1</a></li>
  <li><a href="#">Item 2</a></li>
</ul>
```

#### Programmatic usage

```js
import { Dropdown } from '@anilla/ui';

const dropdown = new Dropdown('#my-menu', {
  trigger:             '#menu-btn',
  closeOnOutsideClick: true,
  closeOnItemClick:    true,
});

dropdown.show();
dropdown.hide();
dropdown.toggle();

console.log(dropdown.isOpen);    // boolean
console.log(dropdown.trigger);   // HTMLElement | null

dropdown.on('show',    (instance) => { /* ... */ });
dropdown.on('shown',   (instance) => { /* ... */ });
dropdown.on('hide',    (instance) => { /* ... */ });
dropdown.on('hidden',  (instance) => { /* ... */ });
```

---

### Tabs

#### Activation

```html
<div id="my-tabs" data-ui-tabs="true">
  <button data-tab="panel-a" class="is-active">Tab A</button>
  <button data-tab="panel-b">Tab B</button>
</div>

<div id="panel-a" class="is-active">Content A</div>
<div id="panel-b">Content B</div>
```

#### Data attribute options

| Attribute | Type | Default | Description |
|---|---|---|---|
| `data-tabs-active-tab-class` | string | `'is-active'` | Class on the active tab button |
| `data-tabs-active-panel-class` | string | `'is-active'` | Class on the visible panel |
| `data-tabs-default-tab` | string | `null` | Panel ID to activate on init (overrides HTML state) |

#### Full HTML example

```html
<div id="my-tabs"
     data-ui-tabs="true"
     data-tabs-default-tab="panel-b"
     data-tabs-active-tab-class="active"
     data-tabs-active-panel-class="active">
  <button data-tab="panel-a">Tab A</button>
  <button data-tab="panel-b">Tab B</button>
</div>

<div id="panel-a">Content A</div>
<div id="panel-b">Content B</div>
```

#### Programmatic usage

```js
import { Tabs } from '@anilla/ui';

const tabs = new Tabs('#my-tabs', {
  defaultTab: 'panel-b',
});

tabs.show('panel-a');

console.log(tabs.activeTabId); // 'panel-a'

tabs.on('change', ({ previousTab, activeTab }) => {
  console.log(`Switched from ${previousTab} → ${activeTab}`);
});
```

---

## Transitions

AnillaUI includes a CSS class-swap transition engine inspired by Alpine.js and
Tailwind UI. It works with any CSS transition or animation — no JS animation
library required.

### How it works

```
1. Add  transitionEnter     + transitionEnterFrom   (base classes + starting state)
2. rAF: remove EnterFrom,     add transitionEnterTo  (triggers the CSS transition)
3. On transitionend/animationend — remove Enter + EnterTo, fire callback
```

### Transition options

These options are available on every component. Set them via data attributes or
programmatically:

| Option | Description |
|---|---|
| `transitionEnter` | Base class(es) active during the entire enter transition |
| `transitionEnterFrom` | Starting state for the enter transition |
| `transitionEnterTo` | Ending state for the enter transition |
| `transitionLeave` | Base class(es) active during the entire leave transition |
| `transitionLeaveFrom` | Starting state for the leave transition |
| `transitionLeaveTo` | Ending state for the leave transition |

### Via data attributes (Tailwind CSS example)

```html
<div id="my-modal"
     data-ui-modal="true"
     data-modal-transition-enter="transition-all duration-300 ease-out"
     data-modal-transition-enter-from="opacity-0 scale-95"
     data-modal-transition-enter-to="opacity-100 scale-100"
     data-modal-transition-leave="transition-all duration-200 ease-in"
     data-modal-transition-leave-from="opacity-100 scale-100"
     data-modal-transition-leave-to="opacity-0 scale-95">
</div>
```

### Via JavaScript

```js
const modal = new Modal('#my-modal', {
  transitionEnter:     'transition-all duration-300 ease-out',
  transitionEnterFrom: 'opacity-0 scale-95',
  transitionEnterTo:   'opacity-100 scale-100',
  transitionLeave:     'transition-all duration-200 ease-in',
  transitionLeaveFrom: 'opacity-100 scale-100',
  transitionLeaveTo:   'opacity-0 scale-95',
});
```

When transition options are absent the component shows/hides instantly —
fully backward compatible.

### Using Transition directly

The `Transition` class is also exported for standalone use:

```js
import { Transition } from '@anilla/ui';

const t = new Transition({
  transitionEnter:     'transition duration-300',
  transitionEnterFrom: 'opacity-0',
  transitionEnterTo:   'opacity-100',
  transitionLeave:     'transition duration-200',
  transitionLeaveFrom: 'opacity-100',
  transitionLeaveTo:   'opacity-0',
});

t.enter(element, () => console.log('entered'));
t.leave(element, () => console.log('left'));

t.cancel();          // abort mid-transition
t.exists();          // boolean — is any transition configured?
t.event('end');      // 'transitionend' or 'animationend'

t.busy;              // boolean — is a transition running?
t.type;              // 'transition' | 'animation'
t.duration;          // seconds (read from computed styles)
```

---

## Writing a Custom Component

Extend `BaseComponent`, define a `componentName` and `defaults`, then
implement `_init()`.

```js
import { BaseComponent } from '@anilla/ui';

export class Accordion extends BaseComponent {
  static get componentName() {
    return 'Accordion';
  }

  static get defaults() {
    return {
      allowMultiple: false,   // data-accordion-allow-multiple="true"
      activeClass:   'open',  // data-accordion-active-class="expanded"
    };
  }

  _init() {
    // ✅ Assign all state here — not as class fields.
    // BaseComponent calls _init() during super(), before subclass
    // field initialisers run, so private #fields would throw a TypeError.
    this._openPanels = new Set();

    this.addListener(this.el, 'click', (e) => {
      const header = e.target.closest('[data-accordion-header]');
      if (!header) return;
      this._toggle(header);
    });
  }

  _toggle(header) {
    const panelId = header.dataset.target;
    const panel   = document.getElementById(panelId);
    if (!panel) return;

    const isOpen = this._openPanels.has(panelId);

    if (!this.options.allowMultiple) {
      this._openPanels.forEach((id) => this._close(id));
    }

    if (isOpen) {
      this._close(panelId);
    } else {
      this._open(panelId, panel, header);
    }

    this.emit('change', { panelId, isOpen: !isOpen });
  }

  _open(panelId, panel, header) {
    this._openPanels.add(panelId);
    panel.classList.add(this.options.activeClass);
    header.setAttribute('aria-expanded', 'true');
  }

  _close(panelId) {
    this._openPanels.delete(panelId);
    const panel  = document.getElementById(panelId);
    const header = this.el.querySelector(`[data-target="${panelId}"]`);
    panel?.classList.remove(this.options.activeClass);
    header?.setAttribute('aria-expanded', 'false');
  }

  _onDestroy() {
    // Any cleanup beyond automatic listener removal
    this._openPanels.clear();
  }
}
```

#### HTML usage

```html
<!-- AutoInit -->
<div data-ui-accordion="true"
     data-accordion-allow-multiple="false"
     data-accordion-active-class="open">
  <button data-accordion-header data-target="panel-1" aria-expanded="false">Section 1</button>
  <div id="panel-1">Content 1</div>

  <button data-accordion-header data-target="panel-2" aria-expanded="false">Section 2</button>
  <div id="panel-2">Content 2</div>
</div>
```

```js
// Register with AutoInit
import { AutoInit } from '@anilla/ui';
import { Accordion } from './components/Accordion.js';

AutoInit.register(Accordion);
AutoInit.init();
```

#### What every component inherits from BaseComponent

| Member | Description |
|---|---|
| `this.el` | The root DOM element |
| `this.options` | Merged defaults + constructor options |
| `this.transition` | The `Transition` instance for this component |
| `this.isDestroyed` | Boolean — has `destroy()` been called |
| `this.addListener(el, type, fn)` | Attach a tracked DOM listener |
| `this.removeListener(el, type, fn)` | Remove a tracked DOM listener |
| `this.domEvents` | Read-only snapshot of all tracked listeners |
| `this.on/once/off/emit` | Component event bus |
| `this.events` | All subscribed event names |
| `this._init()` | Override for setup logic |
| `this._onDestroy()` | Override for teardown logic |
| `this.destroy()` | Remove all listeners, clear bus, unregister |
| `Component.getInstance(target)` | Get existing instance by selector or element |
| `Component.getInstances()` | All instances of this component type |
| `Component.initAll(selector, opts)` | Bulk initialise by CSS selector |
| `Component.parseDataAttributes(el)` | Parse data attributes into an options object |

---

## Registry API

The Registry is a global singleton that maps every initialised component to
its root element. It is updated automatically — you rarely need to use it
directly, but it is useful for debugging and advanced lookups.

```js
import { Registry } from '@anilla/ui';

// Retrieve by CSS selector
Registry.get('#my-modal', 'Modal');

// Retrieve by Element reference
Registry.get(document.querySelector('#my-modal'), 'Modal');

// Get all instances of one component type
Registry.getAllOfType('Modal');   // Modal[]

// Get every registered instance across all types
Registry.getAll();                // BaseComponent[]

// Debug — returns a copy of the internal Map
Registry.debug();                 // Map<string, BaseComponent>
```

Keys in the registry follow the format `ComponentName::ui-{uid}`. A
`data-{prefix}-id` attribute is stamped on each initialised element so the
Registry can find it on re-lookup. Multiple components on the same element
produce separate keys and never collide.

---

## Building

```bash
# Install dependencies
npm install

# One-time build
npm run build

# Watch mode
npm run dev
```

Output files:

| File | Format | Use case |
|---|---|---|
| `dist/index.js` | ES Module | Bundlers (Vite, Webpack, Rolldown) — tree-shakeable |
| `dist/index.cjs` | CommonJS | Node.js / legacy bundlers |
| `dist/index.umd.js` | UMD | Browser `<script>` tag / CDN |

---

## License

MIT