/**
 * @param {Function} func -
 * @return {Function}
 */
export default (func) => {
    const spy = (...args) => {
        spy.called.push(args);
        return func(...args);
    };
    spy.called = [];

    return spy;
};
