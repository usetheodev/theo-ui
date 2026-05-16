/**
 * safeHref — defang `javascript:`, `vbscript:`, and `data:text/html` URIs.
 *
 * T3.3 (Security SEC-003). When a consumer passes user-controlled data as
 * an href to one of our card composites (`ProjectCard.href`, `PreviewEnvCard.url`,
 * etc.), an attacker who controls that data can craft a `javascript:alert(...)`
 * URI that fires in the application's origin on click. This is a standard
 * component-library hardening (mitigation also documented in `SECURITY.md`).
 *
 * Returns `undefined` for dangerous protocols so the consuming component
 * can short-circuit to a non-link rendering. Returns the URL unchanged for
 * safe protocols (`http`, `https`, `mailto`, `tel`, relative paths).
 *
 * Allowed (returns input unchanged):
 *   - "https://example.com/path?query"
 *   - "/internal/route"
 *   - "mailto:dev@usetheo.dev"
 *   - "tel:+15551234567"
 *
 * Blocked (returns undefined):
 *   - "javascript:alert(1)" — XSS via JS execution
 *   - " JavaScript:alert(1)" — case-insensitive, leading whitespace
 *   - "vbscript:msgbox(1)" — legacy IE XSS surface (still relevant on
 *     certain enterprise envs)
 *   - "data:text/html,..." — inline HTML/script payloads
 */

const DANGEROUS_PROTOCOL_PATTERNS: readonly RegExp[] = [
  /^javascript:/i,
  /^vbscript:/i,
  /^data:text\/html/i,
];

export function safeHref(url: string | null | undefined): string | undefined {
  if (url === null || url === undefined) return undefined;
  const trimmed = url.trim();
  if (trimmed.length === 0) return undefined;
  for (const pattern of DANGEROUS_PROTOCOL_PATTERNS) {
    if (pattern.test(trimmed)) return undefined;
  }
  return url;
}
