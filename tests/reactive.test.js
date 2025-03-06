import { JSDOM } from "jsdom";
import test from "ava";
import { render, reactive } from "../index.js";

test.before(() => {
    const { window } = new JSDOM();
    global.window = window;
});

test("Simple value", (t) => {
    const data = {
        content: "Meow",
    };
    const app = reactive(data, "content", (value, el) => render(el || "div", value));

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
