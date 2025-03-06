import { JSDOM } from "jsdom";
import test from "ava";
import { renderStyle, getCSS } from "../index.js";

test.before(() => {
    const { window } = new JSDOM();
    global.window = window;
});

test("Get CSS", (t) => {
    const style = {
        ".app": {
            padding: "10px",
            margin: 0,
        },
    };
    t.is(getCSS(style), `.app {
    padding: 10px;
    margin: 0;
}`);
});

test.skip("Nested style", (t) => {
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
