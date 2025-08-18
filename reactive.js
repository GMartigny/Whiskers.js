/**
 * @callback renderCallback
 * @param {*} value The new value
 * @param {HTMLElement?} node Previous node for re-use
 * @return {HTMLElement}
 */

/**
 * @param {Object} context Store holding data
 * @param {string} target Field to observe
 * @param {renderCallback} render - Render callback called on change
 * @return {HTMLElement}
 */
function reactiveNode (context, target, render) {
    let value = context[target];

    const node = render(value);

    /* eslint-disable no-underscore-dangle */
    if (!context.__watchers) {
        Object.defineProperty(context, "__watchers", {
            value: {},
        });
        Object.defineProperty(context, target, {
            get: () => value,
            set: (newValue) => {
                value = newValue;
                context.__watchers[target].forEach(([watcher, initial]) => watcher(value, initial));
            },
        });
    }
    if (!context.__watchers[target]) context.__watchers[target] = [];
    context.__watchers[target].push([render, node]);

    /* eslint-enable no-underscore-dangle */

    return node;
}

/**
 * @callback ChangeCallback
 * @param {string} name Name of the Array method called
 * @param {*[]} args All the following arguments
 */
/**
 * Copy of Array class to preserve its prototype
 * @class
 * @extends Array
 */
class EmitterArray extends Array {
    #watchers = [];

    /**
     * @param {ChangeCallback} callback Define what callback to call on change
     */
    pushWatcher (callback) {
        this.#watchers.push(callback);
    }

    /**
     * @param {...*} args Any arguments
     */
    #trigger (...args) {
        this.#watchers.forEach(callback => callback(...args));
    }

    /**
     * @inheritDoc
     */
    push (...args) {
        const result = super.push(...args);
        this.#trigger("push", args);
        return result;
    }

    /**
     * @inheritDoc
     */
    pop () {
        const result = super.pop();
        this.#trigger("pop");
        return result;
    }

    /**
     * @inheritDoc
     */
    shift () {
        const result = super.shift();
        this.#trigger("shift");
        return result;
    }

    /**
     * @inheritDoc
     */
    unshift (...args) {
        const result = super.unshift(...args);
        this.#trigger("unshift", args);
        return result;
    }

    /**
     * @inheritDoc
     */
    splice (...args) {
        const result = super.splice(...args);
        this.#trigger("splice", args);
        return result;
    }

    /**
     * @inheritDoc
     */
    sort (sortFunction) {
        const result = super.sort(sortFunction);
        this.#trigger("sort", sortFunction);
        return result;
    }

    /**
     * @inheritDoc
     */
    reverse () {
        const result = super.reverse();
        this.#trigger("reverse");
        return result;
    }
}

/**
 * @param {Object} context Store holding data
 * @param {string} target Field to observe
 * @param {renderCallback} render Render callback called on change
 * @param {renderCallback} [childrenRender] Render callback for each child
 * @return {*}
 */
function reactiveArray (context, target, render, childrenRender) {
    let values = context[target] instanceof EmitterArray ? context[target] : new EmitterArray(...context[target]);
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
        values.pushWatcher(childrenRender ? reflow : () => render(values));
        if (childrenRender) {
            reflow();
        }
    };
    setOnChange();

    if (!(context[target] instanceof EmitterArray)) {
        Object.defineProperty(context, target, {
            get: () => values,
            set: (newValue) => {
                if (!Array.isArray(newValue)) {
                    throw new window.TypeError(`Value of ${target} should be an array, ${typeof newValue} given.`);
                }
                values = new EmitterArray(...newValue);

                setOnChange();
            },
        });
    }

    return wrapper;
}

/**
 * @param {Object} context Store holding data
 * @param {string} target Field to observe
 * @param {renderCallback} render Render callback called on change
 * @param {renderCallback} [childrenRender] Render callback for each child when observing an array
 * @return {HTMLElement}
 * @example
 * reactive(data, "field", (value, el) => render(el, value));
 */
export default function reactive (context, target, render, childrenRender) {
    if (!Object.hasOwn(context, target)) {
        const { name } = context.constructor;
        const message = `The prop [${target}] doesn't exists on [${name}]. Couldn't make it reactive.`;
        throw new window.ReferenceError(message, {
            cause: context,
        });
    }
    return (Array.isArray(context[target]) ? reactiveArray : reactiveNode)(context, target, render, childrenRender);
}
