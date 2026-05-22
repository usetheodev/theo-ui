import { describe, expect, it } from "vitest";
import { defineTheme } from "./define.js";
import { violetForge } from "./violet-forge.js";

describe("defineTheme", () => {
  it("returns a complete Theme when given only a name (all keys inherit violetForge)", () => {
    const theme = defineTheme({ name: "corp" });
    expect(theme.name).toBe("corp");
    expect(theme.label).toBe("Corp");
    expect(theme.light).toEqual(violetForge.light);
    expect(theme.dark).toEqual(violetForge.dark);
    expect(theme.fonts).toEqual(violetForge.fonts);
  });

  it("merges a partial light override into violetForge.light", () => {
    const theme = defineTheme({
      name: "red",
      light: { primary: "0 100% 50%" },
    });
    expect(theme.light.primary).toBe("0 100% 50%");
    // Untouched keys inherit from violetForge.
    expect(theme.light.foreground).toBe(violetForge.light.foreground);
    expect(theme.light.background).toBe(violetForge.light.background);
  });

  it("dark inherits violetForge.dark when only light is overridden", () => {
    const theme = defineTheme({
      name: "red",
      light: { primary: "0 100% 50%" },
    });
    expect(theme.dark).toEqual(violetForge.dark);
  });

  it("merges fonts partials independently of light/dark", () => {
    const theme = defineTheme({
      name: "mono",
      fonts: { mono: '"Custom Mono", monospace' },
    });
    expect(theme.fonts.mono).toBe('"Custom Mono", monospace');
    expect(theme.fonts.body).toBe(violetForge.fonts.body);
    expect(theme.fonts.display).toBe(violetForge.fonts.display);
  });

  it("throws when name is empty", () => {
    expect(() => defineTheme({ name: "" })).toThrow(/name.*required/);
  });

  it("throws when name contains invalid characters", () => {
    expect(() => defineTheme({ name: "my theme" })).toThrow(/invalid name/);
    expect(() => defineTheme({ name: "corp/dark" })).toThrow(/invalid name/);
  });

  it("derives label from name (capitalized) when label is omitted", () => {
    expect(defineTheme({ name: "foo" }).label).toBe("Foo");
    expect(defineTheme({ name: "corp-dark" }).label).toBe("Corp-dark");
  });

  it("uses explicit label when provided", () => {
    expect(defineTheme({ name: "foo", label: "My Foo" }).label).toBe("My Foo");
  });

  // EC-3: nome conflitando com built-in. ThemeProvider dedup keeps the
  // last writer; defineTheme returns a fresh object, so the caller can
  // intentionally override violetForge by passing the same name.
  it("overrides a built-in theme when the same name is reused (last-writer-wins)", () => {
    const overridden = defineTheme({
      name: "violet-forge",
      light: { primary: "0 0% 0%" },
    });
    expect(overridden.name).toBe(violetForge.name);
    expect(overridden.light.primary).toBe("0 0% 0%");
    // All other keys still resolve from violetForge — this is the intended
    // partial-override behavior.
    expect(overridden.light.foreground).toBe(violetForge.light.foreground);
  });
});
