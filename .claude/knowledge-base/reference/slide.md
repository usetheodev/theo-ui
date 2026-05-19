# Reference: Slide

**Date:** 2026-05-19
**Depth:** exhaustive
**Project:** `@usetheo/ui` v0.1.0-next.0 (TheoUI / Violet Forge)
**Project language:** TypeScript (primary) + React 18 (peer) + Tailwind CSS + SCSS-free (vanilla CSS via tokens)
**Project layout:** Single package, `src/components/primitives/{name}/` + `src/components/composites/{name}/`. Subpath barrel exports declared in `package.json#exports`.
**Sources analyzed:**
- **Local clone (Source A):** `referencia/marp/` — Marp marketing-website workspace (NOT the Marpit engine; engine lives in separate marp-team repos). Contains real React+remark composition code that consumes `@marp-team/marp-core`.
- **Local code (project-self):** `src/components/primitives/whiteboard/` — direct precedent for the subpath-isolated, view-only, JSON-driven primitive pattern.
- **Remote (Source C):** Marpit core, Marp-Core, Marp React (deprecated), Reveal.js — fetched live via raw.githubusercontent.com / `gh api`.
- **External docs (Source D):** Marpit docs/directives.md, mdast-util-from-markdown README, Marpit CHANGELOG.
**Frameworks analyzed:** Marpit (`@marp-team/marpit` v3.x, the canonical engine), Marp Core (`@marp-team/marp-core` latest main), Marp React (`@marp-team/marp-react` INACTIVE), Reveal.js (`hakimel/reveal.js` master) — architectural divergent comparison only, Marp Website (`marp-team/marp` website workspace) — real React+Shadow DOM consumer pattern.
**Target directory:** `src/components/primitives/slide/` (subpath export `@usetheo/ui/slide`).
**Related references:**
- `docs/rfcs/0001-whiteboard.md` — direct precedent for primitive shape (subpath, peer-deps, view-only, Zod schema, RFC governance)
- `CLAUDE.md` (TheoUI) — roadmap entry locking `Slide` + `SlideDeck` + `Diagram` as upcoming primitives, all governed by "Don't reinvent the algorithmic core" (markdown parsing via mature OSS deps)

---

## 1. Problem statement

- **What:** A `<Slide>` primitive that takes a markdown string (single slide content, no deck delimiters) plus theme config and renders it as a themed, fixed-aspect-ratio surface (default 16:9, 1280×720 logical units). View-only — no editing, no toolbar, no transition logic. Mirrors the Whiteboard precedent: declarative input in → consistent rendered surface out. Consumed by agent surfaces that emit a "slide" tool call payload, and by future `<SlideDeck>` composite that orchestrates N `<Slide>` instances with navigation, progress, and presenter mode.
- **Current state:** Nothing implemented. Roadmap entry in `CLAUDE.md` ("`Slide` Primitive Marp Explorer (RFC) — Single slide renderer (markdown → themed surface). Reuse `remark`/`micromark` for parsing; do not reinvent the markdown layer."). No `slide` directory in `src/components/primitives/`. No markdown-related dep in `package.json` (verified: `@radix-ui/*`, `cmdk`, `cva`, `clsx`, `lucide-react`, `tailwind-merge`, `zod` — nothing else). Whiteboard precedent shipped 2026-05-18 (RFC 0001) — the pattern is fresh and well-documented.
- **Why now:** Roadmap formalized 2026-05-18 alongside Whiteboard ship. Agent surfaces — the TheoUI categorical wedge — increasingly emit slide-shaped artifacts (LLM tool calls that say "here's a one-slide explanation"). Without a primitive, every consumer rolls their own markdown renderer with no theme, no aspect lock, no consistent styling. Pre-empts that proliferation.
- **License constraint:** Apache-2.0 (TheoUI). Compatible with: MIT (Marp ecosystem, micromark/remark, Reveal.js), Apache-2.0. **Cannot adopt:** GPL transitive deps. All Marp ecosystem libs are MIT — clean to depend on (peer-dep) or to study (algorithmic inspiration with attribution in `THIRD_PARTY_NOTICES.md`).
- **Non-goals (scope guard for this analysis):**
  - **Deck navigation, transitions, presenter mode** — those are `<SlideDeck>` (separate primitive, separate RFC, will reference this doc).
  - **Markdown authoring/editor surface** — pure renderer.
  - **PDF / PPTX export** — out of scope; Marpit CLI does this, we don't need to.
  - **Math/KaTeX, Mermaid, Twemoji** — defer to `<SlideDeck>` or to consumer; MVP renders pure CommonMark + GFM subset + Marpit-style directives.

## 2. Inventário completo de arquivos (mandatório)

### Marpit core (Source C — fetched via `raw.githubusercontent.com` + `gh api`)

