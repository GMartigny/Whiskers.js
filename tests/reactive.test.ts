import { describe, expect, it, vi } from "vitest";
import { reactive, render, unreactive } from "../src";

const listOf = <T>(data: { list: T[] }) => reactive(
    data,
    "list",
    (_, node?: HTMLUListElement) => node ?? render("ul"),
    item => render("li", String(item)),
);

describe("reactive value", () => {
    it("renders right away and on each change", () => {
        const data = { content: "Meow" };
        const node = reactive(data, "content", (value, el?: HTMLElement) => render(el ?? "div", value));

        expect(node.outerHTML).toBe("<div>Meow</div>");

        data.content = "Purrrrr !";
        expect(data.content).toBe("Purrrrr !");
        expect(node.outerHTML).toBe("<div>Purrrrr !</div>");
    });

    it("renders falsy values", () => {
        const data = { count: 0 };
        const node = reactive(data, "count", (value, el?: HTMLElement) => render(el ?? "span", value));
        expect(node.outerHTML).toBe("<span>0</span>");
    });

    it("passes the previous result to the callback", () => {
        const data = { value: 1 };
        const callback = vi.fn((value: number) => value * 10);
        reactive(data, "value", callback);
        data.value = 2;
        data.value = 3;

        expect(callback.mock.calls).toEqual([[1, undefined], [2, 10], [3, 20]]);
    });

    it("skips assignments of the same value", () => {
        const data = { value: 1, nan: Number.NaN };
        const callback = vi.fn();
        reactive(data, "value", callback);
        reactive(data, "nan", callback);
        data.value = 1;
        data.nan = Number.NaN;

        expect(callback).toHaveBeenCalledTimes(2);
    });

    it("observes several props of the same object", () => {
        const data = { a: 1, b: 1 };
        const a = reactive(data, "a", (value, el?: HTMLElement) => render(el ?? "i", value));
        const b = reactive(data, "b", (value, el?: HTMLElement) => render(el ?? "b", value));
        data.a = 2;
        data.b = 3;

        expect(a.outerHTML).toBe("<i>2</i>");
        expect(b.outerHTML).toBe("<b>3</b>");
    });

    it("supports several bindings on the same prop", () => {
        const data = { value: "a" };
        const first = vi.fn();
        const second = vi.fn();
        reactive(data, "value", first);
        reactive(data, "value", second);
        data.value = "b";

        expect(first).toHaveBeenLastCalledWith("b", undefined);
        expect(second).toHaveBeenLastCalledWith("b", undefined);
    });

    it("swaps the node in the DOM when the callback returns a new one", () => {
        const data = { tag: "b" as "b" | "i" };
        const parent = render("p", reactive(data, "tag", tag => render(tag, tag)));
        data.tag = "i";
        expect(parent.outerHTML).toBe("<p><i>i</i></p>");

        // Detached nodes are simply replaced
        const detached = reactive(data, "tag", tag => render(tag));
        data.tag = "b";
        expect(detached.outerHTML).toBe("<i></i>");
    });

    it("keeps the prop enumerable", () => {
        const data = { value: 1 };
        reactive(data, "value", () => null);
        expect(Object.keys(data)).toEqual(["value"]);
        expect(JSON.stringify(data)).toBe("{\"value\":1}");
    });

    it("works without DOM rendering (headless)", () => {
        const data = { value: 42 };
        const log: number[] = [];
        reactive(data, "value", (value) => {
            log.push(value);
        });
        data.value = 1234;
        expect(log).toEqual([42, 1234]);
    });

    it("throws on unknown props and getters", () => {
        class Cat {
            get name () {
                return "Felix";
            }
        }
        const getter = Object.defineProperty({}, "computed", { get: () => 1 }) as { computed: number };

        expect(() => reactive({} as { missing: number }, "missing", () => null)).toThrow(ReferenceError);
        expect(() => reactive(new Cat(), "name", () => null)).toThrow("[name] doesn't exist on [Cat]");
        expect(() => reactive(Object.create(null) as { x: 1 }, "x", () => null)).toThrow("on [Object]");
        expect(() => reactive(getter, "computed", () => null)).toThrow(TypeError);
    });
});

