/**
 * Marpit-style `![bg](url)` background syntax detector.
 *
 * Marpit popularised the convention of declaring a slide background via a
 * standalone image whose alt-text starts with `bg`:
 *
 *     ![bg](https://example.com/photo.jpg)
 *     ![bg cover](url)   ![bg fit](url)   ![bg left](url)   ![bg right](url)
 *
 * LLMs trained on Marp output emit this naturally, so the slide primitive
 * adopts the same surface — but in a STRICTLY safe way:
 *
 * 1. Only triggers when the paragraph contains a SINGLE image (avoids
 *    collisions with inline images mixed with text).
 * 2. First-bg-wins (multiple `![bg]` directives in one slide → only the first
 *    is honoured; the others are also dropped from the tree to prevent
 *    duplicate rendering).
 * 3. The extracted result goes into `ParsedSlide.extractedBackground` (D18 /
 *    EC-5) and the Slide component prefers an explicit `frontmatter.backgroundImage`
 *    over the Marpit extraction.
 * 4. URL sanitization happens at the caller (`parseSlide`) via `sanitizeBgUrl`.
 */
import type { Image, Paragraph, Root } from "mdast";

const BG_ALT_RE = /^bg(?:\s+(\w+))?/i;

const VALID_MODIFIERS = new Set(["cover", "fit", "left", "right"]);

export interface ExtractedMarpitBackground {
  url: string;
  modifier?: "cover" | "fit" | "left" | "right";
}

/**
 * Walk the mdast tree, extract the first `![bg](url)` directive, drop ALL
 * matching paragraphs from the tree. Returns a new tree (children array
 * is filtered; node identities are preserved otherwise).
 */
export function extractMarpitBackgrounds(tree: Root): {
  tree: Root;
  background?: ExtractedMarpitBackground;
} {
  let background: ExtractedMarpitBackground | undefined;
  const filteredChildren = tree.children.filter((node) => {
    if (node.type !== "paragraph") return true;
    const p = node as Paragraph;
    // Single-child guard: paragraphs with mixed content (text + image) are
    // kept as-is — only "image-only" paragraphs are candidates.
    if (p.children.length !== 1) return true;
    const child = p.children[0];
    if (!child || child.type !== "image") return true;
    const img = child as Image;
    const match = BG_ALT_RE.exec(img.alt ?? "");
    if (!match) return true;
    // Capture once; drop subsequent bg paragraphs to avoid duplicate output.
    if (!background) {
      const modifierRaw = match[1]?.toLowerCase();
      const modifier =
        modifierRaw && VALID_MODIFIERS.has(modifierRaw)
          ? (modifierRaw as "cover" | "fit" | "left" | "right")
          : undefined;
      background = {
        url: img.url,
        modifier,
      };
    }
    return false; // drop this paragraph from the tree
  });
  return {
    tree: { ...tree, children: filteredChildren },
    background,
  };
}
