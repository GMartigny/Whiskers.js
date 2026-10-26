import { defineConfig } from "tsdown";

export default defineConfig({
    entry: "src/index.ts",
    format: "esm",
    platform: "browser",
    target: "es2022",
    dts: true,
    minify: true,
    treeshake: {
        // Props reads never have side effects in this library
        propertyReadSideEffects: false,
    },
    sourcemap: true,
    clean: true,
    publint: true,
    attw: { profile: "esm-only" },
});
