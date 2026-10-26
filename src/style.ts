/**
 * Value of a CSS declaration. `null`, `undefined` and `false` are ignored, an array outputs one declaration per value.
 */
export type CSSValue = string | number | null | undefined | false;

/**
 * Nested CSS definition: keys are either properties (camelCase or kebab-case) or nested selectors and at-rules.
 */
export interface CSSDefinition {
    [key: string]: CSSValue | CSSValue[] | CSSDefinition;
}

const INDENT = "    ";

/**
 * Turn a camelCase property name into kebab-case (custom properties are left untouched)
 * @param property Property name
 */
const toKebabCase = (property: string): string => (property.startsWith("--")
    ? property
    : property.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`));

const isEmpty = (value: unknown): value is null | undefined | false => value === null || value === undefined || value === false;

/**
 * Turn a nested object into a CSS string, using native CSS nesting
 * @param styles CSS definition
 * @param depth Current nesting depth
 * @example
 * getCSS({
 *     ".app": {
 *         padding: "10px",
 *         backgroundColor: "#123",
 *     },
 * });
 */
export function getCSS (styles: CSSDefinition, depth = 0): string {
    const indent = INDENT.repeat(depth);
    const declarations: string[] = [];
    const blocks: string[] = [];

    Object.entries(styles).forEach(([key, value]) => {
        if (typeof value === "object" && value !== null && !Array.isArray(value)) {
            const content = getCSS(value, depth + 1);
            blocks.push(content ? `${indent}${key} {\n${content}\n${indent}}` : `${indent}${key} {}`);
        }
        else {
            [value].flat()
                .filter(item => !isEmpty(item))
                .forEach(item => declarations.push(`${indent}${toKebabCase(key)}: ${item};`));
        }
    });

    return [declarations.join("\n"), ...blocks].filter(Boolean).join("\n\n");
}

/**
 * Create a style element, or update an existing one
 * @param styles CSS definition or raw CSS string
 * @param element Style element to update
 * @example
 * document.head.appendChild(renderStyle({
 *     ".app": {
 *         padding: "10px",
 *     },
 * }));
 */
export function renderStyle (styles: CSSDefinition | string, element?: HTMLStyleElement): HTMLStyleElement {
    const style = element ?? document.createElement("style");
    style.textContent = typeof styles === "string" ? styles : getCSS(styles);

    return style;
}
