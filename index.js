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

/**
 * Build an HTML element
 * @param {string|HTMLElement} [element = "div"] - Element to create or reuse
 * @param {Object} [props] - Set of attributes, prefix with "@" for event listeners and "." for properties
 * @param {(HTMLElement|string)[]|(HTMLElement|string)} [children] - List of children to append
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
    const { Node, document, Text } = window;

    const node = element instanceof Node ? element : document.createElement(element || "div");

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
                    node.addEventListener(key.slice(1), (event) => {
                        props[key](key === "@input" && node instanceof HTMLInputElement ? getNodeValue(node) : event);
                    });
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
    reactive,
};
