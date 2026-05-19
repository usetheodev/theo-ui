/**
 * Split a markdown string into individual slides at top-level `thematicBreak`s.
 *
 * Mirrors the Slide primitive's `detectMultiSlide` algorithm (D12 of RFC 0002),
 * but returns ALL slides instead of truncating.
 *
 * ADR D15: strips global frontmatter FIRST so the leading `---\n...\n---\n`
 * delimiter is not parsed as a `thematicBreak` (which would yield a phantom
 * empty slide #0).
 *
 * The first slide may have its own frontmatter (kept attached); subsequent
 * slides do not parse frontmatter again (consumer's `<Slide markdown>` does
 * per-slide validation).
 */
import { extractFrontmatter } from "../../primitives/slide/index.js";
import { extractNotes } from "./notes.js";
import type { SlideDeckSlide } from "./schema.js";

export async function splitDeck(markdown: string): Promise<SlideDeckSlide[]> {
  // D15: strip leading global frontmatter so its `---` delimiters are not
  // mistaken for slide separators.
  const { body: bodyAfterFM } = extractFrontmatter(markdown);

  if (bodyAfterFM.trim().length === 0) {
    return [];
  }

  const { fromMarkdown } = await import("mdast-util-from-markdown");
  const tree = fromMarkdown(bodyAfterFM);

  const breakOffsets: number[] = [];
  for (const node of tree.children) {
    if (node.type === "thematicBreak") {
      const start = node.position?.start.offset;
      const end = node.position?.end.offset;
      if (typeof start === "number" && typeof end === "number") {
        breakOffsets.push(start);
        breakOffsets.push(end);
      }
    }
  }

  if (breakOffsets.length === 0) {
    // Single-slide deck.
    const { body, notes } = extractNotes(bodyAfterFM);
    if (body.trim().length === 0 && !notes) return [];
    return [{ markdown: body, notes }];
  }

  // Build ranges between (or excluding) the `---` tokens.
  const slides: SlideDeckSlide[] = [];
  const positions: number[] = [0];
  // breakOffsets is [start0, end0, start1, end1, ...]. We want to skip the
  // `---` itself but include the content between them.
  for (let i = 0; i < breakOffsets.length; i += 2) {
    const start = breakOffsets[i];
    const end = breakOffsets[i + 1];
    if (typeof start === "number") positions.push(start);
    if (typeof end === "number") positions.push(end);
  }
  positions.push(bodyAfterFM.length);

  // Pair adjacent positions to form slide ranges (skip the `---` segments).
  for (let i = 0; i < positions.length - 1; i += 2) {
    const start = positions[i];
    const end = positions[i + 1];
    if (typeof start !== "number" || typeof end !== "number") continue;
    const chunk = bodyAfterFM.slice(start, end).trim();
    if (chunk.length === 0) continue;
    const { body, notes } = extractNotes(chunk);
    if (body.trim().length === 0 && !notes) continue;
    slides.push({ markdown: body, notes });
  }

  return slides;
}
