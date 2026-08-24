/**
 * GFM alerts post-processor — converts `> [!NOTE]` blockquotes into
 * `<aside class="theo-slide-alert" data-theo-slide-alert-type="...">` (ADR D3 of
 * the slide-rich-content plan).
 *
 * GitHub Flavored Markdown introduced this convention in 2023 for callouts.
 * `remark-gfm` (already in our dep tree) parses the blockquote but does NOT
 * distinguish alerts from regular blockquotes. We post-process the mdast tree
 * to detect the canonical marker and annotate with `hName` + `hProperties` so
 * `mdast-util-to-hast` emits the desired hast element.
 *
 * Five tag families are supported, mirroring GitHub:
 *   - NOTE      (info / blue)
 *   - TIP       (success / green)
 *   - IMPORTANT (purple)
 *   - WARNING   (yellow)
 *   - CAUTION   (red)
 *
 * Case-insensitive. Marker is stripped from the rendered text. Regular
 * blockquotes (without `[!TYPE]` prefix) are left untouched.
 */
import type { Blockquote, Paragraph, Root, Text } from "mdast";

/** Canonical alert types — used by CSS via `data-theo-slide-alert-type="..."`. */
export const ALERT_TYPES = ["note", "tip", "important", "warning", "caution"] as const;
export type AlertType = (typeof ALERT_TYPES)[number];

const ALERT_RE = /^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\][ \t]*(?:\r?\n|$)/i;

/**
 * Walk a mdast tree and mutate any blockquote that opens with `[!TYPE]` into
 * an `<aside>` annotation. Mutation is in-place to keep the pipeline allocation
 * profile flat; the same tree is returned for chainability.
 */
export function detectAlerts(tree: Root): Root {
  for (const node of tree.children) {
    if (node.type !== "blockquote") continue;
    transformIfAlert(node);
  }
  return tree;
}

function transformIfAlert(node: Blockquote): void {
  const firstChild = node.children[0];
  if (!firstChild || firstChild.type !== "paragraph") return;
  const paragraph = firstChild as Paragraph;
  const firstInline = paragraph.children[0];
  if (!firstInline || firstInline.type !== "text") return;
  const text = firstInline as Text;
  const match = ALERT_RE.exec(text.value);
  if (!match) return;

  const matched = match[1];
  if (!matched) return;
  const type = matched.toLowerCase() as AlertType;

  // Strip the marker from the rendered text.
  text.value = text.value.replace(ALERT_RE, "");
  // If the first inline became empty, drop it so the paragraph doesn't render
  // an empty leading line.
  if (text.value === "" && paragraph.children.length > 1) {
    paragraph.children.shift();
  }
  // Annotate so mdast-util-to-hast emits <aside> with the data attribute.
  node.data = {
    ...node.data,
    hName: "aside",
    hProperties: {
      ...((node.data as { hProperties?: Record<string, unknown> })?.hProperties ?? {}),
      className: ["theo-slide-alert"],
      "data-theo-slide-alert-type": type,
    },
  };
}
