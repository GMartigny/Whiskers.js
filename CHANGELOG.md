# Changelog

## 2.0.0

Complete rewrite in TypeScript. The API keeps the same shape as v1, most code will work unchanged.

### Breaking changes

- **Re-rendering an element only changes what is given.**
  - `render(el, props)` keeps the current children (v1 removed them).
  - `render(el, children)` keeps the current props and event listeners (v1 removed the listeners).
  - New props replace the previous ones: attributes, CSS variables and listeners missing from the new props are removed.
- **List rendering reuses nodes.** The item callback only receives the item (no previous element) and is called only for new items. When items move (`sort`, `reverse`…), their existing node is moved.
- **The list container callback is called once.** Anything it renders inside the container is replaced by the items.
- **`@input` and `@change` on form fields** (`input`, `textarea`, `select`) receive `(value, event)`. Number and range inputs give a number, checkboxes a boolean (radios now give their value).
- **Empty children are skipped:** `null`, `false` and `true` render nothing (v1 rendered `"false"`, `"true"` or crashed on `null`).
- **Dropped `main`/`module` fields:** the package is ESM only, exposed through `exports`. The CDN file is now `dist/index.js`.

### Fixes

- Several props of the same object can be reactive (only the first one worked).
- Arrays with a single number (`[3]`) were turned into empty arrays.
- `0` is rendered as a child and kept as an attribute value.
- `unshift` with several items reversed their order in the DOM.
- `splice` with a negative index, without delete count or past the end.
- Assigning a new array updates every binding, even without item render.
- Mutations of a replaced array are ignored.
- Props without prototype (`Object.create(null)`) are accepted.
- Nested CSS as first child, `null` CSS values.
- `reactive` works without DOM (no more `window` dependency).

### New

- Every array change is detected: index assignment, `length`, `fill`, `copyWithin`, `delete`.
- Assigning the same value doesn't trigger a render.
- When a reactive callback returns a new node, it replaces the previous one in the DOM.
- `unreactive(data, key?)` to stop observing.
- `class` accepts an array or an object of conditions.
- SVG elements with the `svg` tag and `svg:` prefix.
- CSS: camelCase properties, array values, `renderStyle` can update an existing element.
- TypeScript types.

### Migration

```js
// v1
reactive(data, "list", (values, el) => render(el || "ul", values), (item, el) => render(el || "li", item));
// v2
reactive(data, "list", () => render("ul"), item => render("li", item));
```

```js
// v1: listeners had to be passed again on each render
render(button, { "@click": onClick }, label);
// v2: still works, but render(button, label) now keeps the listener
```
