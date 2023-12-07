import { JSDOM } from "jsdom";
import test from "ava";
import { renderStyle } from "../index.js";

test.before(() => {
    const { window } = new JSDOM();
    global.window = window;
});

test("Nested style", (t) => {
    const style = renderStyle({
        body: {
            margin: 0,
            padding: "12px",

            "#app": {
                "background-color": "#123456",
            },
        },
    });

    t.true(style instanceof window.HTMLStyleElement);
    t.is(style.textContent, `body {
    margin: 0;
    padding: 12px;

    #app {
        background-color: #123456;
    }
}`);
});

test("Pass a string", (t) => {
    const css = "body { margin: 0 }";
    const style = renderStyle(css);

    t.true(style instanceof window.HTMLStyleElement);
    t.is(style.textContent, css);
});
