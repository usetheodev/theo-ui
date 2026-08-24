/**
 * Theme color value validation pattern — Phase 2 T2.5, EC-5 absorbed.
 *
 * Allowed forms (one or more, single string per token):
 *   1. Hex:        `#fff`, `#0a0a0a`, `#0a0a0aff`
 *   2. CSS color functions:
 *      - oklch/oklab: supports relative-color syntax `oklch(from var(--x) l c h)`,
 *        `calc(...)` of depth 1, `none` keyword, and single-char component
 *        identifiers (`l`, `c`, `h`, `a`, `b`).
 *      - rgb, rgba, hsl, hsla, lab, lch, color: conservative content
 *        `[\d.\s%,/+\-]+` — no nested function calls.
 *   3. HSL split tuple (legacy ColorScale convention pre-T2.4):
 *      `"0 0% 100%"`, `"262 83% 58%"` — space-separated numeric components.
 *   4. `var(--token)` reference with optional safe fallback value.
 *   5. CSS keywords: `transparent`, `currentColor`, `inherit`, `initial`, `unset`.
 *
 * Defense in depth: rejects values that contain `;`, `{`, `}`, `url(` — the
 * vectors used to break out of the CSS declaration injected by ThemeProvider.
 * `oklch(from ...)` permits a single bare var() identifier and at most ONE
 * level of nested `calc(...)` to keep the surface scoped.
 */

// OKLCH/oklab relative-color or static form.
// Allows: `oklch(0.5 0.2 270)`, `oklch(0.5 0.2 270 / 0.5)`,
//         `oklch(from var(--primary) calc(l - 0.16) c h)`,
//         `oklch(none none none)`, `oklch(from var(--x) l c h / 0.5)`.
const OKLCH_RELATIVE_OR_STATIC =
  String.raw`(?:oklch|oklab)\(\s*` +
  // Optional `from var(--token)` prefix.
  String.raw`(?:from\s+var\(--[a-zA-Z0-9-]+\)\s+)?` +
  // 1+ component tokens: calc(no-nested) | single letter | numeric | `none` | `/`.
  // max()/min() may wrap a calc(); calc() itself stays flat. Single nesting depth.
  String.raw`(?:max\([^(){}]*(?:\([^(){}]*\))?[^(){}]*\)|min\([^(){}]*(?:\([^(){}]*\))?[^(){}]*\)|calc\([^();{}]+\)|[a-z]|-?\d+(?:\.\d+)?%?|none|\/|\s)+` +
  String.raw`\)`;

// Other CSS color functions — conservative content (no nested parens/words).
const CONSERVATIVE_COLOR_FN = String.raw`(?:rgb|rgba|hsl|hsla|lab|lch|color)\(\s*[\d.\s%,/+\-]+\s*\)`;

const HEX = String.raw`#[0-9a-fA-F]{3,8}`;

// HSL split: "H S% L%" or "H S L" (legacy ColorScale convention).
const HSL_SPLIT = String.raw`-?\d+(?:\.\d+)?%?(?:\s+-?\d+(?:\.\d+)?%?){1,3}`;

const VAR_REF = String.raw`var\(--[a-zA-Z0-9-]+(?:\s*,\s*[^();{}]+)?\)`;

const KEYWORDS = String.raw`transparent|currentColor|inherit|initial|unset`;

export const COLOR_VALUE_PATTERN = new RegExp(
  `^(${HEX}|${OKLCH_RELATIVE_OR_STATIC}|${CONSERVATIVE_COLOR_FN}|${HSL_SPLIT}|${VAR_REF}|${KEYWORDS})$`,
);
