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


```js
import { render, reactive } from "@gmartigny/whiskers.js";

const data = {
  list: ["Minimalist", "Ergonomic", "Fun"],
}

const parentRender = (node) => render(node ?? "ul");
const childRender = (node) => render(node ?? "li");
const element = reactive(data, "list", parentRender, childRender)

document.body.appendChild(element);
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

## License

[MIT](./license)
