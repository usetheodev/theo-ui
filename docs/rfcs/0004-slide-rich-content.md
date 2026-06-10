# RFC 0004 — Slide rich content (Tier 1 + Tier 2 plugins)

| Field | Value |
|---|---|
| Author | paulohenriquevn |
| Date | 2026-05-19 |
| Status | **Implemented** (2026-05-19) |
| Subpath | `@theokit/ui/slide` (Tier 1 baked in) · `@theokit/ui/slide/plugins/{shiki,math,mermaid,emoji}` (Tier 2 opt-in) |
| Plan | `.claude/knowledge-base/plans/slide-rich-content-plan.md` (v1.1) |
| Edge-case review | `.claude/knowledge-base/reviews/edge-cases/slide-rich-content-edge-cases-2026-05-19.md` |
| Depends on | RFC 0002 (Slide), RFC 0003 (SlideDeck) |
| Consumer documented | TheoCode Desktop release-notes deck, TheoKit slide-of-the-day, Theo PaaS incident-summary panel (all pending wire-up). |

## 1. Summary

Extends the `<Slide>` primitive (RFC 0002) and `<SlideDeck>` composite (RFC 0003) with PowerPoint-grade rich content without reinventing parsers. The work splits into two tiers:

- **Tier 1 (baked-in, zero new peer-deps):** GFM alerts (`> [!NOTE]` callouts), 7 frontmatter layouts (`title`, `two-column`, `image-right`, `image-left`, `code-output`, `section`, `default`), background images + gradients (sanitized), Marpit-style `![bg](url)` directives, header/footer/pagination overlays.
- **Tier 2 (opt-in plugins, each a sub-subpath with peer-deps):** Shiki syntax highlighting, KaTeX math (`$inline$` + `$$block$$`), Mermaid diagrams, emoji shortcodes.

The plugin architecture is explicit (no auto-detect): consumers import a plugin factory and pass it via `<Slide plugins={[…]}>` or `<SlideDeck plugins={[…]}>`. Plugins compose mdast/hast transformers, declare sanitize-schema extensions, and inject React component overrides — all under the security barrier (sanitize never bypassed).

## 2. Motivation

The 2026-05-19 visual review confirmed the Slide primitive renders CommonMark/GFM correctly, but the result felt one-dimensional ("just text and tables"). LLMs trained on Marp/Reveal.js + GitHub docs emit alerts, math, syntax-highlighted code, mermaid diagrams, and Marpit `![bg]()` backgrounds naturally — without those, the agent surface looks underpowered next to PowerPoint or Keynote.

Tier 1 ships the highest-impact additions with zero new peer-deps. Tier 2 adds the heavier engines (Shiki, KaTeX, Mermaid) opt-in so the baseline slide bundle stays small.

## 3. Decision

### 3.1 Plugin architecture

`<Slide plugins={SlidePlugin[]}>` is the single extension point. A `SlidePlugin` is:

```ts
interface SlidePlugin {
  name: string;
  mdastTransform?: (tree: MdastRoot) => Promise<MdastRoot> | MdastRoot;
  hastTransform?: (tree: HastRoot) => Promise<HastRoot> | HastRoot;
  components?: Record<string, FC<unknown>>;
  sanitizeSchemaExtension?: { tagNames?: string[]; attributes?: Record<string, string[]> };
}
```

Pipeline order (D13):

```
validateSlide → parseBody → detectAlerts (Tier 1) → extractMarpitBackgrounds (Tier 1)
  → plugin.mdastTransform[…] → mdastToHast → plugin.hastTransform[…]
  → sanitize (defaultSchema + plugin extensions)
  → hastToReact (consumer components + plugin components)
```

Error isolation (D16): every plugin call is `try/catch` wrapped; throws are collected as `errors[]` with `code: "PLUGIN_ERROR"`. The pipeline NEVER throws.

Sanitize-schema merge (D17): plugins that emit non-default tags (Shiki spans, KaTeX MathML, Mermaid SVG) MUST declare `sanitizeSchemaExtension`. Without it, the sanitizer strips the output silently. `getSlideSanitizeSchema(extensions)` merges plugin extensions on top of the baseline (default + Tier 1 `aside`).

### 3.2 Tier 1 features

