# JavaScript

This page demonstrates some of the built-in markdown extensions provided by VitePress.

## Methods

The following methods are available on all component instances.

#### `setOptions`

```js
dropdown.setOptions(newOptions);
```

Merges new values into the current options of an initialized component.

| Name | Type | Description |
| ---- | ---- | ----------- |
| `newOptions` | `object` | An object containing properties of the component options. |

#### `destroy`

```js
dropdown.destroy();
```

Tears down the component by doing cleanups, removing listeners, unregistering entries and clearing internal event bus.

#### `on`

```js
dropdown.on(event, handler);
```

For subscribing to custom component events.

| Name | Type | Description |
| ---- | ---- | ----------- |
| `event` | `string` | The name name of the custom event e.g., `show`.  |
| `handler` | `function` | A callback function to call when the event is emitted.  |

#### `once`

```js
dropdown.once(event, handler);
```

For subscribing to custom component events exactly once.

| Name | Type | Description |
| ---- | ---- | ----------- |
| `event` | `string` | The name name of the custom event e.g., `show`.  |
| `handler` | `function` | A callback function to call when the event is emitted.  |

#### `off`

```js
dropdown.off(event, handler);
```

For unsubscribing to custom component events.

| Name | Type | Description |
| ---- | ---- | ----------- |
| `event` | `string` | The name name of the custom event e.g., `show`.  |
| `handler` | `function` | The same callback function used when subscribing to the custom event.  |

#### `getInstance`

```js
Dropdown.getInstance(target);
```

A static method for retrieving existing component instance.

| Name | Type | Description |
| ---- | ---- | ----------- |
| `target` | `string`,`HTMLElement` | The component element or a selector pointing to it.  |

#### `getInstances`

```js
Dropdown.getInstances();
```

A static method for returning every existing instance of a component type. Useful for debugging or introspection.

#### `initAll`

```js
Dropdown.initAll(selector, options);
```

A static method for initializing a component on every element matching the selector. The same options `object` is passed to every instance, but data attributes on each element will override these options on a per-instance basis.

| Name | Type | Description |
| ---- | ---- | ----------- |
| `selector` | `string` | A valid CSS selector.  |
| `options` | `object` | An object containing component options.  |

## Accessors

#### Static Accessors

The following static accessors are available on all components:

##### `componentName`

<small>*Type:* `string` | *Access:* `read-only`</small>

Returns the registered component name.

```js
Dropdown.componentName;
```

##### `defaults`

<small>*Type:* `object` | *Access:* `read-only`</small>

Returns an `object` of the default component options.

```js
Dropdown.defaults;
```

#### Instance Accessors

The following instance accessors are available on all components:

##### `name`

<small>*Type:* `string` | *Access:* `read-only`</small>

Returns the registered component name.

```js
dropdown.name;
```

##### `el`

<small>*Type:* `HTMLElement` | *Access:* `read-only`</small>

Returns the root DOM element this component is bound to.

```js
dropdown.el;
```

##### `options`

<small>*Type:* `object` | *Access:* `read-write`</small>

Returns the merged (static defaults + user defined) component options `object`. It can also be used to modify component options by setting an `object` of options as its value.

```js
// Get options
dropdown.options;

// Set options
dropdown.options = { placement: 'top' };
```

##### `isDestroyed`

<small>*Type:* `boolean` | *Access:* `read-only`</small>

Returns `true` when the `destroy()` method is called.

```js
dropdown.isDestroyed;
```

##### `events`

<small>*Type:* `Array` | *Access:* `read-only`</small>

Return all currently subscribed custom event names on an instance. Useful for debugging or introspection.

```js
dropdown.events;
```

##### `domEvents`

<small>*Type:* `Array` | *Access:* `read-only`</small>

Returns a snapshot of all tracked DOM listeners. Useful for debugging or introspection.

```js
dropdown.domEvents;
```