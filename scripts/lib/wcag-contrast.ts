/**
 * WCAG 2.1 contrast helpers — pure JS, no deps.
 *
 * Parses HSL string-tuples (the format `ColorScale` uses, e.g. "262 83% 58%"),
 * converts to relative luminance, returns contrast ratios per WCAG formula:
 *   ratio = (L_lighter + 0.05) / (L_darker + 0.05)
 *   AA pass: ratio >= 4.5 (body) or >= 3.0 (large text 18pt+)
 *
 * Used by `validateThemeContrast` in validate-quality-gates.ts to gate the
 * built-in theme set on accessibility.
 *
 * Plan: .claude/knowledge-base/plans/seven-themes-plan.md T1.1
 */

import { parse as culoriParse, rgb as culoriRgb } from "culori";

export interface Hsl {
  h: number;
  s: number;
  l: number;
}

/**
 * Parse "H S% L%" or "H S L" string-tuple to numbers.
 * Tolerant: strips `%`, extra whitespace, clamps hue to [0, 360).
 */
export function parseHsl(input: string): Hsl {
  const cleaned = input.replace(/%/g, "").trim();
  const parts = cleaned.split(/\s+/).filter(Boolean);
  if (parts.length < 3) {
    throw new Error(`parseHsl: expected "H S% L%" tuple, got "${input}"`);
  }
  const h = ((Number(parts[0]) % 360) + 360) % 360;
  const s = Number(parts[1]);
  const l = Number(parts[2]);
  if (!Number.isFinite(h) || !Number.isFinite(s) || !Number.isFinite(l)) {
    throw new Error(`parseHsl: non-numeric component in "${input}"`);
  }
  return { h, s, l };
}

/**
 * Relative luminance per WCAG 2.1
 * https://www.w3.org/TR/WCAG21/#dfn-relative-luminance
 */
export function hslToLuminance({ h, s, l }: Hsl): number {
  const sNorm = s / 100;
  const lNorm = l / 100;
  const c = (1 - Math.abs(2 * lNorm - 1)) * sNorm;
  const hPrime = h / 60;
  const x = c * (1 - Math.abs((hPrime % 2) - 1));
  let r1 = 0;
  let g1 = 0;
  let b1 = 0;
  if (hPrime < 1) {
    r1 = c;
    g1 = x;
  } else if (hPrime < 2) {
    r1 = x;
    g1 = c;
  } else if (hPrime < 3) {
    g1 = c;
    b1 = x;
  } else if (hPrime < 4) {
    g1 = x;
    b1 = c;
  } else if (hPrime < 5) {
    r1 = x;
    b1 = c;
  } else {
    r1 = c;
    b1 = x;
  }
  const m = lNorm - c / 2;
  const r = r1 + m;
  const g = g1 + m;
  const b = b1 + m;
  // sRGB → linear RGB
  const lin = (v: number) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

/**
 * Compute relative luminance for any color format using culori.
 * Post-T2.4 the built-in themes use OKLCH; pre-T2.4 they used HSL split.
 * Both must work in the same gate.
 */
function valueToLuminance(value: string): number {
  // Try HSL split first (legacy ColorScale convention) — fast path with no dep.
  const cleaned = value.replace(/%/g, "").trim();
  const splitParts = cleaned.split(/\s+/).filter(Boolean);
  if (splitParts.length === 3 && splitParts.every((p) => /^-?\d+(\.\d+)?$/.test(p))) {
    return hslToLuminance(parseHsl(value));
  }
  // Otherwise: delegate to culori (handles oklch, hex, rgb, hsl wrapped, ...).
  const parsed = culoriParse(value);
  const rgb = parsed === undefined ? undefined : culoriRgb(parsed);
  if (rgb === undefined) {
    throw new Error(`valueToLuminance: cannot parse "${value}"`);
  }
  const lin = (v: number) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
  return 0.2126 * lin(rgb.r) + 0.7152 * lin(rgb.g) + 0.0722 * lin(rgb.b);
}

/**
 * WCAG contrast ratio between two color values (HSL split, OKLCH, hex, rgb).
 * Returns a number in [1, 21].
 */
export function contrastRatio(a: string, b: string): number {
  const la = valueToLuminance(a);
  const lb = valueToLuminance(b);
  const max = Math.max(la, lb);
  const min = Math.min(la, lb);
  return (max + 0.05) / (min + 0.05);
}
