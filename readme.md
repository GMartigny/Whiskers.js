# Whiskers.js 😸

[![NPM version](https://img.shields.io/npm/v/@gmartigny/whiskers.js?style=flat-square)](https://www.npmjs.com/package/@gmartigny/whiskers.js)
[![Bundle size](https://img.shields.io/bundlejs/size/@gmartigny/whiskers.js?style=flat-square)](https://bundlejs.com/?q=@gmartigny/whiskers.js)
[![CI](https://img.shields.io/github/actions/workflow/status/GMartigny/Whiskers.js/ci.yaml?style=flat-square)](https://github.com/GMartigny/Whiskers.js/actions)

Minimalist HTML-in-JS reactive framework.

- **Simple**: 5 functions, no build step, no virtual DOM, no magic.
- **Light**: about 2 kB gzipped, zero dependencies.
- **Typed**: written in TypeScript, types included.

Whiskers.js is made for small widgets, demos and side projects, not for complex applications.


## Installation

### From npm

```shell
npm install @gmartigny/whiskers.js
```

```js
import { render, reactive, renderStyle } from "@gmartigny/whiskers.js";
```

### From a CDN

No install needed, import it right into a page:

```html
<script type="module">
    import { render, reactive } from "https://unpkg.com/@gmartigny/whiskers.js@2";
</script>
```


## Usage

### Render elements

`render(tag, props, children)` creates an element. Props and children are both optional.

```js
const app = render("main", { class: "app" }, [
    render("h1", "Whiskers.js"),
    render("p", "Minimalist HTML-in-JS reactive framework."),
]);

document.body.appendChild(app);
```

Props follow a few simple conventions:

```js
render("input", {
    // Attribute (false, null and undefined remove it, true sets it empty)
    type: "checkbox",
    disabled: false,
    // Class as a string, an array or an object of conditions
    class: { field: true, checked: isChecked },
    // DOM property, not visible in the HTML
    ".indeterminate": true,
    // CSS variable
    "--color": "goldenrod",
    // Event listener: form fields receive their value, then the event
    "@input": (checked, event) => console.log(checked),
});
```

Children can be elements, text, numbers or arrays of them. `null`, `undefined` and booleans render nothing, which is handy for conditions:

```js
render("p", [user.name, user.isAdmin && render("b", " (admin)")]);
```

Pass an existing element instead of a tag to update it. Only what you give is changed: omitted children are kept, while new props replace the previous ones.

```js
const title = render("h1", "Hello");
render(title, "Hello again");
```

For SVG, use the `svg` tag and prefix its children with `svg:`:

```js
render("svg", { viewBox: "0 0 10 10" }, render("svg:circle", { cx: 5, cy: 5, r: 4 }));
```

### React to changes

`reactive(data, key, callback)` calls the callback right away, then each time `data[key]` changes. The callback receives the new value and what it returned last time, so an element can be reused:

```js
const data = { count: 0 };

const counter = render("div", [
    render("button", { "@click": () => data.count++ }, "Increase"),
    reactive(data, "count", (count, el) => render(el ?? "span", count)),
]);
```

It also works without any rendering:

```js
reactive(data, "count", count => console.log(count)); // logs 0
data.count = 42; // logs 42
```

### Render lists

For an array, add a second callback to render each item. The first callback creates the list container once.

```js
const data = { cats: ["Felix", "Garfield"] };

const list = reactive(
    data,
    "cats",
    () => render("ul"),
    cat => render("li", cat),
);

data.cats.push("Salem"); // adds a <li>
data.cats.sort(); // moves the existing <li>, nothing is re-rendered
data.cats = ["Tom"]; // replacing the whole array works too
```

Every change is detected: `push`, `splice`, `sort`, index assignment (`data.cats[0] = "Tom"`), `length`…

### Stop reacting

```js
unreactive(data, "count"); // a single prop
unreactive(data); // every prop of the object
```

### Style

`renderStyle(styles)` turns an object into a `<style>` element, using native CSS nesting:

```js
document.head.appendChild(renderStyle({
    ".app": {
        backgroundColor: "#654321", // camelCase or "kebab-case"
        padding: "2em",

        "& h1": {
            fontSize: "3em",
        },
    },
}));
```

Use `getCSS(styles)` to get the CSS string only.


## Examples

The [examples](./examples) folder has a basic page, a reactivity demo and a complete todo app. Build the library first (`npm run build`), then open them through any local web server.


## API

| Function                                   | Returns          | Description                                                     |
|--------------------------------------------|------------------|-----------------------------------------------------------------|
| `render(element?, props?, children?)`      | `Element`        | Create an element (default `"div"`) or update an existing one   |
| `reactive(data, key, callback)`            | Callback result  | Call `callback(value, previous)` now and on each change         |
| `reactive(data, key, container, item)`     | Container        | Render an array, `item(value)` is called for each new item      |
| `unreactive(data, key?)`                   | –                | Stop reacting to one or every prop                              |
| `renderStyle(styles, element?)`            | `HTMLStyleElement` | Create (or update) a style element from an object or a string |
| `getCSS(styles)`                           | `string`         | Turn a style object into CSS                                    |


## Upgrading from v1

See the [changelog](./CHANGELOG.md#200) for the breaking changes and how to migrate.


## License

[MIT](./license)
