// @vitest-environment node
import { describe, expect, it } from "vitest";
import { reactive, unreactive } from "../src";

describe("without a DOM", () => {
    it("has no DOM globals", () => {
        expect(typeof document).toBe("undefined");
        expect(typeof Node).toBe("undefined");
    });

    it("reacts to value changes", () => {
        const data = { value: 42 };
        const log: unknown[][] = [];
        reactive(data, "value", (...args) => {
            log.push(args);
            return "result";
        });
        data.value = 1234;

        expect(log).toEqual([[42, undefined], [1234, "result"]]);
    });

    it("reacts to array changes", () => {
        const data = { list: [1] };
        const log: number[][] = [];
        reactive(data, "list", (values) => {
            log.push([...values]);
        });
        data.list.push(2);
        data.list = [3];

        expect(log).toEqual([[1], [1, 2], [3]]);
    });

    it("can stop reacting", () => {
        const data = { value: 1 };
        let calls = 0;
        reactive(data, "value", () => calls++);
        unreactive(data);
        data.value = 2;

        expect(calls).toBe(1);
    });

    it("throws on unknown props", () => {
        expect(() => reactive({}, "missing" as never, () => null)).toThrow(ReferenceError);
    });
});
