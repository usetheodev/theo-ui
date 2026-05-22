/**
 * Color helpers that return values in the HSL string-tuple format the
 * `ColorScale` shape expects (e.g. `"262 83% 58%"`).
 *
 * Why this format: matches the shadcn / Violet Forge convention where
 * CSS variables hold the H S% L% components and consumers write
 * `hsl(var(--primary))` (allowing alpha overlays via
 * `hsl(var(--primary) / 0.5)`). Returning an object would force callers
 * to write `${theme.light.primary.h} ${theme.light.primary.s}% …` —
 * exactly the friction `hex()` is meant to remove.
 *
 * No external dependency: vanilla algorithm from CSS Color spec.
 * Alpha channels are intentionally discarded — `ColorScale` is opaque;
 * use `hsl(var(--primary) / 0.5)` in CSS for transparency.
 *
 * Plan: `.claude/knowledge-base/plans/theming-and-sizes-plan.md` T2.2.
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
    // Short form #rgb or #rgba — expand each nibble.
    const nr = hexCharToNibble(body[0]!);
    const ng = hexCharToNibble(body[1]!);
    const nb = hexCharToNibble(body[2]!);
    r = (nr << 4) | nr;
    g = (ng << 4) | ng;
    b = (nb << 4) | nb;
    // Alpha char (body[3]) is silently dropped per spec — ColorScale is opaque.
  } else if (body.length === 6 || body.length === 8) {
    r = (hexCharToNibble(body[0]!) << 4) | hexCharToNibble(body[1]!);
    g = (hexCharToNibble(body[2]!) << 4) | hexCharToNibble(body[3]!);
    b = (hexCharToNibble(body[4]!) << 4) | hexCharToNibble(body[5]!);
    // Bytes 6-7 (alpha) silently dropped.
  } else {
    throw new Error(
      `hex(): invalid length ${body.length} for hex input "${input}" — expected 3, 4, 6, or 8 hex chars after the '#'.`,
    );
  }
  return { r, g, b };
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
 *   hex("#7C3AED")   // "262 83% 58%"
 *   hex("#7c3aed")   // "262 83% 58%"  (same)
 *   hex("#abc")      // expanded to "#aabbcc"
 */
export function hex(input: string): string {
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
 *   rgb(124, 58, 237)  // "262 83% 58%"
 */
export function rgb(r: number, g: number, b: number): string {
  for (const value of [r, g, b]) {
    if (!Number.isFinite(value) || value < 0 || value > 255) {
      throw new Error(
        `rgb(): channel out of range — expected 0..255, got ${value}. Did you mix percentage values?`,
      );
    }
  }
  return rgbToHsl(Math.round(r), Math.round(g), Math.round(b));
}
