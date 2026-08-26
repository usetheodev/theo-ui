/**
 * Every `@theme` token must point at a runtime variable, not carry a literal.
 *
 * Regression: usetheokit/theokit-ui#88.
 *
 * `tokens-v4.css` declares the Tailwind v4 `@theme` namespace, and the whole file is built on one
 * rule: each entry aliases BACK to the runtime variable that `<ThemeProvider>` and `[data-theme]`
 * mutate. `--color-primary: var(--primary)` is what keeps a theme switch working, because Tailwind
 * emits the token's value verbatim into the utility — so a token holding `var(...)` produces a
 * utility that reads the cascade at paint time.
 *
 * The radii broke that rule with literals, under a comment asserting Tailwind v4 "reads the value
 * directly". It does not; it reads whatever the token says. The cost was measurable and total:
 * `.rounded-xl` compiled to `border-radius: 14px`, so the documented `--radius-*` variables were
 * inert — a consumer could set them and nothing moved. Radius became the only token in the set a
 * theme could not change.
 *
 * This reads the stylesheet as text for the same reason `token-override.test.ts` does: the defect
 * is a property of the emitted CSS. jsdom resolves no custom properties across sheets, so a DOM
 * test here would pass whatever the file said.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const STYLES_DIR = dirname(fileURLToPath(import.meta.url));
const V4 = readFileSync(join(STYLES_DIR, "tokens-v4.css"), "utf-8");

/** Strips comments, so prose quoting a token is never read as a declaration. */
function withoutComments(css: string): string {
  return css.replace(/\/\*[\s\S]*?\*\//g, "");
}

/** Every `--token: value;` declaration in the file, comments removed. */
function declarations(): Map<string, string> {
  const found = new Map<string, string>();
  for (const line of withoutComments(V4).split("\n")) {
    const match = /^\s*(--[a-z0-9-]+)\s*:\s*([^;]+);/i.exec(line);
    if (match?.[1] !== undefined && match[2] !== undefined) found.set(match[1], match[2].trim());
  }
  return found;
}

/**
 * Families whose values are genuinely static, and why each one is exempt.
 *
 * A token is listed here because there is nothing at runtime for it to point at — not because
 * pointing at something would be inconvenient. Anything outside this list is expected to defer.
 */
const STATIC_FAMILIES = [
  // Type scale: sizes, line-heights and weights, fixed by the typographic system rather than
  // by the theme. `--font-*` families (the part a theme does change) live in tokens.css.
  "--text-",
  // Breakpoints and container sizes: layout structure, not appearance.
  "--breakpoint-",
  "--container-",
  // Keyframe names and animation shorthands reference `@keyframes` blocks by name.
  "--animate-",
];

const isStatic = (token: string): boolean => STATIC_FAMILIES.some((p) => token.startsWith(p));

describe("tokens-v4.css — @theme entries defer to runtime variables", () => {
  it("every radius token defers, so a theme can change the corners", () => {
    const decls = declarations();
    const radii = [...decls.keys()].filter((t) => t.startsWith("--radius"));

    expect(radii.length).toBeGreaterThan(4);
    for (const token of radii) {
      expect(decls.get(token), `${token} must defer to a runtime variable, not hold a literal`).toMatch(
        /^var\(--/,
      );
    }
  });

  it("no appearance token holds a literal — the rule the radii used to break", () => {
    const decls = declarations();
    const literals = [...decls.entries()]
      .filter(([token]) => !isStatic(token))
      .filter(([, value]) => !value.startsWith("var("))
      .map(([token, value]) => `${token}: ${value}`);

    expect(literals, "these cannot be changed at runtime by a theme").toEqual([]);
  });

  it("the families that already deferred still do — this is the pattern being generalised", () => {
    const decls = declarations();

    expect(decls.get("--color-primary")).toBe("var(--primary)");
    expect(decls.get("--shadow-md")).toBe("var(--shadow-md)");
    expect(decls.get("--ease-out-soft")).toBe("var(--ease-out-soft)");
  });
});
