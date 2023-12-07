# Whiskers.js 😸

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
    }, ["Increase"]),
    reactive(data, "count", (value, el) => render(el || "span", value)),
]);

document.body.appendChild(counter);
```


### Complete example

[Todo app](./examples/todo.html)


## License

[MIT](./license)
