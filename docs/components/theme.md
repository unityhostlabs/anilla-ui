# Theme

A theme component for switching between light, dark and auto or a system preferred theme.

## Introduction

The Theme component adds a class and data attribute to a parent element through a trigger or system preference. You can then use CSS selectors to style child elements based on the theme class and data attribute applied to the parent element. The supported trigger elements are `<button>`, `<a>`, `<input type="checkbox">`, `<input type="radio">` and single `<select>`.

## Usage

To initialize the Theme component on a parent element through the use of data attributes, add `data-ui-theme="true"` to enable the component. Add `data-theme-trigger="{selector}"` Theme option to the same element, where `{selector}` is a valid <!--@include: @/partials/css-ref.md--> pointing to supported trigger elements.

```html
<html lang="en" data-ui-theme="enable" data-theme-trigger=".theme-trigger">
<head>...</head>
<body>
    <select class="theme-trigger">
        <option value="light">Light</option>
        <option value="dark">Dark</option>
        <option value="auto">Auto</option>
    </select>
</body>
</html>
```

## Choice Selection

#### Radio Input

When using radio inputs as triggers, the component uses the `value` attributes to determine your preferred theme mode.

<DemoBox src="/demos/theme/selection-radio-input.html" :show-theme="false"/>

```html
<label>
    <input type="radio" name="themeRadio" value="light" class="theme-trigger">
    Light
</label>
<label>
    <input type="radio" name="themeRadio" value="dark" class="theme-trigger">
    Dark
</label>
<label>
    <input type="radio" name="themeRadio" value="auto" class="theme-trigger">
    Auto
</label>
```

#### Select Input

The `value` attribute of the `<option>` tag of a single `<select>` input, is used by the component to determine your preferred theme mode.

<DemoBox src="/demos/theme/selection-select-input.html" :show-theme="false"/>

```html
<select class="theme-trigger" title="Select theme">
    <option value="light">Light</option>
    <option value="dark">Dark</option>
    <option value="auto">Auto</option>
</select>
```

#### Buttons or Links

Multiple `<button>` and `<a>` tags can be used to setup choice selection triggers. To set the preferred theme mode on these elements, add `data-mode="{light|dark|auto}"` to the trigger element. A `<button>` or `<a>` tag can be styled based on the state of their `aria-pressed="{true|false}"` and `aria-current="{true|false}"` attributes.

<DemoBox src="/demos/theme/selection-buttons-links.html" :show-theme="false"/>

```html
<button type="button" class="theme-trigger" data-mode="light">Light</button>
<button type="button" class="theme-trigger" data-mode="dark">Dark</button>
<a href="#" class="theme-trigger" data-mode="auto">Auto</a>
```

## Toggle Triggers

Checkboxes have only two states and are therefore considered toggle triggers. Single `<button>` or `<a>` elements that do not have a `data-mode="{light|dark|auto}"` attribute present are considered as toggles. Toggle triggers only have `light` and `dark` modes. The `dark` mode is enabled when `<input type="checkbox">` is `:checked` or a `<button>` or `<a>` is pressed.

<DemoBox src="/demos/theme/toggle-triggers.html" :show-theme="false"/>

```html
<label>
    <input class="theme-trigger" type="checkbox" role="switch">
    Toggle Mode
</label>
<button type="button" class="theme-trigger">Toggle Mode</button>
```

## Storage Type
The component uses `localStorage` to persist the selected theme across browser sessions. If you prefer the theme preference to reset when the user closes their browser tab or window, you can change the `storageType` option to `session`.

This can be configured via JavaScript options or inline using the `data-storage-type` attribute. The example below stores the theme mode in `sessionStorage`.

<DemoBox src="/demos/theme/session-storage.html" :show-theme="false"/>

```html
<html lang="en" data-ui-theme="enable" data-theme-trigger=".theme-trigger" data-theme-storage-type="session">
    <head>...</head>
    <body>
        <input class="theme-trigger" type="checkbox" role="switch">
    </body>
</html>
```

## Disable Storage

By default, the theme preference persists across sessions because it is saved to `localStorage`. If you want to disable this behavior, you can set the `enableStorage` option to `false`. This can also be configured inline by adding the `data-enable-storage="false"` attribute to the component element.

<DemoBox src="/demos/theme/disable-storage.html" :show-theme="false"/>

```html
<html lang="en" data-ui-theme="enable" data-theme-trigger=".theme-trigger" data-theme-enable-storage="false">
    <head>...</head>
    <body>
        <input class="theme-trigger" type="checkbox" role="switch">
    </body>
</html>
```

## Light Theme Flash Fix

