/**
 * Lightweight, dependency-free extractor that separates YAML frontmatter from
 * the markdown body.
 *
 * Strips a leading BOM (`﻿`) before matching the regex — common when
 * markdown is pasted from Word/Notion. See plan ADR D14 and edge-case EC-4.
 *
 * Returns `{ rawFrontmatter, body, tooLarge? }`:
 *   - `rawFrontmatter`: the YAML string between the two `---` delimiters, or
 *     `null` if no frontmatter is present.
 *   - `body`: the markdown after the closing `---\n` (or the full input when
 *     no frontmatter).
 *   - `tooLarge`: `true` if `rawFrontmatter` exceeds `MAX_RAW_FRONTMATTER`
 *     bytes — the caller turns this into `FRONTMATTER_TOO_LARGE`.
 */

/** Maximum size of the raw frontmatter string before YAML parsing. 10 KB cap. */
export const MAX_RAW_FRONTMATTER = 10_240;

const FRONTMATTER_RE = /^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/;
const BOM = "﻿";

export interface ExtractFrontmatterResult {
  rawFrontmatter: string | null;
  body: string;
  tooLarge?: boolean;
}

export function extractFrontmatter(md: string): ExtractFrontmatterResult {
  const normalized = md.startsWith(BOM) ? md.slice(1) : md;
  const match = FRONTMATTER_RE.exec(normalized);
  if (!match) {
    return { rawFrontmatter: null, body: normalized };
  }
  const raw = match[1] ?? "";
  const body = match[2] ?? "";
  if (raw.length > MAX_RAW_FRONTMATTER) {
    return { rawFrontmatter: raw, body, tooLarge: true };
  }
  return { rawFrontmatter: raw, body };
}
