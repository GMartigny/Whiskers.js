import { describe, expect, it, vi } from "vitest";
import { render } from "../src";

describe("render", () => {
    it("creates a div by default", () => {
        expect(render().outerHTML).toBe("<div></div>");
        expect(render(undefined, "Meow").outerHTML).toBe("<div>Meow</div>");
    });

    it("accepts children without props", () => {
        expect(render("span", "Lazy cat").outerHTML).toBe("<span>Lazy cat</span>");
        expect(render("ul", [render("li", "a"), render("li", "b")]).outerHTML).toBe("<ul><li>a</li><li>b</li></ul>");
    });

    it("accepts props without children", () => {
        expect(render("span", { id: "malicia" }).outerHTML).toBe("<span id=\"malicia\"></span>");
    });

    it("accepts props and children", () => {
        expect(render("p", { class: "text" }, "Purr").outerHTML).toBe("<p class=\"text\">Purr</p>");
        expect(render("p", undefined, "Purr").outerHTML).toBe("<p>Purr</p>");
    });

    it("renders numbers, including zero", () => {
        expect(render("span", 0).outerHTML).toBe("<span>0</span>");
        expect(render("span", [1, 2n]).outerHTML).toBe("<span>12</span>");
    });

    it("ignores empty children and flattens nested arrays", () => {
        const node = render("div", ["a", null, undefined, false, true, ["b", ["c"]]]);
        expect(node.outerHTML).toBe("<div>abc</div>");
    });

    it("sets attributes", () => {
        const node = render("input", {
            "tabindex": 0,
            "disabled": true,
            "data-empty": "",
            "hidden": false,
            "title": null,
            "placeholder": undefined,
        });
        expect(node.outerHTML).toBe("<input tabindex=\"0\" disabled=\"\" data-empty=\"\">");
    });

    it("sets class from a string, an array or an object", () => {
        expect(render("i", { class: "a b" }).className).toBe("a b");
        expect(render("i", { class: ["a", false, null, undefined, "b"] }).className).toBe("a b");
        expect(render("i", { class: { a: true, b: false, c: 1 } }).className).toBe("a c");
        expect(render("i", { class: null }).hasAttribute("class")).toBe(false);
    });

    it("sets CSS variables", () => {
        const node = render("span", { "--color": "red", "--size": 2 });
        expect(node.style.getPropertyValue("--color")).toBe("red");
        expect(node.style.getPropertyValue("--size")).toBe("2");

        render(node, { "--color": null });
        expect(node.style.getPropertyValue("--color")).toBe("");
        expect(node.style.getPropertyValue("--size")).toBe("");
    });

    it("sets DOM properties without attributes", () => {
        const node = render("input", { ".value": "Not in DOM" });
        expect(node.outerHTML).toBe("<input>");
        expect(node.value).toBe("Not in DOM");

        // Properties are not reset when removed from props
        render(node, {});
        expect(node.value).toBe("Not in DOM");
    });

    it("accepts props without prototype", () => {
        const props = Object.create(null) as Record<string, string>;
        props.id = "x";
        expect(render("div", props).outerHTML).toBe("<div id=\"x\"></div>");
    });

    it("creates SVG elements", () => {
        const svg = render("svg", { viewBox: "0 0 10 10" }, render("svg:circle", { r: 5 }));
        expect(svg.namespaceURI).toBe("http://www.w3.org/2000/svg");
        expect(svg.firstElementChild?.namespaceURI).toBe("http://www.w3.org/2000/svg");
        expect(svg.firstElementChild?.tagName).toBe("circle");
    });

    describe("events", () => {
        it("calls listeners with the event", () => {
            const onClick = vi.fn();
            const node = render("div", { "@click": onClick }, render("button"));
            node.firstElementChild?.dispatchEvent(new Event("click", { bubbles: true }));

            expect(onClick).toHaveBeenCalledOnce();
            expect(onClick.mock.calls[0]?.[0]).toBeInstanceOf(Event);
        });

        it("gives the value of form fields to @input and @change", () => {
            const cases: [string, Record<string, unknown>, unknown][] = [
                ["input", { ".value": "text" }, "text"],
                ["input", { "type": "checkbox", ".checked": true }, true],
                ["input", { "type": "number", ".value": "42" }, 42],
                ["input", { "type": "range", "min": 0, "max": 10, ".value": "7" }, 7],
                ["input", { type: "radio", value: "a" }, "a"],
                ["textarea", { ".value": "long" }, "long"],
            ];
            cases.forEach(([tag, props, expected]) => {
                ["input", "change"].forEach((type) => {
                    const handler = vi.fn();
                    const field = render(tag, { ...props, [`@${type}`]: handler });
                    const event = new Event(type);
                    field.dispatchEvent(event);
                    expect(handler).toHaveBeenCalledWith(expected, event);
                });
            });

            const onChange = vi.fn();
            const select = render("select", { "@change": onChange }, [render("option", "x"), render("option", "y")]);
            select.dispatchEvent(new Event("change"));
            expect(onChange.mock.calls[0]?.[0]).toBe("x");
        });

        it("gives the event to @input of other elements", () => {
            const handler = vi.fn();
            const node = render("div", { "@input": handler });
            const event = new Event("input");
            node.dispatchEvent(event);
            expect(handler).toHaveBeenCalledWith(event);
        });

        it("calls the latest handler and removes missing ones on re-render", () => {
            const first = vi.fn();
            const second = vi.fn();
            const node = render("button", { "@click": first });
            render(node, { "@click": second });
            node.click();
            expect(first).not.toHaveBeenCalled();
            expect(second).toHaveBeenCalledOnce();

            render(node, {});
            node.click();
            expect(second).toHaveBeenCalledOnce();

            render(node, { "@click": undefined });
            node.click();
            expect(second).toHaveBeenCalledOnce();
        });
    });

    describe("re-render", () => {
        it("keeps props and listeners when only children are given", () => {
            const onClick = vi.fn();
            const node = render("button", { "@click": onClick, "class": "btn" }, "Old");
            render(node, "New");
            node.click();

            expect(node.outerHTML).toBe("<button class=\"btn\">New</button>");
            expect(onClick).toHaveBeenCalledOnce();
        });

        it("keeps children when only props are given", () => {
            const node = render("p", "Content");
            render(node, { id: "kept" });
            expect(node.outerHTML).toBe("<p id=\"kept\">Content</p>");
        });

        it("removes attributes missing from new props", () => {
            const node = render("p", { "id": "a", "title": "b", "--c": "d" });
            render(node, { id: "e" });
            expect(node.id).toBe("e");
            expect(node.hasAttribute("title")).toBe(false);
            expect(node.style.getPropertyValue("--c")).toBe("");
        });

        it("clears children with null or an empty array", () => {
            expect(render(render("p", "x"), null).outerHTML).toBe("<p></p>");
            expect(render(render("p", "x"), []).outerHTML).toBe("<p></p>");
        });
    });
});
