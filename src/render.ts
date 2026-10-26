/**
 * Anything that can be rendered as a child: nodes, text and numbers.
 * `null`, `undefined`, `true` and `false` render nothing, nested arrays are flattened.
 */
export type Child = Node | string | number | bigint | boolean | null | undefined | Child[];

/**
 * Value of the `class` attribute: a string, a list of names or a map of conditional names.
 */
export type ClassValue = string | (string | false | null | undefined)[] | Record<string, unknown>;

/**
 * Props of an element. Keys follow these conventions:
 * - `@event`: event listener (form fields' `@input` and `@change` receive their value first)
 * - `--name`: CSS custom property
 * - `.name`: DOM property (not reflected as an attribute)
 * - `class`: string, array or object of conditional class names
 * - anything else: attribute (`false`, `null` and `undefined` remove it, `true` sets it empty)
 */
export type Props = Record<string, unknown> & {
    class?: ClassValue | null | false;
};

type Handler = (...args: unknown[]) => unknown;
type FormField = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;

const SVG_NS = "http://www.w3.org/2000/svg";

/** Last props applied to each element */
const appliedProps = new WeakMap<Element, Props>();
/** Event listeners registered on each element, by prop key */
const listeners = new WeakMap<Element, Map<string, EventListener>>();

const isNil = (value: unknown): value is null | undefined | false => value === null || value === undefined || value === false;

const isProps = (value: unknown): value is Props => typeof value === "object"
    && value !== null
    && !Array.isArray(value)
    && !(value instanceof Node);

const isFormField = (node: Element): node is FormField => ["INPUT", "TEXTAREA", "SELECT"].includes(node.tagName);

/**
 * Read the value of a form field: a boolean for checkboxes, a number for number and range inputs, a string otherwise
 * @param field Form field to read from
 */
function getFieldValue (field: FormField): string | number | boolean {
    switch (field.type) {
        case "checkbox":
            return (field as HTMLInputElement).checked;
        case "number":
        case "range":
            return (field as HTMLInputElement).valueAsNumber;
        default:
            return field.value;
    }
}

/**
 * Turn a class value into a string
 * @param value Class value
 */
function getClassName (value: ClassValue): string {
    if (typeof value === "string") {
        return value;
    }
    const names = Array.isArray(value) ? value : Object.keys(value).filter(name => value[name]);
    return names.filter(Boolean).join(" ");
}

/**
 * Apply a single prop to an element (an `undefined` value removes it)
 * @param node Element to update
 * @param key Prop key
 * @param value Prop value
 */
function applyProp (node: Element, key: string, value: unknown): void {
    if (key.startsWith("@")) {
        const nodeListeners = listeners.get(node) ?? new Map<string, EventListener>();
        listeners.set(node, nodeListeners);
        const type = key.slice(1);
        const existing = nodeListeners.get(key);

        if (typeof value !== "function") {
            if (existing) {
                node.removeEventListener(type, existing);
                nodeListeners.delete(key);
            }
        }
        else if (!existing) {
            // The listener always calls the latest handler, so re-rendering doesn't need to re-bind it
            const listener: EventListener = (event) => {
                const handler = appliedProps.get(node)?.[key] as Handler;
                const withValue = (type === "input" || type === "change") && isFormField(node);
                handler(...(withValue ? [getFieldValue(node), event] : [event]));
            };
            node.addEventListener(type, listener);
            nodeListeners.set(key, listener);
        }
    }
    else if (key.startsWith("--")) {
        const { style } = node as HTMLElement;
        if (isNil(value)) {
            style.removeProperty(key);
        }
        else {
            style.setProperty(key, String(value));
        }
    }
    else if (key.startsWith(".")) {
        (node as unknown as Record<string, unknown>)[key.slice(1)] = value;
    }
    else {
        const attribute = key === "class" && !isNil(value) ? getClassName(value as ClassValue) : value;
        if (isNil(attribute)) {
            node.removeAttribute(key);
        }
        else {
            node.setAttribute(key, attribute === true ? "" : String(attribute));
        }
    }
}

/**
 * Apply props to an element, removing the ones from the previous render that are now missing
 * @param node Element to update
 * @param props New props
 */
function applyProps (node: Element, props: Props): void {
    const previous = appliedProps.get(node) ?? {};
    appliedProps.set(node, props);

    Object.keys(previous)
        .filter(key => !(key in props) && !key.startsWith("."))
        .forEach(key => applyProp(node, key, undefined));
    Object.keys(props).forEach(key => applyProp(node, key, props[key]));
}

/**
 * Turn children into a flat list of nodes and strings, ignoring empty values
 * @param children Children to normalize
 */
export function toNodes (children: Child): (Node | string)[] {
    return [children]
        .flat(Infinity as 1)
        .filter((child): child is Exclude<Child, boolean | null | undefined | Child[]> => !isNil(child) && child !== true)
        .map(child => (child instanceof Node ? child : String(child)));
}

/**
 * Create an element from its tag name. Prefix with `svg:` (or use `svg`) to create an SVG element.
 * @param tag Tag name
 */
function createElement (tag: string): Element {
    if (tag === "svg" || tag.startsWith("svg:")) {
        return document.createElementNS(SVG_NS, tag.replace(/^svg:/, ""));
    }
    return document.createElement(tag);
}

/**
 * Create an element, or update an existing one.
 * - Props, when given, replace the ones from the previous render.
 * - Children, when given, replace the current children. Omitted children are left untouched.
 * @param element Tag name (default `"div"`) or element to update
 * @param props Props to apply (can be omitted)
 * @param children Children to render
 * @example
 * render("main", { class: "app" }, [
 *     render("h1", "Whiskers.js"),
 *     render("p", "Minimalist HTML-in-JS reactive framework"),
 * ]);
 */
export function render<K extends keyof HTMLElementTagNameMap> (element: K, props?: Props | Child, children?: Child): HTMLElementTagNameMap[K];
export function render<E extends Element> (element: E, props?: Props | Child, children?: Child): E;
export function render (element?: string | Element, props?: Props | Child, children?: Child): HTMLElement;
export function render (element?: string | Element | null, props?: Props | Child, children?: Child): Element {
    const node = element instanceof Element ? element : createElement(element || "div");

    const hasProps = isProps(props);
    if (hasProps) {
        applyProps(node, props);
    }

    const content = hasProps || props === undefined ? children : props;
    if (content !== undefined) {
        node.replaceChildren(...toNodes(content));
    }

    return node;
}
