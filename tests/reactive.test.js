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
        (cats, el) => render(el || "ul", cats),
        name => render("li", name),
    );

    t.is(data.cats.length, 2);
    t.is(app.outerHTML, "<ul><li>Guppy</li><li>Puss in Boots</li></ul>");

    app.name = "liter";
    data.cats.push("Garfield");

    t.is(app.outerHTML, "<ul><li>Guppy</li><li>Puss in Boots</li><li>Garfield</li></ul>");
    t.is(app.name, "liter");

    data.cats.splice(1, 1, "Salem");

    t.is(app.outerHTML, "<ul><li>Guppy</li><li>Salem</li><li>Garfield</li></ul>");

    t.throws(() => data.cats = null);
});
