/**
 * WCAG contrast, for colours a theme is made of — at runtime, in the browser, with no dependency.
 *
 * The build already gates the built-in themes (`scripts/validate-contrast.ts`, which uses `culori`
 * off a devDependency). That cannot help someone building a theme in a UI: by the time a colour is
 * picked, the build ran months ago. A theme editor needs the same arithmetic while the person is
 * still moving the slider, which means it has to ship.
 *
 * So this is deliberately dependency-free. `culori` is 30kB for a job that is one cube root and a
 * matrix multiply, and every consumer of this package would carry it whether or not they ever
 * render an editor.
 *
 * OKLCH is converted through OKLab to LINEAR sRGB, which is exactly what the WCAG luminance
 * formula wants — the usual "convert to hex, then linearise" round trip throws away precision and
 * adds a step. Hex and rgb() go through the standard sRGB linearisation.
 */

import type { ColorScale } from "./types.js";

/** A colour's relative luminance per WCAG 2.1, or `null` if the string cannot be read. */
export type Luminance = number | null;

const clamp01 = (n: number): number => (n < 0 ? 0 : n > 1 ? 1 : n);

/** sRGB channel (0–1, gamma-encoded) → linear light. WCAG 2.1 §relative luminance. */
function linearise(channel: number): number {
  return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
}

/** Linear R/G/B → relative luminance. */
const luminanceOf = (r: number, g: number, b: number): number =>
  0.2126 * clamp01(r) + 0.7152 * clamp01(g) + 0.0722 * clamp01(b);

/**
 * OKLCH → linear sRGB.
 *
 * The matrices are Björn Ottosson's published OKLab constants. Kept as literals rather than named
 * intermediates because they are a single transform read from a reference, and naming each row
 * would suggest they can be adjusted independently — they cannot.
 */
function oklchToLinearRgb(l: number, c: number, hDegrees: number): [number, number, number] {
  const h = (hDegrees * Math.PI) / 180;
  const a = c * Math.cos(h);
  const bb = c * Math.sin(h);

  const lp = l + 0.3963377774 * a + 0.2158037573 * bb;
  const mp = l - 0.1055613458 * a - 0.0638541728 * bb;
  const sp = l - 0.0894841775 * a - 1.291485548 * bb;

  const lc = lp ** 3;
  const mc = mp ** 3;
  const sc = sp ** 3;

  return [
    4.0767416621 * lc - 3.3077115913 * mc + 0.2309699292 * sc,
    -1.2684380046 * lc + 2.6097574011 * mc - 0.3413193965 * sc,
    -0.0041960863 * lc - 0.7034186147 * mc + 1.707614701 * sc,
  ];
}

/** Reads the three numbers out of `oklch(L C H)` / `oklch(L C H / A)`, percentages included. */
function parseOklch(value: string): [number, number, number] | null {
  const inner = /^oklch\(([^)]+)\)$/i.exec(value.trim())?.[1];
  if (inner === undefined) return null;

  const parts = inner.split("/")[0]?.trim().split(/\s+/) ?? [];
  if (parts.length < 3) return null;

  const l = parts[0]?.endsWith("%") ? Number.parseFloat(parts[0]) / 100 : Number(parts[0]);
  const c = Number(parts[1]);
  const h = Number(parts[2]);
  if (!Number.isFinite(l) || !Number.isFinite(c) || !Number.isFinite(h)) return null;

  return [l, c, h];
}

/** Reads `#rgb`, `#rrggbb`, `#rrggbbaa`. Alpha is ignored — see `contrastRatio`. */
function parseHex(value: string): [number, number, number] | null {
  const hex = /^#([0-9a-f]{3,8})$/i.exec(value.trim())?.[1];
  if (hex === undefined) return null;

  const expand = (s: string): number => Number.parseInt(s.length === 1 ? s + s : s, 16) / 255;
  if (hex.length === 3 || hex.length === 4) {
    return [expand(hex[0] ?? ""), expand(hex[1] ?? ""), expand(hex[2] ?? "")];
  }
  if (hex.length === 6 || hex.length === 8) {
    return [expand(hex.slice(0, 2)), expand(hex.slice(2, 4)), expand(hex.slice(4, 6))];
  }
  return null;
}

