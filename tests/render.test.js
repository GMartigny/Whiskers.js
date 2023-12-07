import { JSDOM } from "jsdom";
import test from "ava";
import { render } from "../index.js";

test.before(() => {
    const { window } = new JSDOM();
    global.window = window;
});

test("Default values", (t) => {
    const app = render();

    t.is(app.outerHTML, "<div></div>");
});

test("Optional props", (t) => {
    const noProps = render("span", "Lazy cat");

    t.is(noProps.outerHTML, "<span>Lazy cat</span>");

    const id = "malicia";
    const withProps = render("span", {
        id,
    });

    t.is(withProps.outerHTML, `<span id="${id}"></span>`);
});

test("Nested elements", (t) => {
    const app = render("main", [
        render("h1", ["Whiskers.js"]),
        render("p", "Minimalist HTML-in-JS reactive framework"),
    ]);

    t.is(app.outerHTML, "<main><h1>Whiskers.js</h1><p>Minimalist HTML-in-JS reactive framework</p></main>");
});

test("Event Listeners", (t) => {
    const button = render("button");
    const app = render("div", {
        "@click": event => t.true(event instanceof window.Event),
        "@notCalled": () => t.fail(),
    }, button);

    app.dispatchEvent(new window.CustomEvent("click", {
        bubbles: true,
    }));

    // const isCute = render("input", {
    //     type: "checkbox",
    //     ".checked": true,
    //     ".value": "is-cute",
    //     "@input": value => t.true(value),
    // });
    // isCute.dispatchEvent(new CustomEvent("input"));

    t.plan(1);
});

test("Property", (t) => {
    const app = render("input", {
        ".value": "Not in DOM",
    });

    t.is(app.outerHTML, "<input>");
    t.is(app.value, "Not in DOM");
});