To fix the light theme flash before `dark` mode loads, you must apply the theme preference before the browser renders the page. Add the following JavaScript in between the `<head>` tag of your pages to apply the theme before the component loads. The `<html>` element or `document.documentElement` was used in this example. You can however change it to the parent element you apply the Theme component to.

```html
<script>
    (function () {
        const savedTheme = localStorage.getItem('theme');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

        if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
            document.documentElement.classList.add('dark');
            document.documentElement.setAttribute('data-theme', 'dark');
        }
    })();
</script>
```

## Component Options

<!--@include: @/partials/options-intro.md-->

| Name | Type | Description |
| --- | --- | --- |
| `parent` | `HTMLElement`, `string` | The parent element or selector to apply the theme class to. |
| `trigger` | `HTMLElement`, `string` | The element or selector that triggers the theme change. |
| `autoModeName` | `string` | The name of the auto mode. You can change it to some else like 'system' or 'device'. Remember to update the `value` or `data-mode` attributes of your triggers. |
| `attributeName` | `string` | The data attribute name to store the current theme mode. |
| `modeAttributeName` | `string` | The data attribute name to store the current theme mode on the trigger element. |
| `label` | `string` | The label template for the trigger element, where `:mode` will be replaced with the current mode. This sets `aria-label` attribute on supported elements with the label text as its value. `<select>` inputs are excluded and must be set manually. |
| `showTitle` | `boolean` | Sets a `title` attribute with the label text as its value. `<select>` inputs are excluded. |
| `enableStorage` | `boolean` | Whether to enable `localStorage` to persist the theme mode across sessions. |
| `storageKey` | `string` | The key used to store the theme mode in `localStorage`. |
| `storageType` | `string` | Determines the storage mechanism used to persist the theme. Accepts `local` (uses `localStorage`) or `session` (uses `sessionStorage`). |
| `className` | `string` | The CSS class name for the dark theme. |

## JavaScript

<!--@include: @/partials/component-js-intro.md-->

### Initialization

::: code-group

```js [ESM]
import { Theme } from '@anilla/ui';

const theme = new Theme(element, options);
```

```js [UMD]
const { Theme } = AnillaUI;

const theme = new Theme(element, options);
```

```js [CommonJS]
const { Theme } = require('@anilla/ui');

const theme = new Theme(element, options);
```

:::

<!--@include: @/partials/component-js-params.md-->

### Methods 

The following methods are available for this component. Learn more about all available [component methods](/getting-started/javascript#methods) and how to use them.

#### `change`

```js
theme.change(mode);
```

Changes the current theme to the set `mode`.

| Name | Type | Description |
| ---- | ---- | ----------- |
| `mode` | `string` | Your preferred mode (e.g., `light`, `dark` or `auto`). |

### Accessors 

The following instance accessors are available for this component. Learn more about all available [component accessors](/getting-started/javascript#accessors) and how to use them.

##### `theme`

<small>*Type:* `string` | *Access:* `read-only`</small>

Returns the current or active theme.

```js
const theme = new Theme(element, options);
console.log(theme.theme); // 'light', 'dark' or 'auto'
```

##### `modes`

<small>*Type:* `object` | *Access:* `read-only`</small>

Returns an `object` of allowed theme modes.

```js
const theme = new Theme(element, options);
console.log(theme.modes); // {...}
```

### Events 

You can listen for events using either an internal or external approach. The internal approach uses the component's `on()` method, while the external approach relies on JavaScript's native `addEventListener()` method with a prefixed event name (e.g., `ui:change`).

##### `change`

<small>*Parameters:* `{ instance: Theme }`</small>

Fired when the theme changes.

#### Event Listeners

```js
const theme = new Theme(element, options);

// Internal listener example
theme.on('change', ({ instance }) => {
    console.log(instance);
});

// External listener example
element.addEventListener('ui:change', (e) => {
    const { instance } = e.detail;
    console.log(instance);
});
```

#### Callbacks

You can define callbacks by prefixing the event name with `on` and using PascalCase (e.g., the `change` event becomes the `onChange` callback).

```js
const theme = new Theme(element, {
    ...,
    onChange: ({ instance }) => {
        console.log(instance);
    }
});
```

## Accessibility

The Theme component adheres to the following [Button WAI-ARIA design patterns](https://www.w3.org/WAI/ARIA/apg/patterns/button/) and automatically sets the appropriate WAI-ARIA roles, states and properties.

- The button has `role="button"`. 
- The button has an accessible label.
- If the button is a toggle button, it has an `aria-pressed` state. When the button is toggled on, the value of this state is `true`, and when toggled off, the state is `false`.