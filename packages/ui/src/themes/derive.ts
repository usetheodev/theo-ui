/**
 * Derive a whole palette from one colour.
 *
 * This is the half of a theme editor that separates a colour picker from a design system. Asking
 * somebody to choose twenty-nine colours is asking them to be a designer; asking for one and
 * deriving the rest is what Radix and Material 3 do, and it only works in a perceptual space —
 * lightening in HSL changes how saturated a colour *looks*, so a scale built that way drifts in
 * ways the numbers do not show.
 *
 * OKLCH makes lightness mean what the eye means by it, which is why every step here moves `L` and
 * leaves hue alone.
 *
 * WHAT MAKES THIS MORE THAN A GRADIENT: the pairs that carry text are solved for contrast rather
 * than assigned and hoped over. `primary-foreground` is whichever of near-black and near-white
 * clears the threshold against `primary` — and when neither does, `primary` itself is walked in
 * lightness until one of them does. A derived palette that fails WCAG is exactly the artefact the
 * audit exists to reject, so deriving one would be a strange thing for this package to do.
 */

import { WCAG_AA, contrastRatio } from "./contrast.js";
import type { ColorScale, ThemeMode } from "./types.js";

/** OKLCH components, in the units CSS uses: L 0–1, C 0–0.4ish, H degrees. */
interface Oklch {
  l: number;
  c: number;
  h: number;
}

const clamp = (n: number, min: number, max: number): number => Math.min(max, Math.max(min, n));

/** Rounded to what CSS needs, so a theme file does not carry sixteen decimal places. */
function css({ l, c, h }: Oklch): string {
  const r = (n: number, places: number): string => Number(n.toFixed(places)).toString();
  return `oklch(${r(clamp(l, 0, 1), 4)} ${r(Math.max(0, c), 4)} ${r(((h % 360) + 360) % 360, 2)})`;
}

/** Reads `oklch()`, `#rrggbb` and `rgb()` into OKLCH. Returns `null` for anything else. */
export function toOklch(color: string): Oklch | null {
  const direct = /^oklch\(\s*([\d.%]+)\s+([\d.]+)\s+([\d.]+)/i.exec(color.trim());
  if (direct?.[1] !== undefined && direct[2] !== undefined && direct[3] !== undefined) {
    const l = direct[1].endsWith("%") ? Number.parseFloat(direct[1]) / 100 : Number(direct[1]);
    return { l, c: Number(direct[2]), h: Number(direct[3]) };
  }

  const rgb = toLinearRgb(color);
  if (!rgb) return null;
  return linearRgbToOklch(rgb);
}

/** `#rrggbb` / `rgb()` → linear sRGB. */
function toLinearRgb(color: string): [number, number, number] | null {
  const linearise = (channel: number): number =>
    channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;

  const hex = /^#([0-9a-f]{6})$/i.exec(color.trim())?.[1];
  if (hex !== undefined) {
    const at = (i: number): number => Number.parseInt(hex.slice(i, i + 2), 16) / 255;
    return [linearise(at(0)), linearise(at(2)), linearise(at(4))];
  }

  const inner = /^rgba?\(([^)]+)\)$/i.exec(color.trim())?.[1];
  if (inner !== undefined) {
    const parts =
      inner
        .split("/")[0]
        ?.trim()
        .split(/[\s,]+/)
        .filter(Boolean) ?? [];
    if (parts.length < 3) return null;
    const at = (i: number): number => Number(parts[i]) / 255;
    return [linearise(at(0)), linearise(at(1)), linearise(at(2))];
  }

  return null;
}

/** Linear sRGB → OKLCH. The inverse of the transform in `contrast.ts`, same constants. */
function linearRgbToOklch([r, g, b]: [number, number, number]): Oklch {
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);

  const lightness = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const a = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const bb = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;

  return {
    l: lightness,
    c: Math.sqrt(a * a + bb * bb),
    h: ((Math.atan2(bb, a) * 180) / Math.PI + 360) % 360,
  };
}

