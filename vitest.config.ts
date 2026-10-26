import { defineConfig } from "vitest/config";

export default defineConfig({
    test: {
        environment: "happy-dom",
        include: ["tests/**/*.test.ts"],
        coverage: {
            provider: "v8",
            include: ["src/**/*.ts"],
            reporter: ["text", "html", "lcov"],
            thresholds: {
                100: true,
            },
        },
    },
});
