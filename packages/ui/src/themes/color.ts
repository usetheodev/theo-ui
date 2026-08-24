/**
 * Color helpers for `ColorScale` and `defineTheme`.
 *
 * Post-T2.6 (community-best-practices alignment, ADR-0005): the canonical
 * output format is OKLCH (`"oklch(L C H)"`). Built-in themes also use OKLCH
 * after the T2.4 migration. The CSS regex (`COLOR_VALUE_PATTERN`) accepts
 * both formats for backward compatibility — legacy themes pinned to the
 * HSL split format keep working.
 *
 * Helpers:
 *   - hex(input)      → "oklch(L C H)"  (NEW — primary path post-T2.6)
 *   - rgb(r, g, b)    → "oklch(L C H)"  (NEW)
 *   - hexToHsl(input) → "H S% L%"       (legacy — deprecated, kept 1 minor)
 *   - rgbToHsl(...)   → "H S% L%"       (legacy — deprecated)
 *
 * Alpha channels are intentionally discarded — `ColorScale` is opaque;
 * compose alpha in CSS via `color-mix(in oklch, var(--primary) 50%, transparent)`.
 *
 * RFC: `wiki/rfcs/0005-theming-and-sizes.md`.
 */

function hexCharToNibble(ch: string): number {
  if (ch >= "0" && ch <= "9") return ch.charCodeAt(0) - 48;
  if (ch >= "a" && ch <= "f") return ch.charCodeAt(0) - 87;
  if (ch >= "A" && ch <= "F") return ch.charCodeAt(0) - 55;
  throw new Error(`hex(): invalid hex character "${ch}"`);
}

function parseHex(input: string): { r: number; g: number; b: number } {
  if (!input.startsWith("#")) {
    throw new Error(`hex(): expected '#'-prefixed input, got "${input}"`);
  }
  const body = input.slice(1);
  let r: number;
  let g: number;
  let b: number;
  if (body.length === 3 || body.length === 4) {
    // Short form #rgb or #rgba — expand each nibble. charAt always returns
    // a string (empty for OOB), so hexCharToNibble throws on the empty
    // string the same way it does on any invalid char — no NonNull needed.
    const nr = hexCharToNibble(body.charAt(0));
    const ng = hexCharToNibble(body.charAt(1));
    const nb = hexCharToNibble(body.charAt(2));
    r = (nr << 4) | nr;
    g = (ng << 4) | ng;
    b = (nb << 4) | nb;
    // Alpha char (body[3]) is silently dropped per spec — ColorScale is opaque.
  } else if (body.length === 6 || body.length === 8) {
    r = (hexCharToNibble(body.charAt(0)) << 4) | hexCharToNibble(body.charAt(1));
    g = (hexCharToNibble(body.charAt(2)) << 4) | hexCharToNibble(body.charAt(3));
    b = (hexCharToNibble(body.charAt(4)) << 4) | hexCharToNibble(body.charAt(5));
    // Bytes 6-7 (alpha) silently dropped.
  } else {
    throw new Error(
      `hex(): invalid length ${body.length} for hex input "${input}" — expected 3, 4, 6, or 8 hex chars after the '#'.`,
    );
  }
  return { r, g, b };
}

/**
 * Convert sRGB ([0, 255]^3) to OKLCH via D65 linearization and Oklab matrices.
 * Inline implementation (no external dep): the Oklab paper (Björn Ottosson,
 * 2020) defines the conversion as two matrix products + cube-root nonlinearity.
 * Output: rounded to 3 decimals for L/C, 1 decimal for H.
 */
