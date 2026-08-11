---
type: Component Reference
title: Slide plugins — shiki, math, mermaid, emoji
description: The four opt-in Tier 2 plugins, their peer-deps, ordering rule, and the sanitize-extension obligation every plugin carries.
tags: [engine, slide, plugins, shiki, katex, mermaid, sanitize]
sources:
  - id: rfc-0004
    resource: "git:94d9b11:docs/rfcs/0004-slide-rich-content.md"
generated:
  by: "claude-code/opus-5"
  at: "2026-08-11"
status: stable
---

# The two tiers

**Tier 1** is baked into `@theokit/ui/slide` with zero new peer-deps: GFM alerts, seven
layouts, backgrounds and gradients, Marpit `![bg](url)`, header/footer/pagination. Nothing
to install, nothing to configure — documented in [`/engines/slide.md`](/engines/slide.md).

**Tier 2** is these four plugins, each its own sub-subpath with externalized peer-deps.
Opt-in by design, so the baseline slide bundle stays small.

# The four plugins

| Plugin | Import | Peer-deps |
| --- | --- | --- |
| `shikiPlugin({ themes, langs })` | `@theokit/ui/slide/plugins/shiki` | `shiki` |
| `mathPlugin({ katexOptions })` | `@theokit/ui/slide/plugins/math` | `katex`, `hast-util-from-html`, `unist-util-visit` |
| `mermaidPlugin({ theme })` | `@theokit/ui/slide/plugins/mermaid` | `mermaid` |
| `emojiPlugin({ extra })` | `@theokit/ui/slide/plugins/emoji` | none |

# Usage

```tsx
import { Slide } from "@theokit/ui/slide";
import "@theokit/ui/slide/themes/default.css";
import { emojiPlugin } from "@theokit/ui/slide/plugins/emoji";
import { mathPlugin } from "@theokit/ui/slide/plugins/math";
import { mermaidPlugin } from "@theokit/ui/slide/plugins/mermaid";
import { shikiPlugin } from "@theokit/ui/slide/plugins/shiki";
import "katex/dist/katex.min.css";   // consumer serves KaTeX fonts/styles

const plugins = [
  emojiPlugin(),                                  // text-level substitution first
  mathPlugin(),                                   // before shiki — no collision with code
  mermaidPlugin(),                                // before shiki — replaces its <pre> first
  shikiPlugin({ langs: ["ts", "python", "rust"] }), // last
];

<Slide markdown={md} plugins={plugins} theme="violet-forge" />
```

`<SlideDeck>` accepts and relays the same `plugins` prop.

## Ordering matters

Plugin order is array index. **The recommended order is
`[emojiPlugin, mathPlugin, mermaidPlugin, shikiPlugin]`.**

Running `[shiki, emoji]` would emoji-substitute tokens inside already-highlighted code.
Each plugin also carries an ancestor check that skips `<code>` and `<pre>` subtrees, which
handles the common case, but the order above avoids the class of problem entirely.

# Per-plugin behavior

## `shikiPlugin`

Walks `<pre><code class="language-XXX">` in the hast tree and replaces it with Shiki-rendered
HTML. The highlighter is cached as a singleton. Unknown languages pass through as plain
`<pre><code>` rather than failing.

**Bundle scales linearly with `langs`** — roughly 50 KB at 5 languages, 200 KB at 30.
Consumers pre-select.

## `mathPlugin`

Walks text nodes, replacing `$inline$` and `$$block$$` with KaTeX `renderToString` output.
Block math resolves before inline, masking overlapping ranges. Matches inside `<code>` and
`<pre>` are skipped, so `$amount` in a code sample never renders as math.

Its sanitize extension lists 30+ MathML tags. The consumer must import
`katex/dist/katex.min.css` — the plugin does not ship fonts.

## `mermaidPlugin`

Swaps `<pre><code class="language-mermaid">` for a `<theo-mermaid source="…">` element;
`components["theo-mermaid"]` renders a component that lazy-imports mermaid and injects the
SVG.

**Client-only** — mermaid measures the DOM. SSR shows the source as a `<pre>` placeholder
with `role="img"` for accessibility. The error fallback also shows the source, which is what
keeps PDF print readable.

Sanitize extension lists 30+ SVG tags and attributes.

## `emojiPlugin`

Replaces `:shortcode:` with Unicode emoji across text nodes. 100 baseline shortcodes;
unknown ones pass through unchanged. Skips `<code>` and `<pre>` via an ancestor check, so
shortcodes inside code samples stay literal.

No peer-deps — it reuses `unist-util-visit-parents`, already present.

# Writing a plugin

```ts
interface SlidePlugin {
  name: string;
  mdastTransform?: (tree: MdastRoot) => Promise<MdastRoot> | MdastRoot;
  hastTransform?: (tree: HastRoot) => Promise<HastRoot> | HastRoot;
  components?: Record<string, FC<unknown>>;
  sanitizeSchemaExtension?: { tagNames?: string[]; attributes?: Record<string, string[]> };
}
```

Two obligations:

1. **Declare `sanitizeSchemaExtension` for any non-default tag you emit.** Sanitize runs
   after every transform. Without the declaration your output is silently stripped, and the
   symptom looks like "the plugin does nothing".
2. **Expect to be wrapped in `try/catch`.** A throw is collected as `PLUGIN_ERROR` and the
   content degrades to plain markdown. The pipeline never throws, so a broken plugin cannot
   take down the slide — but it also will not announce itself loudly. Check `errors[]`.

Keeping the allow-list in sync with the wrapped library is real maintenance: a new KaTeX
release adding `<mphantom>` means updating the extension. That burden was accepted
deliberately, because the alternative — auto-mirroring whatever a plugin emits — is a
sanitize bypass in disguise.
