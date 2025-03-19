# Whiskers.js 😸

[![NPM version](https://img.shields.io/npm/v/@gmartigny/whiskers.js?style=flat-square)](https://www.npmjs.com/package/@gmartigny/whiskers.js)
[![Minifies bundle size](https://img.shields.io/bundlephobia/min/@gmartigny/whiskers.js?style=flat-square)](https://bundlephobia.com/package/@gmartigny/whiskers.js)
[![Code coverage](https://flat.badgen.net/codeclimate/coverage/GMartigny/Whiskers.js)](https://codeclimate.com/github/GMartigny/Whiskers.js)

Minimalist HTML-in-JS reactive framework


## Installation

### Registry

    npm install @gmartigny/whiskers.js

### CDN

    https://unpkg.com/@gmartigny/whiskers.js


## Usage

### Basic rendering

Prepare elements in order to append them to the DOM.

```js
import { render } from "@gmartigny/whiskers.js";

const app = render("main", {
    class: "app",
}, [
    render("h1", "Whisker.js"),
    render("p", "Minimalist HTML-in-JS reactive framework."),
]);

document.body.appendChild(app);
```


### CSS

Turn an object into a style element.

```js
import { renderStyle } from "@gmartigny/whiskers.js";

const style = renderStyle({
    body: {
        "background-color": "#654321",
        
        ".nested": {
            padding: "2em",
        },
    },
});

document.head.appendChild(style);
```


### Reactivity

Rerender on each change of the data.

```js
import { render, reactive } from "@gmartigny/whiskers.js";

const data = {
    count: 0,
};

const counter = render(undefined, [
    render("button", {
        "@click": () => data.count++,
    }, "Increase"),
    reactive(data, "count", (value, el) => render(el || "span", value)),
]);

document.body.appendChild(counter);
```

### List rendering

Render a list of items.

```js
import { render, reactive } from "@gmartigny/whiskers.js";

const data = {
    list: ["Minimalist", "Ergonomic", "Fun"],
}

const parentRender = (node) => render(node ?? "ul");
const childRender = (value) => render("li", value);
const element = reactive(data, "list", parentRender, childRender)

document.body.appendChild(element);
```

### Headless

React to changes without rendering.

```js
import { reactive } from "@gmartigny/whiskers.js";

const data = {
    value: 42,
};

reactive(data, "value", (value) => {
    console.log(value); // => 42 the first time, 1234 the second time
});
data.value = 1234;
```

### Complete example

[Todo app](./examples/todo.html)


### API

#### `render`

| Property  | Type                                              | Default | Description                                                                                           |
|-----------|---------------------------------------------------|---------|-------------------------------------------------------------------------------------------------------|
| element   | `string \| HTMLElement`                           | `"div"` | Element to create or reuse                                                                            |
| props?    | `Object`                                          |         | Set of attributes, prefix with "@" for event listeners, "--" for CSS variables and "." for properties |
| children? | `string\|HTMLElement\|Array<string\|HTMLElement>` |         | List of children to append                                                                            |

```js
render("input", {
    // DOM property
    type: "checkbox",
    // Property set in RAM
    ".private": "",
    // CSS variable
    "--color": "goldenrod",
    // Event listener
    "@input": value => console.assert(typeof value === "boolean"),
})
```

#### `reactive`

| Property        | Type       | Default | Description                                            |
|-----------------|------------|---------|--------------------------------------------------------|
| data            | `Object`   |         | Store holding data                                     |
| key             | `string`   |         | Field to observe                                       |
| render          | `Function` |         | Render callback called on change                       |
| childrenRender? | `Function` |         | Render callback for each child when observing an array |

const data = {
```js
const data = {
    value: 42,
    array: [1, 2, 3],
};
// For a single value
reactive(
    data,
    "value",
    // Called on each changes
    (value) => {},
);
// For an array
reactive(
    data,
    "array",
    // Called once on initialization
    (values) => {},
    // Called on each values and then for each update
    (value) => {},
);
```

## License

[MIT](./license)