| File / URL | Category | LOC (approx) | Read in full? | Anchored in |
|---|---|---|---|---|
| `src/marpit.js` ([github](https://github.com/marp-team/marpit/blob/main/src/marpit.js)) | core | ~300 | seletivo (via WebFetch summary) | §4.1, §5.1, §5.2, §6.1, §7 |
| `src/markdown/slide.js` ([github](https://github.com/marp-team/marpit/blob/main/src/markdown/slide.js)) | core | ~80 | seletivo (via WebFetch summary) | §4.1, §5.2, §8 (alg-1), §12 |
| `src/markdown/directives/parse.js` ([github](https://github.com/marp-team/marpit/blob/main/src/markdown/directives/parse.js)) | core | ~120 | seletivo | §4.1, §5.3, §10, §12 |
| `src/markdown/directives/directives.js` ([github](https://github.com/marp-team/marpit/blob/main/src/markdown/directives/directives.js)) | core | ~80 | seletivo | §3 glossary, §4.1, §5.3 |
| `src/markdown/directives/apply.js` ([github](https://github.com/marp-team/marpit/blob/main/src/markdown/directives/apply.js)) | core | (listed, not fetched) | listed via `gh api` | §11 (descartado da deep-read — função puramente token-merging; padrão idêntico ao parse.js) |
| `src/markdown/directives/yaml.js` ([github](https://github.com/marp-team/marpit/blob/main/src/markdown/directives/yaml.js)) | core | (listed, not fetched) | listed via `gh api` | §10 (referenced for "loose mode parsing", not deep-read) |
| `src/theme_set.js` ([github](https://github.com/marp-team/marpit/blob/main/src/theme_set.js)) | core | ~400 | seletivo (via WebFetch summary) | §4.1, §5.4, §7, §11 |
| `src/markdown/comment.js`, `style/*`, `image*`, `inline_svg.js`, `slide_container.js`, `container.js`, `background_image*`, `sweep.js`, `fragment.js`, `collect.js`, `header_and_footer.js`, `heading_divider.js` ([dir](https://github.com/marp-team/marpit/tree/main/src/markdown)) | support | n/a | listed via `gh api` (see "discarded with rationale") | §2 discard table |
| `CHANGELOG.md` ([github](https://github.com/marp-team/marpit/blob/main/CHANGELOG.md)) | doc | ~700 | seletivo (via WebFetch summary) | §9, §10, §12 |
| `docs/directives.md` ([github](https://github.com/marp-team/marpit/blob/main/docs/directives.md)) | doc | ~200 | seletivo (via WebFetch summary) | §3, §5.3, §12 |

### Marp Core (Source C)

| File / URL | Category | LOC (approx) | Read in full? | Anchored in |
|---|---|---|---|---|
| `src/marp.ts` ([github](https://github.com/marp-team/marp-core/blob/main/src/marp.ts)) | core | ~200 | seletivo (via WebFetch summary) | §4.2, §7, §13 |
| `themes/default.scss` ([github](https://github.com/marp-team/marp-core/blob/main/themes/default.scss)) | config | ~150 | seletivo (via WebFetch summary) | §4.2, §11 |

### Marp React — INACTIVE (Source C — used as cautionary tale + API shape reference)

| File / URL | Category | LOC | Read in full? | Anchored in |
|---|---|---|---|---|
| `README.md` ([github](https://github.com/marp-team/marp-react)) | doc | ~150 | seletivo (via WebFetch summary) | §4.3, §13 (anti-pattern: abandoned React wrapper) |

### Marp marketing website (Source A — local clone in `referencia/marp/website/`)

| File | Category | LOC | Read in full? | Anchored in |
|---|---|---|---|---|
| `referencia/marp/website/components/Marp.tsx` | core (consumer-side React wrapper) | 182 | ✓ | §4.4, §5.5, §6, §10, §14.1 (snippet origin) |
| `referencia/marp/website/utils/markdown/parse/index.ts` | support | 22 | ✓ | §4.4, §7 |
| `referencia/marp/website/utils/markdown/parse/marp-code-block.ts` | support | 22 | ✓ | §4.4 |
| `referencia/marp/website/utils/markdown/parse/image-paragraph-to-figure.ts` | support | (listed; not deep-read — single-purpose unist transformer) | seletivo | §2 discard table |
| `referencia/marp/website/utils/markdown/renderer/index.ts` | core | 28 | ✓ | §4.4, §5.5, §7 |
| `referencia/marp/website/utils/markdown/renderer/sanitize.ts` | support | 11 | ✓ | §4.4, §10 |
| `referencia/marp/website/utils/markdown/index.tsx` | support | 23 | ✓ | §4.4 |
| `referencia/marp/website/components/markdown/{Image,Pre,Heading,Anchor}.tsx` | support | (listed; not deep-read — pure presentational components) | seletivo | §2 discard table |
| `referencia/marp/website/docs/guide/how-to-write-slides.md` | doc | 80 | ✓ (top 60 lines) | §3, §5.3, §12, §17 (Q1) |
| `referencia/marp/website/docs/guide/heading-divider.md` | doc | n/a | listed (not deep-read; behavior covered by directives doc + slide.js) | §2 discard table |
| `referencia/marp/website/docs/guide/{theme,directives,fitting-header,fragmented-list,image-syntax,math-typesetting}.md` | doc | n/a | listed (covered by remote authoritative docs) | §2 discard table |
| `referencia/marp/README.md`, `referencia/marp/package.json` | doc | small | ✓ | §4.4 |

### Reveal.js (Source C — divergent architecture)

| File / URL | Category | LOC | Read in full? | Anchored in |
|---|---|---|---|---|
| `js/reveal.js` ([github](https://github.com/hakimel/reveal.js/blob/master/js/reveal.js)) | core | ~2500 | seletivo (via WebFetch summary, single-slide focus) | §4.5, §6, §11 |

### External docs (Source D)

| URL | Category | Anchored in |
|---|---|---|
| `https://github.com/syntax-tree/mdast-util-from-markdown` | external-doc | §3, §4.6, §7, §17 (Q3) |
| `https://github.com/marp-team/marpit/blob/main/docs/directives.md` | external-doc | §3, §5.3, §12 |
| `https://github.com/marp-team/marpit/blob/main/CHANGELOG.md` | external-doc | §9, §10, §12 |

### Project-self precedent (read for pattern compliance, not as prior art)

| File | Category | LOC | Read in full? | Anchored in |
|---|---|---|---|---|
| `src/components/primitives/whiteboard/whiteboard.tsx` | reference (precedent) | ~200 | top 60 lines | §15 (ADR-1, ADR-2), §16.3 (API shape inspiration) |
| `docs/rfcs/0001-whiteboard.md` | reference (precedent) | ~300 | top 80 lines | §15, §16.6 (rollout pattern) |
| `package.json` exports + peerDeps | config | — | ✓ | §16.4 |

### Arquivos avaliados e descartados (com motivo)

| File | Why discarded |
|---|---|
| Marpit `src/markdown/comment.js` | Pure markdown-it comment-token tokenizer — feeds into directive parse but logic owned by `parse.js`; reading it adds no signal beyond "extracts `<!-- ... -->` and tags as `marpit_comment`" |
| Marpit `src/markdown/inline_svg.js` | Renders the *inline-SVG containers* feature, which is an opt-in container model. TheoUI uses HTML+CSS surface (not SVG-wrapping); behaviour is not load-bearing for the primitive |
| Marpit `src/markdown/slide_container.js`, `container.js` | Wraps slide HTML in `<div class="marpit">` containers — only relevant if we adopted the Marpit deck-level container model. We won't (single-slide primitive); these are §6 divergent. |
| Marpit `src/markdown/background_image.js` + `background_image/` dir | Marpit-specific `![bg]()` syntax — out of MVP scope per §1 non-goals (can be revisited as a directive in v0.2) |
| Marpit `src/markdown/sweep.js`, `fragment.js`, `collect.js`, `header_and_footer.js` | Each implements a single Marpit feature (sweep = strip empty paragraphs, fragment = progressive reveal, collect = aggregate styles, header/footer = per-page chrome). None relevant to single-slide primitive MVP. Will revisit individually when promoting to `<SlideDeck>`. |
| Marpit `src/markdown/heading_divider.js` | Implements the multi-slide `headingDivider` directive — by definition NOT a single-slide concern. Will be implemented in `<SlideDeck>`. |
| Marpit `src/markdown/style/` (dir) | Implements `<style>` tag scoping — useful but secondary; covered by sanitize layer in MVP |
| Marpit `src/markdown/image.js` + `image/` dir | Marpit-extended image syntax (alignment, sizing) — gated by directive parsing. v0.2 territory. |
| Marpit `src/markdown/directives/apply.js` | Token-merging utility — applies parsed directives onto slide token meta. Pattern is identical to `parse.js`; deep read would duplicate signal. |
| Marpit `src/markdown/directives/yaml.js` | Frontmatter parser — wraps `js-yaml` with loose+strict modes. Behaviour summarized in §10. |
| `referencia/marp/website/utils/markdown/parse/image-paragraph-to-figure.ts` | Unist transformer that wraps single-image paragraphs in `<figure>` for the website's blog rendering. Not a slide concern. |
| `referencia/marp/website/components/markdown/{Image,Pre,Heading,Anchor}.tsx` | Presentational React components for the website's blog markdown; pure styling, no novel architecture. |
| `referencia/marp/website/docs/guide/heading-divider.md` | Documents `headingDivider` directive — by definition multi-slide, deferred to `<SlideDeck>`. |
| `referencia/marp/website/docs/guide/{theme,directives,fitting-header,fragmented-list,image-syntax,math-typesetting}.md` | Documents Marpit feature flags. Each is either (a) post-MVP, (b) covered by the canonical remote docs that ARE in inventory, or both. Listing here for honesty. |
| Reveal.js plugins (`Backgrounds`, `AutoAnimate`, `Fragments`, `Touch`, `Keyboard`, etc.) | Deck-level features. Single-slide primitive does not navigate; will revisit for `<SlideDeck>`. |

## 3. Glossary — vocabulário do domínio

| Termo | Definição | Onde apareceu |
|---|---|---|
| **Slide** | A single fixed-aspect rendered surface representing one "page" of a presentation. In Marpit, exactly one `<section>` element. ([Marpit `slide.js`](https://github.com/marp-team/marpit/blob/main/src/markdown/slide.js)) | Marpit, Reveal, Marp |
| **Deck** | Ordered collection of slides + navigation/transition state. Out of scope for `<Slide>` primitive — belongs to `<SlideDeck>`. | Marpit, Reveal |
| **Directive** | A configuration key declared in YAML frontmatter or `<!-- key: value -->` HTML comment that controls slide rendering. Two scopes: global (whole deck) and local (per-slide). ([Marpit directives.md](https://github.com/marp-team/marpit/blob/main/docs/directives.md)) | Marpit |
| **Spot directive** | Local directive prefixed with `_` (underscore), applies to the current slide only and does not propagate. Example: `_backgroundColor: aqua`. ([Marpit directives.js](https://github.com/marp-team/marpit/blob/main/src/markdown/directives/directives.js)) | Marpit |
| **Heading divider** | Marpit feature where headings at a specified level (or above) implicitly split the markdown into separate slides — alternative to `---`. Multi-slide concern. ([Marpit `heading_divider.js`](https://github.com/marp-team/marpit/blob/main/src/markdown)) | Marpit |
| **Theme** | A CSS stylesheet that defines the slide's typography, colors, dimensions, and layout. Processed through PostCSS plugin chain by `ThemeSet.pack()`. Three built-in in Marp Core: `default`, `gaia`, `uncover`. ([Marpit `theme_set.js`](https://github.com/marp-team/marpit/blob/main/src/theme_set.js); [Marp Core `marp.ts`](https://github.com/marp-team/marp-core/blob/main/src/marp.ts)) | Marpit, Marp |
| **Slide canvas** | The fixed logical-pixel surface a slide renders into. Marp default: 1280×720 (16:9), padding 78.5px, base font 29px. ([Marp Core `themes/default.scss`](https://github.com/marp-team/marp-core/blob/main/themes/default.scss)) | Marp, Reveal (`--slide-width`/`--slide-height`) |
| **mdast** | Markdown Abstract Syntax Tree — unified spec for markdown trees, output of `mdast-util-from-markdown`. ([syntax-tree/mdast-util-from-markdown](https://github.com/syntax-tree/mdast-util-from-markdown)) | remark, micromark |
| **micromark** | Lightweight CommonMark tokenizer; lower-level than remark, suitable when you want to produce HTML directly or own the AST conversion. ([mdast-util-from-markdown README](https://github.com/syntax-tree/mdast-util-from-markdown)) | remark ecosystem |
| **Auto-scaling (Marp)** | Marp Core mechanism that wraps headings and code blocks in a CSS custom-element (`::part(auto-scaling)`) with `max-height` constraints, scaling content via a `transform: scale()` computed from natural size. ([Marp Core `themes/default.scss`](https://github.com/marp-team/marp-core/blob/main/themes/default.scss)) | Marp |
| **Shadow DOM mount** | Pattern used by the Marp website's `<Marp>` React component to isolate slide CSS from host page styles — attaches an open shadow root, injects `:host{all:initial}` to break inheritance. (`referencia/marp/website/components/Marp.tsx:65-79`) | Marp website |

## 4. Prior art — deep dive por framework

### 4.1 Marpit (`@marp-team/marpit` v3.x — main branch, fetched 2026-05-19)

#### API pública
```ts
// src/marpit.js (paraphrased from JS to TS for clarity; source is JS)
class Marpit {
  constructor(opts?: MarpitOptions);
  get markdown(): MarkdownIt;
  set markdown(md: MarkdownIt);
  render(markdown: string, env?: object): {
    html: string | string[];
    css: string;
    comments: string[][];
  };
  renderMarkdown(markdown: string, env?: object): string | string[];
  renderStyle(theme?: string): string;
  use(plugin: Function, ...params: unknown[]): Marpit;
  // properties
  readonly options: Readonly<MarpitOptions>;
  customDirectives: { global: Record<string, Function>; local: Record<string, Function> };
  themeSet: ThemeSet;
}
```
Source: WebFetch summary of [src/marpit.js](https://github.com/marp-team/marpit/blob/main/src/marpit.js), §1 of the WebFetch result.

#### Algoritmo interno (prosa, passo a passo) — `render(markdown, env)`
1. `markdown-it.parse()` produces a flat token stream from the input string.
2. The token stream goes through a 16-step plugin chain (in deterministic order): `marpitComment → marpitStyleParse → marpitSlide → marpitParseDirectives → marpitApplyDirectives → marpitHeaderAndFooter → marpitHeadingDivider → marpitSlideContainer → marpitContainerPlugin → marpitInlineSVG → marpitImage → marpitBackgroundImage → marpitSweep → marpitStyleAssign → marpitFragment → marpitCollect`. ([marpit.js](https://github.com/marp-team/marpit/blob/main/src/marpit.js))
3. `marpitSlide` is the boundary detector: it splits the token array on `t.type === 'hr' && t.level === 0` using a `split` helper, keeping the `hr` token as a slide marker. ([slide.js](https://github.com/marp-team/marpit/blob/main/src/markdown/slide.js))
4. `marpitParseDirectives` walks the front-matter (via `markdown-it-front-matter`) and `marpit_comment` tokens, applying the global → local → spot priority.
5. `marpitApplyDirectives` merges parsed directives onto `token.meta.marpitDirectives` per slide.
6. Renderer (`markdown.renderer.render()`) outputs HTML; when `env.htmlAsArray = true`, returns one HTML string per slide.
7. `themeSet.pack(theme)` composes the theme CSS through a long PostCSS plugin chain (see §4.1 Pack algorithm below).
8. Returns `{ html, css, comments }`.

#### Estado mantido
- `#markdown` (private MarkdownIt instance) — the parser+renderer combined unit.
- `options` (frozen) — constructor config.
- `customDirectives` (sealed `{ global: {}, local: {} }`) — user-registered directives.
- `themeSet` (ThemeSet instance) — registered themes; PostCSS plugins; default theme.
- Implied per-render state (set during pipeline execution): `lastGlobalDirectives`, `lastComments`, `lastSlideTokens`, `lastStyles`. Source: WebFetch summary of [marpit.js](https://github.com/marp-team/marpit/blob/main/src/marpit.js) §5.

#### Concorrência model
- **Single-threaded synchronous**. The entire `render()` call is synchronous (token transforms are array-walks). No async, no workers in core Marpit. (Marp React's experimental `<MarpWorker>` shows this is a known opportunity but lives outside core.)
- Sincronização: N/A.
- Justificativa: markdown-it is sync-by-design; Marpit inherits.

#### Dependências externas usadas
| Lib | Versão (latest as of Marpit v3 main) | Licença | Para quê (uso específico) | Trans-dep? | Adotar aqui? |
|---|---|---|---|---|---|
| `markdown-it` | ^14.x | MIT | Core CommonMark + GFM tokenizer + renderer | yes (transitive via Marpit) | **Avaliar** (alternative: micromark+mdast — see §6) |
| `markdown-it-front-matter` | ^0.2.x | MIT | YAML frontmatter capture into a single token | yes (transitive) | Sim, if we go markdown-it route |
| `js-yaml` | ^4.x | MIT | YAML parsing inside frontmatter | yes (transitive) | Sim (peer-dep opt-in) |
| `postcss` | ^8.x | MIT | Theme CSS composition pipeline | yes (transitive) | Avaliar (heavyweight for MVP — see §6) |
| Numerous custom PostCSS plugins | n/a (in-tree) | MIT | One per theme transformation step (scope `:root`, inject pseudos, rem normalize, etc.) | yes (in-tree, not separately published) | No — we own our theming via CSS vars |

#### Side effects observáveis
- None at the engine level. `Marpit.render()` is a pure function of (markdown, themeSet config). All HTML/CSS comes back in the return value.
- WebFetch summary of `marpit.js` confirms no filesystem, no globals.

#### TODOs / FIXMEs / HACKs literais
- WebFetch summary returned "None explicitly present" for `marpit.js` and `slide.js`.
- CHANGELOG references one historical note: `v0.0.5 (2018-05-12) — "Prevent style injections"` (the first security-related entry). See §10. ([CHANGELOG.md](https://github.com/marp-team/marpit/blob/main/CHANGELOG.md))

#### Padrão de design
- **Pipeline of pure token transformers** — each plugin reads token meta, mutates token array in place, hands off. Markdown-it idiomatic.
- **Plugin-registration via `.use(plugin)`** — explicit, ordered, deterministic.
- **Frozen options / sealed customDirectives** — defensively immutable to prevent accidental mutation mid-render.

#### Error handling style
- **Silent ignore on malformed directives.** ([parse.js WebFetch result, §5](https://github.com/marp-team/marpit/blob/main/src/markdown/directives/parse.js)): `yaml() returns false on parse failure; code checks if (parsed !== false) but continues silently`. Unrecognized directive keys are stored as-is but produce no warning.
- **Throws on circular theme @import.** ThemeSet `resolveImport` throws when a theme name appears twice in the import chain. ([theme_set.js WebFetch result, §6](https://github.com/marp-team/marpit/blob/main/src/theme_set.js))

#### Performance hot path
- Fast path: token traversal — `marpitSlide`'s `split(state.tokens, predicate, true)` is O(n) in token count.
- Otimizações: **40-70% speedup from `for-of` loop in v0.1.3 (2018-10-05)**. ([CHANGELOG.md WebFetch result, §3](https://github.com/marp-team/marpit/blob/main/CHANGELOG.md))
- Big-O declarado: not formal, but operationally O(tokens + slides × directive-count) for rendering, O(theme CSS lines) for ThemeSet.pack.

#### Security boundary
- **Trust boundary:** the markdown string input. Marpit assumes the caller has decided whether to allow HTML; the engine itself does not strip user HTML — that's the consumer's responsibility (Marp website uses `hast-util-sanitize` with a custom schema, see §4.4).
- **Defaults:** raw HTML is **disabled** in Marp Core's default markdown-it config ("Most HTML tags are _disabled_ by default for security reasons" — [how-to-write-slides.md:57](file:referencia/marp/website/docs/guide/how-to-write-slides.md#L57)). Only `<style>` (for theme tweaks) and `<br />` are allowed.
- **Sanitization:** done by consumer, not Marpit. Marp website uses `hast-util-sanitize` (defaultSchema + `data*` attribute allowlist + `marp-slides` tag allowlist) — see `referencia/marp/website/utils/markdown/renderer/sanitize.ts:1-11`.

#### Observability hooks
- None at engine level. The `comments` array in the return value is the only telemetry surface — it's the raw `marpit_comment` tokens that didn't parse as directives, useful for debugging user input.

### 4.2 Marp Core (`@marp-team/marp-core` — main branch)

#### What Marp Core adds on top of Marpit
([WebFetch result of marp.ts](https://github.com/marp-team/marp-core/blob/main/src/marp.ts))

1. **HTML allowlist** — replaces Marpit's all-or-nothing with `MarpOptions.html: boolean | HTMLAllowList`.
2. **Emoji** plugin (Twemoji integration).
3. **Math** plugin (KaTeX/MathJax).
4. **Auto-scaling** plugin — fits long content to slide bounds via CSS shadow parts (`::part(auto-scaling)`).
5. **Size** plugin — `size: 16:9` / `size: 4:3` directive.
6. **Script** plugin — opt-in `<script>` execution inside slides (dangerous; opt-in only).
7. **Slug** plugin — auto IDs for headings.
8. **Custom elements** — `<marp-custom>` family.
9. **CSS minification** via `@csstools/postcss-minify`.
10. **markdown-it features turned on**: tables, linkify, strikethrough, replacements, smartquotes.
11. **Three built-in themes**: `default`, `gaia`, `uncover`. ([WebFetch result §4](https://github.com/marp-team/marp-core/blob/main/src/marp.ts))

#### Default theme dimensions ([themes/default.scss WebFetch result §1](https://github.com/marp-team/marp-core/blob/main/themes/default.scss))
- `<section>` is 1280×720, padding 78.5px, base font 29px.
- Headings: `h1: 1.6em (~46px)`, `h2: 1.3em (~38px)`, `h3: 1.1em (~32px)`, `h4: 1.05em`, `h5: 1em`, `h6: 0.9em`.
- Color tokens (CSS vars, all `light-dark()` for auto theme): `--h1-color: light-dark(#246, #cee7ff)`, `--header-footer-color`, `--heading-strong-color`, `--paginate-color`.
- Inherits GitHub Markdown CSS via `@extend .markdown-body`.

#### Lesson for TheoUI
- Themes as **opt-in layered CSS** (default → gaia → uncover) with shared variable names is the right shape.
- `light-dark()` CSS function is the canonical way to handle dark mode without JS — adopt for our theme tokens.
- Auto-scaling via CSS custom element / shadow part is clever but **post-MVP**; depend on caller to size content responsibly first.

### 4.3 Marp React (`@marp-team/marp-react` — INACTIVE)

[Repository status WebFetch result](https://github.com/marp-team/marp-react): *"[INACTIVE] Marp renderer component for React" / "⚠️ Currently Marp React is inactive."*

#### API (last shipped)
- `<Marp markdown options render init>` and `<MarpWorker markdown worker render>`.
- Props: `markdown: string`, `options: MarpOptions`, `render: (slides) => ReactNode`, `init: (marp) => void`.
- Returns `<div>` containing inline SVG slides.

#### Cautionary signal
This is **direct evidence** that wrapping the full Marp Core in a React component **as a redistributable package** did not survive — possibly because:
- Marp Core ships ~50kB+ of CSS minifier + KaTeX + highlight.js — large for a UI lib peer.
- The "render markdown deck" use case is too coupled to deck navigation, which React Marp didn't handle (Swiper, slide N indexing — left to the Marp website implementation in §4.4).
- The author preferred to keep the React layer thin and let consumers compose (see §4.4 below for what the Marp team *actually* ships in production).

**TheoUI takeaway:** do not try to redistribute Marpit/Marp-Core. Implement the renderer directly using lower-level libs (`micromark`+`mdast-util-*` or `markdown-it`), keep the React shell thin (~200 LOC like Whiteboard), and own the theme via CSS variables. Treat Marp React's deprecation as confirmation of the **"don't reinvent the algorithmic core — but do build the shell yourself"** rule.

### 4.4 Marp marketing website (the canonical "embed Marp in React" reference)

Source: `referencia/marp/website/components/Marp.tsx:1-182` (local clone, 182 LOC, full read).

#### API pública
```ts
// referencia/marp/website/components/Marp.tsx:36-86
export const generateRenderedMarp = async (markdown: string) => Promise<{
  markdown: string;
  html: string[];     // one entry per slide
  css: string;        // composed theme CSS
  fonts: string[];    // extracted @font-face rules
}>;

export type MarpProps = {
  border?: boolean;
  className?: string;
  rendered: Pick<RenderedMarp, 'css' | 'html' | 'fonts'>;
  page?: number;
};

export const Marp: React.FC<MarpProps>;        // renders a SINGLE slide via Shadow DOM
export const MarpSlides: React.FC<{ 'data-html'/'data-css'/'data-fonts': string }>;  // renders multi-slide with Swiper
```

#### Algoritmo (single-slide path)
1. `generateRenderedMarp(markdown)` (line 36-53) constructs a `MarpCore({ container: false, script: false, printable: false })`, calls `marp.render(markdown, { htmlAsArray: true })` → gets `{ css, html: string[] }`, then runs the CSS through `postcss.use(postcssImportUrl).use(postcssStripFontFace)` to extract `@font-face` rules into a sidecar `fonts` array.
2. `<Marp>` (line 55-86) takes `{ html, css, fonts }` + `page` index, attaches an open Shadow DOM root to a `<span>`, and `shadowRoot.innerHTML = html[page-1] + <style>${css}</style><style>:host{all:initial;}:host>[data-marpit-svg]{vertical-align:top;}</style>`.
3. The `useFontFace(fonts)` hook (line 63, imported from `utils/hooks/useFontFace`) registers fonts at document level using the `FontFace` API.
4. After every render, calls `require('@marp-team/marp-core/browser').browser(root)` (line 78) to wire up Marp Core's runtime helpers (auto-scaling JS, etc.).

#### Estado mantido
- `useRef<HTMLDivElement>` holding the host element.
- Shadow root attached lazily (`if (!element.current.shadowRoot) attachShadow`).
- `fonts` registered globally via `FontFace`.

#### Concorrência model
- `generateRenderedMarp` is async (because PostCSS pipeline is async). Should be called in a server action / `useMemo` async / preload, NOT inline in render.
- `<Marp>` render itself is sync (useEffect injects HTML).

#### Dependências externas usadas
| Lib | Versão | Licença | Para quê (uso específico) | Trans-dep? | Adotar aqui? |
|---|---|---|---|---|---|
| `@marp-team/marp-core` | latest | MIT | Markdown → slide HTML+CSS converter | no | **Avaliar** as peer-dep (vs lighter own impl) |
| `postcss` | ^8 | MIT | Post-process composed CSS (extract fonts, resolve `@import url(...)`) | yes (via Marp Core) | Yes if we adopt Marp Core |
| `postcss-import-url` | ^8 | MIT | Inline `@import url(...)` of webfonts | yes | If we adopt Marp Core |
| `swiper` | ^11 | MIT | Multi-slide carousel (NOT used in single-slide primitive) | no | **No** — out of scope (deck-level concern) |

#### Side effects observáveis
- Attaches Shadow DOM root to host element on first effect.
- Registers `@font-face` rules globally via `FontFace` API.
- Calls `marp-core/browser.browser(root)` which wires runtime listeners inside shadow root.

#### TODOs / FIXMEs / HACKs literais
- Line 70 (`referencia/marp/website/components/Marp.tsx:70-71`):
  > `// Render Marp slide to shadow root (tailwind default styles will break Marp slide CSS)`
- Line 77-78:
  > `// eslint-disable-next-line @typescript-eslint/no-var-requires`
  > `return require('@marp-team/marp-core/browser').browser(root)`

#### Padrão de design
- **Shadow DOM isolation + page-index slicing** — the canonical pattern for embedding pre-rendered slide HTML in a React app. Reuse it.
- **Two-phase render**: async heavy work in `generateRenderedMarp` (server/build time), sync DOM injection in `<Marp>` (render time). Excellent separation.

#### Error handling style
- Defensive — `if (!element.current) return;` early-out (line 66).
- `postcssStripFontFace` (line 23-34) silently swallows non-`@font-face` rules into `result.fonts` array; no errors thrown.

#### Performance hot path
- The Shadow DOM mount is the slow op (single `innerHTML` write). Browser DOM cost dominates; markdown parsing is amortized into the async `generateRenderedMarp`.

#### Security boundary
- **Critical:** the Marp website assumes Marp Core's HTML output is safe (the `script: false` + `container: false` constructor options disable script execution and remove the outer container wrapper). The website also runs the AUTHORED markdown through `hast-util-sanitize` BEFORE handing to Marp — see `referencia/marp/website/utils/markdown/renderer/sanitize.ts:1-11`:
  ```ts
  export const sanitize = {
    ...defaultSchema,
    attributes: {
      ...defaultSchema.attributes,
      '*': [...(defaultSchema.attributes?.['*'] ?? []), 'data*'],
    },
    clobberPrefix: '',
    tagNames: [...(defaultSchema.tagNames ?? []), 'marp-slides'],
  };
  ```
- Allowlist-extended `defaultSchema` from `hast-util-sanitize`. The `clobberPrefix: ''` is **a deliberate choice** to disable hast-util-sanitize's name-clobbering protection (because Marp Core's output already manages namespace) — this is a **known trade-off**, not a bug.

#### Observability hooks
- None. This is a marketing surface, not instrumented.

### 4.5 Reveal.js (divergent architecture)

Source: WebFetch summary of [js/reveal.js master](https://github.com/hakimel/reveal.js/blob/master/js/reveal.js), focused on single-slide rendering.

#### Public DOM contract
```html
<div class="reveal">
  <div class="slides">
    <section>Horizontal Slide 1</section>
    <section>
      <section>Vertical Slide 1.1</section>
      <section>Vertical Slide 1.2</section>
    </section>
  </div>
</div>
```
Source: WebFetch result §1.

#### Content authorship
- **Pure HTML by default.** No markdown in core. Markdown is provided by a plugin (RevealMarkdown plugin, external).
- This is the **opposite axis** from Marpit, which is markdown-first.

#### Theming via CSS variables
- `--slide-width`, `--slide-height`, `--slide-scale`, `--viewport-width`, `--viewport-height`, `--vh`.
- Mobile viewport-height workaround: `--vh: 1% of innerHeight`.

#### Scaling algorithm (single-slide rendering)
```js
// Paraphrased from reveal.js
const scale = Math.min(
  presentationWidth / slideWidth,
  presentationHeight / slideHeight
);
const clampedScale = Math.max(minScale, Math.min(scale, maxScale));
// Apply via CSS transform on the .slides container, transform-origin centered:
transformSlides({ layout: `translate(-50%, -50%) scale(${clampedScale})` });
```
Source: WebFetch result §4.

#### Lesson for TheoUI
- Reveal.js is the **divergent design** evidence: HTML-first + CSS transform scaling, no markdown opinion. Marpit is markdown-first + fixed canvas + theme CSS. **TheoUI should align with Marpit** because:
  1. The roadmap explicitly says "markdown → themed surface". HTML-first contradicts the Whiteboard / Slide pattern of "declarative input → rendered output".
  2. LLM tool calls produce markdown reliably; producing valid HTML reliably is harder.
- But TheoUI **should borrow Reveal.js's CSS-transform-scale** for fitting the slide canvas into arbitrary container sizes — it's elegant and Marpit's auto-scaling is a separate axis (content-level), not container-level.

### 4.6 micromark + mdast (the "don't reinvent" target)

Source: WebFetch of [mdast-util-from-markdown README](https://github.com/syntax-tree/mdast-util-from-markdown).

#### Pipeline
`micromark` (tokenizer) → `mdast-util-from-markdown` (token→tree compiler) → optional plugins.

Public API: `fromMarkdown(value, encoding?, options?): Root`. Options: `extensions` (micromark-level) and `mdastExtensions` (token→tree).

#### Why micromark vs remark vs markdown-it
- `micromark`: lightweight CommonMark tokenizer optimized for streaming; primary author Titus Wormer.
- `remark`: full unified-pipeline ecosystem; higher-level; ideal when you want to apply many AST transforms.
- `markdown-it`: separate ecosystem (Marpit's chosen base); plugin model via `.use()`; mature, broad community.

For **a single-slide primitive**, the `markdown-it` model has won — Marpit's whole architecture validates it. But for TheoUI (where bundle size matters and we don't need most of Marpit), **`mdast-util-from-markdown` (micromark + tree) might be lighter**. Open question — §17 Q3.

## 5. Convergent patterns (todos concordam)

1. **Single slide = single `<section>` element with semantic role + data attributes.** Marpit (`section` with `data-marpit-slide` and other meta), Reveal.js (`section` with `data-state`, `data-background-*`). **TheoUI must adopt** — semantic and accessible, screen-reader friendly. Adaptation: emit `<section role="region" aria-roledescription="slide" data-theo-slide={themeName}>`.

2. **Fixed logical canvas + scale-to-fit at the container level.** Marp default: 1280×720 baked into `themes/default.scss:1`. Reveal.js: configurable via `--slide-width`/`--slide-height` + CSS transform. **TheoUI must adopt** — predictable layout, consistent rendering across container sizes. Adaptation: prop `aspectRatio` (default `'16:9'` → 1280×720), wrap content in inner container with CSS `transform: scale(var(--theo-slide-scale))` computed from `ResizeObserver` measurement of host.

3. **Theme system based on CSS variables (light-dark capable).** Marp (`--h1-color`, `--header-footer-color`, etc., all with `light-dark()`). Reveal.js (`--slide-width`, `--slide-height`, etc.). **TheoUI must adopt** — already does this in Violet Forge tokens. Adaptation: emit slide-scoped CSS vars (`--theo-slide-color-text`, `--theo-slide-color-bg`, `--theo-slide-font-heading`) layered on top of Violet Forge tokens.

4. **HTML escape + tag/attribute allowlist as the security boundary.** Marp website uses `hast-util-sanitize` with custom schema (`referencia/marp/website/utils/markdown/renderer/sanitize.ts:1-11`). Marpit disables HTML by default in markdown-it (`how-to-write-slides.md:57`). **TheoUI must adopt** — agent surfaces consume LLM markdown; HTML must be opt-in with strict allowlist. Adaptation: use `hast-util-sanitize` directly OR `rehype-sanitize` if we're on the unified pipeline.

5. **Render pipeline as composable plugin chain.** Marpit: 16-step `markdown-it` chain. Reveal.js: controller registration model (`Backgrounds`, `Fragments`, etc.). **TheoUI should adopt** — but with restraint. MVP needs only: tokenize → transform headings (slug) → sanitize → render to React elements. No need to pre-build a registration API; we can add `<Slide plugins={[]}>` later if real consumer demand emerges.

## 6. Divergent patterns (trade-off real)

1. **Markdown parser choice: markdown-it vs micromark/mdast.**
   - Marpit: `markdown-it` (mature plugin ecosystem, sync, larger).
   - Modern unified: `micromark` + `mdast-util-from-markdown` + `mdast-util-to-hast` + `hast-util-to-jsx-runtime` (smaller per-piece, async-capable, separable).
   - **TheoUI choice:** **start with `micromark` + `mdast-util-*` + `hast-util-*`** because (a) we already use unified-style libs in TheoUI's potential future markdown surfaces; (b) bundle pressure — markdown-it is ~50kB; the micromark + 3 small utilities path can be ~25-30kB; (c) it gives us a typed AST without a `.use(plugin)` registration API we don't need. Marked as **open question Q3** for a definitive bundle measurement.

2. **Slide HTML rendered into Shadow DOM (Marp website) vs into normal DOM with scoped CSS (Reveal.js).**
   - Marp website: Shadow DOM + `:host { all: initial; }` to fully isolate from host CSS — necessary when host is Tailwind/site CSS that would collide with Marp's `.markdown-body` styles.
   - Reveal.js: normal DOM with `.reveal` namespace, depends on its own stylesheet being loaded.
   - **TheoUI choice:** **start with NORMAL DOM + scoped CSS classes** (`.theo-slide` + scoped CSS module / scoped style tag). Justification: (a) Violet Forge tokens are explicitly designed to be inherited; (b) Shadow DOM breaks `theme-provider` context; (c) Tailwind utility classes on the host *should* work inside the slide (e.g. a consumer wraps `<Slide>` in `dark`). Shadow DOM can be added as an opt-in prop (`isolate?: boolean`) in v0.2 if a consumer reports CSS bleed.

3. **Directive syntax: HTML comments + frontmatter, frontmatter only, or neither.**
   - Marpit: both (`<!-- key: value -->` AND `--- yaml frontmatter ---`). ([directives.md WebFetch result §1](https://github.com/marp-team/marpit/blob/main/docs/directives.md))
   - Reveal.js: data attributes on `<section>` (no markdown directive model — content is HTML).
   - **TheoUI choice:** **frontmatter only for MVP**. Justification: (a) frontmatter is more familiar to LLM training data (every blog post has it); (b) HTML comments inside markdown are visually confusing for non-Marpit users; (c) trivially extensible later if consumers ask. Spot directives (`_foo:`) deferred to `<SlideDeck>` since they are per-slide-in-deck concerns.

4. **Where rendered HTML lives in the React tree.**
   - Marp website: `dangerouslySetInnerHTML`-equivalent into shadow root (one big string per slide).
   - Marp React (deprecated): inline SVG via `<foreignObject>`.
   - micromark + `hast-util-to-jsx-runtime`: real React VDOM nodes.
   - **TheoUI choice:** **real React VDOM** (via `hast-util-to-jsx-runtime` or hand-written `mdast → React` mapper). Justification: (a) consumer can pass custom components (`<Slide components={{ pre: MyPre }}>`); (b) avoids `dangerouslySetInnerHTML` entirely → SSR-safe and React-DevTools-inspectable; (c) matches the Whiteboard precedent (declarative input → real React tree).

5. **Fail-fast vs silent-ignore on malformed directives.**
   - Marpit: silent ignore ([parse.js WebFetch result §5](https://github.com/marp-team/marpit/blob/main/src/markdown/directives/parse.js)).
   - **TheoUI choice:** **invoke a `onValidationError` callback** (mirrors Whiteboard `onValidationError` in `src/components/primitives/whiteboard/whiteboard.tsx:31`). Justification: agent surfaces want to know when an LLM emitted invalid directives so they can self-correct. Render still proceeds with safe defaults; the callback is best-effort observability.

## 7. Dependency inventory — bibliotecas comuns

Convergent libs (used by 2+ analyzed sources):

| Lib | Frameworks que usam | Função | Licença | Project decision |
|---|---|---|---|---|
| `markdown-it` | Marpit, Marp Core | CommonMark tokenize+render with plugin chain | MIT | **Evaluate vs micromark route** — see §6 div. #1 |
| `markdown-it-front-matter` | Marpit (transitive) | YAML frontmatter capture | MIT | **Adopt only if** we go markdown-it route |
| `js-yaml` | Marpit (transitive) | YAML parsing | MIT | **Adopt** (peer-dep, lazy import) |
| `postcss` | Marpit, Marp Core, Marp website | Theme CSS pipeline | MIT | **Skip** — overkill for token-driven theming. Use CSS vars directly. |
| `hast-util-sanitize` | Marp website (`renderer/sanitize.ts:1`) | hast tree sanitization w/ allowlist | MIT | **Adopt** (if we go unified/hast route) |
| `unified` | Marp website (`parse/index.ts:4`) | Pipeline runner for remark/rehype | MIT | **Adopt** (if we go unified route) |
| `remark-parse` | Marp website (`parse/index.ts:2`) | markdown → mdast | MIT | **Evaluate** (vs `mdast-util-from-markdown` direct) |
| `remark-gfm` | Marp website (`parse/index.ts:1`) | GFM extensions (tables, strikethrough, autolinks) | MIT | **Adopt** (peer-dep, opt-in) |
| `remark-slug` (or `rehype-slug`) | Marp website (`parse/index.ts:3`) | auto-IDs for headings | MIT | **Adopt** (small, useful for anchored fragments) |
| `unist-util-visit` | Marp website (`parse/marp-code-block.ts:2`) | tree traversal | MIT | **Adopt** (transitive via remark) |

Non-convergent but notable:
- `swiper` (Marp website only, multi-slide carousel) — **skip for `<Slide>`**, evaluate for `<SlideDeck>`.
- `@marp-team/marp-core` itself — **skip as direct dep**, study only.
- `postcss-import-url` (Marp website, font @import resolution) — **skip**, we manage fonts via Violet Forge.

## 8. Algorithms / data structures não-óbvios

- **Slide boundary detection via top-level `hr` token** (Marpit `slide.js`) — `state.tokens.filter(t => t.type === 'hr' && t.level === 0)` then `split(tokens, predicate, keepDelim=true)`. Complexity: O(n) in token count. **Invariant:** only level-0 horizontal rules split slides; nested rules (inside blockquotes, lists, tables) do not. For `<Slide>` primitive (single slide), we instead **enforce no `hr` splits** — input is exactly one slide. Refuse or error if multiple slides are present in the markdown.
- **Front-matter "loose mode" parsing** (Marpit `yaml.js`) — wraps `js-yaml.load()` and on parse failure returns `false` rather than throwing. This is the canonical way to keep render moving even if frontmatter is broken. Cost: lost data; benefit: never crashes a deck because of one bad slide. **Adopt the policy** but with `onValidationError` callback (see §6 div. #5).
- **CSS scoping via `postcss-pseudo-replace`** (Marpit `theme_set.js`) — at pack time, every CSS selector is prefixed/postfixed to scope to `section` element(s). Complexity: O(rules × selectors). **Skip** — we use CSS variables + class scoping (`.theo-slide` + `[data-theo-theme="..."]`) which is simpler and doesn't need PostCSS at runtime.
- **Shadow DOM as the host-CSS firewall** (Marp website `Marp.tsx:67-79`) — `element.attachShadow({mode: 'open'})` + injected `<style>:host { all: initial; }</style>`. The `all: initial` resets every inherited CSS property at the shadow boundary. Complexity: O(1) at mount; per-render is a single `innerHTML =` write. **Defer to v0.2** (opt-in `isolate` prop) per §6 div. #2.
- **Reveal.js scale-to-fit transform** (Reveal.js WebFetch result §4) — `scale = Math.min(viewportW/slideW, viewportH/slideH)` then `transform: translate(-50%,-50%) scale(scale)` with `transform-origin` at slide center. Complexity: O(1) per resize event. **Adopt directly** for container fitting.

## 9. Performance & complexity

### Benchmarks publicados (Marpit / Marp / Reveal)

Direct benchmarks publicly published by the projects: **none located in the provided sources.** The Marpit and Marp-Core READMEs do not list benchmark suites; CHANGELOG mentions one historical performance improvement (below). This is honest — no benchmark table can be filled with measurements we don't have. **Open question Q4.**

| Source | Benchmark | Hardware/setup | Resultado | Fonte |
|---|---|---|---|---|
| Marpit | conversion perf improvement | not specified | "40-70% faster" by switching to for-of loop | CHANGELOG v0.1.3 (2018-10-05) ([CHANGELOG.md](https://github.com/marp-team/marpit/blob/main/CHANGELOG.md)) |
| (other) | — | — | — | (none found in inventory) |

### Complexidade declarada / observada

| Operação | Framework | Big-O (observed) | Onde observado |
|---|---|---|---|
| Slide split (`marpitSlide`) | Marpit | O(tokens) | `slide.js` `split()` walk |
| Token-to-HTML render | Marpit (via markdown-it) | O(tokens) | markdown-it core |
| Theme `pack()` (PostCSS chain) | Marpit | O(CSS_rules × plugins) (~16 plugins) | `theme_set.js` |
| Shadow DOM mount + innerHTML | Marp website | O(slide HTML size) per page change | `Marp.tsx:73-78` |
| Reveal scale-to-fit | Reveal.js | O(1) per resize | `reveal.js` `transformSlides` |

### Hot path tricks observados
- **`for-of` over `Array.prototype.forEach`** in Marpit (40-70% speedup in 2018) — V8 optimizes `for-of` better when the predicate is a closure. Worth doing in our token transforms too, but only if/when we measure.
- **PostCSS plugin caching** in Marpit ThemeSet — themes are packed once and cached by name.
- **CSS `transform: scale()`** in Reveal.js — GPU-accelerated, doesn't trigger layout. Adopt for container scaling.

### Implicações para este projeto
- Target render budget: **< 16ms for a single slide on a 4× CPU throttle Chrome** (one frame). Validate in benchmark gate (§16.7).
- Bundle target for `@usetheo/ui/slide` subpath: **< 30 kB gzipped** without peer-deps. Verify via `quality:bundle` after isolation.
- Concorrência: **single-threaded React render**; do the markdown parse async at the caller (loader / RSC) and pass parsed AST or already-rendered React tree as prop.

## 10. Security & threat model

### CVEs históricos relevantes

| CVE / Advisory | Framework | Tipo | Fix / version | Lição para este projeto |
|---|---|---|---|---|
| (none located in the sources analyzed — Marpit CHANGELOG mentions security generically: "Prevent style injections" v0.0.5, "prevent the malicious attack in dependencies" v0.3.1, no CVE numbers) | Marpit | style injection / supply chain | v0.0.5, v0.3.1 | **Always sanitize.** Always pin dep versions. |
| (potential: KaTeX & highlight.js have a CVE history — not directly searched in this analysis; **open question Q5**) | Marp Core (transitive) | various | — | Defer KaTeX/highlight.js inclusion to opt-in flags so the attack surface is opt-in too |

### Attack surface conhecida (concrete vectors observed in code)

- **Style injection via `<style>` tag in markdown.** Marpit and Marp Core allow `<style>` by default (it's the user-facing "tweak theme inline" feature). Without scoping, a malicious slide could inject `body { display: none }` or `* { content: url(...) }` exfil. Marpit handles this via `marpitStyleParse` + `marpitStyleAssign` plugins which scope styles to the slide section. **TheoUI mitigation:** disallow `<style>` in MVP. Re-evaluate as opt-in directive (`allowStyle: true`) in v0.2 with mandatory CSS sanitizer.
- **Script tag execution via `<script>` in markdown.** Marp Core's `script` option default is `true` but **with `allowedAttributes` allowlist** (per `marp.ts` constructor). Marp website **disables** it (`script: false` in `Marp.tsx:39`). **TheoUI mitigation:** `<script>` is always stripped at sanitize-time. No opt-in. Period.
- **`<iframe>` / `<object>` / `<embed>` for click-jacking / mixed-content.** `hast-util-sanitize` defaultSchema disallows these. **Adopt defaultSchema as-is** without extending tagNames beyond what we measurably need.
- **`data*` attribute exfil via `--background-image: url(...)` or directive injection.** Marp website's sanitize.ts (`renderer/sanitize.ts:8`) explicitly allows `data*` attributes — this is a relaxation; we should justify or refuse it in TheoUI.
- **`clobberPrefix: ''` in Marp website sanitize.ts (`renderer/sanitize.ts:9`)** — disables `hast-util-sanitize`'s name-clobbering protection (which prevents `id` collisions from `<a name="constructor">` etc.). Marp has its own namespacing so it's a knowing trade-off; **TheoUI should keep the default `clobberPrefix: 'user-content-'`** unless proven necessary.
- **Frontmatter injection.** Marpit's `yaml.js` "loose mode" accepts malformed YAML silently. An attacker could craft frontmatter that evaluates oddly. js-yaml has had RCE history (CVE-2013-4660 era) — modern versions are safe but **always use `yaml.load()` (safe schema)**, never `yaml.loadAll()` with default schema.

### Defaults seguros

| Decisão | Marpit | Marp Core | Marp website (consumer) | Projeto (decisão) |
|---|---|---|---|---|
| `<style>` in markdown | allowed (scoped) | allowed | enabled | **Disallow in v0.1; opt-in in v0.2** |
| `<script>` in markdown | depends on markdown-it html opt | opt-in via `script` constructor | **disabled** (`script: false`) | **Always strip** |
| Raw HTML | disabled by default in markdown-it | allowlist via `MarpOptions.html` | sanitized via hast-util-sanitize | **Allowlist via hast-util-sanitize defaultSchema** (no extensions) |
| Frontmatter parse failure | silent (returns false) | inherits | inherits | **Silent + `onValidationError` callback** |
| Theme `@import url(...)` for fonts | resolved by PostCSS | resolved | strip + sidecar | **Disallow remote @import in v0.1**; bundle fonts |

### Validação de input

- **Fronteira:** the markdown string + parsed frontmatter object handed to the component as props.
- **Required sanitizations (MVP):**
  - Strip `<script>`, `<iframe>`, `<object>`, `<embed>`, `<form>`, `<input>` via `hast-util-sanitize` defaultSchema.
  - Validate frontmatter via Zod schema (see §16.3) — coerce unknown keys to ignored.
  - Clamp numeric values (font sizes, paddings) to sane ranges (mirror Whiteboard's `1..20000` for width/height).
- **Assumptions post-validation:** rendered React tree is XSS-safe; embedded CSS variables are well-formed.

## 11. Observability

### Logging

| Framework | Library | Format | Campos-chave |
|---|---|---|---|
| Marpit | none (sync, returns data) | n/a | n/a |
| Marp Core | none | n/a | n/a |
| Marp website | none (production-ish app, no telemetry shown) | n/a | n/a |
| Reveal.js | console.warn for some plugin issues | plain | n/a |

**Implication:** there is no "logger" precedent to copy. TheoUI is a UI library — no console.* spam. Telemetry happens at the consumer.

### Métricas (Prometheus-style)
N/A — UI library. Consumers can wrap and instrument.

### Trace spans
N/A — UI library.

### Erros estruturados (recommendation)

Mirror the Whiteboard precedent (`src/components/primitives/whiteboard/whiteboard.tsx:31` — `onValidationError?: (errors: ValidationError[]) => void`).

- Define `SlideValidationError = { code: 'INVALID_FRONTMATTER' | 'MULTIPLE_SLIDES' | 'CONTENT_TOO_LARGE' | 'BANNED_TAG' | ...; path: string[]; message: string; }`.
- Surface via `onValidationError` callback (best-effort, in `useEffect` not in render, per Whiteboard's EC-6).

### Implicações para este projeto

- **Métricas mínimas a expor** (via callbacks, not via metric emitter): `onValidationError` (errors array), `onRender({ slideContentLength, parseDurationMs, renderDurationMs })` optional in v0.2.
- **Spans mínimos:** N/A in v0.1. Consumer wraps with OTel if needed.
- **Campos de log obrigatórios:** N/A in v0.1. Component is silent unless `onValidationError` fires.

## 12. Edge cases conhecidos (com fonte)

| Edge case | Como manifesta | Onde foi corrigido | Como prevenir aqui |
|---|---|---|---|
| Empty slide (lone `hr`) | Marpit produces empty `<section>` | not explicitly fixed — accepted behaviour ([slide.js WebFetch §3](https://github.com/marp-team/marpit/blob/main/src/markdown/slide.js)) | For `<Slide>` (single-slide), reject input containing top-level `hr`; emit `MULTIPLE_SLIDES` validation error |
| Markdown CommonMark requires blank line before `---` ruler | Adjacent text + `---` interpreted as setext heading instead of `hr` | [how-to-write-slides.md:40](file:referencia/marp/website/docs/guide/how-to-write-slides.md#L40) — Marpit added `___` and `***` and `- - -` as alternative split markers | Since `<Slide>` is single-slide, **detect any in-input slide split and error**. Don't silently swallow it. |
| Front-matter must be FIRST in document | If anything precedes `---`, frontmatter is not detected | Marpit `parse.js` documents this behaviour ([WebFetch §4 caveat](https://github.com/marp-team/marpit/blob/main/src/markdown/directives/parse.js)) | Validate at parse time; emit `INVALID_FRONTMATTER` if leading whitespace + non-frontmatter content |
| YAML special chars unquoted | YAML parse silently fails (returns false) ([Marpit `parse.js` WebFetch §5](https://github.com/marp-team/marpit/blob/main/src/markdown/directives/parse.js)) | Marpit accepts it; ignores | Run a strict YAML schema validation (Zod) and surface `INVALID_FRONTMATTER` on failure |
| `![bg](...)` syntax in `header`/`footer` directive | Doesn't work due to parsing order ([directives.md WebFetch §4](https://github.com/marp-team/marpit/blob/main/docs/directives.md)) | Documented limitation in Marpit; not fixed | Strip image syntax from header/footer directive values at validation; document the limitation in JSDoc |
| Theme `@import` circular | Throws | [theme_set.js WebFetch §6](https://github.com/marp-team/marpit/blob/main/src/theme_set.js) — `resolveImport` detects via name-occurrence count | We don't support custom theme imports in v0.1; built-in themes only. Non-issue. |
| Tailwind default styles break Marp's CSS | Pages render with wrong typography/spacing | Marp website mounts inside Shadow DOM (`Marp.tsx:67-79`) | Use scoped CSS class `.theo-slide` with high-specificity-tokens; provide opt-in `isolate` prop for Shadow DOM in v0.2 |
| Repeated global directive | Marpit uses LAST value silently | [directives.md WebFetch §2](https://github.com/marp-team/marpit/blob/main/docs/directives.md) | We accept Marpit's policy; document in JSDoc |
| `dollar-prefixed` legacy directives | Marpit removed in v1.4.0 (breaking change) | [CHANGELOG.md WebFetch](https://github.com/marp-team/marpit/blob/main/CHANGELOG.md) | Don't introduce dollar-prefixed syntax — Marp learned the lesson |
| CommonMark `tight list` vs `loose list` rendering differences | Lists with blank lines between items render with `<p>` wrappers — different vertical rhythm | Standard CommonMark behaviour; not Marp-specific | Document in stories; theme handles both |

## 13. Anti-patterns observados (não faça isso)

1. **Wrapping the entire engine in a React component as a standalone package.** Marp React is **inactive** ([github.com/marp-team/marp-react](https://github.com/marp-team/marp-react) WebFetch result). Symptom: too coupled to deck navigation that the wrapper doesn't actually handle, ends up neglected. Tempting because: "ship a React component" feels small. Do this instead: implement the renderer directly in TheoUI's React layer with our own thin shell; depend on small unified primitives, not on Marp Core. Mirrors Whiteboard's choice (RFC 0001 ADR-D2): peer-deps optional, shell thin.

2. **Allowing `<style>` and `<script>` in user markdown by default.** Marpit/Marp Core allow `<style>` for "theme tweaks". Symptom: CSS-injection attack surface, unscoped style bleeds into the host page. Tempting because: gives end-users full theming control. Do this instead: disallow in MVP; opt-in via `allowInlineStyle: true` with mandatory CSS sanitizer in v0.2.

3. **Mutating tokens in place across a 16-plugin chain.** Marpit does it ([marpit.js plugin chain](https://github.com/marp-team/marpit/blob/main/src/marpit.js)). Symptom: debugging is hell — failure at step 14 is hard to attribute. Tempting because: it's the markdown-it idiom. Do this instead: in TheoUI, use unified's pipeline (each plugin produces a fresh AST node or annotates immutably).

4. **Silently swallowing malformed directives** (Marpit `parse.js` ignores YAML parse failures). Symptom: agents emit bad frontmatter, the user sees a broken slide and has no idea why. Do this instead: surface failures via `onValidationError` callback (Whiteboard precedent: `whiteboard.tsx:31`).

5. **Coupling slide-level concerns to deck-level concerns** (Reveal.js's `data-state` mutates document.body, Marpit's `marpitCollect` aggregates styles across slides). Symptom: you can't render a slide in isolation. Do this instead: `<Slide>` MUST be pure — it takes (markdown, theme) and returns a self-contained tree. `<SlideDeck>` aggregates separately when we build it.

6. **`dangerouslySetInnerHTML` + Shadow DOM as the default mount strategy** (Marp website `Marp.tsx:73`). Symptom: React tree opacity, no DevTools introspection, no easy custom-component overrides, SSR weirdness. Tempting because: gives strict CSS isolation. Do this instead: real React VDOM via `hast-util-to-jsx-runtime`; Shadow DOM as opt-in `isolate` prop in v0.2.

## 14. Cookbook — snippets reutilizáveis

### 14.1 Async markdown → cached rendered slide artifacts

Inspired by `referencia/marp/website/components/Marp.tsx:36-53`.

```ts
// Original (Marp website pattern)
export const generateRenderedMarp = async (markdown: string) => {
  const marp = new MarpCore({ container: false, script: false, printable: false });
  const { css, html } = marp.render(markdown, { htmlAsArray: true });
  const result = await postcss()
    .use(postcssImportUrl)
    .use(postcssStripFontFace)
    .process(css, { from: undefined });
  const fonts: string[] = (result['fonts'] || []).map((font) => font.toString());
  return { markdown, html, css: result.css, fonts };
};
```

**Adaptado para o stack do projeto (TheoUI / TypeScript / unified):**

```ts
// Pseudo-code MVP: parse + sanitize + return React-renderable tree (synchronous if we lazy-load deps;
// async if we want to use unified's full pipeline). Tested in tests/unit/slide.test.tsx.
import { fromMarkdown } from "mdast-util-from-markdown";
import { gfmFromMarkdown } from "mdast-util-gfm";
import { gfm } from "micromark-extension-gfm";
import { toHast } from "mdast-util-to-hast";
import { sanitize, defaultSchema } from "hast-util-sanitize";
import { toJsxRuntime } from "hast-util-to-jsx-runtime";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import type { ReactElement } from "react";

export interface ParsedSlide {
  frontmatter: Record<string, unknown>;
  tree: ReactElement;
}

export function parseSlide(markdown: string): ParsedSlide {
  // 1. Extract frontmatter (lightweight — see §16.3 for schema).
  const { frontmatter, body } = extractFrontmatter(markdown);

  // 2. Parse body to mdast (CommonMark + GFM).
  const mdast = fromMarkdown(body, {
    extensions: [gfm()],
    mdastExtensions: [gfmFromMarkdown()],
  });

  // 3. Convert to hast.
  const hast = toHast(mdast, { allowDangerousHtml: false });

  // 4. Sanitize: defaultSchema (no extensions in v0.1).
  const safeHast = sanitize(hast, defaultSchema);

  // 5. Convert hast → React tree.
  const tree = toJsxRuntime(safeHast, { Fragment, jsx, jsxs }) as ReactElement;

  return { frontmatter, tree };
}
```

### 14.2 Container scale-to-fit (Reveal.js algorithm in React)

Inspired by Reveal.js [reveal.js transformSlides](https://github.com/hakimel/reveal.js/blob/master/js/reveal.js) (WebFetch §4).

```js
// Original (Reveal.js algorithm, vanilla)
const scale = Math.min(
  presentationWidth / slideWidth,
  presentationHeight / slideHeight
);
const clampedScale = Math.max(minScale, Math.min(scale, maxScale));
transformSlides({ layout: `translate(-50%, -50%) scale(${clampedScale})` });
```

**Adaptado para o stack do projeto (React + ResizeObserver):**

```tsx
// src/components/primitives/slide/use-slide-fit.ts (stub — tests in tests/unit/use-slide-fit.test.ts)
import { useEffect, useState, type RefObject } from "react";

export function useSlideFit(
  containerRef: RefObject<HTMLElement>,
  slideWidth: number,
  slideHeight: number,
  options: { minScale?: number; maxScale?: number } = {}
): number {
  const { minScale = 0.1, maxScale = 4 } = options;
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => {
      const { width, height } = el.getBoundingClientRect();
      const raw = Math.min(width / slideWidth, height / slideHeight);
      setScale(Math.max(minScale, Math.min(raw, maxScale)));
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [containerRef, slideWidth, slideHeight, minScale, maxScale]);

  return scale;
}
```

### 14.3 hast sanitize schema for slide content (allowlist-extended)

Inspired by `referencia/marp/website/utils/markdown/renderer/sanitize.ts:1-11`.

```ts
// Original (Marp website)
export const sanitize = {
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    '*': [...(defaultSchema.attributes?.['*'] ?? []), 'data*'],
  },
  clobberPrefix: '',
  tagNames: [...(defaultSchema.tagNames ?? []), 'marp-slides'],
};
```

**Adapted for TheoUI (stricter — no data* extension, keep clobberPrefix default):**

```ts
// src/components/primitives/slide/sanitize.ts
import { defaultSchema, type Schema } from "hast-util-sanitize";

export const slideSanitizeSchema: Schema = {
  ...defaultSchema,
  // No tag extensions. No attribute extensions in v0.1.
  // clobberPrefix defaults to "user-content-" — keep it.
};

export const looseSlideSanitizeSchema: Schema = {
  ...slideSanitizeSchema,
  tagNames: [...(defaultSchema.tagNames ?? []), "figure", "figcaption"],
  // explicit additions only; reviewed on each change.
};
```

## 15. ADR template (PROPOSED)

```markdown
# ADR — Slide primitive (`<Slide>`, `@usetheo/ui/slide`)

**Status:** PROPOSED
**Date:** 2026-05-19
**Deciders:** TheoUI maintainers (paulohenriquevn + reviewers)
**Source of truth for this decision:** `.claude/knowledge-base/reference/slide.md`

## Context
TheoUI needs a single-slide rendering primitive that takes markdown + optional frontmatter and produces a themed, fixed-aspect surface. Roadmap entry in `CLAUDE.md` requires reuse of `remark`/`micromark` ("do not reinvent the markdown layer"). The Whiteboard primitive (RFC 0001) established the pattern: subpath-isolated, view-only, peer-deps optional, Zod-validated input. Prior art from Marpit/Marp Core/Marp website (this doc §4) provides the canvas + theme model; Reveal.js provides container fit. Marp React's inactive status is direct evidence (this doc §13.1) that redistributing the full Marp engine inside a React component does not survive — keep our shell thin.

## Decision
1. **Subpath isolation**: ship as `@usetheo/ui/slide` (mirrors `@usetheo/ui/whiteboard`).
2. **Parser**: `mdast-util-from-markdown` + `micromark-extension-gfm` + `mdast-util-to-hast` + `hast-util-sanitize` + `hast-util-to-jsx-runtime`. All optional peer-deps.
3. **Slide model**: single `<section role="region" aria-roledescription="slide">` with fixed logical canvas (default 1280×720, 16:9), scaled to container via Reveal.js algorithm (this doc §14.2).
4. **Theme**: CSS variables layered on Violet Forge tokens. Built-in themes: `default`, `violet-forge-slide` (light + dark). No PostCSS at runtime.
5. **Directives**: YAML frontmatter only in v0.1. Validated via Zod. Spot directives (`_foo:`) deferred to `<SlideDeck>`.
6. **Security**: HTML defaults strip via `hast-util-sanitize.defaultSchema`; no `<style>`, no `<script>`, no `<iframe>`. Opt-in relaxations gated by explicit props in v0.2.
7. **Validation errors**: surfaced via `onValidationError?: (errors: SlideValidationError[]) => void`, mirroring Whiteboard.
8. **No deck logic**: `<Slide>` is pure; multi-slide markdown (containing `---` splits) is rejected as `MULTIPLE_SLIDES` validation error.
9. **No Shadow DOM in v0.1**: scoped CSS class `.theo-slide` + Violet Forge token inheritance. Shadow DOM as opt-in `isolate` prop in v0.2 if CSS bleed is reported.

## Consequences
**Positive:**
- Small, focused primitive (target < 30kB gz subpath, see this doc §9).
- LLM agent surfaces get a guaranteed-safe markdown → slide renderer.
- Pairs naturally with future `<SlideDeck>` composite.
- Reuses Violet Forge — no new theme system.

**Negative:**
- Markdown extension set is intentionally narrow (CommonMark + GFM; no math, no Mermaid, no Twemoji in v0.1).
- Consumers wanting Marp's full feature set must compose Marp Core themselves.

**Neutral:**
- Bundle isolation breaks `quality:bundle` baseline temporarily — re-baseline after subpath verification.

## Alternatives considered
- **Wrap Marp Core directly** — rejected. Marp React is inactive (this doc §4.3, §13.1); Marp Core ships KaTeX/highlight.js/PostCSS = 200kB+ which violates our bundle budget.
- **markdown-it instead of micromark** — open question Q3; revisit if micromark + unified path totals more than markdown-it.
- **Shadow DOM by default** — rejected. Breaks theme-provider context (this doc §6 div. #2).

## References
- `referencia/marp/website/components/Marp.tsx:36-86` — generateRenderedMarp + `<Marp>` patterns
- `src/components/primitives/whiteboard/whiteboard.tsx:1-200` — precedent shape
- [Marpit slide.js](https://github.com/marp-team/marpit/blob/main/src/markdown/slide.js) — slide boundary algorithm
- [Reveal.js scale-to-fit](https://github.com/hakimel/reveal.js/blob/master/js/reveal.js) — container fitting
- [hast-util-sanitize](https://github.com/syntax-tree/hast-util-sanitize) — sanitize schema
```

## 16. Implementation Guide

### 16.1 Arquitetura proposta

```
┌──────────────────────────────────────────────────────────────────┐
│  Consumer code                                                   │
│  <Slide markdown={mdString} theme="default" onValidationError /> │
└──────────────────┬───────────────────────────────────────────────┘
                   │ props
                   ▼
┌──────────────────────────────────────────────────────────────────┐
│  <Slide>  (src/components/primitives/slide/slide.tsx)            │
│  - extracts frontmatter                                          │
│  - validates frontmatter via Zod (schema.ts)                     │
│  - parseSlide(body) → { tree: ReactElement }                     │
│  - useSlideFit(containerRef, w, h) → scale                       │
│  - renders <section role=region> + <div style="transform:scale"> │
└──────┬────────────────────────────┬──────────────────────────────┘
       │                            │
       ▼                            ▼
┌──────────────────┐    ┌──────────────────────────────────────┐
│  parseSlide()    │    │  useSlideFit()                       │
│  (parse.ts)      │    │  (use-slide-fit.ts)                  │
│  mdast → hast    │    │  ResizeObserver → scale              │
│ → sanitize → jsx │    │                                      │
└────────┬─────────┘    └──────────────────────────────────────┘
         │
         ▼ peer-dep dynamic imports (lazy)
┌──────────────────────────────────────────────────────────────────┐
│ mdast-util-from-markdown · micromark-extension-gfm ·             │
│ mdast-util-to-hast · hast-util-sanitize · hast-util-to-jsx-rt    │
└──────────────────────────────────────────────────────────────────┘
```

### 16.2 Files to create

```
src/components/primitives/slide/slide.tsx                   — entrypoint <Slide> React component
src/components/primitives/slide/slide.stories.tsx           — Ladle stories (multi-theme, edge cases)
src/components/primitives/slide/slide.test.tsx              — vitest unit tests
src/components/primitives/slide/schema.ts                   — Zod schema for frontmatter
src/components/primitives/slide/schema.test.ts              — schema tests
src/components/primitives/slide/parse.ts                    — markdown → React tree (cookbook §14.1)
src/components/primitives/slide/parse.test.ts               — parse tests (sanitize coverage)
src/components/primitives/slide/sanitize.ts                 — slideSanitizeSchema (cookbook §14.3)
src/components/primitives/slide/use-slide-fit.ts            — scale hook (cookbook §14.2)
src/components/primitives/slide/use-slide-fit.test.ts       — hook tests
src/components/primitives/slide/themes/default.css          — Violet-Forge-layered default theme
src/components/primitives/slide/themes/violet-forge.css     — branded theme
src/components/primitives/slide/index.ts                    — barrel: <Slide>, types, themes
docs/rfcs/0002-slide.md                                     — RFC, mirrors 0001-whiteboard.md shape
```

Subpath barrel emission in `package.json`:
```jsonc
"./slide": {
  "types": "./dist/slide/index.d.ts",
  "import": "./dist/slide/index.js"
},
"./slide/themes/default.css": "./dist/slide/themes/default.css",
"./slide/themes/violet-forge.css": "./dist/slide/themes/violet-forge.css"
```

### 16.3 Public API surface

```ts
// src/components/primitives/slide/index.ts (planned)

export interface SlideFrontmatter {
  theme?: "default" | "violet-forge";
  lang?: string;
  color?: string;             // CSS color
  backgroundColor?: string;   // CSS color
  /** Single-slide primitive: no `paginate`, no `header`/`footer`, no `_spot` directives. */
}

export interface SlideProps {
  /** Slide markdown. MUST NOT contain top-level horizontal rules (would imply deck split). */
  markdown: string;
  /** Theme name. Defaults to "default". */
  theme?: "default" | "violet-forge";
  /** Aspect ratio of the logical canvas. Default "16:9" → 1280×720. */
  aspectRatio?: "16:9" | "4:3" | { width: number; height: number };
  /** Min/max zoom for container fit. */
  minScale?: number;
  maxScale?: number;
  /** Validation callback (best-effort, in useEffect). */
  onValidationError?: (errors: SlideValidationError[]) => void;
  /** Override individual element renderers (passed to hast-util-to-jsx-runtime). */
  components?: Record<string, React.FC<any>>;
  /** Accessible label for the slide (defaults to "Slide"). */
  "aria-label"?: string;
  className?: string;
}

export type SlideValidationErrorCode =
  | "INVALID_FRONTMATTER"
  | "MULTIPLE_SLIDES"
  | "CONTENT_TOO_LARGE"
  | "BANNED_TAG"
  | "BANNED_ATTRIBUTE";

export interface SlideValidationError {
  code: SlideValidationErrorCode;
  path: string[];
  message: string;
}

export const Slide: React.FC<SlideProps>;
```

### 16.4 Dependências a adotar

| Package | Version | Licença | Justification |
|---|---|---|---|
| `mdast-util-from-markdown` | ^2.x | MIT | Tokenize+tree-build CommonMark; minimal vs full remark |
| `micromark-extension-gfm` | ^3.x | MIT | GFM (tables/strikethrough/autolinks) — paired with `mdast-util-gfm` |
| `mdast-util-gfm` | ^3.x | MIT | mdast extension for GFM tokens |
| `mdast-util-to-hast` | ^13.x | MIT | mdast → hast (HTML AST) |
| `hast-util-sanitize` | ^5.x | MIT | Allowlist sanitizer; defaultSchema |
| `hast-util-to-jsx-runtime` | ^2.x | MIT | hast → React tree (jsx-runtime) |
| `zod` | ^4.4.3 | MIT | Already a direct dep — reuse for frontmatter schema |
| `yaml` (or `js-yaml`) | ^2.x / ^4.x | MIT | Frontmatter parsing — `yaml` (eemeli) is smaller + ESM-first |

**All as `peerDependenciesMeta.optional = true`** — mirrors Whiteboard's roughjs/perfect-freehand pattern (`package.json` precedent verified). Consumer only pays the cost if they import `@usetheo/ui/slide`.

### 16.5 Test strategy

- **Unit (vitest + happy-dom):** `slide.test.tsx`
  - Happy path: simple markdown → renders heading + paragraph
  - GFM tables → render with correct semantic table tags
  - Frontmatter parsing: valid, missing, malformed (emits `INVALID_FRONTMATTER`)
  - Multi-slide input (contains `---`) → emits `MULTIPLE_SLIDES`, renders first slide
  - Banned tag (`<script>`, `<iframe>`) → stripped silently + `BANNED_TAG` emitted via callback
  - Theme prop change → CSS class swap
  - `aspectRatio` prop change → canvas dimensions
- **Schema tests:** `schema.test.ts`, mirrors `whiteboard/schema.test.ts` shape — all Zod edges (NaN, Infinity, oversize, unknown keys)
- **Hook tests:** `use-slide-fit.test.ts` — ResizeObserver mock; min/max clamp; teardown
- **Property-based (fast-check, OPTIONAL v0.2):** random valid CommonMark → never throws, always sanitizes
- **Accessibility (vitest-axe):** rendered slide has `role="region"` + `aria-roledescription="slide"`, no axe violations
- **Stories (Ladle):** `slide.stories.tsx` with happy path, GFM, dark theme, edge cases
- **Bundle test:** verify `dist/slide/*.js` doesn't import from `dist/index.js` (subpath isolation gate)

### 16.6 Phases of rollout

1. **Phase 1 — RFC + core API + schema + unit tests (TDD).** Target: green schema + parse tests, no runtime peer-deps yet (parse runs synchronously with statically-imported deps in test env).
2. **Phase 2 — Lazy dynamic imports for peer-deps + Ladle stories.** Target: dev workflow demo (`pnpm ladle:dev`), `<Slide markdown="# Hello" />` renders.
3. **Phase 3 — Theme system + container fit hook.** Target: themed rendering, `useSlideFit` working in dev story, `aspectRatio` prop.
4. **Phase 4 — Security hardening + sanitize coverage.** Target: every banned tag is covered by a test; `onValidationError` always fires for sanitize stripping.
5. **Phase 5 — Subpath bundle + quality gates + tsup config.** Target: `dist/slide/index.js` ships separately; barrel does not import slide module; `pnpm quality:gates` green.

### 16.7 Acceptance criteria

- [ ] `<Slide markdown="# Hello world" />` renders an `<h1>` inside `<section role="region" aria-roledescription="slide">`.
- [ ] GFM tables render with `<table><thead>...` semantic markup.
- [ ] Frontmatter `theme: violet-forge` swaps the theme class.
- [ ] `<script>`, `<iframe>` tags in markdown are stripped without raising; `onValidationError` invoked with `BANNED_TAG`.
- [ ] Multi-slide markdown (`# A\n\n---\n\n# B`) → renders A only, `onValidationError` invoked with `MULTIPLE_SLIDES`.
- [ ] `useSlideFit` resizes to container; clamped to `[minScale, maxScale]`.
- [ ] Type-check (`pnpm typecheck`) clean.
- [ ] Lint (`pnpm lint`) clean.
- [ ] Test suite green (unit + schema + hook + a11y axe).
- [ ] `pnpm bundle:diff` shows `dist/slide/*.js` under 30 kB gzip (target from §9).
- [ ] Subpath isolation: `dist/index.js` does not contain slide module bytes (validated by `pnpm structure:check`).
- [ ] Ladle story for every theme + every edge case from §12.
- [ ] CHANGELOG entry under `[Unreleased] / Added`.
- [ ] `docs/rfcs/0002-slide.md` PROPOSED → IMPLEMENTED at merge.
- [ ] RFC references this reference doc.

### 16.8 Risks + mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| micromark + 4 mdast/hast utils blow the 30 kB budget | med | high | Measure in Phase 5; if blown, fall back to `markdown-it` or trim GFM. Both routes are pre-vetted. |
| `hast-util-to-jsx-runtime` SSR quirks (React 18 jsx-runtime hydration mismatch) | med | med | Phase 2 includes an SSR fixture (Next.js app dir) + hydration assertion |
| Bundle isolation regression — slide module accidentally imported by barrel | low | med | tsup `entries` config + `pnpm structure:check` enforces; gated in CI |
| Theme CSS not isolated → bleed into host page | med | low (v0.1 has only 2 themes, scoped via `.theo-slide`) | Strict naming convention `--theo-slide-*` for CSS vars; smoke story renders inside a Tailwind container to catch regressions |
| Markdown extension creep — consumers ask for math/mermaid/twemoji | high | low | Document NON-GOALS in JSDoc + README; explicit "use composition" guidance |
| Peer-dep version drift (mdast/hast utils are pre-1.0 ecosystem, churn) | med | med | Pin minor; weekly Renovate; integration suite catches breaks |
| LLM emits `paginate: true` / `_backgroundColor:` directives we ignore silently | high | low | onValidationError emits `UNKNOWN_DIRECTIVE` for unrecognized frontmatter keys |
| Reveal.js scale-to-fit algorithm fails on extreme aspect mismatch (tall mobile container) | low | low | Test with vertical container in Ladle; clamp `maxScale` and document the behaviour |

## 17. Open questions

1. **Q1 — Multi-slide split markers.** Marp accepts `---`, `___`, `***`, `- - -` as slide splits ([how-to-write-slides.md:40](file:referencia/marp/website/docs/guide/how-to-write-slides.md#L40)). Should `<Slide>` reject ANY of those as multi-slide, or only the canonical `---`? Trade-off: stricter = fewer false negatives, less Marp compatibility for users migrating. **Possible paths:** A) reject only `---` (and let other rulers render as inline `<hr>`); B) reject all four. **Decision needed before Phase 1.** Owner: paulohenriquevn.

2. **Q2 — Should the default theme inherit from Violet Forge tokens or stand alone?** If we inherit (`--color-text: var(--vf-color-text-primary)`), the slide picks up the host's color scheme — great for dashboards, surprising for presentations on a brand template. Possible paths: A) inherit (one theme for both); B) decouple — `default` matches Violet Forge, `slide-presentation` is opinionated. **Decision can be deferred to Phase 3.**

3. **Q3 — micromark+mdast vs markdown-it bundle measurement.** Section 6 div. #1 hypothesizes micromark route is smaller (~25-30 kB) vs markdown-it (~50 kB). Need actual measurement before locking the dep set. Possible paths: A) ship a one-off bundle benchmark in Phase 1 to validate; B) lock micromark route and re-evaluate if budget blown in Phase 5. Recommendation: A.

4. **Q4 — Performance benchmark target.** §9 references "< 16ms on 4× CPU throttle". No public Marpit/Marp benchmark exists. We need an internal target. Possible paths: A) measure Marp Core on representative slide markdown for a baseline; B) just set "no regression vs N tokens" via vitest bench. Recommendation: B for v0.1, A as nice-to-have.

5. **Q5 — CVE history of indirect markdown deps.** §10 notes Marpit's CHANGELOG entries are not CVE-numbered. We should run `npm audit` against the chosen dep set during Phase 1 (parse.ts dep choices) and document findings here. Recommendation: blocking step before Phase 5 (ship).

6. **Q6 — Consumer documented.** RFC 0001-whiteboard required a documented consumer before promotion (`docs/rfcs/0001-whiteboard.md:7`). What is the first consumer for `<Slide>`? TheoCode Desktop "explain this PR" view? A future TheoKit `slide-of-the-day` app? **Block the Phase 5 merge until a concrete consumer is named in `docs/rfcs/0002-slide.md`.**

## 18. Referências citadas (todos os arquivos do inventário)

### Marpit (remote, fetched via raw.githubusercontent.com + `gh api` 2026-05-19)

#### Core
- `src/marpit.js` — public Marpit class, render pipeline, plugin chain. Referenced in §4.1, §5.1, §5.2, §5.5 (HTML disabled-by-default), §6, §7, §8 (algorithm: 16-plugin chain), §10, §11.
- `src/markdown/slide.js` — slide boundary detection algorithm. Referenced in §4.1 (#3), §5.2, §8 (alg-1), §12 (empty-slide edge case).
- `src/markdown/directives/parse.js` — frontmatter + `<!-- comment -->` directive extraction. Referenced in §4.1, §5.3, §6 div. #5, §10, §12.
- `src/markdown/directives/directives.js` — directive name registry (global / local / spot). Referenced in §3 (glossary), §4.1, §5.3.
- `src/markdown/directives/apply.js` — token-meta merge utility (listed in inventory, not deep-read; pattern equivalent to parse.js).
- `src/markdown/directives/yaml.js` — YAML loose-mode wrapper (listed, summarized in §10).
- `src/theme_set.js` — ThemeSet class, PostCSS pack pipeline, theme @import resolution. Referenced in §4.1, §5.4, §7, §11.

#### Support (listed, descarted with rationale in §2)
- `src/markdown/comment.js`, `src/markdown/inline_svg.js`, `src/markdown/slide_container.js`, `src/markdown/container.js`, `src/markdown/background_image.js`, `src/markdown/background_image/`, `src/markdown/sweep.js`, `src/markdown/fragment.js`, `src/markdown/collect.js`, `src/markdown/header_and_footer.js`, `src/markdown/heading_divider.js`, `src/markdown/style/`, `src/markdown/image.js`, `src/markdown/image/` — each justified in §2 discard table.

#### Doc / RFC / CHANGELOG
- `CHANGELOG.md` — performance entry v0.1.3, security entries v0.0.5 + v0.3.1, breaking changes v3.0.0. Referenced in §9, §10, §12.
- `docs/directives.md` — directive declaration syntax (frontmatter + HTML comment), global/local/spot scoping, edge cases. Referenced in §3, §5.3, §6, §12.

### Marp Core (remote)

#### Core
- `src/marp.ts` — Marp class extends Marpit, options, builtin plugins, three themes. Referenced in §4.2, §7, §13.

#### Config (theme)
- `themes/default.scss` — section dimensions 1280×720, font 29px, CSS variables (`--h1-color` light-dark, etc.), auto-scaling parts. Referenced in §4.2, §11 (no observability), §16.3 (canvas defaults), §3 (auto-scaling glossary).

#### Doc
- `marp-core/browser` (referenced from `referencia/marp/website/components/Marp.tsx:78`) — runtime helper for auto-scaling JS inside rendered HTML.

### Marp React (remote, INACTIVE)
- `README.md` — public API (`<Marp markdown options render>`, `<MarpWorker>`), deprecation notice. Referenced in §4.3, §13 (anti-pattern: wrapped engine deprecated).

### Marp marketing website (local clone `referencia/marp/`)

#### Core
- `referencia/marp/website/components/Marp.tsx:1-182` — generateRenderedMarp + `<Marp>` single-slide + `<MarpSlides>` carousel. Shadow DOM mount + font extraction pattern. Referenced in §4.4, §5.5, §6 div. #2, §10 (security trade-offs: clobberPrefix), §13, §14.1 (cookbook source).

#### Support
- `referencia/marp/website/utils/markdown/parse/index.ts:1-22` — unified pipeline (remark-parse + remark-gfm + remark-slug + custom transforms). Referenced in §4.4, §7.
- `referencia/marp/website/utils/markdown/parse/marp-code-block.ts:1-22` — unist-util-visit transformer for `:marp` code fences. Referenced in §4.4.
- `referencia/marp/website/utils/markdown/parse/image-paragraph-to-figure.ts` (listed; discarded in §2).
- `referencia/marp/website/utils/markdown/renderer/index.ts:1-28` — RemarkReact compiler + component overrides. Referenced in §4.4, §5.5, §7.
- `referencia/marp/website/utils/markdown/renderer/sanitize.ts:1-11` — hast-util-sanitize schema with `data*` allowlist and `marp-slides` tag extension. Referenced in §4.4, §10 (security trade-offs), §14.3 (cookbook source).
- `referencia/marp/website/utils/markdown/index.tsx:1-23` — entrypoint wiring parse + renderer. Referenced in §4.4.
- `referencia/marp/website/components/markdown/{Image,Pre,Heading,Anchor}.tsx` — presentational; listed in §2 discard table.

#### Doc
- `referencia/marp/website/docs/guide/how-to-write-slides.md:1-60` (read top 60 lines) — slide split markers (`---`/`___`/`***`/`- - -`), CommonMark blank-line requirement, GFM features list, HTML-disabled-by-default. Referenced in §3, §5.3, §12 (edge cases), §17 (Q1).
- `referencia/marp/website/docs/guide/heading-divider.md`, `referencia/marp/website/docs/guide/{theme,directives,fitting-header,fragmented-list,image-syntax,math-typesetting}.md` — listed in §2 discard table (covered by remote authoritative docs).
- `referencia/marp/README.md` — Marp family overview (Marpit / Marp Core / Marp CLI / Marp for VS Code / [INACTIVE] Marp React). Referenced in §4.3.
- `referencia/marp/package.json` — repository top-level metadata (private monorepo, workspaces: ["website"]). Referenced in §4.4 (confirms website-only clone).

### Reveal.js (remote, divergent reference)
- `js/reveal.js` — single-slide DOM contract (`section[data-state]`), CSS-variable theming (`--slide-width`, `--vh`), scale-to-fit algorithm. Referenced in §4.5, §5.2, §6 (divergence — HTML-first vs markdown-first), §11 (no logging precedent), §14.2 (cookbook source).

### External docs (Source D)
- [github.com/syntax-tree/mdast-util-from-markdown](https://github.com/syntax-tree/mdast-util-from-markdown) — `fromMarkdown(value, encoding?, options?)`; micromark as tokenizer; positioning vs remark vs markdown-it. Referenced in §3 (glossary), §4.6, §7, §17 (Q3).
- [hakimel/reveal.js master/js/reveal.js](https://github.com/hakimel/reveal.js/blob/master/js/reveal.js) — single-slide focus WebFetch. Same as Reveal.js entry above.
- [marp-team/marpit docs/directives.md](https://github.com/marp-team/marpit/blob/main/docs/directives.md) — Same as Marpit doc entry.
- [marp-team/marpit CHANGELOG.md](https://github.com/marp-team/marpit/blob/main/CHANGELOG.md) — Same as Marpit CHANGELOG entry.

### Commits / version anchors (git arqueologia)
- Marpit `v0.0.5 (2018-05-12)` — "Prevent style injections" — first security-flavored entry. §10.
- Marpit `v0.1.3 (2018-10-05)` — "Improve conversion performance by using `for-of` loop (40-70% faster)" — §9.
- Marpit `v0.3.1 (2018-11-24)` — "Upgrade dependent packages to prevent the malicious attack in dependencies" — §10.
- Marpit `v1.4.0` — Removal of dollar-prefixed directives (legacy breaking change). §12.
- Marpit `v2.5.0` — `paginate: skip` and `paginate: hold` (local-directive evolution). §4.1 CHANGELOG context.
- Marpit `v2.6.0` — `lang` global directive added (recent addition pattern). §4.1.
- Marpit `v3.0.0` — Drop Node 16, remove deprecated color image shorthand. §4.1.
- Marpit `v3.1.0` — CSS nesting support via `cssNesting` constructor opt. §4.1.

### Project-self precedent files (read for pattern compliance, not as prior art to copy)
- `src/components/primitives/whiteboard/whiteboard.tsx:1-60` — direct precedent for the React shell (props shape, `onValidationError` callback, `aria-label` default). Referenced in §6 div. #5, §11, §15 (ADR D1, D2, D7), §16.3.
- `docs/rfcs/0001-whiteboard.md:1-80` — RFC governance pattern (status table, summary, motivation, decision table, JSON schema). Referenced in §1, §13, §15, §16.6.
- `package.json` (TheoUI) — exports table, peerDependenciesMeta optional pattern (roughjs, perfect-freehand). Referenced in §16.2, §16.4.
- `CLAUDE.md` (TheoUI) — roadmap entry locking Slide as Explorer (RFC), "Reuse remark/micromark for parsing; do not reinvent the markdown layer." Referenced in document header + §1.
