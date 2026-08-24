/**
 * Speaker notes extractor (ADR D11).
 *
 * Sintaxe: HTML comments `<!-- notes: ... -->` ou `<!-- note: ... -->`.
 * Aceita ambos singular e plural. Texto interno é plain (sem markdown nesting
 * em v0.4 — pode vir em v0.5).
 *
 * Returns the body with comments removed and the aggregated notes string.
 */

const NOTES_RE = /<!--\s*notes?:\s*([\s\S]*?)\s*-->/gi;

export interface ExtractNotesResult {
  body: string;
  notes: string | undefined;
}

export function extractNotes(md: string): ExtractNotesResult {
  const matches = [...md.matchAll(NOTES_RE)];
  if (matches.length === 0) {
    return { body: md, notes: undefined };
  }
  const notes = matches
    .map((m) => (m[1] ?? "").trim())
    .filter((s) => s.length > 0)
    .join("\n\n");
  const body = md.replace(NOTES_RE, "").trim();
  return { body, notes: notes.length > 0 ? notes : undefined };
}
