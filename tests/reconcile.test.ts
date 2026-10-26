import { describe, expect, it, vi } from "vitest";
import { reactive, render } from "../src";

const setup = (list: number[]) => {
    const data = { list };
    const itemRender = vi.fn((item: number) => render("li", String(item)));
    const app = reactive(data, "list", () => render("ul"), itemRender);
    const spies = {
        insert: vi.spyOn(app, "insertBefore"),
        remove: vi.spyOn(app, "removeChild"),
    };
    return { data, app, itemRender, spies };
};

const range = (size: number) => Array.from({ length: size }, (_, index) => index);
const text = (app: Element) => [...app.children].map(child => child.textContent);

describe("list updates only touch what changed", () => {
    it("doesn't inspect the nodes of unchanged items", () => {
        const { data } = setup(range(1000));
        const nextSibling = vi.spyOn(Node.prototype, "nextSibling", "get");
        const parentNode = vi.spyOn(Node.prototype, "parentNode", "get");
        data.list.push(1000);
        data.list.pop();
        data.list.shift();
        data.list.unshift(-1);

        // Looking at every node would cost thousands of reads
        expect(nextSibling.mock.calls.length + parentNode.mock.calls.length).toBeLessThan(50);
        nextSibling.mockRestore();
        parentNode.mockRestore();
    });

    it("push", () => {
        const { data, app, itemRender, spies } = setup(range(1000));
        itemRender.mockClear();
        data.list.push(1000);

        expect(itemRender).toHaveBeenCalledTimes(1);
        expect(spies.insert).toHaveBeenCalledTimes(1);
        expect(spies.remove).not.toHaveBeenCalled();
        expect(app.children).toHaveLength(1001);
        expect(app.lastElementChild?.textContent).toBe("1000");
    });

    it("pop", () => {
        const { data, app, itemRender, spies } = setup(range(1000));
        itemRender.mockClear();
        data.list.pop();

        expect(itemRender).not.toHaveBeenCalled();
        expect(spies.insert).not.toHaveBeenCalled();
        expect(spies.remove).toHaveBeenCalledTimes(1);
        expect(app.children).toHaveLength(999);
    });

    it("shift", () => {
        const { data, app, itemRender, spies } = setup(range(1000));
        const second = app.children[1];
        itemRender.mockClear();
        data.list.shift();

        expect(itemRender).not.toHaveBeenCalled();
        expect(spies.insert).not.toHaveBeenCalled();
        expect(spies.remove).toHaveBeenCalledTimes(1);
        expect(app.firstElementChild).toBe(second);
    });

    it("unshift", () => {
        const { data, app, itemRender, spies } = setup(range(1000));
        itemRender.mockClear();
        data.list.unshift(-1);

        expect(itemRender).toHaveBeenCalledTimes(1);
        expect(spies.insert).toHaveBeenCalledTimes(1);
        expect(spies.remove).not.toHaveBeenCalled();
        expect(app.firstElementChild?.textContent).toBe("-1");
    });

    it("splice in the middle", () => {
        const { data, app, itemRender, spies } = setup(range(1000));
        itemRender.mockClear();
        data.list.splice(500, 1, 5000);

        expect(itemRender).toHaveBeenCalledTimes(1);
        expect(spies.insert).toHaveBeenCalledTimes(1);
        expect(spies.remove).toHaveBeenCalledTimes(1);
        expect(app.children[500]?.textContent).toBe("5000");
        expect(app.children).toHaveLength(1000);
    });

    it("does nothing when the same items are assigned", () => {
        const { data, itemRender, spies } = setup(range(100));
        itemRender.mockClear();
        data.list = range(100);

        expect(itemRender).not.toHaveBeenCalled();
        expect(spies.insert).not.toHaveBeenCalled();
        expect(spies.remove).not.toHaveBeenCalled();
    });
});

describe("list updates stay correct", () => {
    it("matches the data after random operations", () => {
        // Small seeded generator, so a failure is reproducible
        let seed = 42;
        const random = (max: number) => {
            seed = (seed * 1664525 + 1013904223) % 4294967296;
            return Math.floor((seed / 4294967296) * max);
        };

        const { data, app } = setup([1, 2, 3, 4, 5]);
        const operations: (() => unknown)[] = [
            () => data.list.push(random(8), random(8)),
            () => data.list.pop(),
            () => data.list.shift(),
            () => data.list.unshift(random(8), random(8)),
            () => data.list.splice(random(data.list.length + 2) - 1, random(4), random(8), random(8)),
            () => data.list.sort((a, b) => a - b),
            () => data.list.reverse(),
            () => data.list.fill(random(8), random(4), random(6)),
            () => data.list[random(data.list.length + 1)] = random(8),
            () => data.list.length = random(data.list.length + 1),
            () => data.list = Array.from({ length: random(8) }, () => random(8)),
        ];

        for (let step = 0; step < 1000; step++) {
            operations[random(operations.length)]?.();
            expect(text(app), `step ${step}`).toEqual([...data.list].map(String));
        }
    });

    it("keeps the nodes of unchanged items when edges change", () => {
        const { data, app } = setup([1, 2, 3, 4]);
        const [, two, three] = app.children;
        data.list.splice(0, 1);
        data.list.pop();

        expect([...app.children]).toEqual([two, three]);
    });
});
