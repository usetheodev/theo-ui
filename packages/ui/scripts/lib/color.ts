/**
 * Color utilities for scripts — Phase 2 T2.1.
 *
 * Thin wrappers around culori focused on the conversions our tooling needs:
 *
 *   - hslSplitToOklch    HSL split string ("262 83% 58%") → "oklch(L C H)"
 *   - oklchToHslSplit    inverse, lossy round-trip (~0.001 L delta)
 *   - parseColorScaleValue  parse a ColorScale string regardless of format
 *
 * EC-3 absorbed: ColorScale stores HSL split WITHOUT the `hsl(...)` wrapper
 * ("262 83% 58%"), but culori's `parse()` only accepts wrapped forms. We
 * detect the split shape via regex and prepend `hsl(` before delegating.
 *
 * Rounding policy: OKLCH output uses 3-decimal L (0.000–1.000),
 * 3-decimal C, 1-decimal H (degrees). Tighter than this we hit float
 * jitter; looser we lose perceptible fidelity in hue-rich tones.
 *
 * P3 gamut clamping: hex/RGB inputs may convert to OKLCH values outside
 * the sRGB gamut. `culori.clampChroma()` brings them back into the sRGB
 * gamut so browsers render the intended hue (not silently clipped).
 */

import { clampChroma, formatHex, oklch, parse } from "culori";

/** Regex matching ColorScale HSL split format, e.g. "262 83% 58%" or "0 0% 100%". */
const HSL_SPLIT_PATTERN = /^\s*(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)%\s+(-?\d+(?:\.\d+)?)%\s*$/;

export interface ParsedColor {
  /** L in [0, 1]. */
  l: number;
  /** C in [0, ~0.4]. */
  c: number;
  /** H in [0, 360). */
  h: number;
  /** Alpha in [0, 1]. 1 when source omits alpha. */
  alpha: number;
}

function round(n: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(n * factor) / factor;
}

/**
 * Parse any color string the ColorScale accepts:
 *   - HSL split "H S% L%" (legacy ColorScale format)
 *   - Wrapped CSS color functions: hsl(...), rgb(...), oklch(...), oklab(...), lab(...), lch(...)
 *   - Hex: #abc, #aabbcc, #aabbccdd
 *
 * Returns undefined for input that culori cannot resolve.
 */
export function parseColorScaleValue(raw: string): ParsedColor | undefined {
  const trimmed = raw.trim();
  const splitMatch = HSL_SPLIT_PATTERN.exec(trimmed);
  const candidate = splitMatch === null ? trimmed : `hsl(${trimmed})`;
  const parsed = parse(candidate);
  if (parsed === undefined) return undefined;
  // Convert to OKLCH and clamp into sRGB gamut. h may be NaN for neutrals (L=0 / L=1).
  const target = clampChroma(parsed, "oklch");
  const lch = oklch(target);
  if (lch === undefined) return undefined;
  return {
    l: lch.l,
    c: lch.c,
    h: Number.isFinite(lch.h) ? (lch.h as number) : 0,
    alpha: lch.alpha ?? 1,
  };
}

/**
 * Format a ParsedColor back to `oklch(L C H)` or `oklch(L C H / A)`.
 *
 * @param color parsed color
 * @param decimals tuple `[lcDecimals, hDecimals]`; defaults `[3, 1]`
 */
export function formatOklch(color: ParsedColor, decimals: [number, number] = [3, 1]): string {
  const [lc, hd] = decimals;
  const l = round(color.l, lc);
  const c = round(color.c, lc);
  const h = round(color.h, hd);
  const a = color.alpha;
  const base = `oklch(${l} ${c} ${h})`;
  if (a >= 0.9995) return base;
  return `oklch(${l} ${c} ${h} / ${round(a, 3)})`;
}

/**
 * Convert HSL split ("262 83% 58%") directly to "oklch(L C H)" string.
 *
 * Returns undefined for input that doesn't match HSL split format.
 */
export function hslSplitToOklch(input: string): string | undefined {
  if (!HSL_SPLIT_PATTERN.test(input.trim())) return undefined;
  const parsed = parseColorScaleValue(input);
  if (parsed === undefined) return undefined;
  return formatOklch(parsed);
}

/**
 * Convert OKLCH ("oklch(0.560 0.244 277.0)") back to HSL split ("262 83% 58%").
 *
 * Returns undefined for input culori cannot parse.
 */
export function oklchToHslSplit(input: string): string | undefined {
  const parsed = parse(input.trim());
  if (parsed === undefined) return undefined;
  // Use culori's HSL projection.
  const hex = formatHex(parsed);
  if (hex === undefined) return undefined;
  const fromHex = parse(hex);
  if (fromHex === undefined) return undefined;
  // Pull HSL via dynamic import to keep bundle minimal in test envs.
  // Re-parse as hsl by formatting then parsing — but simpler: use culori hsl converter
  // through dynamic require.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { hsl } = require("culori") as typeof import("culori");
  const h = hsl(fromHex);
  if (h === undefined) return undefined;
  const hh = Number.isFinite(h.h) ? Math.round(h.h as number) : 0;
  const ss = Math.round((h.s ?? 0) * 100);
  const ll = Math.round((h.l ?? 0) * 100);
  return `${hh} ${ss}% ${ll}%`;
}

export { HSL_SPLIT_PATTERN };