/** Reads `rgb(r g b)`, `rgb(r, g, b)`, `rgba(...)`, with or without percentages. */
function parseRgb(value: string): [number, number, number] | null {
  const inner = /^rgba?\(([^)]+)\)$/i.exec(value.trim())?.[1];
  if (inner === undefined) return null;

  const parts =
    inner
      .split("/")[0]
      ?.trim()
      .split(/[\s,]+/)
      .filter(Boolean) ?? [];
  if (parts.length < 3) return null;

  const channel = (raw: string): number =>
    raw.endsWith("%") ? Number.parseFloat(raw) / 100 : Number(raw) / 255;

  const [r, g, b] = [channel(parts[0] ?? ""), channel(parts[1] ?? ""), channel(parts[2] ?? "")];
  if (!Number.isFinite(r) || !Number.isFinite(g) || !Number.isFinite(b)) return null;

  return [r, g, b];
}

/**
 * Relative luminance of a CSS colour string, or `null` when the format is not one we read.
 *
 * `null` rather than a fallback number on purpose: a wrong luminance produces a plausible contrast
 * ratio, and a contrast gate that quietly reports a made-up number is worse than one that says it
 * could not measure.
 */
export function relativeLuminance(color: string): Luminance {
  const oklch = parseOklch(color);
  if (oklch) {
    const [r, g, b] = oklchToLinearRgb(oklch[0], oklch[1], oklch[2]);
    return luminanceOf(r, g, b);
  }

  const srgb = parseHex(color) ?? parseRgb(color);
  if (srgb) {
    return luminanceOf(linearise(srgb[0]), linearise(srgb[1]), linearise(srgb[2]));
  }

  return null;
}

/**
 * WCAG 2.1 contrast ratio between two colours, or `null` if either cannot be read.
 *
 * Alpha is ignored, in both inputs. A translucent colour's real contrast depends on whatever is
 * painted behind it, which a pair of strings does not know; treating it as opaque is the standard
 * simplification and is why a gate built on this should compare tokens, not arbitrary surfaces.
 */
export function contrastRatio(foreground: string, background: string): number | null {
  const a = relativeLuminance(foreground);
  const b = relativeLuminance(background);
  if (a === null || b === null) return null;

  const [lighter, darker] = a > b ? [a, b] : [b, a];
  return (lighter + 0.05) / (darker + 0.05);
}

/** WCAG 2.1 AA thresholds. Large text is 18pt, or 14pt bold. */
export const WCAG_AA = { normalText: 4.5, largeText: 3, uiComponent: 3 } as const;

export type ContrastLevel = "fail" | "AA-large" | "AA" | "AAA";

/** Where a ratio lands, for a UI that wants to show more than pass/fail. */
export function contrastLevel(ratio: number): ContrastLevel {
  if (ratio >= 7) return "AAA";
  if (ratio >= WCAG_AA.normalText) return "AA";
  if (ratio >= WCAG_AA.largeText) return "AA-large";
  return "fail";
}

/**
 * The token pairs a theme has to get right, and the threshold each is held to.
 *
 * Same set the build gate uses (`scripts/validate-contrast.ts`), deliberately: a theme built in an
 * editor and a theme committed to the repo should pass or fail for the same reasons. Duplicating
 * the list is a real risk of drift, but the alternative — importing from `scripts/` — would pull
 * `culori` into everyone's bundle, which is the whole reason this file exists.
 *
 * `muted-foreground` over `muted` sits at the large-text threshold because it is auxiliary text in
 * practice: badges, hints, timestamps. That is the build gate's judgement, kept here rather than
 * revisited, so the two cannot disagree.
 */