function rgbToOklch(r: number, g: number, b: number): string {
  // sRGB → linear RGB (gamma decoding).
  const linearize = (c: number): number => {
    const cn = c / 255;
    return cn <= 0.04045 ? cn / 12.92 : ((cn + 0.055) / 1.055) ** 2.4;
  };
  const rl = linearize(r);
  const gl = linearize(g);
  const bl = linearize(b);

  // Linear RGB → LMS via Oklab matrix.
  const l_ = 0.4122214708 * rl + 0.5363325363 * gl + 0.0514459929 * bl;
  const m_ = 0.2119034982 * rl + 0.6806995451 * gl + 0.1073969566 * bl;
  const s_ = 0.0883024619 * rl + 0.2817188376 * gl + 0.6299787005 * bl;

  const l = Math.cbrt(l_);
  const m = Math.cbrt(m_);
  const s = Math.cbrt(s_);

  // LMS' → Oklab.
  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const a = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const bComp = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;

  // Oklab → OKLCH.
  const C = Math.sqrt(a * a + bComp * bComp);
  let H = (Math.atan2(bComp, a) * 180) / Math.PI;
  if (H < 0) H += 360;

  const round = (n: number, d: number): number => {
    const f = 10 ** d;
    return Math.round(n * f) / f;
  };
  // Neutrals (C ≈ 0) have an undefined hue; emit 0 to keep regex-friendly.
  const hOut = C < 1e-4 ? 0 : round(H, 1);
  return `oklch(${round(L, 3)} ${round(C, 3)} ${hOut})`;
}

function rgbToHsl(r: number, g: number, b: number): string {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case rn:
        h = (gn - bn) / d + (gn < bn ? 6 : 0);
        break;
      case gn:
        h = (bn - rn) / d + 2;
        break;
      default:
        h = (rn - gn) / d + 4;
        break;
    }
    h *= 60;
  }
  const hh = Math.round(h);
  const ss = Math.round(s * 100);
  const ll = Math.round(l * 100);
  return `${hh} ${ss}% ${ll}%`;
}

/**
 * Convert a hex color string to the HSL string-tuple format used by
 * `ColorScale` ("`H S% L%`", e.g. `"262 83% 58%"`).
 *
 * Accepts `#rgb`, `#rgba`, `#rrggbb`, `#rrggbbaa`. Case-insensitive.
 * Alpha bytes are silently dropped — use `hsl(var(--primary) / 0.5)`
 * in CSS for transparency.
 *
 * @throws if the input is malformed.
 *
 * @example
 *   hex("#A855F7")   // "oklch(0.628 0.225 296)"
 *   hex("#a855f7")   // same — case-insensitive
 *   hex("#abc")      // expanded to "#aabbcc"
 */
export function hex(input: string): string {
  const { r, g, b } = parseHex(input);
  return rgbToOklch(r, g, b);
}

/**
 * Legacy helper that returns HSL string-tuple format (pre-T2.6).
 *
 * @deprecated Since 2026-06-03 — use `hex(input)` which returns OKLCH.
 *   Kept for one minor cycle to avoid breaking consumers that authored
 *   themes using the HSL split format. Both formats are accepted by
 *   `ColorScale` and by `<ThemeProvider>` runtime validation.
 */
export function hexToHsl(input: string): string {
  const { r, g, b } = parseHex(input);
  return rgbToHsl(r, g, b);
}

/**
 * Convert an RGB triplet (each in `[0, 255]`) to the HSL string-tuple
 * format used by `ColorScale`.
 *
 * @throws if any channel is out of `[0, 255]`.
 *
 * @example
 *   rgb(168, 85, 247)  // "oklch(0.628 0.225 296)"
 */
export function rgb(r: number, g: number, b: number): string {
  for (const value of [r, g, b]) {
    if (!Number.isFinite(value) || value < 0 || value > 255) {
      throw new Error(
        `rgb(): channel out of range — expected 0..255, got ${value}. Did you mix percentage values?`,
      );
    }
  }
  return rgbToOklch(Math.round(r), Math.round(g), Math.round(b));
}

/**
 * Legacy helper that returns HSL string-tuple format (pre-T2.6).
 *
 * @deprecated Since 2026-06-03 — use `rgb(r, g, b)` which returns OKLCH.
 */
export function rgbToHslLegacy(r: number, g: number, b: number): string {
  for (const value of [r, g, b]) {
    if (!Number.isFinite(value) || value < 0 || value > 255) {
      throw new Error(`rgbToHslLegacy(): channel out of range — expected 0..255, got ${value}.`);
    }
  }
  return rgbToHsl(Math.round(r), Math.round(g), Math.round(b));
}
