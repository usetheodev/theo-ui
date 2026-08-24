/**
 * Streaming-safe markdown preprocessor.
 *
 * When markdown arrives token-by-token from an LLM, the tail of the buffer
 * is almost always mid-token: `**bold` (unclosed), `[link` (no `]`), an
 * unterminated ` ```fence`, an unfinished `$math$`. A vanilla markdown
 * parser treats those as literal text — the user sees `**bold` instead of
 * **bold** for the few hundred ms until the matching token arrives. This
 * "flash" is the single biggest UX defect of naïve streaming markdown
 * (cf. Streamdown's design note).
 *
 * The trick — adopted from Streamdown (MIT, vercel) and re-implemented
 * here — is to NEVER mutate the original buffer (the model's authoritative
 * stream), but to feed a TRANSIENTLY auto-closed copy to the parser. When
 * the next token actually closes the syntax, the temporary close was a
 * no-op and the real one takes over.
 *
 * Scope:
 *   - bold/italic markers: `**`, `__`, `*`, `_`
 *   - inline code: single backtick `` ` ``
 *   - fenced code: triple-backtick (with optional language)
 *   - inline math: `$` … `$`
 *   - block math: `$$` … `$$`
 *   - links: `[text](url)` — close the `)` if missing
 *
 * Out of scope (yet):
 *   - reference-style links `[text][ref]` — rare in LLM output
 *   - HTML tags — Tailwind v4 already sanitizes downstream
 *   - tables — partial tables render OK as plain text mid-stream
 */

/**
 * Auto-close incomplete markdown tokens in the tail of a streaming buffer.
 * Returns a copy that's safe to pass to the parser; the original buffer
 * stays untouched.
 *
 * `isStreaming = false` short-circuits (returns input unchanged) — the
 * close-tokens are only synthesized while content is still arriving.
 */
export function preprocessStreaming(markdown: string, isStreaming = true): string {
  if (!isStreaming) return markdown;

  let buf = markdown;

  /* ─── Fenced code blocks (highest priority — they swallow everything) */
  // If there's an odd number of ``` runs, the last fence is unclosed.
  const fenceCount = countTripleBackticks(buf);
  if (fenceCount % 2 === 1) {
    // Add a newline + closing fence so the parser sees a complete block.
    buf = `${buf.endsWith("\n") ? buf : `${buf}\n`}\`\`\``;
    // Once inside an unclosed fence the rest of the rules don't apply —
    // everything is code text.
    return buf;
  }

  /* ─── Block math `$$ … $$` (also greedy) */
  const blockMathCount = countOccurrences(buf, "$$");
  if (blockMathCount % 2 === 1) {
    buf = `${buf}$$`;
    return buf;
  }

  /* ─── Inline code, single backticks */
  const inlineBackticks = countSingleBackticks(buf);
  if (inlineBackticks % 2 === 1) {
    buf = `${buf}\``;
  }

  /* ─── Inline math `$ … $` (avoid double-counting `$$`) */
  const inlineDollars = countSingleDollars(buf);
  if (inlineDollars % 2 === 1) {
    buf = `${buf}$`;
  }

  /* ─── Emphasis pairs */
  // Order matters: close longer markers before shorter (`**` before `*`).
  for (const marker of ["**", "__", "*", "_"]) {
    if (countMarker(buf, marker) % 2 === 1) {
      buf = `${buf}${marker}`;
    }
  }

  /* ─── Links: `[text](url)` — close the URL paren if missing.
   * Cheap heuristic: find the last `[` after the last `]`, and the last
   * `(` after that with no matching `)`.
   */
  buf = closeUnclosedLink(buf);

  return buf;
}

/* ─── Counting helpers (avoid regex global-state pitfalls) ───────────── */

function countTripleBackticks(s: string): number {
  let count = 0;
  let i = 0;
  while (i < s.length) {
    if (s[i] === "`" && s[i + 1] === "`" && s[i + 2] === "`") {
      count++;
      i += 3;
    } else {
      i++;
    }
  }
  return count;
}

function countSingleBackticks(s: string): number {
  // Count ` characters that are NOT part of a ``` run.
  let count = 0;
  let i = 0;
  while (i < s.length) {
    if (s[i] === "`") {
      if (s[i + 1] === "`" && s[i + 2] === "`") {
        i += 3; // skip whole triple
        continue;
      }
      count++;
    }
    i++;
  }
  return count;
}

function countOccurrences(s: string, needle: string): number {
  if (needle.length === 0) return 0;
  let count = 0;
  let i = s.indexOf(needle);
  while (i !== -1) {
    count++;
    i = s.indexOf(needle, i + needle.length);
  }
  return count;
}

function countSingleDollars(s: string): number {
  // Single `$` that is NOT part of `$$`.
  let count = 0;
  let i = 0;
  while (i < s.length) {
    if (s[i] === "$") {
      if (s[i + 1] === "$") {
        i += 2; // skip whole pair
        continue;
      }
      // also skip escaped \$
      if (i > 0 && s[i - 1] === "\\") {
        i++;
        continue;
      }
      count++;
    }
    i++;
  }
  return count;
}

function countMarker(s: string, marker: string): number {
  if (marker.length === 0) return 0;
  // For single-char markers (`*`, `_`), don't count double sequences as 2 —
  // they ARE the double marker. For double-char markers, count occurrences
  // and the single-marker pass below handles leftovers.
  if (marker.length === 1) {
    let count = 0;
    let i = 0;
    while (i < s.length) {
      if (s[i] === marker) {
        if (s[i + 1] === marker) {
          // Part of double marker — skip both.
          i += 2;
          continue;
        }
        if (i > 0 && s[i - 1] === "\\") {
          i++;
          continue;
        }
        count++;
      }
      i++;
    }
    return count;
  }
  // Multi-char marker (`**`, `__`).
  let count = 0;
  let i = 0;
  while (i <= s.length - marker.length) {
    if (s.substring(i, i + marker.length) === marker) {
      count++;
      i += marker.length;
    } else {
      i++;
    }
  }
  return count;
}

function closeUnclosedLink(s: string): string {
  // Look for the trailing structure `[…](…` with no closing `)`.
  const lastOpenParen = s.lastIndexOf("(");
  const lastCloseParen = s.lastIndexOf(")");
  if (lastOpenParen === -1 || lastOpenParen <= lastCloseParen) return s;

  // The `(` must be immediately preceded by `]` to be a link.
  if (s[lastOpenParen - 1] !== "]") return s;

  // Confirm there's a `[` before that `]`.
  const closingBracket = lastOpenParen - 1;
  const openingBracket = s.lastIndexOf("[", closingBracket - 1);
  if (openingBracket === -1) return s;

  // Close it.
  return `${s})`;
}
