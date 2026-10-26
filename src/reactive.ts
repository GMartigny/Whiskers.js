import { type Child, toNodes } from "./render";

/**
 * Called with the new value and the result of the previous call (`undefined` the first time)
 */
export type RenderCallback<V, R> = (value: V, previous: R | undefined) => R;

/**
 * Called once for each new item of a list, must return a single node (or text)
 */
export type ItemRenderCallback<I> = (item: I) => Child;

type ItemOf<V> = V extends readonly (infer I)[] ? I : never;
type AnyFunction = (...args: unknown[]) => unknown;

interface Binding {
    list: boolean;
    update: (value: unknown) => void;
}

interface Entry {
    value: unknown;
    enumerable: boolean;
    bindings: Set<Binding>;
}

const registry = new WeakMap<object, Map<PropertyKey, Entry>>();
/** Observed arrays and their underlying raw array */
const rawArrays = new WeakMap<object, unknown[]>();

const MUTATORS = new Set(["copyWithin", "fill", "pop", "push", "reverse", "shift", "sort", "splice", "unshift"]);

const unwrap = <V>(value: V): V => (rawArrays.get(value as object) as V) ?? value;

/**
 * Wrap an array to be notified of any change (mutating methods, index assignment, length change and deletion)
 * @param array Array to observe
 * @param notify Called after each change
 */
function observeArray (array: unknown[], notify: () => void): unknown[] {
    const proxy: unknown[] = new Proxy(unwrap(array), {
        get (target, prop, receiver) {
            const value: unknown = Reflect.get(target, prop, receiver);
            if (typeof prop === "string" && MUTATORS.has(prop)) {
                // Run on the raw array to notify only once per call
                return (...args: unknown[]) => {
                    const result = (value as AnyFunction).apply(target, args);
                    notify();
                    return result === target ? proxy : result;
                };
            }
            return value;
        },
        set (target, prop, value) {
            const changed = !Object.is(Reflect.get(target, prop), value);
            Reflect.set(target, prop, value);
            if (changed) {
                notify();
            }
            return true;
        },
        deleteProperty (target, prop) {
            const existed = Object.hasOwn(target, prop);
            Reflect.deleteProperty(target, prop);
            if (existed) {
                notify();
            }
            return true;
        },
    });
    rawArrays.set(proxy, unwrap(array));
    return proxy;
}

/**
 * Turn a prop into a getter/setter that notifies its bindings (only once per prop)
 * @param context Object holding the prop
 * @param key Prop name
 */
function track (context: object, key: PropertyKey): Entry {
    const keys = registry.get(context) ?? new Map<PropertyKey, Entry>();
    registry.set(context, keys);

    const existing = keys.get(key);
    if (existing) {
        return existing;
    }

    const descriptor = Object.getOwnPropertyDescriptor(context, key) as PropertyDescriptor;
    if (!("value" in descriptor)) {
        throw new TypeError(`The prop [${String(key)}] is a getter/setter, it can't be made reactive.`);
    }

    const entry: Entry = {
        value: undefined,
        enumerable: Boolean(descriptor.enumerable),
        bindings: new Set(),
    };
    const notify = () => entry.bindings.forEach(binding => binding.update(entry.value));
    const wrap = (value: unknown): unknown => {
        if (!Array.isArray(value)) {
            return value;
        }
        // Mutations of a replaced array are ignored
        const proxy = observeArray(value, () => entry.value === proxy && notify());
        return proxy;
    };

    entry.value = wrap(descriptor.value);
    keys.set(key, entry);

    Object.defineProperty(context, key, {
        configurable: true,
        enumerable: entry.enumerable,
        get: () => entry.value,
        set: (value: unknown) => {
            if (Object.is(value, entry.value)) {
                return;
            }
            if (!Array.isArray(value) && [...entry.bindings].some(binding => binding.list)) {
                throw new TypeError(`Value of [${String(key)}] should be an array, ${typeof value} given.`);
            }
            entry.value = wrap(value);
            notify();
        },
    });

    return entry;
}

/**
 * Turn the result of an item render into a single node
 * @param child Rendered item
 */
function toNode (child: Child): Node {
    const [node = ""] = toNodes(child);
    return typeof node === "string" ? document.createTextNode(node) : node;
}