describe("reactive array", () => {
    it("calls the callback on each mutation without item render", () => {
        const data = { list: [1, 2] };
        const log: number[][] = [];
        reactive(data, "list", (values) => {
            log.push([...values]);
        });
        data.list.push(3);
        data.list.shift();
        data.list[0] = 9;
        data.list = [4];

        expect(log).toEqual([[1, 2], [1, 2, 3], [2, 3], [9, 3], [4]]);
    });

    it("renders items", () => {
        const app = listOf({ list: ["Guppy", "Puss in Boots"] });
        expect(app.outerHTML).toBe("<ul><li>Guppy</li><li>Puss in Boots</li></ul>");
    });

    it("handles a single number item", () => {
        const data = { list: [3] };
        const app = listOf(data);
        expect([...data.list]).toEqual([3]);
        expect(app.outerHTML).toBe("<ul><li>3</li></ul>");
    });

    it("clears content rendered by the container callback", () => {
        const data = { list: ["a"] };
        const app = reactive(data, "list", values => render("ul", values), item => render("li", item));
        expect(app.outerHTML).toBe("<ul><li>a</li></ul>");
    });

    it("follows every mutating method", () => {
        const data = { list: ["c", "a", "b"] };
        const app = listOf(data);
        const html = () => app.innerHTML.replaceAll("<li>", "").replaceAll("</li>", ",");

        const steps: [() => unknown, string][] = [
            [() => data.list.push("d", "e"), "c,a,b,d,e,"],
            [() => data.list.pop(), "c,a,b,d,"],
            [() => data.list.shift(), "a,b,d,"],
            [() => data.list.unshift("x", "y"), "x,y,a,b,d,"],
            [() => data.list.splice(1, 1, "z"), "x,z,a,b,d,"],
            [() => data.list.splice(-1, 1), "x,z,a,b,"],
            [() => data.list.splice(2), "x,z,"],
            [() => data.list.splice(1, 99, "w"), "x,w,"],
            [() => data.list.reverse(), "w,x,"],
            [() => data.list.sort(), "w,x,"],
            [() => data.list.fill("f"), "f,f,"],
            [() => data.list.copyWithin(0, 1), "f,f,"],
            [() => data.list[3] = "h", "f,f,undefined,h,"],
            [() => data.list.length = 1, "f,"],
            [() => delete data.list[0], "undefined,"],
            [() => data.list = [], ""],
            [() => data.list.unshift("Felix", "Kitty"), "Felix,Kitty,"],
        ];

        steps.forEach(([step, expected]) => {
            step();
            expect(html()).toBe(expected);
        });
    });

    it("returns the reactive array from chainable methods", () => {
        const data = { list: [2, 1] };
        listOf(data);
        expect(data.list.sort()).toBe(data.list);
        expect(data.list.reverse()).toBe(data.list);
        expect(data.list.filter(Boolean)).not.toBe(data.list);
        expect(Array.isArray(data.list)).toBe(true);
        expect(data.list.filter(Boolean).constructor).toBe(Array);
    });

    it("keeps item nodes when items move", () => {
        const data = { list: ["a", "b", "c"] };
        const app = listOf(data);
        const [a, b, c] = app.children;
        data.list.reverse();

        expect([...app.children]).toEqual([c, b, a]);
    });

    it("handles duplicated values", () => {
        const data = { list: [1, 1, 2] };
        const app = listOf(data);
        data.list.splice(0, 1);
        expect(app.innerHTML).toBe("<li>1</li><li>2</li>");
        data.list.push(1);
        expect(app.innerHTML).toBe("<li>1</li><li>2</li><li>1</li>");
    });

    it("only renders new items", () => {
        const data = { list: ["a"] };
        const itemRender = vi.fn((item: string) => render("li", item));
        reactive(data, "list", () => render("ul"), itemRender);
        data.list.push("b");
        data.list.sort();
        data.list = ["a", "b", "c"];

        expect(itemRender.mock.calls.map(([item]) => item)).toEqual(["a", "b", "c"]);
    });

    it("accepts text items", () => {
        const data = { list: ["a", "b"] };
        const app = reactive(data, "list", () => render("p"), item => `${item};`);
        data.list.push("c");
        expect(app.innerHTML).toBe("a;b;c;");

        const empty = reactive({ list: [1] }, "list", () => render("p"), () => null);
        expect(empty.childNodes).toHaveLength(1);
    });

    it("ignores unchanged assignments", () => {
        const data = { list: [1] };
        const callback = vi.fn();
        reactive(data, "list", callback);
        data.list[0] = 1;
        // eslint-disable-next-line no-self-assign
        data.list = data.list;
        delete (data.list as unknown as Record<string, unknown>).missing;

        expect(callback).toHaveBeenCalledOnce();
    });

    it("supports several bindings, even after reassignment", () => {
        const data = { list: ["x"] };
        const first = listOf(data);
        const second = listOf(data);
        data.list = ["y"];
        data.list.push("z");

        expect(first.innerHTML).toBe("<li>y</li><li>z</li>");
        expect(second.innerHTML).toBe("<li>y</li><li>z</li>");
    });

    it("ignores mutations of a replaced array", () => {
        const data = { list: ["p"] };
        const app = listOf(data);
        const old = data.list;
        data.list = ["q"];
        old.push("ghost");

        expect(app.innerHTML).toBe("<li>q</li>");
    });

    it("wraps an already reactive array without nesting proxies", () => {
        const source = { list: [1] };
        const target = { list: [] as number[] };
        listOf(source);
        const app = listOf(target);
        target.list = source.list;
        target.list.push(2);

        expect(app.innerHTML).toBe("<li>1</li><li>2</li>");
    });

    it("refuses non-array values when rendering items", () => {
        const data = { list: ["a"] as unknown };
        reactive(data as { list: string[] }, "list", () => render("ul"), item => item);

        expect(() => data.list = null).toThrow(TypeError);
        expect(() => reactive({ list: "a" } as unknown as { list: string[] }, "list", () => render("ul"), item => item))
            .toThrow(TypeError);
    });
});

describe("unreactive", () => {
    it("releases a single prop", () => {
        const data = { a: 1, b: [1] };
        const callback = vi.fn();
        reactive(data, "a", callback);
        reactive(data, "b", callback);
        unreactive(data, "a");
        data.a = 2;
        data.b.push(2);

        expect(callback).toHaveBeenCalledTimes(3);
        expect(Object.getOwnPropertyDescriptor(data, "a")).toEqual({
            value: 2,
            writable: true,
            enumerable: true,
            configurable: true,
        });
    });

    it("releases every prop and restores raw arrays", () => {
        const data = { a: 1, list: [1] };
        const callback = vi.fn();
        reactive(data, "a", callback);
        listOf(data);
        unreactive(data);
        data.a = 2;
        data.list.push(2);

        expect(callback).toHaveBeenCalledOnce();
        expect(data.list).toEqual([1, 2]);

        // Can be observed again
        reactive(data, "a", callback);
        data.a = 3;
        expect(callback).toHaveBeenLastCalledWith(3, undefined);
    });

    it("does nothing on unknown objects or props", () => {
        const data = { a: 1 };
        expect(() => unreactive(data)).not.toThrow();
        reactive(data, "a", () => null);
        expect(() => unreactive(data, "b" as "a")).not.toThrow();
    });
});