| Feature | Surface | Mechanism |
|---|---|---|
| GFM alerts | `> [!NOTE]` blockquote | `detectAlerts` walks mdast blockquotes; converts to `<aside class="theo-slide-alert" data-theo-slide-alert-type="…">` via `data.hName` + `hProperties`. 5 types: `note`, `tip`, `important`, `warning`, `caution`. Themed via CSS in `default.css` / `violet-forge.css`. |
| Layout | Frontmatter `layout: title \| two-column \| image-right \| image-left \| code-output \| section` | Applied as `data-theo-slide-layout` attribute on the outer `<section>`. CSS grid templates live in `themes/layouts.css` (imported by both themes). |
| Background image | Frontmatter `backgroundImage: "https://…"` | Validated by `sanitizeBgUrl` (http/https only, no data: URLs — EC-7). Cap 500_000 chars. Applied as inline `style.backgroundImage`. |
| Background gradient | Frontmatter `backgroundGradient: "linear-gradient(…)"` | Validated by prefix regex (`linear-`/`radial-`/`conic-gradient(`). Inline style. |
| Marpit `![bg](url)` | Markdown body | `extractMarpitBackgrounds` walks paragraphs containing a single image whose alt starts with `bg`, drops them from the tree, exposes `ParsedSlide.extractedBackground = { url, modifier }`. Modifiers: `cover`/`fit`/`left`/`right`. URL is sanitized — failures surface `MARPIT_BG_UNSAFE_URL`. **Precedence:** `frontmatter.backgroundImage` > `extractedBackground.url` (D18). |
| Header / Footer / Paginate | Frontmatter `header`/`footer`/`paginate` | Plain text (≤200 chars). Rendered as absolute-positioned overlays inside the slide canvas. CSS lives in `themes/layouts.css`. |

### 3.3 Tier 2 plugins

Each plugin is its own sub-subpath: `@theokit/ui/slide/plugins/{shiki,math,mermaid,emoji}`. tsup multi-entry; peer-deps stay external.

