import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
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

/**
 * One-sided themes — usetheokit/theokit-ui#81.
 *
 * A theme that defines only `dark` is a valid `Theme` and passes every gate, but it renders as
 * Violet Forge for every visitor whose system is set to light — which `ThemeProvider` follows by
 * default. The failure is total (background, accent, brand) and completely silent, so the only
 * place it can be caught cheaply is here, at authoring time.
 */
describe("defineTheme warns about a mode omitted entirely", () => {
  let warn: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
  });

  afterEach(() => {
    warn.mockRestore();
  });

  it("warns when dark is painted and light is absent", () => {
    defineTheme({ name: "desk", dark: { background: "#131314", primary: "#a8c7fa" } });

    expect(warn).toHaveBeenCalledTimes(1);
    const message = String(warn.mock.calls[0]?.[0]);
    expect(message).toContain("desk");
    expect(message).toContain("light");
    expect(message).toContain("Violet Forge");
  });

  it("warns symmetrically when light is painted and dark is absent", () => {
    defineTheme({ name: "paper", light: { background: "#f5f1e8" } });

    expect(warn).toHaveBeenCalledTimes(1);
    expect(String(warn.mock.calls[0]?.[0])).toContain("dark");
  });

  it("counts the overridden keys, so the message states the size of what is lost", () => {
    defineTheme({ name: "desk", dark: { background: "#000", primary: "#fff", ring: "#f00" } });

    expect(String(warn.mock.calls[0]?.[0])).toContain("3 dark-mode colours");
  });

  it("stays silent when an empty object declares the inheritance deliberate", () => {
    defineTheme({ name: "desk", dark: { background: "#131314" }, light: {} });

    expect(warn).not.toHaveBeenCalled();
  });

  it("stays silent when both modes are defined", () => {
    defineTheme({ name: "corp", light: { primary: "#0ea5e9" }, dark: { primary: "#38bdf8" } });

    expect(warn).not.toHaveBeenCalled();
  });

  it("stays silent for a name-only alias of violetForge — nothing was lost", () => {
    defineTheme({ name: "alias" });

    expect(warn).not.toHaveBeenCalled();
  });

  it("stays silent when the given side overrides nothing", () => {
    defineTheme({ name: "empty", dark: {} });

    expect(warn).not.toHaveBeenCalled();
  });

  it("still returns a usable theme — the warning does not change the merge", () => {
    const theme = defineTheme({ name: "desk", dark: { background: "#131314" } });

    expect(theme.dark.background).toBe("#131314");
    expect(theme.light.background).toBe(violetForge.light.background);
  });
});