/**
 * Update the children of a list, reusing the nodes of unchanged items and only rendering new ones
 * @param parent List container
 * @param previous Items and nodes of the previous render
 * @param values New items
 * @param renderItem Item render callback
 * @returns Items and nodes of this render
 */
function reconcile<I> (parent: ParentNode, previous: [I, Node][], values: I[], renderItem: ItemRenderCallback<I>): [I, Node][] {
    const pool = new Map<I, Node[]>();
    previous.forEach(([value, node]) => pool.set(value, [...(pool.get(value) ?? []), node]));

    // Array.from also fills sparse arrays' holes
    const next = Array.from(values, (value): [I, Node] => [value, pool.get(value)?.shift() ?? toNode(renderItem(value))]);

    pool.forEach(nodes => nodes.forEach(node => node.parentNode?.removeChild(node)));

    // Place nodes from the end, moving only the ones out of place
    let reference: Node | null = null;
    for (let index = next.length - 1; index >= 0; index--) {
        const [, node] = next[index] as [I, Node];
        if (node.parentNode !== parent || node.nextSibling !== reference) {
            parent.insertBefore(node, reference);
        }
        reference = node;
    }

    return next;
}

/**
 * Bind a prop of an object to a render callback, called right away and on each change.
 *
 * With an `itemRender` callback, the prop must be an array: `render` is called once to create the list container,
 * then `itemRender` is called for each new item while existing items keep their node (even when moved).
 * @param context Object holding the data
 * @param key Prop to observe
 * @param render Render callback, receives the new value and its previous result
 * @param itemRender Render callback for each item of an array
 * @returns Result of the first render
 * @example
 * const data = { count: 0 };
 * reactive(data, "count", (count, node) => render(node ?? "span", count));
 * data.count++;
 */
export function reactive<T extends object, K extends keyof T, R> (
    context: T,
    key: K,
    render: RenderCallback<T[K], R>,
): R;
export function reactive<T extends object, K extends keyof T, R extends ParentNode> (
    context: T,
    key: K,
    render: RenderCallback<T[K], R>,
    itemRender: ItemRenderCallback<ItemOf<T[K]>>,
): R;
export function reactive (
    context: object,
    key: PropertyKey,
    render: RenderCallback<unknown, unknown>,
    itemRender?: ItemRenderCallback<unknown>,
): unknown {
    if (!Object.hasOwn(context, key)) {
        const name = (context.constructor as AnyFunction | undefined)?.name ?? "Object";
        throw new ReferenceError(`The prop [${String(key)}] doesn't exist on [${name}], it can't be made reactive.`);
    }

    const entry = track(context, key);
    const result = render(entry.value, undefined);
    let binding: Binding;

    if (itemRender) {
        if (!Array.isArray(entry.value)) {
            throw new TypeError(`Value of [${String(key)}] should be an array to render its items.`);
        }
        const parent = result as ParentNode;
        let items: [unknown, Node][] = [];
        parent.replaceChildren();
        binding = {
            list: true,
            update: (values) => {
                items = reconcile(parent, items, values as unknown[], itemRender);
            },
        };
        binding.update(entry.value);
    }
    else {
        let previous = result;
        binding = {
            list: false,
            update: (value) => {
                const next = render(value, previous);
                // Swap the node in place when the callback returned a new one
                if (previous instanceof Node && next instanceof Node && next !== previous) {
                    previous.parentNode?.replaceChild(next, previous);
                }
                previous = next;
            },
        };
    }

    entry.bindings.add(binding);
    return result;
}

/**
 * Stop observing a prop (or every prop) of an object: bindings are dropped and the prop becomes a plain value again
 * @param context Object holding the data
 * @param key Prop to release, every reactive prop when omitted
 * @example
 * unreactive(data, "count");
 */
export function unreactive<T extends object> (context: T, key?: keyof T): void {
    const keys = registry.get(context);
    if (!keys) {
        return;
    }

    (key === undefined ? [...keys.keys()] : [key]).forEach((name) => {
        const entry = keys.get(name);
        if (entry) {
            keys.delete(name);
            entry.bindings.clear();
            Object.defineProperty(context, name, {
                value: unwrap(entry.value),
                writable: true,
                configurable: true,
                enumerable: entry.enumerable,
            });
        }
    });
}
