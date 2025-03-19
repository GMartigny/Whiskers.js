/**
 * @callback renderCallback
 * @param {*} value - The new value
 * @param {HTMLElement?} node - Previous node for re-use
 * @return {HTMLElement}
 */

/**
 * @param {Object} context - Store holding data
 * @param {string} target - Field to observe
 * @param {renderCallback} render - Render callback called on change
 * @return {HTMLElement}
 */
function reactiveNode (context, target, render) {
    let value = context[target];

    const node = render(value);

    Object.defineProperty(context, target, {
        get: () => value,
        set: (newValue) => {
            value = newValue;
            render(value, node);
        },
    });

    return node;
}

/**
 * @callback ChangeCallback
 * @param {string} name - Name of the Array method called
 * @param {*[]} args - All the following arguments
 */
/**
 * Copy of Array class to preserve its prototype
 * @class
 * @extends Array
 */
class EmitterArray extends Array {
    #onChange;

    /**
     * @param {ChangeCallback} callback - Define what callback to call on change
     */
    setOnChange (callback) {
        this.#onChange = callback;
    }

    /**
     * @inheritDoc
     */
    push (...args) {
        super.push(...args);
        this.#onChange?.("push", args);
    }

    /**
     * @inheritDoc
     */
    pop () {
        super.pop();
        this.#onChange?.("pop");
    }

    /**
     * @inheritDoc
     */
    shift () {
        super.shift();
        this.#onChange("shift");
    }

    /**
     * @inheritDoc
     */
    unshift (...args) {
        super.unshift(...args);
        this.#onChange?.("unshift", args);
    }

    /**
     * @inheritDoc
     */
    splice (...args) {
        super.splice(...args);
        this.#onChange?.("splice", args);
    }

    /**
     * @inheritDoc
     */
    sort (...args) {
        super.sort(...args);
        this.#onChange?.("sort", args);
    }

    /**
     * @inheritDoc
     */
    reverse () {
        super.reverse();
        this.#onChange?.("reverse");
    }
}

/**
 * @param {Object} context - Store holding data
 * @param {string} target - Field to observe
 * @param {renderCallback} render - Render callback called on change
 * @param {renderCallback} [childrenRender] - Render callback for each child
 * @return {*}
 */
function reactiveArray (context, target, render, childrenRender) {
    let values = new EmitterArray(...context[target]);
    const wrapper = render(values);

    /**
     * @param {string} [func] -
     * @param {...*} [args] -
     */
    function reflow (func, args) {
        switch (func) {
            case "push":
                args.forEach(value => wrapper.appendChild(childrenRender(value)));
                break;
            case "pop":
                if (wrapper.lastChild) {
                    wrapper.removeChild(wrapper.lastChild);
                }
                break;
            case "shift":
                if (wrapper.firstChild) {
                    wrapper.removeChild(wrapper.firstChild);
                }
                break;
            case "splice":
                // eslint-disable-next-line no-case-declarations
                const [index, removed, ...added] = args;
                for (let i = 0; i < removed; ++i) {
                    wrapper.removeChild(wrapper.children[index]);
                }
                if (added.length) {
                    const pivot = wrapper.children[index] ?? null;
                    added.forEach(value => wrapper.insertBefore(childrenRender(value), pivot));
                }
                break;
            case "unshift":
                args.forEach((value) => {
                    if (wrapper.children.length) {
                        wrapper.insertBefore(childrenRender(value), wrapper.firstChild);
                    }
                    else {
                        wrapper.appendChild(childrenRender(value));
                    }
                });
                break;
            default:
                wrapper.innerHTML = "";
                values.forEach(value => wrapper.appendChild(childrenRender(value)));
        }
    }
    const setOnChange = () => {
        const onChange = childrenRender ? reflow : () => render(values);
        values.setOnChange(onChange);
        if (childrenRender) {
            reflow();
        }
    };
    setOnChange();

    Object.defineProperty(context, target, {
        get: () => values,
        set: (newValue) => {
            if (!Array.isArray(newValue)) {
                throw new window.TypeError(`Value of ${target} should be an array.`);
            }
            values = new EmitterArray(...newValue);

            setOnChange();
        },
    });

    return wrapper;
}

/**
 * @param {Object} context - Store holding data
 * @param {string} target - Field to observe
 * @param {renderCallback} render - Render callback called on change
 * @param {renderCallback} [childrenRender] - Render callback for each child when observing an array
 * @return {HTMLElement}
 * @example
 * reactive(data, "field", (value, el) => render(el, value));
 */
export default function reactive (context, target, render, childrenRender) {
    if (context[target] === undefined) {
        const { name } = context.constructor;
        const message = `The prop [${target}] doesn't exists on [${name}]. Couldn't make it reactive.`;
        throw new window.ReferenceError(message, {
            cause: context,
        });
    }
    return (Array.isArray(context[target]) ? reactiveArray : reactiveNode)(context, target, render, childrenRender);
}
