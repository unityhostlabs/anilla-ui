# Dropdown

Overlays for displaying a list of options, forms, and other content.

## Introduction

The Dropdown component shows or hides a dropdown element via a trigger element. It assigns a target element specified by the user as the dropdown element. When a target element is not explicitly set, the component falls back to the `nextElementSibling` element if available. 

To prevent the dropdown element from appearing briefly on page load before being hidden by the component, you must add a `hidden` utility class to the dropdown markup. This display class is then toggled by the trigger element to show or hide the content.

## Usage

To initialize the Dropdown component using data attributes, add `data-ui-dropdown="true"` to your trigger element. 

By default, the component targets the immediate next sibling element. If your dropdown is located elsewhere in the DOM, you must explicitly define it by adding `data-dropdown-target="{selector}"` to the trigger element, where `{selector}` is a valid <!--@include: @/partials/css-ref.md--> pointing to your target dropdown element.

Note that your dropdown element must be initially hidden using the utility class specified by your `hiddenClass` configuration option (which defaults to `'hidden'`).

```html
<div class="relative">
    <button type="button" data-ui-dropdown="true">Dropdown</button>
    <div class="absolute z-10 hidden">
        <!-- your dropdown content -->
    </div>
</div>
```

<DemoBox src="/demos/dropdown/basic-usage.html" height="300px" id="dropdown-basic-usage" />

## Auto Close Behavior

By default, a dropdown closes when you click inside or outside it. To change how dropdowns close, set the `autoClose` value to any of the `autoClose` option values under the [component options](#component-options) section. Note: Clicking the trigger element will always close the dropdown ignoring this option.

## Extended Features

You can also install and import the [Floating UI](https://floating-ui.com/){target="_blank"} (the successor to Popper) library to enable advanced features such as placement, auto-positioning, flipping, offset distance, offset skidding, and more.

```js
import { Dropdown } from '@anilla/ui';
import * as FloatingUI from 'https://cdn.jsdelivr.net/npm/@floating-ui/dom@1.7.5/+esm';

const dropdown = new Dropdown(element, {
    floatingUI: FloatingUI
});
```

### Placement

The dropdown is placed at the `bottom-start` position by default. You can change this behavior by setting the `placement` value to any of the acceptable values under the [component options](#component-options) section.

<DemoBox src="/demos/dropdown/placement.html" height="230px" id="dropdown-placement" />

```html
<div class="relative">
    <button type="button" data-ui-dropdown="true" data-dropdown-placement="top">Dropdown</button>
    <div class="absolute z-10 hidden">
        <!-- your dropdown content -->
    </div>
</div>
```

### Offset Distance

The `offsetDistance` option controls the vertical position of the dropdown from the reference element. In the example below, the `offsetDistance` is changed from the default value of `8` to `0`.

<DemoBox src="/demos/dropdown/offset-distance.html" height="260px" id="dropdown-offset-distance" />

```html
<div class="relative">
    <button type="button" data-ui-dropdown="true" data-dropdown-offset-distance="0">Dropdown</button>
    <div class="absolute z-10 hidden">
        <!-- your dropdown content -->
    </div>
</div>
```

### Offset Skidding

The `offsetSkidding` option controls the horizontal position of the dropdown from the reference element. In the example below, the `offsetSkidding` is changed from the default value of `0` to `-100`.

<DemoBox src="/demos/dropdown/offset-skidding.html" height="260px" id="dropdown-offset-skidding" />

```html
<div class="relative">
    <button type="button" data-ui-dropdown="true" data-dropdown-offset-skidding="-100">Dropdown</button>
    <div class="absolute z-10 hidden">
        <!-- your dropdown content -->
    </div>
</div>
```

### Auto Positioning

Auto positioning is enabled out of the box once you import the [Floating UI](https://floating-ui.com/){target="_blank"} library. The example below shows the dropdown auto position when you scroll down.

<DemoBox src="/demos/dropdown/auto-positioning.html" height="260px" id="dropdown-auto-positioning" />

## Component Options

<!--@include: @/partials/options-intro.md-->

| Name | Type | Description |
| --- | --- | --- |
| `autoClose` | `boolean`, `string` | <ul class="my-2"><li>`true` - the dropdown will be closed by clicking outside or inside the dropdown menu.</li><li>`false` - the dropdown will be closed by clicking the trigger button and manually calling `hide` or `toggle` method.</li><li>`'inside'` - the dropdown will be closed **only** by clicking inside the dropdown menu.</li> <li>`'outside'` - the dropdown will be closed **only** by clicking outside the dropdown menu.</li></ul> The <kbd>Esc</kbd> key will close all dropdowns with the above options except `false`. |
| `placement` | `string` | You can adjust the position of the dropdown to any of the following values: `top`, `top-start`, `top-end`, `right`, `right-start`, `right-end`, `bottom`, `bottom-start`, `bottom-end`, `left`, `left-start` and `left-end`. The default position is `bottom-start`. |
| `offsetDistance` | `number` | The vertical distance between the trigger element and the dropdown in pixels. The `px` suffix is not required. |
| `offsetSkidding` | `number` | The horizontal distance between the trigger element and the dropdown in pixels. The `px` suffix is not required. |
| `target` | `string` | A selector pointing to the dropdown element if it is not the immediate sibling of the trigger element. |
| `hiddenClass` | `string` | The utility class for hiding the dropdown element. The default value is `hidden`. |
<!--@include: @/partials/component-transitions.md-->