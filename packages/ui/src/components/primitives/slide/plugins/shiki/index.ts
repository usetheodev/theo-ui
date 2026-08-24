/**
 * Slide rich-content plugin — Shiki syntax highlighting.
 *
 * Lazy + opt-in (ADR D9, D13 of the rich-content plan). Peer-dep `shiki` is
 * declared optional in `package.json`; the plugin guards every dynamic import
 * so a missing peer-dep is reported (D16) rather than crashing the slide.
 *
 * Pipeline contribution:
 *   - `hastTransform`: walks `<pre><code class="language-XXX">` nodes, replaces
 *     them with the pre-rendered `<pre><code>` tree emitted by Shiki.
 *   - `sanitizeSchemaExtension`: allows `<span>` with `style` and `class`
 *     (Shiki emits inline styles for tokens).
 *
 * Performance:
 *   - Highlighter is created lazily on first use and cached.
 *   - Grammars listed in `langs` are pre-loaded once; unknown langs pass-through
 *     as plain `<pre><code>` (defaultSchema allows that).
 *
 * @example
 *   import { shikiPlugin } from "@theokit/ui/slide/plugins/shiki";
 *   import "shiki";  // installed as peer-dep
 *   <Slide markdown={md} plugins={[shikiPlugin({ langs: ["ts","python"] })]} />
 */
import type { Element, Root as HastRoot } from "hast";
import type { SlidePlugin } from "../../plugin.js";

export interface ShikiPluginOptions {
  /** Dual-theme map — light/dark Shiki theme names. Defaults to `github-light` / `github-dark`. */
  themes?: { light: string; dark: string };
  /** Languages to pre-load. Unknown languages pass-through. Defaults to a tech-stack baseline. */
  langs?: string[];
}

const DEFAULT_LANGS = [
  "ts",
  "tsx",
  "js",
  "jsx",
  "python",
  "go",
  "rust",
  "java",
  "json",
  "yaml",
  "bash",
  "shell",
  "html",
  "css",
  "sql",
  "markdown",
];

export function shikiPlugin(opts: ShikiPluginOptions = {}): SlidePlugin {
  const themes = opts.themes ?? { light: "github-light", dark: "github-dark" };
  const langs = opts.langs ?? DEFAULT_LANGS;
  // biome-ignore lint/suspicious/noExplicitAny: shiki has no exported type for `Highlighter` at the top level
  let highlighter: any = null;
  let peerDepMissing = false;

  // biome-ignore lint/suspicious/noExplicitAny: shiki Highlighter is untyped here
  async function getHighlighter(): Promise<any> {
    if (highlighter) return highlighter;
    if (peerDepMissing) return null;
    try {
      const shiki = await import("shiki");
      highlighter = await shiki.createHighlighter({
        themes: [themes.light, themes.dark],
        langs,
      });
      return highlighter;
    } catch (e) {
      peerDepMissing = true;
      // Surface via D16 path (composePlugins catches → PLUGIN_ERROR).
      throw new Error(
        `[slide/plugins/shiki] peer-dep 'shiki' not installed or failed to load. Run: pnpm add shiki. Original: ${e instanceof Error ? e.message : String(e)}`,
      );
    }
  }

  return {
    name: "shiki",
    sanitizeSchemaExtension: {
      tagNames: ["span", "pre", "code"],
      // Shiki emits inline `style` and `class` on tokens; "*" applies to every tag.
      attributes: {
        "*": ["style", "className"],
        pre: ["style", "className", "tabIndex"],
        code: ["style", "className"],
        span: ["style", "className"],
      },
    },
    async hastTransform(tree: HastRoot): Promise<HastRoot> {
      const hl = await getHighlighter();
      if (!hl) return tree; // peer-dep missing AND we've already reported it once
      const { visit } = await import("unist-util-visit");
      const { fromHtml } = await import("hast-util-from-html");
      // Walk: find <code class="language-XXX">, replace its parent <pre> subtree
      // with the highlighted output (which is also a <pre><code>...</code></pre>).
      // biome-ignore lint/suspicious/noExplicitAny: hast unist-util-visit untyped here
      visit(tree, "element", (node: Element, _idx: number | undefined, parent: any) => {
        if (node.tagName !== "code") return;
        const className = (node.properties?.className as string[] | undefined) ?? [];
        const langClass = className.find((c) => c.startsWith("language-"));
        if (!langClass) return;
        const lang = langClass.replace("language-", "");
        if (!langs.includes(lang)) return;
        const first = node.children?.[0];
        const codeText = first && first.type === "text" ? first.value : "";
        let html: string;
        try {
          html = hl.codeToHtml(codeText, { lang, themes });
        } catch {
          // Shiki failed on this snippet (e.g. malformed input). Leave the plain
          // <pre><code> in place — the consumer still gets readable text.
          return;
        }
        const newTree = fromHtml(html, { fragment: true });
        const top = newTree.children[0];
        if (parent?.tagName === "pre" && parent.children?.length === 1 && top) {
          Object.assign(parent, top);
        }
      });
      return tree;
    },
  };
}
