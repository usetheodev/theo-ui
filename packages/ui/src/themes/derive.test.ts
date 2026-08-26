/**
 * A derived palette must pass the audit by construction, not by luck.
 *
 * This is the whole claim of `deriveColorScale`, and the only way to test it honestly is a sweep:
 * one convenient seed passing proves nothing, because the failure mode is a hue or a lightness the
 * author happened not to try. Yellow at high chroma and a near-black seed are the two that break
 * naive derivations — the first because it is bright at every lightness a brand would want, the
 * second because there is no room left to darken.
 */
import { describe, expect, it } from "vitest";

import { WCAG_AA, auditColorScale, contrastRatio } from "./contrast.js";
import { deriveColorScale, toOklch } from "./derive.js";
import type { ThemeMode } from "./types.js";

/** A spread of hues plus the awkward cases, in the notations a consumer actually pastes. */
const SEEDS = [
  "#8ab4f8", // the desk's blue
  "#DE2329", // the TheoKit falcon red
  "#7C3AED", // violet
  "#facc15", // yellow — bright at every useful lightness
  "#10b981", // green
  "#ec4899", // pink
  "#0f172a", // near-black, nothing left to darken
  "#f8fafc", // near-white, nothing left to lighten
  "oklch(0.7 0.2 30)",
  "rgb(34, 197, 94)",
  // The one that actually exercises the lightness walk. Measured, not guessed: with the near-black
  // and near-white candidates this file uses, no text colour clears 4.5:1 against a surface in
  // L 0.555–0.590 — so a derivation that only picked between the two would fail here, and one that
  // moves the surface passes. Disabling the walk turns this case red and leaves the rest green.
  "oklch(0.585 0.15 0)",
];

const MODES: ThemeMode[] = ["light", "dark"];

describe("deriveColorScale passes the audit for every seed", () => {
  for (const seed of SEEDS) {
    for (const mode of MODES) {
      it(`${seed} in ${mode}`, () => {
        const scale = deriveColorScale({ seed, mode });
        expect(scale, `${seed} should be readable`).not.toBeNull();

        const failures = auditColorScale(scale ?? {}).filter((f) => !f.passes);
        const detail = failures
          .map(
            (f) =>
              `${f.foreground}/${f.background} ${String(f.ratio?.toFixed(2))} < ${String(f.minimum)}`,
          )
          .join("; ");

        expect(failures, detail).toEqual([]);
      });
    }
  }
});

describe("deriveColorScale clears the bar with room, not by a hundredth", () => {
  /**
   * The audit holds `primary` to the large-text threshold (3:1), a convention inherited for judging
   * hand-written themes. A DERIVED palette should do better, because the surface it is deriving
   * carries button labels and a label is normal-sized text.
   *
   * Asserting the internal target rather than the audit's floor is also the only way this suite
   * sees the lightness walk: at 3:1 there is no lightness where neither near-black nor near-white
   * reads, so a derivation that never moved a surface would still pass an audit-based test. It
   * fails this one.
   */
  const LABEL_SURFACES = [
    ["primary-foreground", "primary"],
    ["secondary-foreground", "secondary"],
    ["destructive-foreground", "destructive"],
    ["success-foreground", "success"],
    ["warning-foreground", "warning"],
    ["info-foreground", "info"],
  ] as const;

  for (const seed of SEEDS) {
    for (const mode of MODES) {
      it(`${seed} in ${mode} carries normal text on every label surface`, () => {
        const scale = deriveColorScale({ seed, mode });
        expect(scale).not.toBeNull();

        for (const [fg, bg] of LABEL_SURFACES) {
          const ratio = contrastRatio(scale?.[fg] ?? "", scale?.[bg] ?? "");
          expect(ratio ?? 0, `${fg} on ${bg} for ${seed}/${mode}`).toBeGreaterThanOrEqual(
            WCAG_AA.normalText,
          );
        }
      });
    }
  }
});