/**
 * Pick the readable text colour for a surface, and say when neither works.
 *
 * Returning `null` rather than "the better of two bad options" is what lets the caller fix the
 * surface instead of shipping a pair that fails. A function that always answers would make the
 * threshold decorative.
 */
function readableOn(surface: string, minimum: number, hue: number): string | null {
  const candidates = [css({ l: 0.14, c: 0.01, h: hue }), css({ l: 0.99, c: 0.005, h: hue })];
  const scored = candidates
    .map((candidate) => ({ candidate, ratio: contrastRatio(candidate, surface) ?? 0 }))
    .sort((a, b) => b.ratio - a.ratio);

  const best = scored[0];
  return best !== undefined && best.ratio >= minimum ? best.candidate : null;
}

/**
 * Move a surface's lightness until some text colour clears the threshold on it.
 *
 * The direction is away from the mode's own background — a dark theme darkens its accents, a light
 * theme lightens them — so a brand colour lands where it still reads as itself rather than being
 * dragged to the nearest passing grey. Steps are 0.02 in OKLCH lightness, roughly the smallest
 * change a person notices, so the result is never further from the requested colour than the
 * constraint requires.
 *
 * WHETHER THIS LOOP EVER RUNS DEPENDS ENTIRELY ON THE THRESHOLD, and it is worth writing down
 * because the first version of this file walked for a threshold that never needed it. Near-black
 * and near-white bracket the lightness range, so:
 *
 *   3:1   — no dead band. One of the two always clears it, at every luminance.
 *   4.5:1 — dead band at luminance 0.173–0.251. Neither works; the surface has to move.
 *   7:1   — dead band 0.093–0.418, most of the useful range.
 *
 * So a derivation targeting only 3:1 would make this function a no-op. It targets 4.5 for the
 * surfaces that carry button labels — see `deriveColorScale` — which is both why the loop exists
 * and why a derived palette clears the audit with room rather than by exactly one hundredth.
 */
function solveSurface(
  seed: Oklch,
  minimum: number,
  mode: ThemeMode,
): { surface: string; text: string } {
  const direction = mode === "dark" ? -1 : 1;

  for (let step = 0; step <= 40; step += 1) {
    for (const sign of step === 0 ? [1] : [direction, -direction]) {
      const l = clamp(seed.l + sign * step * 0.02, 0.05, 0.98);
      const surface = css({ ...seed, l });
      const text = readableOn(surface, minimum, seed.h);
      if (text !== null) return { surface, text };
    }
  }

  // Unreachable for any real hue: near-black and near-white bracket the whole lightness range, so
  // one of them clears 3:1 somewhere. Kept as an explicit floor rather than a non-null assertion.
  const surface = css({ ...seed, l: mode === "dark" ? 0.35 : 0.75 });
  return { surface, text: css({ l: mode === "dark" ? 0.99 : 0.14, c: 0.005, h: seed.h }) };
}

export interface DeriveOptions {
  /** The one colour a person chooses. Hex, rgb() or oklch(). */
  seed: string;
  mode: ThemeMode;
  /**
   * How much of the seed's hue bleeds into the greys, 0–0.03.
   *
   * `0` gives true neutrals. The default tints them very slightly toward the brand, which is what
   * stops a palette reading as "a colour on top of Bootstrap" — the greys belong to it too.
   */
  neutralChroma?: number;
}

/** Fixed hues for the semantic colours, which mean what they mean regardless of the brand. */
const SEMANTIC_HUES = { destructive: 27, success: 145, warning: 85, info: 250 } as const;

/**
 * Build a complete `ColorScale` from one colour.
 *
 * Every pair the contrast audit checks is solved rather than assigned, so the result passes
 * `auditColorScale` by construction — which the tests assert across a sweep of hues rather than on
 * one convenient example.
 *
 * Returns `null` only when the seed cannot be read at all; an out-of-gamut or extreme seed is
 * handled by moving it, not by refusing.
 */