export const CONTRAST_PAIRS = [
  { foreground: "foreground", background: "background", minimum: WCAG_AA.normalText },
  { foreground: "card-foreground", background: "card", minimum: WCAG_AA.normalText },
  { foreground: "popover-foreground", background: "popover", minimum: WCAG_AA.normalText },
  { foreground: "primary-foreground", background: "primary", minimum: WCAG_AA.largeText },
  { foreground: "secondary-foreground", background: "secondary", minimum: WCAG_AA.largeText },
  { foreground: "accent-foreground", background: "accent", minimum: WCAG_AA.largeText },
  { foreground: "destructive-foreground", background: "destructive", minimum: WCAG_AA.largeText },
  { foreground: "muted-foreground", background: "muted", minimum: WCAG_AA.largeText },
] as const;

export interface ContrastFinding {
  foreground: string;
  background: string;
  /** `null` when a colour could not be read — reported, never silently passed. */
  ratio: number | null;
  minimum: number;
  level: ContrastLevel | "unreadable";
  passes: boolean;
}

/**
 * Audit one mode of a colour scale against {@link CONTRAST_PAIRS}.
 *
 * Returns every pair, not only the failures, so a UI can show the whole picture — a person moving
 * a slider wants to see the ratio approaching 4.5, not just the moment it crosses.
 *
 * A pair whose colour cannot be parsed comes back with `ratio: null` and `passes: false`. Treating
 * unreadable as passing would let an editor hand someone a theme it never actually checked.
 */
export function auditColorScale(
  scale: ColorScale | Readonly<Record<string, string | undefined>>,
): ContrastFinding[] {
  // An interface has no index signature, so `ColorScale` does not satisfy `Record` on its own —
  // and widening the parameter to `Record` alone would refuse the very type a theme is made of.
  // The union accepts both; the cast is how the two are read the same way.
  const lookup = scale as Readonly<Record<string, string | undefined>>;

  return CONTRAST_PAIRS.map(({ foreground, background, minimum }) => {
    const fg = lookup[foreground];
    const bg = lookup[background];
    const ratio = fg !== undefined && bg !== undefined ? contrastRatio(fg, bg) : null;

    return {
      foreground,
      background,
      ratio,
      minimum,
      level: ratio === null ? ("unreadable" as const) : contrastLevel(ratio),
      passes: ratio !== null && ratio >= minimum,
    };
  });
}

/** Linear light → sRGB channel (0–1, gamma-encoded). The inverse of {@link linearise}. */
function delinearise(channel: number): number {
  return channel <= 0.0031308 ? channel * 12.92 : 1.055 * channel ** (1 / 2.4) - 0.055;
}

/**
 * Any readable CSS colour → `#rrggbb`, or `null` when it cannot be read.
 *
 * This lives beside the contrast maths because it is the same conversion run one step further, and
 * splitting it would mean two copies of the OKLab matrices.
 *
 * It exists for `<input type="color">`, which accepts hex and nothing else. Every built-in theme is
 * written in OKLCH, so without this an editor seeded from one opens with every swatch black — the
 * palette is there, the control just cannot show it.
 *
 * Out-of-gamut OKLCH clamps per channel. That is lossy and it is the point: a colour outside sRGB
 * has no hex, and clamping shows the nearest one a picker can display rather than refusing.
 */
export function cssColorToHex(color: string): string | null {
  const oklch = parseOklch(color);
  const srgb = oklch
    ? (oklchToLinearRgb(oklch[0], oklch[1], oklch[2]).map(delinearise) as [number, number, number])
    : (parseHex(color) ?? parseRgb(color));

  if (!srgb) return null;

  const channel = (n: number): string =>
    Math.round(clamp01(n) * 255)
      .toString(16)
      .padStart(2, "0");

  return `#${channel(srgb[0])}${channel(srgb[1])}${channel(srgb[2])}`;
}
