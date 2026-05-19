/**
 * Progressive fragments detector (ADR D12).
 *
 * Marpit convention: lists with `*` (asterisco) marker — instead of `-` or `+`
 * — become fragment-revealed lists. Each item is a step.
 *
 * Implementation: regex pre-pass on raw markdown counts top-of-line `* ` markers.
 * Decision (EC-9): mixed `*` and `-` in the same list is rare; we count ONLY
 * `* ` items as fragments. Plain `- item` lists remain non-fragmented.
 *
 * v0.4: counts only. CSS attribute application happens at render time inside
 * `<SlideDeck.Slides>`, post-parse, by walking the rendered DOM.
 */

const FRAGMENT_MARKER_RE = /^\s*\*\s+\S/gm;

/**
 * Count fragment markers in raw markdown.
 *
 * Detects only `*` at start of a line followed by space + non-whitespace.
 * Avoids matching `**bold**`, `*italic*`, or `_ * _` patterns.
 */
export function countFragmentsInMarkdown(markdown: string): number {
  if (!markdown) return 0;
  // Strip fenced code blocks first to avoid counting * inside code.
  const stripped = markdown.replace(/```[\s\S]*?```/g, "");
  const matches = stripped.match(FRAGMENT_MARKER_RE);
  return matches ? matches.length : 0;
}
