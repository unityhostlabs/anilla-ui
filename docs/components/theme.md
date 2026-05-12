# Theme

A theme component for switching between light, dark and auto or a system preferred theme.

## Introduction

The Theme component adds a class and data attribute to a parent element through a trigger or system preference. You can then use CSS selectors to style child elements based on the theme class and data attribute applied to the parent element. The supported trigger elements are `<button>`, `<a>`, `<input type="checkbox">`, `<input type="radio">` and single `<select>`.

## Usage

To initialize the Theme component on a parent element through the use of data attributes, add `data-ui-theme="true"` to enable the component. Add `data-theme-trigger="{selector}"` Theme option to the same element, where `selector` is a valid <!--@include: @/partials/snippets/css-ref.md--> to reference supported trigger elements.

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

<iframe src="/demos/theme/selection-radio-input.html" width="100%" height="150px" loading="lazy" scrolling="no"></iframe>

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

<iframe src="/demos/theme/selection-select-input.html" width="100%" height="150px" loading="lazy" scrolling="no"></iframe>

```html
<select class="theme-trigger">
    <option value="light">Light</option>
    <option value="dark">Dark</option>
    <option value="auto">Auto</option>
</select>
```

#### Buttons or Links

Multiple `<button>` and `<a>` tags can be used to setup choice selection triggers. To set the preferred theme mode on these elements, add `data-mode="{light|dark|auto}"` data attribute to the trigger element. A `<button>` or `<a>` tag can be styled based on the state of their `aria-pressed="{true|false}"` and `aria-current="{true|false}"` attributes.

<iframe src="/demos/theme/selection-buttons-links.html" width="100%" height="150px" loading="lazy" scrolling="no"></iframe>

```html
<button type="button" class="theme-trigger" data-mode="light">Light</button>
<button type="button" class="theme-trigger" data-mode="dark">Dark</button>
<a href="#" class="theme-trigger" data-mode="auto">Auto</a>
```

## Toggle Triggers

Checkboxes have only two states and are therefore considered toggle triggers. Single `<button>` or `<a>` tags without a `data-mode="{light|dark|auto}"` data attribute are also considered as toggles. Toggle triggers only have `light` and `dark` modes. The `dark` mode is enabled when `<input type="checkbox">` is `:checked` or a `<button>` or `<a>` is pressed.

<iframe src="/demos/theme/toggle-triggers.html" width="100%" height="150px" loading="lazy" scrolling="no"></iframe>

```html
<label>
    <input class="theme-trigger" type="checkbox" role="switch">
    Toggle Mode
</label>
<button type="button" class="theme-trigger">Toggle Mode</button>
```

## Syntax Highlighting

VitePress provides Syntax Highlighting powered by [Shiki](https://github.com/shikijs/shiki), with additional features like line-highlighting:

**Input**

````md
```js{4}
export default {
  data () {
    return {
      msg: 'Highlighted!'
    }
  }
}
```
````

**Output**

```js{4}
export default {
  data () {
    return {
      msg: 'Highlighted!'
    }
  }
}
```

## Custom Containers

**Input**

```md
::: info
This is an info box.
:::

::: tip
This is a tip.
:::

::: warning
This is a warning.
:::

::: danger
This is a dangerous warning.
:::

::: details
This is a details block.
:::
```

**Output**

::: info
This is an info box.
:::

::: tip
This is a tip.
:::

::: warning
This is a warning.
:::

::: danger
This is a dangerous warning.
:::

::: details
This is a details block.
:::

## JavaScript

Check out the documentation for the [full list of markdown extensions](https://vitepress.dev/guide/markdown).

### Initialization

```js [JS]
import { Theme } from '@anilla/ui';

const theme = new Theme(element, { 
    trigger: '[theme-trigger]'
});
```