| Plugin | Peer-deps (optional) | Hooks | Key invariants |
|---|---|---|---|
| `shikiPlugin({ themes, langs })` | `shiki` | `hastTransform` walks `<pre><code class="language-XXX">` and replaces with Shiki-rendered HTML | Highlighter cached singleton. Unknown langs pass-through (plain `<pre><code>`). Sanitize ext allows `<span>` with `style`/`className`. |
| `mathPlugin({ katexOptions })` | `katex`, `hast-util-from-html`, `unist-util-visit` | `hastTransform` walks text nodes; replaces `$inline$` + `$$block$$` with KaTeX `renderToString` output | Skips matches inside `<code>`/`<pre>` (regex won't accidentally fire on `$amount` in code). Block math first, then inline (masking overlapping ranges). Sanitize ext lists ≥30 MathML tags (EC-4). |
| `mermaidPlugin({ theme })` | `mermaid` | `hastTransform` swaps `<pre><code class="language-mermaid">` for a `<theo-mermaid source="…">` element; `components["theo-mermaid"]` renders `<MermaidDiagram>` which lazy-imports mermaid and injects SVG via `innerHTML` (mermaid output is trusted) | Render is client-only (mermaid measures DOM). SSR shows source as `<pre>` placeholder + `role="img"` for a11y (EC-10). Error fallback shows source code so PDF print stays readable. Sanitize ext lists ≥30 SVG tags + attributes (EC-4). |
| `emojiPlugin({ extra })` | none (uses existing `unist-util-visit-parents`) | `hastTransform` walks text nodes; replaces `:shortcode:` with Unicode emoji | Skips matches inside `<code>`/`<pre>` via ancestor check (EC-6). 100 baseline emojis. Unknown shortcodes pass through unchanged. |

### 3.4 Bundle isolation

- Barrel `dist/index.js` remains UNCHANGED.
- `dist/slide/index.js` is the Tier 1 + plugin-scaffolding bundle.
- `dist/slide/plugins/{shiki,math,mermaid,emoji}/index.js` are individual bundles — peer-deps externalized, so consumers pay only for plugins they import.
- `package.json#exports` adds the four sub-subpaths; `tsup.config.ts` adds four entries; `scripts/sync-exports.ts` lists them in `ISOLATED_SUBPATHS`.

## 4. Consumer surface

```tsx
import { Slide } from "@theokit/ui/slide";
import "@theokit/ui/slide/themes/default.css";
import { shikiPlugin } from "@theokit/ui/slide/plugins/shiki";
import { mathPlugin } from "@theokit/ui/slide/plugins/math";
import { mermaidPlugin } from "@theokit/ui/slide/plugins/mermaid";
import { emojiPlugin } from "@theokit/ui/slide/plugins/emoji";
import "katex/dist/katex.min.css"; // KaTeX fonts/styles served by consumer

const plugins = [
  emojiPlugin(), // first — text-level substitution
  mathPlugin(), // before shiki: math doesn't collide with code blocks
  mermaidPlugin(), // before shiki: mermaid replaces its <pre> first
  shikiPlugin({ langs: ["ts", "python", "rust"] }), // last
];

const md = `---
layout: two-column
header: "ACME — release notes"
footer: "© 2026"
paginate: true
---

# Q2 release :rocket:

> [!IMPORTANT]
> Migration window: Friday 22h.

Inline math: $E = mc^2$

\`\`\`ts
const greet = (name: string) => \`hi \${name}\`;
\`\`\`

\`\`\`mermaid
graph LR
  A[Build] --> B[Deploy]
\`\`\`
`;

<Slide markdown={md} plugins={plugins} theme="violet-forge" />;
```

## 5. Trade-offs

- **Explicit plugin opt-in over auto-detect** (D1): two extra import lines per consumer, but deterministic bundle + zero magic.
- **Sanitize-schema merge** (D17): each plugin must keep its allow-list in sync with library output (e.g. new KaTeX release adds `<mphantom>` → update). Trade-off accepted vs auto-mirroring whatever the plugin emits (which would be a sanitize bypass in disguise).
- **Marpit `![bg]()` in `ParsedSlide.extractedBackground` not `frontmatter`** (D18): preserves "frontmatter is immutable post-validate" invariant; component reads from two sources with documented precedence.
- **Mermaid render client-only**: SSR shows source code as fallback. Print path also uses the code fallback (PDF cannot run dynamic Mermaid).
- **`data:` URLs rejected for backgroundImage** (EC-7): consumer hosts images externally. Prevents DoS via massive base64 payloads inflating every slide's markdown.

## 6. Non-goals (out of scope this RFC)

- PPTX import / export.
- Custom themes registered at runtime via a `themes` prop (still only the 2 built-in themes; consumers compose their own CSS on top via cascade).
- Twemoji rendering (Unicode-native only; v0.5 may add `slide/plugins/emoji-twemoji`).
- MathJax (KaTeX only; faster, smaller, no peer-dep proliferation).
- Marpit spot directives (`<!-- _class: -->`, `<!-- _color: -->`) — SlideDeck-level v0.5.
- Footnotes / definition lists / superscript — defaultSchema already permits these via raw HTML inline.

## 7. Open questions

- Plugin order is determined by array index, but the EC-9 test case shows `[shiki, emoji]` would emoji-substitute tokens inside highlighted code. EC-6 (ancestor check on code/pre) handles the common case, but recommended order is `[emojiPlugin, mathPlugin, mermaidPlugin, shikiPlugin]`. Document in DEEP DIVE section of README.
- Shiki bundle scales linearly with `langs`: ~50 KB at 5 langs, ~200 KB at 30. Consumers pre-select. Documented in plugin JSDoc.
- KaTeX requires consumer to import `katex/dist/katex.min.css` + fonts. Documented in README "Plugins → Math".

## 8. Risks accepted

- Mermaid theme defaults won't align with Violet Forge palette. v0.5 can add `mermaidPlugin({ themeVariables })` mapping to CSS vars.
- The `<theo-mermaid>` custom element is sanitize-whitelisted; consumers writing literal `<theo-mermaid>` in markdown would bypass code-block detection. Mitigation: defaultSchema already strips raw HTML elements that aren't in the allow-list, but if a future plugin extends in a conflicting way, this becomes a coordination problem. v0.5: namespaced custom element via WC registry.

## 9. Test coverage (post-implementation)

- Phase 0 (plugin foundation): 24 tests (plugin.test.ts + parse.test.ts integration)
- Phase 1 (alerts): 8 tests
- Phases 2/3/5 (schema): 25 tests (slideLayout, sanitizeBgUrl, header/footer/paginate)
- Phase 4 (Marpit bg): 9 tests
- Phase 6 (shiki): 6 tests
- Phase 7 (math): 7 tests
- Phase 8 (mermaid): 7 tests
- Phase 9 (emoji): 10 tests
- Slide component: 32 tests covering layout/bg/header/footer/paginate/plugins
- **Total new + extended: 128 tests** stacked on top of the 95 tests from RFC 0002 and 160 from RFC 0003.
