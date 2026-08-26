/**
 * Every token the package declares is settable through `Theme`.
 *
 * Not a style rule — a completeness one. A token that exists in `tokens.css` and has no way into
 * the theme API is customisable only by writing CSS that outranks the package, which works but is
 * not what a design system should ask of a consumer who is already holding a `Theme` object.
 *
 * This is derived from the stylesheet rather than a hand-kept list, so a token added tomorrow
 * without a matching field fails here instead of being discovered by whoever needed it.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { defineTheme } from "./define.js";
import { shapeToCss } from "./theme-provider.js";

const HERE = dirname(fileURLToPath(import.meta.url));
const TOKENS = readFileSync(join(HERE, "../styles/tokens.css"), "utf-8").replace(
  /\/\*[\s\S]*?\*\//g,
  "",
);

/** Every `--token:` declared in the stylesheet. */
function declaredTokens(): string[] {
  return [...new Set([...TOKENS.matchAll(/^\s*(--[a-z0-9-]+)\s*:/gim)].map((m) => m[1] ?? ""))];
}

/**
 * A theme that sets one distinctive value for every field the API exposes.
 *
 * Its emitted CSS is the proof: whatever token appears here is reachable from `Theme`.
 */
const EVERYTHING = defineTheme({
  name: "coverage",
  light: {},
  dark: {},
  radius: {
    none: "1px",
    sm: "1px",
    md: "1px",
    lg: "1px",
    xl: "1px",
    "2xl": "1px",
    full: "1px",
    DEFAULT: "1px",
  },
  spacing: "1px",
  space: {
    1: "1px",
    2: "1px",
    3: "1px",
    4: "1px",
    5: "1px",
    6: "1px",
    8: "1px",
    10: "1px",
    12: "1px",
    16: "1px",
    20: "1px",
    24: "1px",
    32: "1px",
  },
  shadows: { sm: "none", md: "none", lg: "none", glow: "none", "glow-strong": "none" },
  motion: {
    "duration-fast": "1ms",
    "duration-base": "1ms",
    "duration-slow": "1ms",
    "ease-out-soft": "linear",
    "ease-snap": "linear",
    "ease-in-out": "linear",
    stagger: "1ms",
  },
});

/**
 * Tokens that reach the page through a different door, and why each one does.
 *
 * Colour and font tokens are emitted by `colorScaleToCss` and `fontsToCss`, not by `shapeToCss`,
 * so they are covered by the theme without appearing in the CSS this test inspects. Listing the
 * prefixes rather than the names keeps a new colour token covered automatically — the colour scale
 * is typed, so adding one without a field is already a type error.
 */
const EMITTED_ELSEWHERE = ["--font-", "--color-"];

/** Colour tokens, by name, all of which `ColorScale` carries. */
const COLOR_TOKENS =
  /^--(background|foreground|card|popover|primary|secondary|accent|muted|border|input|ring|success|warning|destructive|info|status)/;

describe("token coverage", () => {
  it("has tokens to check", () => {
    expect(declaredTokens().length).toBeGreaterThan(60);
  });

  it("every declared token is settable through Theme", () => {
    const css = shapeToCss(EVERYTHING);
    const shapeTokens = new Set(
      [...css.matchAll(/^\s*(--[a-z0-9-]+)\s*:/gim)].map((m) => m[1] ?? ""),
    );

    const unreachable = declaredTokens().filter((token) => {
      if (shapeTokens.has(token)) return false;
      if (COLOR_TOKENS.test(token)) return false;
      if (EMITTED_ELSEWHERE.some((p) => token.startsWith(p))) return false;
      return true;
    });

    expect(unreachable, "these are declared but cannot be set through Theme").toEqual([]);
  });

  it("the space scale really is emitted, not just accepted", () => {
    const css = shapeToCss(EVERYTHING);

    expect(css).toContain("--space-1: 1px;");
    expect(css).toContain("--space-32: 1px;");
    expect(css).toContain("--stagger: 1ms;");
  });
});
