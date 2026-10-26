import { describe, expect, it } from "vitest";
import { getCSS, renderStyle } from "../src";

describe("getCSS", () => {
    it("turns an object into CSS", () => {
        expect(getCSS({
            ".app": {
                padding: "10px",
                margin: 0,
            },
            "p": {
                color: "red",
            },
        })).toBe(`.app {
    padding: 10px;
    margin: 0;
}

p {
    color: red;
}`);
    });

    it("nests rules after declarations", () => {
        expect(getCSS({
            body: {
                "#app": {
                    backgroundColor: "#123456",
                },
                "margin": 0,
            },
        })).toBe(`body {
    margin: 0;

    #app {
        background-color: #123456;
    }
}`);
    });

    it("nests a rule as first child", () => {
        expect(getCSS({ ".a": { ".b": { color: "red" } } })).toBe(`.a {
    .b {
        color: red;
    }
}`);
    });

    it("converts camelCase but keeps custom properties", () => {
        expect(getCSS({ a: { "WebkitBoxShadow": "none", "--mainColor": "red", "font-size": "1em" } })).toBe(`a {
    -webkit-box-shadow: none;
    --mainColor: red;
    font-size: 1em;
}`);
    });

    it("ignores empty values and outputs one declaration per array value", () => {
        expect(getCSS({ a: { color: null, margin: undefined, padding: false, display: ["block", null, "flex"] } })).toBe(`a {
    display: block;
    display: flex;
}`);
    });

    it("handles empty blocks and at-rules", () => {
        expect(getCSS({ a: {} })).toBe("a {}");
        expect(getCSS({ "@media (width > 600px)": { a: { color: "red" } } })).toBe(`@media (width > 600px) {
    a {
        color: red;
    }
}`);
    });
});

describe("renderStyle", () => {
    it("creates a style element from an object", () => {
        const style = renderStyle({ body: { margin: 0 } });
        expect(style).toBeInstanceOf(HTMLStyleElement);
        expect(style.textContent).toBe("body {\n    margin: 0;\n}");
    });

    it("creates a style element from a string", () => {
        const css = "body { margin: 0 }";
        expect(renderStyle(css).textContent).toBe(css);
    });

    it("updates an existing style element", () => {
        const style = renderStyle("a {}");
        expect(renderStyle("b {}", style)).toBe(style);
        expect(style.textContent).toBe("b {}");
    });
});
