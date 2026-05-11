# Theme

A theme component for switching between light, dark and auto or a system preferred theme.

## Usage

The Theme component adds a class and data attribute to a parent element through a trigger or system preference. You can then use CSS selectors to style child elements based on the theme class and data attribute applied to the parent element. To initialize the Theme component on a parent element through the use of data attributes, add `data-ui-theme="true"` to enable the component. Add `data-theme-trigger="selector"` to the same element, where `selector` is a valid [CSS selector](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Selectors) to reference supported trigger elements. The supported elements are `<button>`, `<a>`, `<input type="checkbox">`, `<input type="radio">` and single `<select>`.

<iframe src="/demos/theme/radio-input.html" width="100%" height="150px" loading="lazy" scrolling="no"></iframe>

::: code-group

```js [JS]
import { Theme } from '@anilla/ui';

const theme = new Theme('html', { 
    trigger: '[theme-trigger]'
});
```

```html [HTML]
<label>
    <input type="radio" name="themeRadio" value="light" theme-trigger>
    Light
</label>
<label>
    <input type="radio" name="themeRadio" value="dark" theme-trigger>
    Dark
</label>
<label>
    <input type="radio" name="themeRadio" value="auto" theme-trigger>
    Auto
</label>
```

:::

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

## More

Check out the documentation for the [full list of markdown extensions](https://vitepress.dev/guide/markdown).
