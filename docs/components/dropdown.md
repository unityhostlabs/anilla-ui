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
    <button type="button" data-ui-dropdown="true">...</button>
    <div class="absolute z-10 hidden">
        <!-- your dropdown content -->
    </div>
</div>
```

<DemoBox src="/demos/dropdown/basic-usage.html" height="300px" id="dropdown-basic-usage" />

## Extended Features

You can also install and import the [Floating UI](https://floating-ui.com/){target="_blank"} (the successor to Popper) library to enable advanced features such as placement, auto-positioning, flipping, offset distance, offset skidding, and more.

### Placement

The dropdown is placed at the `bottom-start` position by default. You can change this by setting the `placement` value to any of the acceptable values under the [component options](#component-options) section.

<DemoBox src="/demos/dropdown/placement.html" height="400px" id="dropdown-placement" />

```html
<div class="relative">
    <button type="button" data-ui-dropdown="true" data-dropdown-placement="top">...</button>
    <div class="absolute z-10 hidden">
        <!-- your dropdown content -->
    </div>
</div>
```