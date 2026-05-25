import { describe, expect, it } from "vitest";
import preset from "./preset-v3-legacy.js";

describe("preset-v3-legacy — Tailwind v3 JS preset default-export shape", () => {
  it("is a plain object (not a function, not an array)", () => {
    expect(preset).toBeTypeOf("object");
    expect(preset).not.toBeNull();
    expect(Array.isArray(preset)).toBe(false);
  });

  it("declares a `content` field covering the published artifact tree", () => {
    expect(Array.isArray(preset.content)).toBe(true);
    const content = preset.content as string[];
    expect(
      content.some(
        (p) => p.includes("node_modules/@usetheo/ui/dist") && p.match(/\{?(js|mjs|cjs)/),
      ),
    ).toBe(true);
  });

  it("declares `theme.extend.colors.primary` so `bg-primary` is emittable", () => {
    expect(preset.theme).toBeTypeOf("object");
    const extend = (preset.theme as { extend?: Record<string, unknown> }).extend;
    expect(extend).toBeDefined();
    const colors = extend?.colors as Record<string, unknown>;
    expect(colors.primary).toBeDefined();
  });

  it("declares `theme.extend.colors.muted.foreground` for utility tokens", () => {
    const extend = (preset.theme as { extend?: Record<string, unknown> }).extend;
    const colors = extend?.colors as Record<string, { foreground?: unknown } | unknown>;
    const muted = colors.muted as { foreground?: unknown };
    expect(muted.foreground).toBeDefined();
  });

  it("declares `theme.extend.fontFamily` (display + sans + mono)", () => {
    const extend = (preset.theme as { extend?: Record<string, unknown> }).extend;
    const fontFamily = extend?.fontFamily as Record<string, unknown>;
    expect(fontFamily.display).toBeDefined();
    expect(fontFamily.sans).toBeDefined();
    expect(fontFamily.mono).toBeDefined();
  });

  it("declares the Violet Forge typescale fontSize tiers", () => {
    const extend = (preset.theme as { extend?: Record<string, unknown> }).extend;
    const fontSize = extend?.fontSize as Record<string, unknown>;
    expect(fontSize["body-md"]).toBeDefined();
    expect(fontSize["display-2xl"]).toBeDefined();
    expect(fontSize.headline).toBeDefined();
  });

  it("declares animations the components rely on (fade-in-up, pulse-glow)", () => {
    const extend = (preset.theme as { extend?: Record<string, unknown> }).extend;
    const animation = extend?.animation as Record<string, unknown>;
    expect(animation["fade-in-up"]).toBeDefined();
    expect(animation["pulse-glow"]).toBeDefined();
  });

  it("ships the tailwindcss-animate plugin (components rely on it)", () => {
    expect(Array.isArray(preset.plugins)).toBe(true);
    expect((preset.plugins as unknown[]).length).toBeGreaterThan(0);
  });
});
