# AGENTS.md

Technical notes for contributors and coding agents. User-facing documentation lives in [readme.md](./readme.md).

## Principles

Every change must respect the three founding principles:

1. **Simplicity**: a small, stable API (`render`, `reactive`, `unreactive`, `renderStyle`, `getCSS`). Whiskers.js is not meant for complex apps: no virtual DOM, no component system, no scheduler, no deep reactivity. Prefer documenting a limitation over adding an option.
2. **Lightness**: zero runtime dependencies, the minified bundle stays around 2 kB gzipped. Check `npm run build` output before and after a change and justify any growth.
3. **Modernity**: TypeScript strict, ESM only, 100 % test coverage (enforced), up-to-date docs.

## Commands

| Command              | Purpose                                                        |
|----------------------|----------------------------------------------------------------|
| `npm run check`      | Everything below, run it before committing                     |
| `npm run lint`       | ESLint 10 (flat config, typescript-eslint strict, stylistic)   |
| `npm run typecheck`  | `tsc --noEmit` on sources and tests                            |
| `npm test`           | Vitest + happy-dom with v8 coverage (thresholds at 100 %)      |
| `npm run test:watch` | Vitest in watch mode                                           |
| `npm run build`      | tsdown: minified ESM, source map and `.d.ts` in `dist/`        |

TypeScript is pinned to `~6.0` because typescript-eslint doesn't support TypeScript 7 yet.

## Layout

```
src/
  index.ts      public exports only
  render.ts     render(), props handling, children normalization (toNodes)
  reactive.ts   reactive(), unreactive(), array observation, list reconciliation
  style.ts      getCSS(), renderStyle()
tests/          one *.test.ts file per source file
examples/       plain HTML pages importing ../dist/index.js
```

## How it works

### render

- `render(element?, propsOrChildren?, children?)`: the second argument is props only if it is a non-null, non-array object that is not a `Node` (`isProps`).
- Props applied to each element are stored in a `WeakMap` (`appliedProps`). On re-render with props, keys missing from the new props are reset (attribute removed, CSS variable removed, listener removed). `.property` keys are never reset.
- Children are replaced only when given (`undefined` means "leave them"). They are flattened, `null`/`undefined`/booleans are dropped, the rest goes to `replaceChildren`.
- Each `@event` key registers **one** listener per element. It looks up the latest handler in `appliedProps` when the event fires, so re-renders never re-bind listeners.
- Form fields (`INPUT`, `TEXTAREA`, `SELECT`) give `(value, event)` to `@input` and `@change` (`getFieldValue`).
- `svg` and `svg:*` tags are created in the SVG namespace.

### reactive

- `track()` replaces a data property with a getter/setter, once per `(object, key)`. State lives in `registry: WeakMap<object, Map<key, Entry>>`, nothing is added to user objects. The property keeps its enumerability.
- An `Entry` holds the current value and a `Set` of bindings. The setter ignores `Object.is`-equal values, then notifies every binding synchronously (no batching).
- Arrays are wrapped in a `Proxy` (`observeArray`):
  - mutating methods (`MUTATORS`) run on the raw array and notify once per call; chainable results return the proxy;
  - `set` and `deleteProperty` traps notify on real changes (index, `length`, `delete`);
  - `rawArrays` maps proxies to raw arrays, so a proxy is never wrapped twice and `unreactive` restores the raw array;
  - a proxy only notifies while it is still the current value of its entry: a replaced array becomes inert.
- Scalar binding: the callback receives `(value, previousResult)`. If it returns a different `Node`, the previous one is replaced in the DOM.
- List binding (with `itemRender`): the container callback runs once, then `reconcile()` keeps an ordered list of `[item, node]`. Nodes are reused by `Map` lookup on the item value (duplicates handled with queues), leftovers are removed, and nodes are placed from the end, moving only the ones out of place. Item identity is the value itself: an object mutated in place keeps its node, make its own props reactive if needed.
- `unreactive()` drops the bindings and puts back a plain writable property with the raw value.

### style

- `getCSS()` outputs declarations first, then nested blocks (native CSS nesting), indented with 4 spaces. camelCase properties become kebab-case except `--custom` ones. `null`/`undefined`/`false` values are skipped, arrays output one declaration per value.

## Known limitations (by design)

- No deep reactivity: only the observed prop (and the array it holds) is tracked.
- Updates are synchronous: three assignments mean three renders.
- A list container is fully managed by `reactive`: don't add other children to it.
- Item render must return a single node (or text).

## Conventions

- 4-space indentation, double quotes, semicolons, Stroustrup braces, space before function parentheses (enforced by ESLint).
- Every exported function has a TSDoc comment with an `@example`.
- Every bug fix comes with a regression test. Keep coverage at 100 %.
- Update `readme.md` for any user-facing change and `CHANGELOG.md` for every release.

## Release

1. Update `CHANGELOG.md`.
2. `npm version <major|minor|patch>`: runs `npm run check`, bumps `package.json` and creates the `vX.Y.Z` tag.
3. `git push --follow-tags`: pushes to `main` run the checks only, the tag triggers the npm publication.
