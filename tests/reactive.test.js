import { JSDOM } from "jsdom";
import test from "ava";
import spy from "./spies.js";
import { render, reactive } from "../index.js";

test.before(() => {
    const { window } = new JSDOM();
    global.window = window;
});

test("Simple value", (t) => {
    const data = {
        content: "Meow",
    };
    const app = reactive(data, "content", (value, el) => render(el, value));

    t.is(data.content, "Meow");
    t.is(app.outerHTML, "<div>Meow</div>");

    app.name = "felix";
    data.content = "Purrrrr !";

    t.is(app.outerHTML, "<div>Purrrrr !</div>");
    t.is(app.name, "felix");

    t.throws(() => reactive(data, "unknown"));
});

test("Array", (t) => {
    const data = {
        cats: [
            "Guppy",
            "Puss in Boots",
        ],
    };
    const app = reactive(
        data,
        "cats",
        cats => render("ul", cats),
        name => render("li", name),
    );

    t.is(data.cats.length, 2);
    t.true(Array.isArray(data.cats));
    t.is(app.outerHTML, "<ul><li>Guppy</li><li>Puss in Boots</li></ul>");

    data.cats.push("Garfield");

    t.is(app.outerHTML, "<ul><li>Guppy</li><li>Puss in Boots</li><li>Garfield</li></ul>");

    data.cats.sort();

    t.is(app.outerHTML, "<ul><li>Garfield</li><li>Guppy</li><li>Puss in Boots</li></ul>");

    data.cats.reverse();

    t.is(app.outerHTML, "<ul><li>Puss in Boots</li><li>Guppy</li><li>Garfield</li></ul>");

    data.cats.splice(1, 1, "Salem");

    t.is(app.outerHTML, "<ul><li>Puss in Boots</li><li>Salem</li><li>Garfield</li></ul>");

    data.cats.pop();

    t.is(app.outerHTML, "<ul><li>Puss in Boots</li><li>Salem</li></ul>");

    data.cats.shift();

    t.is(app.outerHTML, "<ul><li>Salem</li></ul>");

    data.cats = [];

    t.is(app.outerHTML, "<ul></ul>");

    data.cats.unshift("Felix", "Kitty");

    t.is(app.outerHTML, "<ul><li>Kitty</li><li>Felix</li></ul>");

    t.throws(() => data.cats = null);
});

test("Headless", (t) => {
    const data = {
        simple: 42,
        array: [1, 2],
    };

    let expectedSimple = data.simple;
    const callbackSimple = spy((value) => {
        t.is(value, expectedSimple);
        return "simple";
    });
    reactive(data, "simple", callbackSimple);
    expectedSimple = 1234;
    data.simple = expectedSimple;
    t.deepEqual(callbackSimple.called, [[42], [1234, "simple"]]);

    const callbackArray = spy((value) => {
        t.deepEqual([...value], [...data.array]);
    });
    reactive(data, "array", callbackArray);
    t.is(JSON.stringify(callbackArray.called[0]), JSON.stringify([[1, 2]]));
    data.array.push(3);
    t.is(JSON.stringify(callbackArray.called[1]), JSON.stringify([[1, 2, 3]]));
    data.array.shift();
    t.is(JSON.stringify(callbackArray.called[2]), JSON.stringify([[2, 3]]));
});

test("Multiple watchers scalar", (t) => {
    const data = {
        value: "a",
    };

    const callback1 = spy((value) => {
        t.is(value, data.value);
        return 1;
    });
    const callback2 = spy((value) => {
        t.is(value, data.value);
        return 2;
    });
    reactive(data, "value", callback1);
    reactive(data, "value", callback2);

    t.deepEqual(callback1.called, [["a"]]);
    t.deepEqual(callback2.called, [["a"]]);

    data.value = "b";

    t.deepEqual(callback1.called, [["a"], ["b", 1]]);
    t.deepEqual(callback2.called, [["a"], ["b", 2]]);
});

test("Multiple watchers array", (t) => {
    const data = {
        value: [2, 1],
    };

    const callback1 = spy((value) => {
        t.is(JSON.stringify(value), JSON.stringify(data.value));
        return 1;
    });
    const callback2 = spy((value) => {
        t.is(JSON.stringify(value), JSON.stringify(data.value));
        return 2;
    });
    reactive(data, "value", callback1);
    reactive(data, "value", callback2);

    t.is(JSON.stringify(callback1.called[0]), JSON.stringify([[2, 1]]));
    t.is(JSON.stringify(callback2.called[0]), JSON.stringify([[2, 1]]));

    data.value.push(3);

    t.is(JSON.stringify(callback1.called[1]), JSON.stringify([[2, 1, 3]]));
    t.is(JSON.stringify(callback2.called[1]), JSON.stringify([[2, 1, 3]]));

    data.value.sort();
    t.is(JSON.stringify(callback1.called[2]), JSON.stringify([[1, 2, 3]]));
    t.is(JSON.stringify(callback2.called[2]), JSON.stringify([[1, 2, 3]]));
});
