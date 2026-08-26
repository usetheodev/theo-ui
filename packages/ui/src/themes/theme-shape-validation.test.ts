/**
 * Shape values are validated before they become CSS.
 *
 * They reach the page as `<style>` text, exactly like colours do, so they need the same allowlist
 * and for the same reason the colour one exists (T3.2 / SEC-001): a theme object can arrive from a
 * feature flag or a CMS, and a value that closes the declaration with `}` writes arbitrary rules
 * into the document.
 *
 * Tested against `shapeToCss` rather than a mounted provider. When validation throws mid-render,
 * React is left working and testing-library's automatic `cleanup` throws "Should not already be
 * working" over the top — the assertion then reports a React error instead of the rejection, and
 * points at whichever test ran next. The behaviour here is a pure function of its input, so it is
 * tested as one.
 */
import { describe, expect, it } from "vitest";

import { shapeToCss } from "./theme-provider.js";
import { defineTheme } from "./define.js";

describe("shapeToCss rejects values that would escape the declaration", () => {
  it("rejects a radius that closes the rule and opens its own", () => {
    const theme = defineTheme({ name: "evil", radius: { DEFAULT: "0px } html { display: none; " } });

    expect(() => shapeToCss(theme)).toThrow(/invalid length/i);
  });

  it("rejects a spacing base carrying a second declaration", () => {
    const theme = defineTheme({ name: "evil", spacing: "4px; --primary: red" });

    expect(() => shapeToCss(theme)).toThrow(/invalid length/i);
  });

  it("rejects url() in a shadow — the exfiltration route the colour allowlist also blocks", () => {
    const theme = defineTheme({ name: "evil", shadows: { md: "0 0 1px url(https://evil.test/x)" } });

    expect(() => shapeToCss(theme)).toThrow(/invalid shadow/i);
  });

  it("rejects an easing that is not one", () => {
    const theme = defineTheme({ name: "evil", motion: { "ease-snap": "javascript:1" } });

    expect(() => shapeToCss(theme)).toThrow(/invalid easing/i);
  });

  it("rejects a theme name that would break out of the attribute selector", () => {
    const theme = { ...defineTheme({ name: "ok", radius: { sm: "2px" } }), name: 'x"] { color: red' };

    expect(() => shapeToCss(theme)).toThrow(/invalid theme\.name/i);
  });
});

describe("shapeToCss accepts the CSS these fields exist to carry", () => {
  it("takes lengths, functions and keywords", () => {
    const theme = defineTheme({
      name: "fine",
      radius: { DEFAULT: "0.5rem", full: "9999px", none: "0" },
      spacing: "clamp(2px, 0.25vw, 6px)",
      shadows: { md: "0 2px 8px -2px rgb(0 0 0 / 0.2)", sm: "none" },
      motion: { "duration-base": "200ms", "ease-snap": "cubic-bezier(0.2, 0, 0, 1)" },
    });

    const css = shapeToCss(theme);

    expect(css).toContain("--radius: 0.5rem;");
    expect(css).toContain("--radius-full: 9999px;");
    expect(css).toContain("--spacing: clamp(2px, 0.25vw, 6px);");
    expect(css).toContain("--shadow-md: 0 2px 8px -2px rgb(0 0 0 / 0.2);");
    expect(css).toContain("--shadow-sm: none;");
    expect(css).toContain("--duration-base: 200ms;");
    expect(css).toContain("--ease-snap: cubic-bezier(0.2, 0, 0, 1);");
  });

  it("returns nothing when a theme declares no shape, so no empty rule is injected", () => {
    expect(shapeToCss(defineTheme({ name: "colour-only", light: {}, dark: {} }))).toBe("");
  });
});
