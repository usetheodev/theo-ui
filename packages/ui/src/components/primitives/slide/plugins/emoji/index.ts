/**
 * Slide rich-content plugin — Unicode emoji shortcodes.
 *
 * Zero peer-deps for runtime (only unist-util-visit-parents which is part of
 * the existing slide stack tree). Substitutes `:shortcode:` patterns with the
 * matching Unicode emoji from the embedded map.
 *
 * EC-6: uses `visitParents` with an ancestor check so shortcodes inside
 * `<code>` / `<pre>` are NEVER replaced. This prevents corruption of code
 * samples that legitimately use `:colon:syntax` (Python type hints, YAML
 * keys, Ruby symbols, JSX self-closing, etc.).
 *
 * Unknown shortcodes pass through unchanged (`:foo:` stays as text).
 */
import type { Root as HastRoot } from "hast";
import type { SlidePlugin } from "../../plugin.js";
import { EMOJI_MAP } from "./map.js";

const SHORTCODE_RE = /:([a-z0-9_+-]+):/g;

/**
 * Return true when any ancestor element is `<code>` or `<pre>`. Used to skip
 * emoji replacement inside code samples (EC-6).
 */
function isInsideCodeOrPre(ancestors: ReadonlyArray<{ type: string; tagName?: string }>): boolean {
  for (let i = ancestors.length - 1; i >= 0; i--) {
    const a = ancestors[i];
    if (!a || a.type !== "element") continue;
    if (a.tagName === "code" || a.tagName === "pre") return true;
  }
  return false;
}

export interface EmojiPluginOptions {
  /** Override or extend the default emoji map. Merged on top of the built-in 100. */
  extra?: Record<string, string>;
}

export function emojiPlugin(opts: EmojiPluginOptions = {}): SlidePlugin {
  const map = { ...EMOJI_MAP, ...(opts.extra ?? {}) };
  return {
    name: "emoji",
    async hastTransform(tree: HastRoot): Promise<HastRoot> {
      const { visitParents } = await import("unist-util-visit-parents");
      visitParents(
        tree,
        "text",
        (node: { value: string }, ancestors: Array<{ type: string; tagName?: string }>) => {
          if (isInsideCodeOrPre(ancestors)) return;
          node.value = node.value.replace(SHORTCODE_RE, (match, code: string) => {
            const replacement = map[code.toLowerCase()];
            return replacement ?? match;
          });
        },
      );
      return tree;
    },
  };
}

export { EMOJI_MAP };
