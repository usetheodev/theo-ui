/**
 * Slide rich-content plugin — KaTeX math rendering.
 *
 * Peer-deps (optional): `katex`, `hast-util-from-html`, `unist-util-visit`.
 * Lazy + opt-in (ADR D10 / D13 of the rich-content plan).
 *
 * Detects `$inline$` and `$$block$$` patterns in hast text nodes and replaces
 * them with KaTeX-rendered HTML. Block math (display mode) is rendered with
 * `displayMode: true` for proper line height + numbering.
 *
 * EC-2: every peer-dep is loaded via dynamic `import()` wrapped in try/catch;
 * a missing peer-dep surfaces via the D16 path (PLUGIN_ERROR) and the math
 * source stays as plain text — slide doesn't break.
 *
 * EC-4: `sanitizeSchemaExtension` lists ~30 MathML tags + KaTeX-specific
 * attributes so the rendered output survives the security barrier (D17).
 *
 * Consumer setup:
 *   import "katex/dist/katex.min.css";
 *   <Slide markdown={md} plugins={[mathPlugin()]} />
 */
import type { Root as HastRoot } from "hast";
import type { SlidePlugin } from "../../plugin.js";

export interface MathPluginOptions {
  /** KaTeX render options forwarded to `renderToString`. */
  katexOptions?: Record<string, unknown>;
}

// EC-4: complete MathML core tag list — KaTeX emits these for fraction, sqrt,
// matrix, sub/super, accents, etc. Plus `<span>`/`<div>` for layout chrome.
const MATHML_TAG_NAMES = [
  "span",
  "div",
  "math",
  "semantics",
  "annotation",
  "annotation-xml",
  // token elements
  "mtext",
  "mn",
  "mo",
  "mi",
  "ms",
  "mglyph",
  // general layout
  "mrow",
  "mfrac",
  "msqrt",
  "mroot",
  "mstyle",
  "merror",
  "mpadded",
  "mphantom",
  "menclose",
  "mspace",
  // scripts & limits
  "msub",
  "msup",
  "msubsup",
  "munder",
  "mover",
  "munderover",
  "mmultiscripts",
  "mprescripts",
  // tables (matrices)
  "mtable",
  "mtr",
  "mtd",
  "mlabeledtr",
];

const MATHML_ATTRIBUTES: Record<string, string[]> = {
  "*": ["style", "className", "ariaHidden", "ariaLabel"],
  span: ["style", "className"],
  math: ["xmlns", "display"],
  annotation: ["encoding"],
  "annotation-xml": ["encoding"],
  mfrac: ["linethickness"],
  mspace: ["width", "height", "depth"],
  mover: ["accent"],
  munder: ["accentunder"],
  mo: ["fence", "form", "lspace", "rspace", "stretchy", "symmetric"],
};

const INLINE_RE = /\$([^$\n]+)\$/g;
const BLOCK_RE = /\$\$([\s\S]+?)\$\$/g;

export function mathPlugin(opts: MathPluginOptions = {}): SlidePlugin {
  let peerDepMissing = false;

  return {
    name: "math",
    sanitizeSchemaExtension: {
      tagNames: MATHML_TAG_NAMES,
      attributes: MATHML_ATTRIBUTES,
    },
    async hastTransform(tree: HastRoot): Promise<HastRoot> {
      if (peerDepMissing) return tree;
      // EC-2: peer-dep guard. Throw on missing import — D16 absorbs into errors[].
      // biome-ignore lint/suspicious/noExplicitAny: katex default export untyped here
      let katex: any;
      // biome-ignore lint/suspicious/noExplicitAny: hast-util-from-html fromHtml untyped here
      let fromHtml: any;
      // biome-ignore lint/suspicious/noExplicitAny: unist-util-visit
      let visit: any;
      try {
        katex = (await import("katex")).default;
        fromHtml = (await import("hast-util-from-html")).fromHtml;
        visit = (await import("unist-util-visit")).visit;
      } catch (e) {
        peerDepMissing = true;
        throw new Error(
          `[slide/plugins/math] peer-deps missing (katex / hast-util-from-html). Run: pnpm add katex hast-util-from-html. Math formulas remain as plain text. Error: ${e instanceof Error ? e.message : String(e)}`,
        );
      }

      // Walk text nodes, find $..$ and $$..$$ patterns, replace with rendered HTML.
      visit(
        tree,
        "text",
        (
          node: { value: string },
          idx: number | undefined,
          parent: { children: unknown[]; tagName?: string } | undefined,
        ) => {
          if (!parent || idx === undefined) return;
          // Skip if the text is inside a code / pre block — math shouldn't
          // accidentally trigger on `$amount = 100$` inside a code sample.
          if (parent.tagName === "code" || parent.tagName === "pre") return;
          const value = node.value;
          const replacements: Array<{
            start: number;
            end: number;
            html: string;
          }> = [];
          // Block math first ($$..$$) so we can mask its ranges before inline scan.
          for (const m of value.matchAll(BLOCK_RE)) {
            if (m.index === undefined) continue;
            try {
              replacements.push({
                start: m.index,
                end: m.index + m[0].length,
                html: katex.renderToString(m[1], {
                  ...(opts.katexOptions ?? {}),
                  displayMode: true,
                  throwOnError: false,
                }),
              });
            } catch {
              // Malformed TeX — KaTeX may throw with throwOnError:true. Skip.
            }
          }
          for (const m of value.matchAll(INLINE_RE)) {
            if (m.index === undefined) continue;
            // Avoid re-processing inline matches that fall inside a block range.
            if (replacements.some((r) => (m.index ?? 0) >= r.start && (m.index ?? 0) < r.end))
              continue;
            try {
              replacements.push({
                start: m.index,
                end: m.index + m[0].length,
                html: katex.renderToString(m[1], {
                  ...(opts.katexOptions ?? {}),
                  displayMode: false,
                  throwOnError: false,
                }),
              });
            } catch {
              // skip
            }
          }
          if (replacements.length === 0) return;
          replacements.sort((a, b) => a.start - b.start);
          const newChildren: unknown[] = [];
          let cursor = 0;
          for (const r of replacements) {
            if (r.start > cursor) {
              newChildren.push({ type: "text", value: value.slice(cursor, r.start) });
            }
            const fragment = fromHtml(r.html, { fragment: true });
            newChildren.push(...fragment.children);
            cursor = r.end;
          }
          if (cursor < value.length) {
            newChildren.push({ type: "text", value: value.slice(cursor) });
          }
          parent.children.splice(idx, 1, ...newChildren);
          return idx + newChildren.length;
        },
      );
      return tree;
    },
  };
}
