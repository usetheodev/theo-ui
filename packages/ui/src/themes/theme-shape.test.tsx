/**
 * A theme can change shape, not only colour — usetheokit/theokit-ui#88 and its follow-up.
 *
 * Until the radii deferred to runtime variables, `defineTheme` could only move colour and three
 * font families: everything about the *form* of the UI — corners, rhythm, elevation, motion — was
 * fixed at build time. These tests cover the surface that opened up, and the validation that has
 * to come with it, because every value here is interpolated into a `<style>` element.
 */
import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { defineTheme } from "./define.js";
import { ThemeProvider } from "./theme-provider.js";
import { violetForge } from "./violet-forge.js";

afterEach(cleanup);

const STYLE_ID = "theo-ui-theme-vars";

/** The CSS the provider injected, as text. */
function injectedCss(): string {
  return document.getElementById(STYLE_ID)?.textContent ?? "";
}

function mount(theme: ReturnType<typeof defineTheme>): void {
  render(
    <ThemeProvider themes={[theme]} defaultTheme={theme.name}>
      <div />
    </ThemeProvider>,
  );
}

describe("defineTheme carries shape", () => {
  it("keeps the fields it was given", () => {
    const theme = defineTheme({
      name: "square",
      radius: { none: "0px", sm: "0px", DEFAULT: "0px" },
      spacing: "3px",
      shadows: { sm: "none" },
      motion: { "duration-base": "80ms", "ease-snap": "linear" },
    });

    expect(theme.radius).toEqual({ none: "0px", sm: "0px", DEFAULT: "0px" });
    expect(theme.spacing).toBe("3px");
    expect(theme.shadows).toEqual({ sm: "none" });
    expect(theme.motion).toEqual({ "duration-base": "80ms", "ease-snap": "linear" });
  });

  it("leaves them undefined when unset, rather than inventing empty objects", () => {
    const theme = defineTheme({ name: "plain", light: {}, dark: {} });

    expect(theme.radius).toBeUndefined();
    expect(theme.spacing).toBeUndefined();
    expect(theme.shadows).toBeUndefined();
    expect(theme.motion).toBeUndefined();
  });

  it("does NOT inherit shape from Violet Forge — a square theme stays square", () => {
    // Colour inherits because a partial palette is not a palette. Shape is a set of independent
    // adjustments: inheriting them would make "I want square corners" also adopt another theme's
    // spacing and elevation.
    const theme = defineTheme({ name: "square", radius: { DEFAULT: "0px" } });

    expect(theme.radius).toEqual({ DEFAULT: "0px" });
    expect(theme.spacing).toBeUndefined();
    expect(theme.light.background).toBe(violetForge.light.background);
  });
});

describe("ThemeProvider emits shape into the page", () => {
  it("writes each radius as the variable the Tailwind namespace defers to", () => {
    mount(defineTheme({ name: "square", radius: { sm: "0px", xl: "2px", DEFAULT: "1px" } }));
    const css = injectedCss();

    expect(css).toContain("--radius-sm: 0px;");
    expect(css).toContain("--radius-xl: 2px;");
    // `DEFAULT` is the shadcn-compatible `--radius`, not `--radius-DEFAULT`.
    expect(css).toContain("--radius: 1px;");
    expect(css).not.toContain("--radius-DEFAULT");
  });

  it("writes the spacing base, which every p-*/gap-*/m-* utility multiplies", () => {
    mount(defineTheme({ name: "tight", spacing: "3px" }));

    expect(injectedCss()).toContain("--spacing: 3px;");
  });

  it("writes shadows and motion", () => {
    mount(
      defineTheme({
        name: "flat",
        shadows: { sm: "none", md: "none" },
        motion: { "duration-fast": "60ms", "ease-out-soft": "linear" },
      }),
    );
    const css = injectedCss();

    expect(css).toContain("--shadow-sm: none;");
    expect(css).toContain("--duration-fast: 60ms;");
    expect(css).toContain("--ease-out-soft: linear;");
  });

  it("emits shape once, outside the light/dark split — a rounder theme is rounder in both", () => {
    mount(defineTheme({ name: "round", radius: { DEFAULT: "20px" } }));
    const css = injectedCss();

    expect(css.match(/--radius: 20px;/g)).toHaveLength(1);
    expect(css).toContain('[data-theme="round"] {');
  });

  it("adds no rule at all when a theme declares no shape", () => {
    mount(defineTheme({ name: "colour-only", light: {}, dark: { primary: "#123456" } }));
    const css = injectedCss();

    expect(css).not.toContain("--radius");
    expect(css).not.toContain("--spacing:");
  });

  it("stays inside @layer theme, so a consumer's own CSS still outranks it", () => {
    mount(defineTheme({ name: "square", radius: { DEFAULT: "0px" } }));
    const css = injectedCss();

    // The radius block must be inside the layer, not appended after it.
    const layerStart = css.indexOf("@layer theme {");
    expect(layerStart).toBeGreaterThanOrEqual(0);
    expect(css.indexOf("--radius: 0px;")).toBeGreaterThan(layerStart);
  });
});
