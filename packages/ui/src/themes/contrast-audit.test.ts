/**
 * Auditing a whole colour scale, and keeping the runtime list identical to the build gate's.
 *
 * The pair list is duplicated on purpose — importing it from `scripts/` would pull `culori` into
 * every consumer's bundle. Duplication that nothing checks becomes divergence, so the last test
 * here reads the build gate's source and asserts the two lists agree. If somebody adds a pair to
 * one, this fails rather than letting an editor bless a theme the build would reject.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { CONTRAST_PAIRS, WCAG_AA, auditColorScale } from "./contrast.js";
import { violetForge } from "./violet-forge.js";

describe("auditColorScale", () => {
  it("passes a built-in theme, in both modes", () => {
    for (const mode of ["light", "dark"] as const) {
      const failures = auditColorScale(violetForge[mode]).filter((f) => !f.passes);
      expect(failures, `${mode} mode should have no failing pair`).toEqual([]);
    }
  });

  it("reports every pair, not only the failures — a slider needs to show the approach", () => {
    const findings = auditColorScale(violetForge.dark);

    expect(findings).toHaveLength(CONTRAST_PAIRS.length);
    for (const finding of findings) {
      expect(finding.ratio).not.toBeNull();
      expect(finding.level).not.toBe("unreadable");
    }
  });

  it("catches the failure that shipped in a real product", () => {
    // accent used as a surface grey, so `text-accent` lands on `bg-accent`: 1.61:1.
    const scale = { ...violetForge.dark, accent: "#2f3134", "accent-foreground": "#2b2c2e" };
    const accent = auditColorScale(scale).find((f) => f.background === "accent");

    expect(accent?.passes).toBe(false);
    expect(accent?.ratio ?? 0).toBeLessThan(WCAG_AA.largeText);
  });

  it("treats an unreadable colour as failing, never as passing", () => {
    const scale = { ...violetForge.dark, background: "var(--something)" };
    const finding = auditColorScale(scale).find((f) => f.background === "background");

    expect(finding?.ratio).toBeNull();
    expect(finding?.level).toBe("unreadable");
    expect(finding?.passes).toBe(false);
  });

  it("treats a missing token as failing too", () => {
    const scale: Record<string, string | undefined> = { ...violetForge.dark, card: undefined };
    const finding = auditColorScale(scale).find((f) => f.background === "card");

    expect(finding?.passes).toBe(false);
  });
});

describe("the runtime pair list matches the build gate", () => {
  it("covers exactly the pairs scripts/validate-contrast.ts checks", () => {
    const source = readFileSync(
      join(dirname(fileURLToPath(import.meta.url)), "../../scripts/validate-contrast.ts"),
      "utf-8",
    );

    /** Reads `["a", "b"],` tuples out of the named const block. */
    const pairsIn = (constName: string): string[] => {
      const start = source.indexOf(`const ${constName} = [`);
      expect(start, `${constName} should exist in the build gate`).toBeGreaterThan(-1);
      const block = source.slice(start, source.indexOf("] as const", start));
      return [...block.matchAll(/\["([\w-]+)",\s*"([\w-]+)"\]/g)].map((m) => `${m[1]} vs ${m[2]}`);
    };

    const gate = new Set([...pairsIn("BODY_PAIRS"), ...pairsIn("LARGE_PAIRS")]);
    const runtime = new Set(CONTRAST_PAIRS.map((p) => `${p.foreground} vs ${p.background}`));

    expect([...runtime].sort()).toEqual([...gate].sort());
  });

  it("holds each pair to the same threshold the build gate uses", () => {
    const body = new Set(["foreground vs background", "card-foreground vs card", "popover-foreground vs popover"]);

    for (const pair of CONTRAST_PAIRS) {
      const key = `${pair.foreground} vs ${pair.background}`;
      expect(pair.minimum, key).toBe(body.has(key) ? WCAG_AA.normalText : WCAG_AA.largeText);
    }
  });
})
