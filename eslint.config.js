import js from "@eslint/js";
import stylistic from "@stylistic/eslint-plugin";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
    {
        ignores: ["dist/", "coverage/", "node_modules/"],
    },
    js.configs.recommended,
    ...tseslint.configs.strict,
    stylistic.configs.customize({
        indent: 4,
        quotes: "double",
        semi: true,
        braceStyle: "stroustrup",
    }),
    {
        languageOptions: {
            globals: globals.browser,
        },
        rules: {
            "@stylistic/arrow-parens": ["error", "as-needed", { requireForBlockBody: true }],
            "@stylistic/space-before-function-paren": ["error", "always"],
        },
    },
    {
        files: ["examples/**/*.js"],
        rules: {
            "@typescript-eslint/no-unused-vars": "off",
        },
    },
);