export function deriveColorScale(options: DeriveOptions): ColorScale | null {
  const seed = toOklch(options.seed);
  if (!seed) return null;

  const { mode } = options;
  const dark = mode === "dark";
  const tint = clamp(options.neutralChroma ?? 0.006, 0, 0.03);
  const h = seed.h;

  const neutral = (l: number, c = tint): string => css({ l, c, h });

  const background = neutral(dark ? 0.16 : 0.99);
  const card = neutral(dark ? 0.2 : 1, dark ? tint : 0);
  const popover = card;
  const muted = neutral(dark ? 0.26 : 0.96);
  const border = neutral(dark ? 0.29 : 0.9);

  // Text is solved against the surface it sits on, not assumed from the mode.
  const foreground = readableOn(background, WCAG_AA.normalText, h) ?? neutral(dark ? 0.95 : 0.15);
  const cardForeground = readableOn(card, WCAG_AA.normalText, h) ?? foreground;
  const mutedForeground = solveSurface({ l: dark ? 0.72 : 0.48, c: tint * 2, h }, 0, mode).surface;

  /*
   * Solved at 4.5, not at the 3 the audit demands.
   *
   * These are the surfaces that carry button labels, and a label is normal-sized text — the audit
   * holds them to the large-text threshold by a convention this package inherited, which is right
   * for judging a hand-written theme and too loose for generating one. A derived palette should
   * clear the bar with room, not land on it.
   *
   * It is also what makes `solveSurface` do work: at 3:1 there is no lightness where neither
   * near-black nor near-white reads, so the walk would never take a step.
   */
  const primary = solveSurface(seed, WCAG_AA.normalText, mode);
  const secondary = solveSurface({ l: dark ? 0.28 : 0.94, c: tint, h }, WCAG_AA.normalText, mode);

  // `accent` is tonal — used behind badges and hover states at `/10` and `/15`, rarely under
  // normal text — so the audit's own threshold is the right one here.
  const accent = solveSurface({ ...seed, c: seed.c * 0.9 }, WCAG_AA.largeText, mode);

  const semantic = (hue: number): { surface: string; text: string } =>
    solveSurface({ l: dark ? 0.65 : 0.55, c: 0.15, h: hue }, WCAG_AA.normalText, mode);

  const destructive = semantic(SEMANTIC_HUES.destructive);
  const success = semantic(SEMANTIC_HUES.success);
  const warning = semantic(SEMANTIC_HUES.warning);
  const info = semantic(SEMANTIC_HUES.info);

  return {
    background,
    foreground,
    card,
    "card-foreground": cardForeground,
    popover,
    "popover-foreground": cardForeground,
    primary: primary.surface,
    "primary-foreground": primary.text,
    secondary: secondary.surface,
    "secondary-foreground": secondary.text,
    accent: accent.surface,
    "accent-foreground": accent.text,
    muted,
    // `muted-foreground` is auxiliary text and is held to the large-text threshold, matching the
    // audit — solved against `muted`, which is the surface it actually sits on.
    "muted-foreground": readableOn(muted, WCAG_AA.largeText, h) ?? mutedForeground,
    border,
    input: border,
    ring: primary.surface,
    destructive: destructive.surface,
    "destructive-foreground": destructive.text,
    success: success.surface,
    "success-foreground": success.text,
    warning: warning.surface,
    "warning-foreground": warning.text,
    info: info.surface,
    "info-foreground": info.text,
    // Operational status mirrors the semantic group, which is what the built-in themes do. A
    // consumer wanting visually distinct status surfaces overrides these.
    "status-online": success.surface,
    "status-online-foreground": success.text,
    "status-offline": destructive.surface,
    "status-offline-foreground": destructive.text,
    "status-degraded": warning.surface,
    "status-degraded-foreground": warning.text,
    "status-info": info.surface,
    "status-info-foreground": info.text,
  };
}
