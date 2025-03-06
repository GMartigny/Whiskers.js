import reactive from "./reactive.js";

/**
 * Get the value of an input element
 * @param {HTMLInputElement} input - Any type of input element to read the value from
 * @return {*}
 */
function getNodeValue (input) {
    switch (input.getAttribute("type")) {
        case "checkbox":
            return input.checked;
        default:
            return input.value;
    }
}

const listeners = new WeakMap();

/**
 * Build an HTML element
 * @param {string|HTMLElement} [element = "div"] - Element to create or reuse
 * @param {Object} [props] - Set of attributes, prefix with "@" for event listeners, "--" for CSS variables and "." for properties
 * @param {(string|HTMLElement)[]|(string|HTMLElement)} [children] - List of children to append
 * @returns {HTMLElement}
 * @example
 * render("main", {
 *   class: "app"
 * }, [
 *   render("h1", "Whiskers.js"),
 *   render("p", "Minimalist HTML-in-JS reactive framework"),
 * ]);
 */
function render (element, props, children) {
    const { Node, document, Text, HTMLInputElement } = window;

    const node = element instanceof Node ? element : document.createElement(element || "div");

    listeners.get(node)?.forEach(params => node.removeEventListener(...params));
    listeners.delete(node);

    let nested = children;
    if (children === undefined && props?.constructor !== Object) {
        nested = props;
    }
    else {
        Object.keys(props || {}).forEach((key) => {
            switch (true) {
                case key.startsWith("."):
                    node[key.slice(1)] = props[key];
                    break;
                case key.startsWith("@"):
                    // eslint-disable-next-line no-case-declarations
                    const params = [
                        key.slice(1),
                        (event) => {
                            const isInput = key === "@input" && node instanceof HTMLInputElement;
                            props[key](isInput ? getNodeValue(node) : event);
                        },
                    ];
                    node.addEventListener(...params);
                    if (listeners.has(node)) {
                        listeners.get(node).push(params);
                    }
                    else {
                        listeners.set(node, [params]);
                    }
                    break;
                case key.startsWith("--"):
                    node.style.setProperty(key, props[key]);
                    break;
                default:
                    if (props[key] || props[key] === "") {
                        node.setAttribute(key, props[key] === true ? "" : props[key]);
                    }
                    else {
                        node.removeAttribute(key);
                    }
                    break;
            }
        });
    }

    node.innerHTML = "";
    if (Array.isArray(nested)) {
        nested
            .filter(child => child !== undefined)
            .forEach(child => node.appendChild(child instanceof Node ? child : new Text(child.toString())));
    }
    else if (nested) {
        node.appendChild(nested instanceof Node ? nested : new Text(nested.toString()));
    }

    return node;
}

/**
 * Turn a nested object into a CSS string
 * @param {CSSDefinition} styles - CSS style definition
 * @param {number} [depth = 0] - Current nesting depth
 * @return {string}
 */
function getCSS (styles, depth = 0) {
    const indent = " ".repeat(depth * 4);
    return Object.keys(styles).reduce((style, key) => {
        if (typeof styles[key] === "object") {
            return `${style}${style ? "\n\n" : ""}${indent}${key} {${getCSS(styles[key], depth + 1)}
${indent}}`;
        }

        return `${style}
${indent}${key}: ${styles[key].toString()};`;
    }, "").trimEnd();
}

/**
 * @typedef {Object<string, (string|number|CSSDefinition)>} CSSDefinition
 */

/**
 * Build a style element
 * @param {CSSDefinition|string} styles - CSS style definition
 * @returns {HTMLStyleElement}
 * @example
 * renderStyle({
 *   ".app": {
 *     padding: "10px",
 *   }
 * });
 */
function renderStyle (styles) {
    const style = window.document.createElement("style");
    style.textContent = typeof styles === "string" ? styles : getCSS(styles);

    return style;
}

export {
    render,
    renderStyle,
    getCSS,
    reactive,
};