describe("deriveColorScale moves a colour as little as the constraint allows", () => {
  it("nudges a seed in the dead band instead of jumping to a safe lightness", () => {
    // `oklch(0.585 0.15 0)` is inside the measured band where neither near-black nor near-white
    // clears 4.5:1, so the surface has to move. HOW FAR it moves is the difference between a
    // derivation and a reset: stepping 0.02 at a time lands two steps away and still reads as the
    // chosen colour, while falling back to a known-safe lightness throws the choice away.
    const seedL = 0.585;
    const scale = deriveColorScale({ seed: `oklch(${String(seedL)} 0.15 0)`, mode: "dark" });
    const primaryL = toOklch(scale?.primary ?? "")?.l ?? 0;

    expect(Math.abs(primaryL - seedL)).toBeLessThan(0.1);
    // And it did have to move — otherwise this test would pass on a no-op.
    expect(primaryL).not.toBe(seedL);
  });

  it("leaves a seed alone when it already carries text", () => {
    const seedL = 0.45;
    const scale = deriveColorScale({ seed: `oklch(${String(seedL)} 0.15 250)`, mode: "dark" });

    expect(toOklch(scale?.primary ?? "")?.l).toBeCloseTo(seedL, 3);
  });
});

describe("deriveColorScale keeps the brand recognisable", () => {
  it("holds the seed's hue in primary, rather than snapping to a safe grey", () => {
    const scale = deriveColorScale({ seed: "#7C3AED", mode: "dark" });
    const seedHue = toOklch("#7C3AED")?.h ?? 0;
    const primaryHue = toOklch(scale?.primary ?? "")?.h ?? 0;

    // Lightness may move to satisfy contrast; hue must not.
    expect(Math.abs(primaryHue - seedHue)).toBeLessThan(1);
  });

  it("tints the neutrals toward the brand instead of shipping Bootstrap grey", () => {
    const tinted = deriveColorScale({ seed: "#7C3AED", mode: "dark" });
    const flat = deriveColorScale({ seed: "#7C3AED", mode: "dark", neutralChroma: 0 });

    expect(toOklch(tinted?.background ?? "")?.c ?? 0).toBeGreaterThan(0);
    expect(toOklch(flat?.background ?? "")?.c ?? 1).toBe(0);
  });

  it("keeps semantic colours semantic — red stays red whatever the brand is", () => {
    const blue = deriveColorScale({ seed: "#8ab4f8", mode: "dark" });
    const green = deriveColorScale({ seed: "#10b981", mode: "dark" });

    // A destructive action must not turn green because the brand did.
    expect(blue?.destructive).toBe(green?.destructive);
    expect(toOklch(blue?.destructive ?? "")?.h ?? 0).toBeGreaterThan(15);
    expect(toOklch(blue?.destructive ?? "")?.h ?? 0).toBeLessThan(45);
  });

  it("moves a seed that cannot carry text, rather than failing", () => {
    // Mid-yellow has no readable text at its natural lightness against the large-text threshold in
    // some directions; the solver walks it until one exists.
    const scale = deriveColorScale({ seed: "#facc15", mode: "dark" });
    const ratio = contrastRatio(scale?.["primary-foreground"] ?? "", scale?.primary ?? "");

    expect(ratio ?? 0).toBeGreaterThanOrEqual(WCAG_AA.largeText);
  });
});

describe("deriveColorScale input handling", () => {
  it("reads hex, rgb() and oklch() alike", () => {
    for (const seed of ["#7C3AED", "rgb(124, 58, 237)", "oklch(0.54 0.25 292)"]) {
      expect(deriveColorScale({ seed, mode: "dark" }), seed).not.toBeNull();
    }
  });

  it("returns null for a colour it cannot read, instead of inventing a palette", () => {
    expect(deriveColorScale({ seed: "rebeccapurple", mode: "dark" })).toBeNull();
    expect(deriveColorScale({ seed: "var(--brand)", mode: "dark" })).toBeNull();
  });

  it("fills every key the ColorScale declares, so the merge has no gaps", () => {
    const scale = deriveColorScale({ seed: "#8ab4f8", mode: "light" });

    // The optional tonal variants are derived in CSS; everything else must be present.
    for (const [key, value] of Object.entries(scale ?? {})) {
      expect(typeof value, key).toBe("string");
      expect((value as string).length, key).toBeGreaterThan(0);
    }
    expect(Object.keys(scale ?? {}).length).toBeGreaterThan(25);
  });
});
