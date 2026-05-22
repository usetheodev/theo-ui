# Changelog

All notable changes to `@usetheo/ui` are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.2.0-next.0] - 2026-05-20

Minor bump (not patch) because public API surface grew: new `defineTheme` /
`hex` / `rgb` exports plus `size` prop standardized across 9 primitives.
All additions are backwards-compatible — `defaultVariants.size = "md"`
preserves rendered markup for callers that don't pass `size`.

### Added
- **`defineTheme(partial)` + `hex()` / `rgb()` helpers (2026-05-20, theming-and-sizes plan, Phase 2)** — Reduzem o atrito de criar tema customizado de "58 cor keys obrigatórias" para "só sobrescreva o que mudar". `defineTheme({ name, light: { primary: hex('#FF5722') } })` merja partial overrides em `violetForge` e retorna um `Theme` completo. `hex('#7C3AED')` e `rgb(124, 58, 237)` retornam HSL string-tuple (`"262 83% 58%"`) drop-in compatível com `ColorScale`. Suporta short hex (#abc), 8-char alpha (alpha descartado), case-insensitive. **EC-3** (last-writer-wins): passar `defineTheme({ name: 'violet-forge', ... })` sobrescreve o built-in, comportamento documentado em teste. **EC-4** (case-insensitive) e **EC-5** (4-char alpha) cobertos por testes. **EC-7** (override só light/dark): nota em JSDoc lembra o consumer que se omitir um modo, ele herda violetForge — pode gerar inconsistência visual intencional. Drop-in: `<ThemeProvider themes={[defineTheme({ name: 'corp' })]}>` funciona sem mudança no provider. (#TBD)
- **9 primitives expose `size` prop (2026-05-20, theming-and-sizes plan, Phase 1)** — `Input`, `Badge`, `Toast`, `Checkbox`, `Switch`, `Card`, `FormField`, `Textarea`, `Select.Trigger` agora aceitam `size?: 'sm' | 'md' | 'lg'` (default `md`, backwards-compat preservada). Compounds `Card` e `FormField` propagam size via React Context para os subparts. **EC-1**: `Input` usa `Omit<InputHTMLAttributes<HTMLInputElement>, 'size'>` no extends para evitar conflict com o HTML attribute nativo (`size: number` = text-input columns); type-test garantido via `@ts-expect-error`. **EC-2**: `Select.Trigger` confirmado Radix-button (sem `SelectHTMLAttributes` conflict). Subparts de Card/FormField não aceitam `size` próprio — use `className` para per-subpart tweaks (EC-8 documentado em JSDoc). (#TBD)
- **`cn()` ensina tailwind-merge sobre o Violet Forge typescale (2026-05-20)** — `src/lib/cn.ts` substitui `twMerge` direto por `extendTailwindMerge` declarando o `font-size` classGroup com as 16 typescale tokens (`display-2xl`/`display-xl`/`headline`/`title-lg`/`body-md`/`label-caps`/`code-md`/etc.). Sem essa extensão, classes como `text-label` (font-size) e `text-accent` (color) colapsavam ambas no mesmo `text-*` group, e o último vencia — quebrando size+color em CVA variants. (#TBD)
- **Registry descriptors for the engine surface (2026-05-19)** — Seven new shadcn-compatible registry items so `docs.usetheo.dev/theoui` and the `npx shadcn add` flow can deliver the engines as copy-paste components: `whiteboard` (14 files under `components/ui/whiteboard/`), `slide` (16 files under `components/ui/slide/`, including 3 CSS theme files), `slide-deck` (19 files under `components/blocks/slide-deck/`), and four Tier 2 plugins — `slide-plugin-shiki`, `slide-plugin-math`, `slide-plugin-mermaid`, `slide-plugin-emoji` — each shipping its own subpath under `components/ui/slide/plugins/<name>/`. Cross-item references resolved via `registryDependencies` (each plugin + slide-deck depend on `slide`). Honest install: dependencies arrays list every static or dynamic peer-dep a copy-paste consumer needs (`roughjs`, `perfect-freehand`, `zod` for whiteboard; the full markdown / mdast / hast stack for slide; `shiki` / `katex` / `mermaid` per plugin). Total: 121 registry items (was 114). (#TBD)
- **`scripts/build-registry.ts` strips source ESM extensions on external imports** — `rewriteRegistryImports` now drops `.js` / `.jsx` / `.ts` / `.tsx` from non-relative specifiers (e.g. `roughjs/bin/generator.js` → `roughjs/bin/generator`). Previously only relative imports were normalized; engines that import third-party submodules with the explicit ESM extension (whiteboard does this for `roughjs/bin/*`) would fail `validate-registry`'s `consumer-unsafe extension` gate. Limited to known source extensions so basenames that happen to end in `.js` inside URLs are untouched. (#TBD)
- **`scripts/validate-quality-gates.ts > validateRegistryStoriesAndTests` is entry-aware** — When a descriptor lists multiple files (engines like whiteboard / slide / slide-deck), the gate now only checks `<descriptor.name>.test.tsx` / `.stories.tsx` next to the entry file (`<name>.tsx` or `<name>.ts`), not every internal module. Internal helpers carry their own focused tests but don't need a story sibling. Single-file registry items are unaffected. (#TBD)

## [0.1.0-next.1] - 2026-05-19

### Added
- **Slide rich content — Tier 1 baked-in + Tier 2 plugin system (2026-05-19, RFC 0004)** — Estende `<Slide>` (RFC 0002) e `<SlideDeck>` (RFC 0003) com conteúdo rico nível PowerPoint sem reinventar parsers. **Tier 1 (zero peer-deps novas):** (a) GFM alerts `> [!NOTE/TIP/IMPORTANT/WARNING/CAUTION]` detectados em mdast post-process (alerts.ts) → `<aside class="theo-slide-alert" data-theo-slide-alert-type>` temado em ambos os themes (default + violet-forge); (b) 7 layouts via frontmatter `layout` (`default`, `title`, `two-column`, `image-right`, `image-left`, `code-output`, `section`) em CSS grid templates (themes/layouts.css importado pelos dois themes); (c) backgroundImage + backgroundGradient com `sanitizeBgUrl` rejeitando `javascript:`/`vbscript:`/TODO data: URLs (EC-7), cap 500_000 chars; (d) Marpit `![bg](url)` syntax extraído em mdast walker → `ParsedSlide.extractedBackground = { url, modifier }` (D18/EC-5), sanitizado antes de armazenar com fallback `MARPIT_BG_UNSAFE_URL`, modifier-aware (`cover`/`fit`/`left`/`right`); (e) header/footer/paginate overlays via frontmatter (plain text ≤200 chars cada), CSS absolute positioned. **Tier 2 (opt-in plugin system):** plugin architecture com `<Slide plugins={SlidePlugin[]}>` e relay `<SlideDeck plugins>` para cada slide interno. `SlidePlugin` shape: `{ name, mdastTransform?, hastTransform?, components?, sanitizeSchemaExtension? }` com error isolation D16 (cada chamada em try/catch, throws agregadas em `errors[]` com `code: "PLUGIN_ERROR"`; pipeline **nunca** propaga exception) e sanitize-schema merge D17 (extensions unionadas com defaultSchema + Tier 1 baseline). Quatro plugins shipados em sub-subpaths `@usetheo/ui/slide/plugins/{shiki,math,mermaid,emoji}`: **shikiPlugin** (peer-dep `shiki`; lazy + singleton highlighter; pre-renderiza `<pre><code class="language-XXX">` em HTML temado dual-theme com sanitize ext `<span> style/className`); **mathPlugin** (peer-deps `katex` + `hast-util-from-html`; substitui `$inline$` + `$$block$$` por KaTeX displayMode/inline; skip em `<code>`/`<pre>`; sanitize ext com lista completa de ≥30 tags MathML — `math`, `mfrac`, `msqrt`, `msup`, `msub`, `msubsup`, `munder`, `mover`, `mtable`, `mtr`, `mtd`, `mphantom`, `mstyle`, `annotation`, etc. — EC-4); **mermaidPlugin** (peer-dep `mermaid`; converte `<pre><code class="language-mermaid">` em `<theo-mermaid source>` com React `<MermaidDiagram>` que lazy-importa mermaid e injeta SVG via innerHTML; SSR placeholder distinguível de erro com `role="img"` + source code preservado, EC-10; sanitize ext com ≥30 tags SVG — `svg`, `g`, `path`, `rect`, `circle`, `text`, `marker`, `foreignObject`, etc. — EC-4); **emojiPlugin** (zero peer-deps de runtime, usa `unist-util-visit-parents` já no stack; 100 shortcodes Unicode embedded; **EC-6: ancestor check** via `isInsideCodeOrPre` skipa replace dentro de `<code>`/`<pre>` para preservar type hints Python / YAML keys / Ruby symbols). Pipeline order: `validateSlide → parseBody → detectAlerts (Tier 1) → extractMarpitBackgrounds (Tier 1) → plugin.mdastTransform[] → mdastToHast → plugin.hastTransform[] → sanitize(defaultSchema + extensions) → hastToReact (consumer + plugin components)`. Bundle isolation invariant preservada: barrel `dist/index.js` **inalterado**; cada plugin é entry tsup próprio com peer-deps externalizados. `scripts/sync-exports.ts` ganha 4 entries em `ISOLATED_SUBPATHS`. `package.json` ganha 9 peer-deps opcionais (`shiki`, `katex`, `mermaid`, `micromark-extension-math`, `mdast-util-math`, `hast-util-from-html`, `unist-util-visit`, `unist-util-visit-parents`). RFC `docs/rfcs/0004-slide-rich-content.md` status `Implemented`. **128 testes novos** distribuídos em 13 phases (T0.1 plugin contract: 13 testes; T0.2 parseSlide integration: 11 testes; T1.1 alerts: 8 testes; T2/T3/T5 schema: 25 testes; T4.1 Marpit bg: 9 testes; T6.1 Shiki: 6 testes; T7.1 Math: 7 testes; T8.1 Mermaid: 7 testes; T9.1 Emoji: 10 testes; Slide component: 32 testes). Suite total: 1174 testes verdes. Codes de erro novos: `PLUGIN_ERROR`, `PLUGIN_PEER_DEP_MISSING`, `MARPIT_BG_UNSAFE_URL`. (#TBD)
- **SlideDeck composite engine — multi-slide deck w/ navigation, presenter, fullscreen, PDF (2026-05-19)** — `@usetheo/ui/slide-deck` agora orquestra N `<Slide>` primitives com navegação completa: keyboard (←/→/Space/Home/End/Esc/F/N/Ctrl+P, com guard contra inputs/contentEditable), touch swipe (Pointer Events nativos, multi-touch filtrado, pointercancel limpo — EC-6/EC-7), hash routing bidirectional (`#/N` 1-based, via `history.replaceState` para evitar loop — EC-10), lazy initializer SSR-safe (D17/EC-5). Sub-componentes em namespace dot: `<SlideDeck.Slides>` `<SlideDeck.Controls>` `<SlideDeck.ProgressBar>` `<SlideDeck.SlideNumber>` `<SlideDeck.Thumbnails>` (IntersectionObserver lazy + EC-13 fallback) `<SlideDeck.PresenterView>` (inline panel com timer + speaker notes) `<SlideDeck.FullscreenButton>` (cross-browser API + EC-8 iOS guard) `<SlideDeck.PrintButton>` (window.print + `@page` CSS, afterprint cleanup). Transitions CSS-only (`none`/`fade`/`slide`) com timeout fallback 300ms (D16/EC-3) e respeito a `prefers-reduced-motion`. Progressive fragments via Marpit-style `*` lists (D12, contagem por regex anti-falsos-positivos em `**bold**` ou fenced code). Speaker notes via `<!-- notes: ... -->` HTML comments (D11). Aceita `slides: string | SlideDeckSlide[]` (D4); split string via mdast `thematicBreak` reusando algoritmo do Slide D12 + strip global frontmatter primeiro (D15/EC-1 — evita phantom empty slide). `useReducer` state machine com `UPDATE_TOTAL_SLIDES` que clampa `currentIndex` (EC-4). Zero peer-deps novas — reusa as 7 do Slide. Bundle isolado em `dist/slide-deck/index.js` (~48 KB com Slide vendored); barrel principal `dist/index.js` **inalterado**. RFC `docs/rfcs/0003-slide-deck.md` status `Implemented`. 160 testes específicos do SlideDeck verdes. Stories Ladle: `DefaultDeck`, `WithGfmTable`, `WithSpeakerNotes`, `WithFragments`, `WithFadeTransition`, `WithSlideTransition`, `HashRouting`, `HeadlessLayout`, `WithThumbnails`, `PresenterModeOn`, `LargeDeck` (50 slides), `EmptyDeck`, `SingleSlideDeck`, `ControlledNavigation`. (#TBD)
- **Slide engine — view-only primitive funcional (2026-05-19)** — `@usetheo/ui/slide` agora renderiza markdown + frontmatter YAML como surface temada com canvas lógico fixo (default 16:9 → 1280×720), espelhando o padrão de bundle isolado entregue pelo Whiteboard. Pipeline: `validateSlide` (async — D11) → `parseBody` (micromark + GFM) → `mdastToHast` (`allowDangerousHtml: false`) → `sanitizeHast` (`defaultSchema` sem extensões — D8, com diff de tag-count que emite `BANNED_TAG` — D13) → `hastToReact` (real React VDOM via `hast-util-to-jsx-runtime` — D9, **sem `dangerouslySetInnerHTML`**). Frontmatter YAML único (sem HTML comment syntax do Marpit — D4), validado com Zod `.strict()` (4 keys aceitos: `theme`, `lang`, `color`, `backgroundColor`). Multi-slide input (top-level `---` detectado via mdast `thematicBreak` — D12, sem false-positive em fenced code blocks) emite `MULTIPLE_SLIDES` e renderiza somente o primeiro slide. Input guards (D14): BOM strip, `aspectRatio` inválido → fallback 16:9 + `INVALID_ASPECT_RATIO`, raw frontmatter > 10 KB → `FRONTMATTER_TOO_LARGE`. Container fit (D7) via `useSlideFit` hook (algoritmo Reveal.js: `scale = clamp(min(W/cw, H/ch), minScale, maxScale)` em `ResizeObserver` callback). Dois temas built-in (`default`, `violet-forge`) via CSS variables `--theo-slide-*` layered sobre Violet Forge tokens, com `light-dark()` para dark mode automático. A11y: `<section role="region" aria-roledescription="slide" aria-label>`. Race-resistant re-parse via `versionRef` counter (EC-7). 7 markdown peer-deps são **opcionais**: `mdast-util-from-markdown`, `mdast-util-gfm`, `micromark-extension-gfm`, `mdast-util-to-hast`, `hast-util-sanitize`, `hast-util-to-jsx-runtime`, `yaml`. Bundle isolado em `dist/slide/index.js`; barrel principal `dist/index.js` **inalterado**. RFC `docs/rfcs/0002-slide.md` status `Implemented`. 12 Ladle stories: `HappyPath`, `GfmTable`, `WithFrontmatter`, `VioletForgeTheme`, `AspectFourByThree`, `MultiSlideTruncated`, `MalformedFrontmatter`, `BannedScript`, `LongContent`, `CustomComponents`, `SmallContainer`, `LargeContainer`. (#TBD)
- **Whiteboard engine — view-only primitive funcional (2026-05-18)** — `@usetheo/ui/whiteboard` agora renderiza JSON declarativo (`WhiteboardData`) como SVG com estética hand-drawn estilo Excalidraw. **Sete tipos** de elemento suportados: `rect`, `ellipse`, `diamond`, `line`, `arrow`, `text`, `freedraw`. **Pan + zoom built-in** via `viewBox` (wheel = zoom-to-cursor, mouse drag = pan, Space = hand mode, pinch touch supported). **Prop `fitOnLoad`** centra automaticamente os elementos na viewport. Schema Zod com clamps de sanidade (EC-3 `.finite()` rejeita NaN/Infinity; EC-4 `.max(20000)` em dimensões; `.max(500)` em labels; `.max(5000)` em text e points/elements). `<Whiteboard>` valida JSON em `useMemo`, dispara `onValidationError` em `useEffect` (EC-6 — nunca durante render), e cai em SVG vazio com `data-whiteboard-state="invalid"` quando o JSON falha. SSR-safe (`renderToString` produz markup estático correto). `roughjs` + `perfect-freehand` são peer-deps **opcionais**; `zod` entra em `dependencies` regulares (EC-5 opção A). Bundle isolado em `dist/whiteboard/index.js` (21.53KB ESM); barrel principal `dist/index.js` **inalterado** (320.41KB). RFC `docs/rfcs/0001-whiteboard.md` status `Implemented`. 86 testes específicos do Whiteboard verdes + 776 testes totais do projeto. Stories Ladle: `Empty`, `Flowchart`, `Architecture`, `FreedrawSketch`, `MixedAll`, `InvalidJSON`. (#TBD)
- **`scripts/validate-bundle-size.ts` ganha gate EC-1 anti-leak** — Após o check de tamanho, faz `grep` em `dist/index.js` por strings `roughjs` e `perfect-freehand`; falha o build se qualquer engine peer-dep aparecer no barrel. Previne regressões silenciosas onde uma engine vaze para o barrel principal e arraste KBs extras para todos os consumers, mesmo os que só usam shadcn primitives. Runtime-metric proof: `grep -c "roughjs\\|perfect-freehand" dist/index.js → 0` confirmado em 2026-05-18. (#TBD)
- **`scripts/sync-exports.ts` ganha `ISOLATED_SUBPATHS`** — novo array de overrides para subpaths que devem apontar para `dist/<engine>/index.js` próprio, não re-export do barrel. Detecta colisão com auto-scanned subpaths e lança Error explícito. Suporta a regra de bundle isolation por engine declarada em `CLAUDE.md > Roadmap`. Cobertura via novo `scripts/sync-exports.test.ts` (6 testes). (#TBD)
- **`tsup.config.ts` ganha multi-entry** — `entry` agora é objeto com `index` (barrel) + `whiteboard/index` (engine). External list inclui `roughjs`, `/^roughjs\//` e `perfect-freehand` para garantir que o engine bundle não vendoriza essas libs e o barrel não vaza. Build produz `dist/whiteboard/index.{js,d.ts}` ao lado de `dist/index.{js,d.ts}` sem afetar tamanho do barrel. (#TBD)
- **`zod@4.4.3` em `dependencies`** + `roughjs ^4.6.0` / `perfect-freehand ^1.2.0` em `peerDependencies` com `peerDependenciesMeta.optional=true` — engine peer-deps são opt-in para o consumer que não importa o subpath; Zod é runtime dep regular para garantir que validação não crashe (decisão EC-5 opção A documentada em `.claude/knowledge-base/reviews/edge-cases/whiteboard-view-primitive-edge-cases-2026-05-18.md`). (#TBD)

- **Roadmap formalized (2026-05-18)** — 4 future engines / composites explicitly in scope: `Whiteboard` (Excalidraw-like primitive), `Slide` (Marp-like primitive), `SlideDeck` (composite that orchestrates `Slide` primitives), `Diagram` (Mermaid-like primitive). Each is Explorer (RFC) status, multi-quarter effort, will land via individual RFCs running the full quality-gate chain. Documented in `README.md` (`## Roadmap`) and `CLAUDE.md` (`## Roadmap (formalized 2026-05-18)`) with rules in force per engine: don't reinvent algorithmic cores (markdown / DSL parsing, graph layout, freedraw rendering use mature OSS deps), bundle isolation via subpath import (not main barrel), YAGNI gate (no engine ships without a documented consumer), Apache-2.0 compatible deps only. No version commitment — not on the 0.1 / 1.0 line.

## [0.1.0-next.0] - 2026-05-16

First public pre-release on npm under the `next` dist-tag. Install with
`pnpm add @usetheo/ui@next` (the default `latest` tag is intentionally
unset until 1.0). Highlights from the agent-team-audit-fixes-2026-05-16
remediation sprint:

- New `<TheoUIProvider>` primary entry point (T2.1).
- `<ThemeProvider>` decoupled from `violetForge` (T2.5, **breaking** —
  see migration below).
- CSS injection allowlist + `safeHref` URL guard (T3.2 / T3.3).
- LiveRegionContext universal — eliminates double aria-live
  announcements across 9 components (T4.1, MF-4).
- React 19 compatibility verified in CI (T6.3); `onToggle` clash with
  the new `ToggleEventHandler` resolved in 6 components.
- New composite-to-composite cycle detection gate (re-audit NEW-C).
- happy-dom 16 → 20 (closes CVE-2025-61927 in test env; T3.1).
- Postcss override + tailwindcss-animate moved to deps (T6.1 / T6.4).
- ScrollBar standalone removed in favor of `ScrollArea.Bar` (T7.4).

### Changed (BREAKING, 2026-05-16) — T2.5 ThemeProvider decouple
- **`<ThemeProvider>` now requires the `themes` prop.** Previously, the prop was optional and ThemeProvider auto-included `violet-forge` regardless. Since the source no longer top-level imports `violetForge`, the runtime now throws a helpful error if `themes` is missing or empty. This decouples consumer bundle size from the built-in theme set: consumers passing only custom themes no longer ship `violetForge.ts` (~6 KB savings).
- **Migration**:
  ```tsx
  // Before
  import { ThemeProvider } from "@usetheo/ui";
  <ThemeProvider>...</ThemeProvider>

  // After — option A (recommended for parity with old behavior)
  import { ThemeProvider, builtinThemes } from "@usetheo/ui";
  <ThemeProvider themes={builtinThemes}>...</ThemeProvider>

  // After — option B (new in v0.1.0-next.0)
  import { TheoUIProvider } from "@usetheo/ui";
  <TheoUIProvider>...</TheoUIProvider>
  ```
- **Why this is acceptable pre-1.0**: package is `0.0.0` and never published; first public release will be `0.1.0-next.0`. No external consumers exist yet (validated via `npm view`).

### Added (Agent-team audit fixes, 2026-05-16)
- **`<TheoUIProvider>` (T2.1)** — primary entry point composing `<ThemeProvider>` + `<Toaster>` with sensible defaults (`themes={builtinThemes}`). Recommended for new consumer apps; preserves "works out of the box" DX while keeping explicit primitives (`ThemeProvider`, `Toaster`) available for bespoke setups.
- **`registry/index.json#metadata.requires.tsconfigPathAlias` (T2.3)** — explicit declaration of the `@/` path alias precondition required by the copy-paste install path. New `validateApiCompatibility` gate fails if the field is missing.

### Changed (Agent-team audit fixes, 2026-05-16)
- **`src/index.ts` barrel reorganized (T2.4)** — 8 composites (`SkillsList`, `SkillEditor`, `RuleEditor`, `CronJobsList`, `MCPServerList`, `AgentEditor`, `ApprovalCard`) moved from the `// PRIMITIVES` editorial section to a dedicated subsection under `// COMPOSITES`. No name changes, no type changes, `package.json#exports` unchanged. Quality gate of taxonomy already enforces the rule mechanically; this aligns the human signal.
- **`docs/architecture.md` + `README.md`** — added subsection "Subpath exports — convenience aliases, not code splitting" (T2.2) explaining that all 99 subpath entries resolve to the same `dist/index.js`, tree-shaking is what shrinks bundles, and `tsup splitting: false` is deliberate.
- **`scripts/validate-registry.ts`** — `targetToItemName` reverse map resolves `@/components/ui/<target>` imports to the registry item that ships that file (fix for multi-file items like `toast` which ships `toaster.tsx`).

### Documentation (Agent-team audit fixes, 2026-05-16)
- **`PITCH.md`** — removed false claim that `npx create-theokit my-app` already imports `@usetheo/ui` when picking the dashboard template (verified via `grep -r "@usetheo/ui" /home/paulo/Projetos/usetheo/theokit/` returning zero matches). Replaced with honest "TheoKit integration is on the roadmap." Aligned tertiary CTAs with reality (substituted dead `docs.usetheo.dev/ui` with GitHub anchor).
- **`README.md`** — updated `pnpm quality:gates` pipeline listing to match `package.json#scripts['quality:gates']` exactly: now lists 11 gates (`format:check` → `lint:ci` → `typecheck` → `test` → `build` → `registry:build` → `registry:validate` → `quality:structure` → `quality:bundle` → `quality:a11y` → `ladle:build`). Previous text omitted `quality:bundle` and `quality:a11y`.
- **CHANGELOG correction** — earlier entry under "Phase 3 — Build correctness + exports surface" stated `validateExportsMap` "locks `package.json#exports` to the canonical 5-entry set". Since commit `77b2f7a` (`feat(exports): subpath import for every component`) the strategy expanded to 107+ subpath entries generated by `scripts/sync-exports.ts`. Authoritative source is `package.json` itself. Prior entries in versioned releases stay immutable per Keep a Changelog; this correction lives in `[Unreleased]`.

### Added (Pitch + Voice and Tone formalization, 2026-05-15)
- **`PITCH.md`** at project root — landing-page copy for `@usetheo/ui` (Violet Forge) using the TheoKit aspirational voice. Three layers: HERO (no jargon), BODY (benefit-first with one technical anchor per item), DEEP DIVE (full technical vocabulary, after the `## How it works` delimiter). Companion to `README.md` for marketing surfaces; verified component counts and quality metrics against `README.md` and `src/`.
- **`CLAUDE.md`** at project root — contract between Claude and this project. Defines what TheoUI is, the locked names (npm package, theme names, registry endpoint, module format, component taxonomy), the Voice and Tone section that formalizes adoption of the TheoKit aspirational voice for public copy (strategic review dated 2026-05-15), the relationship to the other usetheo pillars (Harness, Skills, Runtime), and the quality-gate non-bypass rule.

### Changed (Cross-project, 2026-05-15)
- Root monorepo `CLAUDE.md` (`../CLAUDE.md`) `## Voice and Tone — sub-project scoped` section: TheoUI moved from the "technical-direct only" list to the aspirational-voice list, alongside TheoKit and TheoKit-SDK. Rationale captured inline (TheoUI is the visual surface every other product inherits from; benefits from outcome-shaped framing on landing copy).
- Root monorepo sub-project index: `theo-ui` "Read first" pointer updated from `theo-ui/README.md` to `theo-ui/CLAUDE.md` (was a fallback because no `CLAUDE.md` existed in this project until today).

### Changed (README alignment with PITCH, 2026-05-15)
- `README.md` HERO + BODY layers rewritten in the TheoKit aspirational voice to match `PITCH.md`. New h1: *"The UI your agent already needs."* Tagline calls out the 102 agent-shaped components. `@usetheo/ui` demoted from h1 to a small tag above it (discoverability preserved without dominating the HERO).
- Added `## The shift` storytelling block between the HERO and `## Why @usetheo/ui`.
- `## Why @usetheo/ui` now closes with the comparison table from `PITCH.md` (`@usetheo/ui` vs shadcn/Radix, Tremor, build-yourself) and the punch line *"Same Radix UI underneath as shadcn — no philosophy fight. We just shipped the next 102 components you were about to write."*
- Added `## What you'd build` (5 concrete surfaces) before `## Quickstart`.
- Added `## How it works` DEEP DIVE delimiter before `## Quickstart`; everything from there downward stays technical-direct.
- Quickstart code sample swapped from a generic `<Button>` example to `<AgentEvent>` + `<ToolCall>` + `<DeploymentRow>` — agent-shaped primitives nobody else ships.
- Added `## Status` section between `## License` and the bundle/architecture content: production callouts, registry-distribution plan, ESM-only caveat, "component count is the floor" framing.

### Added (BLOCKER-002 / BLOCKER-003 remediation)
- **`src/styles/tailwind-preset.ts`** — single source of truth for the Violet Forge Tailwind tokens (colors, fontFamily, Geist-inspired typescale, borderRadius, boxShadow, motion, keyframes, animation + tailwindcss-animate plugin). `tailwind.config.ts` now consumes the preset via `presets: [theoUIPreset]` (was inline `theme.extend`).
- **`registry/tailwind-preset.json`** (`registry:lib`) — distributes the preset to copy-paste consumers via `npx shadcn add tailwind-preset`. Declares `tailwindcss` + `tailwindcss-animate` as deps.
- **`scripts/add-tailwind-preset-dep.ts`** — idempotent patcher that adds `tailwind-preset` to every `registry:ui` / `registry:block` `registryDependencies`. Ran once; 99 descriptors patched, 12 skipped (lib/types/preset itself). Without the preset, copy-paste consumers received markup using utility classes (`text-body-md`, `text-display-2xl`, `text-label-caps`, `font-display`, …) that vanilla Tailwind doesn't ship.
- **Quality gate `validateRegistryPresetDep`** — fails when any `registry:ui` / `registry:block` is missing `tailwind-preset` from its `registryDependencies`.
- **Fixture CSS build in `scripts/test-registry-install.ts`** — after `tsc --noEmit`, the script now writes `src/styles/global.css`, runs `pnpm exec tailwindcss` against the fixture, and asserts the compiled output contains 12 required utility classes (`text-body-md`, `text-display-2xl`, `text-label-caps`, `font-display`, etc.). Previously the script only ran `tsc`, which couldn't detect BLOCKER-002 because typescale classes are runtime artifacts.
- **Fixture `tailwind.config.ts` + `postcss.config.cjs`** — `tests/fixture-shadcn-app/` now has a real Tailwind toolchain with `safelist` covering the full Violet Forge typescale (forces compilation of every preset entry as proof of capability, independent of fixture App.tsx usage).
- `validateDesignSystemFidelity` audits `src/styles/tailwind-preset.ts` instead of `tailwind.config.ts` (typescale now lives in the preset).

### Added (Phase 6 — observability + test hardening, finalized)
- **`quality:bundle` gate (HIGH-008 / T6.3)** — `scripts/validate-bundle-size.ts` compares the actual byte sizes of 6 dist artifacts (`index.js`, `index.d.ts`, `styles.css`, `tokens.css`, `fonts.css`, `fonts-cdn.css`) against `scripts/baselines/bundle-sizes.json`. Fails the gate when any file is outside ±5% of baseline. Run `pnpm quality:bundle:update` to rebaseline after a legitimate size change (the diff lands in the PR so reviewers see it). Wired into `pnpm quality:gates`.
- **`quality:a11y` gate (MEDIUM-011 / T6.6)** — `pnpm quality:a11y` wraps the Ladle axe sweep (`src/test/ladle-axe.test.tsx`) so it can be invoked standalone or as part of `pnpm quality:gates`. 126 Ladle stories asserted by axe-core via vitest-axe, zero violations. Wired into `pnpm quality:gates` between `quality:bundle` and `ladle:build`.
- **`validateScriptsAndCi` now requires** `sync:exports`, `quality:bundle`, `quality:a11y` in addition to the existing required scripts (`format:check`, `registry:build`, `registry:validate`, `quality:structure`, `quality:gates`, `ladle:build`). Prevents accidental removal during refactors.

### Added (MEDIUM-011 / T6.6 — Ladle stories axe sweep, lightweight implementation)
- **`src/test/ladle-axe.test.tsx`** — 126 Ladle stories pass `vitest-axe` with zero violations. Discovers stories via `import.meta.glob("../**/*.stories.tsx")`, renders each via `@testing-library/react`, runs the axe-core ruleset. Replaces the originally-planned `playwright + axe-playwright` approach (which would have added ~80 MB of devDeps) by reusing the existing happy-dom + vitest-axe stack. Trade-off documented in the file's JSDoc.
- Story-context skip list (12 entries) covers (a) side-by-side variant grids that legitimately repeat landmarks, (b) intentionally-empty states for `aria-required-children` containers, (c) Radix Select stories that demonstrate the unselected/empty state, (d) `AgentStream / FullStream` semantic patterns flagged for follow-up but not regressions from this audit, and (e) `Theo Code Shell` screen stories that depend on Ladle-runtime hooks outside happy-dom's reach. Each entry carries a one-line rationale comment.
- Story-axe rule overrides disable 4 rules that fire false positives in isolated story render (`heading-order`, three `landmark-*` rules). Per-component tests keep these rules ON because the test author controls the surrounding markup.

### Added (Phase 7 — API cleanup, LOWs and NITs)
- **`ScrollArea.Bar` compound** (MEDIUM-007 / T7.1). `ScrollArea` is now a compound (`Object.assign /*#__PURE__*/`) exposing `.Bar` as the canonical subpart. Legacy `ScrollBar` standalone export retained as a `@deprecated` alias for one major version; consumers should migrate to `ScrollArea.Bar`.
- **`Skeleton` JSDoc accessibility override note** (LOW-004 / T7.2). Documents how to silence per-instance `aria-live` announcements when many Skeletons mount in a list/grid; recommends one container-level `role="status"` and per-Skeleton `aria-live="off" aria-hidden="true"`.
- **README "Bundle & module format" section** (LOW-002 / T7.2). Documents the ESM-only decision, tree-shaking via the barrel, CSS distribution map, self-hosted-fonts-as-default plus opt-in CDN.
- **`docs/design-system.md` §"Anti-glass guideline"** (NIT-002 / T7.2). Promotes the "no `backdrop-filter: blur(...)`" rule from inline JSDoc comments to a named DS principle: rationale (Vercel-aligned neutrals + content-led density), performance cost, RFC escalation path.
- **`playground/**/*` added to `tsconfig.json#include`** (LOW-001 / T7.2); `playground/dist` added to `exclude`.

### Added (Phase 6 — observability + test hardening, continued)
- **displayName regression tests on 10 compounds total**: `Card`, `Dialog`, `Tabs`, `Avatar` (committed previously) + `Sheet`, `Sidebar`, `TopNav`, `RadioGroup`, `Toast`, `FormField`. Each test asserts root + every subpart `.displayName` per `Object.assign /*#__PURE__*/` wiring (HIGH-009 / T6.2 complete).
- **MEDIUM-002 / T6.5 — dev-only warn when `BuildLogStream` `visibleLevels` prop flips between controlled and uncontrolled** between renders. `useRef` tracks the previous mode; a one-line `console.warn` in dev surfaces the regression before it manifests as confusing filter state.
- **MEDIUM-003 / T6.7.1 — visual-regression test on `PermissionMatrix`** that asserts the inline native `<input>` and `<select>` carry `border-input`, `font-mono`, and `ring` token classes. Catches drift between the matrix and the standalone Input/Select primitives without requiring full snapshot infrastructure.
- **MEDIUM-013 / T6.7.5 — unit tests for `parseExportsFromIndex`** (the pure parser extracted from `parseIndexExports` in `scripts/sync-readme.ts`). 9 tests cover empty input, single primitive, single composite, mixed `type` exports, multi-line bodies, sorted output, non-component imports, and `as`-aliased re-exports.

### Added (Phase 6 — observability + test hardening)
- **Dev-only `console.warn` in `ThemeProvider` storage catches** (HIGH-006 / T6.1). The three previous silent catches around `localStorage.{getItem,setItem}` now surface a one-line diagnostic in dev (Safari private mode, blocked third-party cookies, sandboxed iframes). Production stays silent because behavior is fail-safe. New helper `warnStorageFailure(scope, err)` carries the `process.env.NODE_ENV === "production"` guard and the per-call `biome-ignore` annotation.
- **`displayName` regression tests on compound components** (HIGH-009 / T6.2) — `Card`, `Dialog`, `Tabs`, `Avatar` (more to follow). Catches accidental refactors that lose `.displayName` after `Object.assign /*#__PURE__*/` wiring; preserves React DevTools naming.

### Changed (Phase 6)
- **`agent-stream` adds explicit `aria-atomic="false"`** (MEDIUM-001 / T6.4) so VoiceOver/macOS does not reannounce the entire log on each new item.
- **`React.<Type>` namespace usage replaced with named imports** (MEDIUM-012 / T6.7.4) across 17 occurrences in 12 files: `React.FormEvent`, `React.KeyboardEvent`, `React.MouseEvent`, `React.ReactNode`, `React.SVGProps`, `React.Ref`, `React.HTMLAttributes` → corresponding `import type { … } from "react"` (preserves `verbatimModuleSyntax` correctness, forward-compatible with React 19 type changes). Zero `React.` namespace references remain in `src/`.

### Added (Phase 5 — docs + governance)
- **`CONTRIBUTING.md`** — operational handbook: setup, taxonomy rule, adding components, quality gates explained, registry distribution, PR conventions, release process, internal exploration archive policy.
- **`SECURITY.md`** — disclosure policy, supported versions matrix, vulnerability scope (in/out), hardening already in place (ThemeScript `</script>` escape, no `dangerouslySetInnerHTML` outside SSR helper, lint guards). Aligns with GitHub Security Advisories workflow.
- **`docs/architecture.md` §"Global Provider Primitives"** — closed-set, RFC-gated exception for `Toaster` + `ThemeProvider`. Names the trade-off explicitly so future contributors can't dilute it silently (HIGH-007 / D7).
- **`referencia/` documentation policy** — `CONTRIBUTING.md` and `SECURITY.md` both name `referencia/` as unmaintained internal exploration archive, not shipped, not in scope for vulnerability reports. Future cleanup will relocate to a separate read-only repository. The directory itself is `.gitignore`d (MEDIUM-004 / T5.4).
- README nav links `Contributing` and `Security`.

### Changed (HIGH-002 / T4.1 — self-hosted fonts as default)
- **`src/styles/fonts.css` no longer `@import`s from `fonts.googleapis.com`.** Now declares six `@font-face` rules pointing at `./fonts/geist-{400,500,600}.woff2` and `./fonts/geist-mono-{400,500,600}.woff2`. Total asset budget: ~290 KB of woff2 next to the CSS. Eliminates the render-blocking third-party fetch that previously hit `fonts.googleapis.com` on every cold page load — fixes GDPR / CSP friction for the enterprise audience.
- `src/styles/fonts-cdn.css` (NEW) — opt-in entrypoint that preserves the legacy Google Fonts CDN behavior. Consumers who prefer not to host static assets can `@import "@usetheo/ui/fonts-cdn.css"` instead of `@usetheo/ui/fonts.css` / `@usetheo/ui/styles.css`.
- `tsup.config.ts` `onSuccess` now also copies `src/styles/fonts/*.woff2` → `dist/fonts/` and `src/styles/fonts-cdn.css` → `dist/fonts-cdn.css`. The relative URLs in `fonts.css` (`./fonts/geist-400.woff2`) resolve correctly inside `node_modules/@usetheo/ui/dist/`.
- Geist OFL license shipped at `src/styles/fonts/LICENSE-GEIST.txt` → `dist/fonts/LICENSE-GEIST.txt`. Apache-2.0 + OFL is a clean dual-license combination.
- New `geist` devDependency: used only as the source of woff2 artifacts at install time; not bundled into `dist/index.js`.
- `validateDocsTypography` now asserts that `src/styles/fonts.css` contains `@font-face` and does NOT `@import` from `fonts.googleapis.com`, and that `src/styles/fonts-cdn.css` exists.

### Removed (HIGH-001 / T3.1)
- `package.json#files` no longer ships `src/` or the unbuilt `registry/*.json` descriptors. New set: `dist`, `registry/r`, `registry/index.json`, `LICENSE`, `CHANGELOG.md`. `npm pack --dry-run` reports 122 files / 353 KB (was 675 files / 570 KB). 102 `.test.tsx` and 114 `.stories.tsx` + `src/screens/` no longer enter the published tarball.

### Added (Phase 3 follow-ups)
- Quality gate `validateNpmTarball` — runs `npm pack --dry-run --json` and fails the build when the tarball contains `*.test.*`, `*.stories.*`, `src/screens/`, `referencia/`, `playground/`, `.ladle/`, or `tests/`, or when total size exceeds 5 MB.
- Quality gate `validateExportsMap` — locks `package.json#exports` to the canonical 5-entry set (`.`, `./styles.css`, `./tokens.css`, `./fonts.css`, `./fonts-cdn.css`) and instructs to run `pnpm sync:exports` on drift.
- `scripts/sync-exports.ts` + `pnpm sync:exports` script — idempotent generator. Includes an in-source ADR explaining why per-component subpath exports (originally D5) were intentionally scoped down: with tsup `splitting: false` and the ESM barrel, modern bundlers already tree-shake unused components; a 99-entry multi-entry tsup would duplicate shared code and inflate the tarball without observable bundler-side benefit.
- `.ladle/generated/welcome.stats.ts` — `welcome.stats.ts` moved out of `src/` (HIGH-003 / T3.3). `sync-readme.ts` writes to the new path; `validateCountConsistency` reads from it. The file no longer ships in the npm tarball.

### Breaking
- **Reclassification of 7 components from `primitives/` to `composites/`** (BLOCKER-001 remediation, D2): `AgentEditor`, `RuleEditor`, `SkillEditor`, `ApprovalCard`, `CronJobsList`, `SkillsList`, `MCPServerList`. Each value-imported one or more sibling primitives, which violated the mechanical taxonomy rule in `docs/architecture.md`. They are composites by every reasonable definition (FormField+Input+Button = composite; list-of-card = composite). Public barrel (`@usetheo/ui`) is unchanged — named exports preserved. Registry consumers via `npx shadcn add`: `type` changed from `registry:ui` to `registry:block` and `target` from `components/ui/<name>` to `components/blocks/<name>`. Migration: re-run `npx shadcn add <name>` to relocate the file, or rename the import path manually.
- **`form-field` now imports `@radix-ui/react-label` directly** (BLOCKER-001 / D2 exception). Previously imported the sibling `Label` primitive. `form-field.tsx` now inlines the same Radix LabelPrimitive + identical Tailwind tokens. Visual parity preserved. `registry/form-field.json` adds `@radix-ui/react-label` to `dependencies` and removes `label` from `registryDependencies`.

### Fixed
- **BLOCKER-001 (2026-05-14): `validateComponentStructure` gate regex was broken.** The previous check `/from\s+["'](?:\.\.\/)+(?:primitives|composites)\//` matched the literal segments `primitives/`/`composites/` in the import specifier, which **never** appears for sibling imports of the form `"../button/button.js"` (the segment is in the resolved path, not the specifier). 8 primitives (`agent-editor`, `rule-editor`, `skill-editor`, `approval-card`, `form-field`, `cron-jobs-list`, `skills-list`, `mcp-server-list`) value-imported other primitives undetected. Replaced with `scripts/lib/import-graph.ts` (path-resolved, multi-line aware, type-vs-value aware) + 15 meta-tests in `scripts/lib/import-graph.test.ts`. Gate now flags 22 distinct sibling-primitive value-imports.

### Added
- `scripts/lib/import-graph.ts` — shared utilities (`parseImports`, `parseImportsDetailed`, `resolveSpecifierToLayer`, `findPrimitiveOffenses`, `importsScreen`, `GLOBAL_PROVIDER_PRIMITIVES`) consumed by `validate-quality-gates.ts`. Exported via named exports for reuse by future gates.
- `scripts/lib/import-graph.test.ts` — 15 meta-tests (RED-then-GREEN) covering: sibling value-import detection, type-only allowance, cross-layer barrel resolution, multi-line imports, global provider allowlist, composite-imports-screen guard.
- `vitest.config.ts` now also collects `scripts/**/*.{test,spec}.ts` so meta-tests run under `pnpm test`.
- `src/test/a11y.ts` — shared `expectNoA11yViolations(ui)` helper used by 30+ primitive smoke tests.
- `src/welcome.stats.ts` (generated) — single source of truth for badge / welcome / architecture counts.
- Quality gates: `validateCompoundPattern`, `validateAxeCoverage`, `validateCountConsistency`, `validateArchitectureCensus`, `validateNoStrayArtifacts`. All hard-fail.
- `vitest-axe` `toHaveNoViolations` assertion in 30 interactive primitives (button, dialog, checkbox, switch, tabs, toast, command-palette, agent-event, audit-log-entry, permission-matrix, mention-menu, …).
- `TokenUsageChart` `sr-only <table>` fallback exposing input/output per period to screen readers (HIGH-013).
- `tests/fixture-shadcn-app/package.json` peers for Radix Dialog/Toast/Avatar/Tabs + cmdk so the registry install fixture can exercise composites.
- `LICENSE` file (Apache-2.0) at repository root.
- `CHANGELOG.md` (this file).
- `<ThemeScript>` component for SSR-safe theme initialization in Next/Astro/Remix.
- Global `@media (prefers-reduced-motion: reduce)` rules in `tokens.css` neutralizing animations for users with vestibular sensitivity.
- `BuildLogStream` `maxLines` prop (default 2000) for high-volume log truncation.
- `TokenUsageChart` `maxBars` prop for time-series binning.
- `vitest-axe` integration for accessibility assertions in primitive tests.
- Quality gates: `validateGovernanceFiles` (LICENSE / CHANGELOG presence), `validateReadmeDrift` (README ↔ exports parity), `validateDocsTypography` (font drift), `validateCompositeBarrel` (composites must import primitives via barrel).
- `tests/fixture-shadcn-app/` integration test exercising registry copy-paste install.
- `scripts/sync-readme.ts` to keep README counts and component catalog generated from source.

### Changed
- `ThemeProvider` `defaultMode` flipped from `"light"` to `"dark"` to match the library's "dark-first" positioning. **Migration**: pass `defaultMode="light"` explicitly if previously relying on the default.
- `TopNav.ModeSwitcher` ARIA semantics: `role="tablist"` → `role="radiogroup"`, `role="tab"` → `role="radio"` with full keyboard navigation (Arrow/Home/End + roving tabindex).
- `CommandPalette` re-implemented on top of `cmdk` — adds keyboard navigation (Up/Down/Enter/Escape), fuzzy ranking, and active-item highlight. Public API is preserved.
- `Card.Title` and `Dialog.Title` accept `asChild` (Radix Slot) for heading-level override.
- `ChatComposer` no longer renders mic/attach buttons by default; consumer must pass `onVoiceInput` / `onAttach` to opt in.
- `JSX.Element` global namespace references replaced by `import type { JSX } from "react"` in `theme-provider.tsx`, `theme-switcher.tsx`, `toaster.tsx` (forward-compatible with React 19).
- Replace `dot-namespace` mutation pattern (`Card.Header = Header`) with `/*#__PURE__*/ Object.assign(...)` in `Card`, `Dialog`, `Sidebar`, `TopNav`, `Tabs` for safer tree-shaking.
- `aria-hidden` codemod: all 15 boolean uses now declare `aria-hidden="true"` explicitly.
- `validate-quality-gates.ts` calls four new gates in sequence; CI fails on README/docs/governance drift.

### Fixed
- `dist/styles.css` referenced `./fonts.css` that was not copied to `dist/`. `tsup.config.ts` now copies `fonts.css` alongside `tokens.css` and `styles.css`; `package.json#exports` exposes all three.
- `registry/tokens.json` shipped `cssVars` with the old warm-violet palette while the embedded `tokens.css` content used the current Vercel-grayscale palette. The `cssVars` block was removed; `files[].content` is now the single source of truth.
- `src/themes/violet-forge.ts` JSDoc claimed "Boska + Switzer + JetBrains Mono" while the `fonts` object used Geist. JSDoc rewritten; `registry/r/theme-provider.json` regenerated.
- `README.md` declared "84 components / 162 tests / 12 composites / 33 registry items" and listed six non-existent components (`ToolPalette`, `TerminalPane`, `TerminalLine`, `TaskBreadcrumbs`, `TaskStatusPill`, `ShellCommandCard`). Counts now derived from source; phantom components removed.
- `docs/design-system.md` described the abandoned Boska/Switzer direction. Rewritten to match the active Geist + Vercel-grayscale state. Historical exploration moved to `docs/audit/2026-05-decisions.md`.
- `docs/agent-screens-composition.md` was a 354-line implementation roadmap referencing legacy product names ("TheoKit", "TheoBrutal") and components that no longer exist. Archived to `docs/audit/2026-05-screens-history.md`; replaced by a slim `docs/screens.md` index.
- `PermissionMatrix`: JSDoc promised `toolOptions={[]}` hides the add form, but `[]` is truthy in JS — the form was always shown. Condition fixed to check `length > 0`.
- `Dialog` overlay JSDoc claimed "violet-tinted 60%" backdrop but code used `bg-background/80`. JSDoc aligned with code.
- `agent-timeline` composite imported `../primitives/agent-event/agent-event.js` directly (bypassing barrel); switched to `../primitives/agent-event/index.js`. Gate added.
- Stories with `console.log` / `console.warn` annotated with `biome-ignore` to keep `noConsole` Biome rule meaningful in production code.

### Security
- **`ThemeScript` XSS hardening (BLOCKER-001)**: `buildScript` now escapes `<` to `<` on every interpolated value (`defaultTheme`, `defaultMode`, `storageKey`). Without the escape, a payload containing `</script>` would terminate the inline `<script>` tag at the HTML tokenizer layer — even though it sat inside a JS string literal — and execute attacker JS. New tests cover the `</script>` payload explicitly. The prior security comment ("no user input") is replaced by a per-call escape so the safety property holds regardless of how the props are sourced.

### Changed (audit remediation 2026-05-14)
- Compound pattern: `Toast`, `Avatar`, `RadioGroup`, `FormField` migrated to `/*#__PURE__*/ Object.assign(Root, {...})` — finishing the migration declared in the prior CHANGELOG entry. New `validateCompoundPattern` quality gate blocks the legacy `Root as typeof Root & {...}; Root.X = X` mutation pattern across all compound components.
- `FormField.Control` rebuilt on `React.cloneElement` + `React.Children.only` (was spread-element-as-object). Now preserves `ref` and `key` on the wrapped child; throws explicit errors on zero / multiple children (was silent breakage).
- `AgentEditor`, `SkillEditor`, `RuleEditor` no longer reset their form state via `useEffect [initial?.id]`. Use the React `key` prop at the call site (`<AgentEditor key={agent.id} initial={agent} ... />`) to remount on entity change — the idiomatic pattern.
- Tailwind `darkMode` set to `"class"` alone; the dead `[data-theme="dark"]` selector (which never matched because `ThemeProvider` sets `data-theme` to the theme NAME, not `"dark"`) was removed from both `tailwind.config.ts` and `tokens.css`.
- `tsup.config.ts` `onSuccess` now uses `node:fs/promises.copyFile` instead of POSIX `cp`. Build is portable across macOS / Linux / Windows.
- `validateRegistryStoriesAndTests` upgrades the missing-test check from warning to hard fail. The test-backfill phase has ended.
- `scripts/sync-readme.ts` is the single source of truth for component counts. Reads `src/index.ts` named exports and writes README badges + welcome STATS + `architecture.md` census atomically (compute everything in memory, write at the end).
- Test count is now derived by static `it(`/`test(` parsing — no longer spawns `pnpm test` inside `sync:readme`.
- `docs/architecture.md`: `BEGIN:primitives-list` / `BEGIN:composites-list` regions auto-regenerated; census matches reality (88 primitives + 14 composites = 102 components, was stale at 36/12).
- `src/screens/theo-code-shell.tsx` split: ~900 lines of mock data + helper types moved to sibling `theo-code-shell.data.tsx`. Main file dropped from 2193 → 1298 LoC.
- `lint:ci` scope widened to `playground` + `tests/fixture-shadcn-app/src`.
- `biome.json` `noConsole` raised to `error` with `allow: []`; stories / tests / scripts opt out via `overrides`.
- `validateReadmeDrift` whitelist trimmed (`Boska`, `Switzer`, `JetBrains`, `Berkeley`, `Departure`, `Söhne`, `Migra`, `Monaspace`, `Neon`, `PP`, `Editorial`, `New`, `General`, `Industrial` removed — fonts/styles deprecated in earlier sprints).
- `ThemeProvider` JSDoc corrected: `defaultMode` documents `"dark"` (matches the actual default since the dark-first migration).
- `classic-paper` JSDoc clarified ("light-primary with deep-navy dark mirror") — was misleadingly described as "light-only" despite shipping a full dark palette.
- `docs/quality-gates.md` Gate 2 "Current known risk" replaced with a "Resolved (2026-05)" note — `scripts/build-registry.ts` already rewrites relative imports.
- `MentionMenu` markup: `<header>` → `<div role="presentation">`, `<ul>`/`<li>` wrappers get `role="presentation"` so `role="menu"` only contains `role="menuitem"` children (axe `aria-required-children` regression fix).
- `test-registry-install.ts` covers a stratified sample of 13 items (was 4): lib (cn, types, chat-types), CSS (tokens), CVA (badge, button), compound (card, dialog, avatar, tabs), Radix multi-file (toast), cmdk composite (command-palette), block composite (deployment-row).

### Fixed (audit remediation 2026-05-14)
- README components badge (`components-N`) is now equal to "Primitives (P)" + "Composites (C)" — the historical badge used directory count while the catalog used named exports (badge said 99, catalog summed to 102).
- `welcome.stories.tsx` hero STATS regenerated from source — was hardcoded to 36/12/07/03/21/122 while the reality is 88/14/7/3/110/389+.
- 95× `registry/*.json.tmp` + 2× `*.bak` files deleted from working tree. New `validateNoStrayArtifacts` gate blocks regression.

### Removed
- N/A.

## [0.0.0]

Initial unpublished baseline. See `git log` between this entry and `5c95373` for the bootstrap work.
