# Changelog

All notable changes to `@theokit/ui` are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed
- **BREAKING (pivot M-C):** `@theokit/ui` is now an **AI-exclusive** component library
  and **depends on `@usetheo/ui`**. The 54 non-AI components (generic primitives +
  cloud/PaaS composites) + the shared Violet Forge foundation moved to the new
  `@usetheo/ui` package; `@theokit/ui` now exports only the 82 AI components. AI
  components re-point their generic-primitive imports to `@usetheo/ui`. Migrate with the
  codemod at `codemod/split-usetheo.mjs` — see `docs/migration/v1-usetheo-ui-split.md`.

### Removed
- **BREAKING:** 54 non-AI components removed from `@theokit/ui` (moved to `@usetheo/ui`):
  the generic shadcn-like primitives (`Button`, `Card`, `Dialog`, `Input`, `Table`, …)
  and cloud/PaaS composites (`DeploymentRow`, `DomainConfig`, `RollbackUI`,
  `EnvVarEditor`, …). Import them from `@usetheo/ui` instead. Full list + codemod in
  `docs/migration/v1-usetheo-ui-split.md`.

### Added
- `useAgentStream` hook — the UI ↔ Harness streaming bridge (M5). Consumes an SDK
  `Run.stream()` / `subscribe()` async stream and drives the existing `<AgentStream>`:
  accumulates live `text_delta` into a streaming item, finalizes complete assistant
  turns into message items, and upserts `tool_call` lifecycle events (running →
  success/failed) by `call_id`. The mapping core is a pure, exhaustively-tested
  reducer (`agentStreamReducer`); the hook wires it into a React lifecycle with
  AbortController cleanup on unmount. theo-ui keeps ZERO runtime coupling to
  `@theokit/sdk` — the input is a structural `SdkStreamMessage` the SDK's real
  output satisfies; `@theokit/sdk` is a devDependency (the real-LLM demo) only.
  Reconnect/resume across a dropped connection is delegated to the SDK's
  `subscribe()` (opaque `lastEventId`); the hook renders continuously across a
  drop+resume (covered by a reconnect test). Validated end-to-end against a real
  OpenRouter LLM via `scripts/m5-real-llm-demo.ts` (live text + tool events).
- Component classification manifest (`registry/component-classification.json`)
  tagging all 136 component directories as `ai` / `generic` / `cloud-ops`, plus a
  `classify:check` quality gate (wired into the `quality:gates` CI chain) that fails
  on any unclassified or drifted component. Current split: 82 `ai` stay in
  `@theokit/ui`; 54 (47 `generic` + 7 `cloud-ops`) are earmarked for a separate
  `@usetheo/ui` package. The AI boundary follows a scope decision covering both
  coding-agent and chat/agent surfaces; every entry was verified against component
  source, with 3 genuinely-dual components carried forward as `disputed`.
  Groundwork for the planned AI-exclusive split of `@theokit/ui`; no public API
  change yet.

### Changed
- The `--font-serif` token (and the `.font-serif` utility) now resolves to the
  brand font (`var(--font-body)`, Geist) instead of Tailwind's default serif
  fallback chain (`ui-serif, Georgia, Cambria, …`). Violet Forge has no separate
  serif face, so serif-flagged text now renders in the brand font consistently
  across platforms — and no longer references the Windows-only Cambria font.

### Deprecated

### Removed

### Fixed
- Added a top-level `"types"` field (`./dist/index.d.ts`) so TypeScript
  consumers on classic `moduleResolution` (`node`/`node10`) resolve the
  package's types. Previously types were exposed only through the `exports`
  map, leaving non-`bundler`/`node16` consumers without type information.

### Security

## [0.19.0] - 2026-06-24

### Added
- `DeploymentStatus` gains an `idle` state (rendered with the `default` badge
  variant, `muted` color, label "Idle"), recognized by `DeploymentRow`,
  `PreviewEnvCard`, and `ProjectCard`. (#119)

### Changed

### Deprecated

### Removed

### Fixed
- Card surfaces now declare the canonical `border-border` token explicitly
  (`Card` plus 13 primitive/composite cards) instead of relying on the bare
  `border` utility's default color, so the border renders consistently across
  the v3 preset and v4 build paths.

### Security
- Bumped `valibot` from `^0.42.1` to `^1.4.1`, clearing the HIGH-severity ReDoS
  advisory GHSA-vqpr-j7v3-hqw9 (`EMOJI_REGEX`, affected `>=0.31.0 <1.2.0`) that
  the theme schema validator transitively carried. The theme schema API surface
  (`v.pipe/object/string/optional/array/safeParse`) is unchanged across the major
  bump — `src/themes/schema.test.ts` (9 cases) passes unmodified. (V3-2)

## [0.17.0] - 2026-06-22

### Added
- `TokenUsageChart` gains `maxScale` (fix the y-axis maximum so multiple charts
  share a scale — bars exceeding it clamp to 100% while the tooltip + a11y table
  keep the true number) and `splitSeries` (render input vs output as adjacent
  grouped bars instead of stacked). Plus pure `toUsageMetrics(points)` (totals +
  peak per-period total) and `splitUsagePoints(points)` (transpose into parallel
  `labels`/`input`/`output` series) helpers, exported from
  `@theokit/ui/token-usage-chart` and the root barrel. (M5-7)
- `toAgentStreamItems({ history, live }, { classifyTool? })` — a pure, order-aware
  builder that merges completed conversation `UIMessage`s with live `AgentEvent`s
  into the `AgentStreamItem[]` that `<AgentStream>` renders: history becomes
  `message` items, live activity becomes `tool-call` items (status mapped from
  `AgentEventStatus`), history-then-live. `classifyTool` customizes each
  tool-call item per event (presentational fields only — `kind`/`id`/`status`
  stay authoritative). Ships `mapAgentEventStatus` + the now-exported
  `MessageStreamItem`/`ToolCallStreamItem` item types. (M5-6)
- `useStickToBottom` — auto-scrolls a scroll container to the bottom as content
  grows, but only while the user is pinned near the bottom (a `threshold` guard),
  so it never yanks the view away while they read history. Streamed content is
  detected with a `MutationObserver` (a scroll container's box does not resize as
  content grows inside it), with a `ResizeObserver` on top for box-size changes
  like images finishing load. Encapsulates the Radix
  `[data-radix-scroll-area-viewport]` selector: attach `scrollRef` to a
  `<ScrollArea>` and the hook resolves the real scrollable node internally.
  Ships the pure `isNearBottom` helper too. Exported from `@theokit/ui/scroll-area`
  and the root barrel. (M5-5)
- `@theokit/ui/sdk-tools-adapters` — pure converters from `@theokit/sdk-tools`
  tool results into theo-ui rich-primitive props: `adaptGitDiffResult`
  (parses a unified diff into `DiffViewer` hunks), `adaptReadFileResult`
  (`CodeBlock`), `adaptShellResult` (`TerminalPanel` lines), `adaptListDirResult`
  (`DataTable` rows), `adaptApplyPatchResult` (`CreatedFilesCard` files), plus the
  reusable `parseUnifiedDiff`. Each returns `null` on an error/unparseable result
  so a tool card keeps its `ToolCallPart` fallback. The adapters are pure and
  import nothing from `@theokit/sdk-tools` at runtime — consumers gain zero new
  runtime dependency; a dev-only contract test imports the real factories and
  runs their handlers to guard against result-shape drift. (M5-4)
- `AgentToolRenderer` — an overridable tool-renderer registry for the chat
  surface. A tool invocation is dispatched to a rich renderer (diff, terminal,
  code, created-files, data-table) by a classification function, falling back to
  `ToolCallPart` for anything unmapped. `<ChatMessage>` now accepts
  `toolRenderers` (shallow-merged over the default) and `classifyTool` props
  alongside the existing `partRenderers` / `dataRenderers`; `partRenderers.tool`
  still takes priority. Exposed via `@theokit/ui/agent-tool-renderer` and the
  root barrel: `AgentToolRenderer`, `defaultToolRegistry`, `defaultClassifyTool`,
  `resolveToolRenderer`, and the `ToolRenderer` / `ToolRendererKind` /
  `ToolRendererRegistry` / `ClassifyTool` types. `ToolCallPart` now lives in this
  module (the fallback tool renderer) and is re-exported unchanged. Behavior
  note: with the default registry, a tool whose name matches a known kind (e.g.
  `git_diff`, `shell`, `read_file`) and whose state is `output-available` now
  renders its rich surface instead of the generic `ToolCallPart`; unmapped tools
  and every non-`output-available` state (streaming, awaiting-approval, error,
  denied) are unchanged and keep using `ToolCallPart`. Pass `classifyTool` /
  `toolRenderers` to override. (M5-3)

### Changed
- Public copy aligned to honest, ecosystem-fit framing across `README.md`,
  `PITCH.md`, and `CLAUDE.md`: removed the unsubstantiated multi-framework
  compatibility claims (Next.js / Vite / Remix / Astro / Tanstack "CI-verified")
  and the false "peer-deps on React only" line. Reframed as a standard React +
  Tailwind package that pairs with TheoKit or runs standalone, with the RSC
  fix described as "Server-Component safe" rather than a marketed Next.js
  target. Counts corrected to 153 components / 1,513 tests / 151 stories and the
  stale `@theokit/ui@next` install snippets updated to `@theokit/ui` (now
  published to `latest`).
- README refreshed: component count corrected to 153, the v0.16.0 shadcn-v4
  features documented (`data-slot`, `"use client"`/RSC, per-subpath types), and
  the inaccurate "peer-deps on React only" line corrected (React is the only
  required peer; Radix/CVA/cmdk/lucide ship as dependencies). (#13)

### Deprecated

### Removed
- `PITCH.md` (landing-page marketing copy) removed from the repo. Public copy
  now lives in `README.md` + the docs site; the Voice/Tone scope in `CLAUDE.md`
  and `rules/public-copy.md` and the `public-copy-lint` hook were updated to
  drop the `PITCH.md` reference.

### Fixed
- **Visual-regression gate tolerates cross-environment antialiasing.** The
  Playwright `toHaveScreenshot` config used `threshold: 0.001` + `maxDiffPixels: 0`
  (zero tolerance), so the 101 snapshots only ever matched the exact machine that
  generated them — they failed in CI with 488-1882 antialiased pixels differing
  (ratio ≤0.2%, no real regression). Raised to Playwright's antialiasing-robust
  default `threshold: 0.2` with a `maxDiffPixels: 200` safety net that still
  fails on a genuine visual regression (thousands+ of pixels). (Internal CI
  hygiene.) (#15)
- **Bundle-size gate scoped to deterministic artifacts.** `dist/components.css`
  is a Tailwind v4 `@source`-scanned generated file whose exact byte size is
  environment-sensitive (~470KB locally vs ~104KB on CI runners — both valid
  output, differing by Tailwind's v3/v4 `@import` resolution across pnpm
  layouts). It is removed from the byte-exact ±5% bundle gate (which now stays
  focused on the deterministic shipped JS/dts bundles) and remains bounded by
  the environment-robust `dogfood:precompiled-utilities` gate. (Internal CI
  hygiene.) (#15)
- **`shadcn add chat-message` no longer references a moved file.** M5-3 moved
  `ToolCallPart` out of `chat-message/parts/` into the new `agent-tool-renderer`
  component, but the `chat-message` registry descriptor still listed the old
  `parts/tool-call-part.tsx` path — so the shadcn-compatible copy-paste path
  was broken. `agent-tool-renderer` is now its own first-class registry item
  (with story + test) and `chat-message` declares it as a `registryDependency`.
  (#15)
- **Agent-stream barrel-wiring test no longer flakes under suite load.** The
  `await import("./index.js")` smoke test occasionally exceeded vitest's 5s
  default (observed 5078ms) under worker-pool contention on cold runners. The
  global `testTimeout` is raised to 20s — a hard ceiling that still fails a
  genuinely hung test. (#15)
- **`quality:gates` typecheck no longer blocks on dev-only playground demos.**
  `playground/**` self-imports the package's own built subpaths
  (`@theokit/ui/slide`, `/slide-deck`, `/slide/plugins/*`), which resolve to
  `dist/*.d.ts` — absent when `pnpm typecheck` runs before `pnpm build`, so the
  gate had failed (TS2307) on every release since 0.14.0. Playground is
  non-shipped demo code exercised via Ladle, so it is excluded from the gate
  typecheck instead of blocking releases. (Internal CI hygiene.) (#15)
- **Release build no longer depends on a pnpm-specific `.bin` shim.**
  `scripts/build-precompiled-css.ts` resolved the Tailwind v4 CLI at a nested
  `@tailwindcss/cli/node_modules/.bin/tailwindcss` path that pnpm only
  materializes in some hoist layouts — absent under CI's `--frozen-lockfile`
  install, so `pnpm build` failed and the tagged release never published. Now
  resolves the package's own declared `bin` entry from its `package.json` and
  runs it via `node`, independent of any `.bin` shim. (#14)
- **`@theokit/sdk-tools` file-link devDependency removed.** The M5-4 contract
  test had pulled in `@theokit/sdk-tools: file:../theokit-sdk/...`, which does
  not resolve under `pnpm install --frozen-lockfile` in CI (no sibling repo) and
  blocked the publish. The 25 adapter unit tests validate against the documented
  `{ ok: true, ... }` result shapes; the factory result contract is owned by the
  SDK repo. (#14)
- **Status indicators now render their colors under the v3 Tailwind preset.**
  `StatusIndicator` uses `bg-status-online` / `-offline` / `-degraded` / `-info`,
  but the `status` color palette was never added to `tailwind-preset.ts` (only
  the v4 `@theme` declared `--color-status-*`), so those utilities resolved to
  transparent in the v3 build path (e.g. the Ladle dev server) — the dots were
  invisible. Added the `status` palette to the preset, mapped to the existing
  `--status-*` tokens. The npm/v4 build was already correct. Registry
  `tailwind-preset.json` regenerated.
- **npm publish CI restored.** The `release.yml` (and `deploy-ladle.yml`) GitHub
  Actions workflow failed on every tagged release since v0.14.1 because
  `pnpm/action-setup@v4` pinned `version: 9.15.0`, conflicting with
  `package.json`'s `packageManager: pnpm@10.32.1`
  (`ERR_PNPM_BAD_PM_VERSION`). Removed the hardcoded version so the package
  actually publishes to npm again. (#13)

### Security

## [0.16.0] - 2026-06-18

### Added
- **`data-slot` attribute on every component (shadcn v4 convention).** All 135
  components now emit `data-slot="<name>"` on their root element (compound
  sub-parts carry `data-slot="<name>-<part>"`), so consumers can target and
  override styles via stable attribute selectors instead of relying on Tailwind
  class order. New quality gate `validateDataSlot` enforces presence on every
  component. (community-standard-componentization, T2.1)
- **Per-subpath TypeScript declarations.** Importing `@theokit/ui/button` now
  resolves an isolated `Button`-only `.d.ts` instead of the entire barrel's
  type surface, so type-checking a single subpath no longer loads all 135
  components' types. Declarations are emitted by `tsc -p tsconfig.dts.json`
  (tsup's bundler OOMs at 130+ entries). (community-standard-componentization, T3.1)
- **`data-variant` / `data-size` on cva components (shadcn v4).** The 9
  variant-driven components (Button, Badge, Avatar, Select, Switch, Input,
  Textarea, Checkbox, Toast) now emit `data-variant`/`data-size` alongside
  `data-slot`, so consumers can style by attribute (e.g.
  `[data-slot=button][data-variant=secondary]`). The `*Variants` helpers remain
  exported for class reuse. (community-standard-componentization, T5.1)

- `"use client"` directive added to the 45 client component source files
  (anything using React hooks/context), matching shadcn/ui conventions.
- Post-build step `scripts/inject-use-client.ts` re-injects the directive into
  the output entry shims + component chunks (esbuild strips it during
  `splitting`). Wired into the `build` script.
- New quality gate `validateUseClientDirective` — fails the build if a client
  component ships without the directive in `dist/`. (T1.2)


### Changed
- Tailwind v4 devDep alignment + v3-legacy removal (Phase 4) is deferred to a
  dedicated `tailwind-v4-migration` cycle — see ADR 0001. The shipped
  `dist/components.css` is already built with Tailwind v4; the deferred work is
  the dev/test version label + the v3-legacy compat artifacts.
- Bundle baseline updated for the new per-subpath declaration strategy: the
  barrel `dist/index.d.ts` is now a thin re-export (15 KB vs the old 206 KB
  inlined monolith) because per-component types live in their own files under
  `dist/components/`. Engine `.d.ts` moved from `dist/<engine>/` to
  `dist/components/.../`. (community-standard-componentization, T3.1)
- Bundle baseline for `dist/components.css` corrected to the full `@source`
  scan size (the prior baseline was set in an environment where Tailwind v4's
  `@source` glob under-scanned the library tree — a known pnpm-symlink
  fragility documented in `scripts/build-precompiled-css.ts`). The
  `data-slot` / `"use client"` work is bundle-neutral — verified empirically
  (removing `data-slot` leaves `components.css` byte-identical). `dist/slide`
  and `dist/slide-deck` grew by a few bytes from the directive + data-slot.
  NOTE: `components.css` size is `@source`-environment-sensitive; CI should
  confirm the full-scan value reproduces in its environment.


### Fixed
- **`@theokit/ui` now works in Next.js App Router (React Server Components).**
  The `"use client"` directive is preserved in the published build so importing
  a client component (anything using hooks) no longer throws *"useState only
  works in a Client Component"*. Previously esbuild stripped the directive under
  code-splitting, so every npm-installed client component was broken in RSC
  projects. Both consumption paths are fixed — subpath (`@theokit/ui/agent-event`)
  and barrel (`@theokit/ui`). (community-standard-componentization, T1.1)

## [0.15.0] - 2026-06-16

### Added
- **Prompt composites — "ask the user" cards for agent surfaces, modeled on
  Claude Code's question UX.** Four self-contained composites, each rendering
  one question at a time (sequencing across questions is the consumer's
  responsibility — there is no built-in flow orchestrator):
  - **`ChoicePrompt`** — single-select (radio). Header chip, options with
    label + description, `1`..`9` number-key shortcuts (terminal-style
    selection), injectable free-text "Other" option, and a side-by-side preview
    pane when options carry preview content. Emits `onConfirm` with the chosen
    value (plus the typed Other text when relevant).
  - **`MultiSelectPrompt`** — multi-select (checkbox). Same surface as
    `ChoicePrompt` with number-key toggles, an Other row, a `minSelected` gate,
    and a stacked preview pane for every selected option. Emits `onConfirm`
    with the value array.
  - **`TextPrompt`** — free-text. Single-line `Input` or multi-line `Textarea`
    with an optional `required` gate. Emits `onConfirm` with the typed text.
  - **`ConfirmPrompt`** — binary yes/no. Optional `destructive` variant that
    tones the confirm action red and exposes the card as an `alertdialog`.
  Controlled or uncontrolled. Ships a `prompt` registry lib item carrying the
  shared `PromptOption` type + helpers consumed by the choice composites.

## [0.14.4] - 2026-06-13

### Added

- `pnpm dev:pack` script for local cross-repo consumption — generates tarball at `dist/theokit-ui-{version}.tgz` that installs without dual-React symlink issues. Documented in CONTRIBUTING.md.

## [0.14.3] - 2026-06-09

**Patch — PageShell content spacing standardization.**

### Fixed
- **`PageShell` content slot now renders direct children with `flex flex-col gap-6`.**
  Previously the content `<div>` had no internal spacing, so pages with 2+
  top-level children (e.g. dashboard `/memory` landing with 5 sibling
  sections: KPI strip + trend grid + getting-started card + Explore
  heading + Explore grid) rendered them flush against each other. The new
  wrapper matches the outer `<main className="flex flex-col gap-6">` gap,
  so spacing is uniform across the page. Pages that already wrap content
  in a single grid or div are unaffected — `gap-6` only applies between
  sibling elements. Equivalent to manually wrapping every page's content
  in `<div className="flex flex-col gap-6">`, but enforced at the
  composite level so every consumer benefits without per-page churn.

## [0.14.2] - 2026-06-09

**Patch — build-pipeline correctness. Bundles the 0.14.1 color migration
plus two FAANG-grade fixes that were required to ship a clean build to
npm. 0.14.1 was tagged in git but never published to the npm registry;
0.14.2 is the first published artifact carrying the violet unification.**

### Added
- **`src/lib/env.ts` — typed environment helpers (`isDev()`, `isProd()`).**
  Centralizes `process.env.NODE_ENV` reads through a single typed accessor
  that uses `globalThis.process?.env?.NODE_ENV`. Works in browser via
  bundler `define` injection (Vite/Webpack/esbuild), in Node (SSR/tests),
  and defensively in browser-without-bundler-injection (returns
  `isDev() === true` to err on the side of more diagnostics). This is the
  same pattern React, Radix, and Stripe Elements use — funnel every
  `NODE_ENV` read through a typed helper so consumers' bundlers can
  dead-code-eliminate dev-only branches in their production build.

### Changed
- **Six components migrated from raw `process.env.NODE_ENV` to `isDev()`.**
  `theme-provider`, `status-dot`, `timestamp`, `env-var-editor`,
  `thinking-level-selector`, `build-log-stream`. No behavior change in
  consumer production builds — only a typecheck-cleanliness and
  build-stability improvement. The previous direct `process.env` reads
  triggered TypeScript `TS2591` failures unless `@types/node` was listed
  in `tsconfig.json#compilerOptions.types`. Adding `"node"` there is the
  workaround we explicitly rejected: it pollutes the ambient global
  namespace of a UI library with Node-only APIs (`Buffer`, `fs`, `path`,
  `Stream`) and surfaces them in author autocomplete inside React
  components. The typed helper is the right pattern.

### Fixed
- **`src/vite-plugin.test.ts:76` — implicit `any` on `.map` callback parameter.**
  Annotated as `(c: unknown[])`. Pre-existing TypeScript strictness
  violation unrelated to the violet migration, but the typecheck job in
  `prepublishOnly`'s `quality:gates` must be clean for publish to proceed.

## [0.14.1] - 2026-06-09 — NOT PUBLISHED

Tagged in git as `v0.14.1` but never published to the npm registry. The
build pipeline surfaced two pre-existing TypeScript errors (six raw
`process.env.NODE_ENV` reads + one implicit-`any` test assertion) that
needed to be fixed before publish. The color migration carried out by
this commit is bundled into `0.14.2` (see above) along with those fixes.

**Patch (token value change only — full backward-compat preserved).**

### Changed
- **Theo violet primary unified to `#A855F7` electric violet**. The Violet Forge theme's `--primary` (and matching `--ring`) moved from `#7C3AED` (`oklch(0.542 0.245 293)`) to `#A855F7` (`oklch(0.628 0.225 296)`) — same family, higher chroma at higher lightness, calmer execution without cyberpunk halos. Decision based on cross-surface unification (marketing + cloud/dashboard share one cor): the new value reads as production-grade premium and works consistently across light + dark surfaces. Burnt sienna accent `#C96442` is preserved (warmth complement unchanged). `--primary-deep` and `--primary-glow` continue to derive algorithmically via OKLCH relative-color syntax — no manual override needed. Files touched: `src/styles/tokens.css` (light + dark `--primary` and `--ring`), `src/themes/violet-forge.ts` (light + dark `primary` and `ring`), `src/components/primitives/slide/themes/violet-forge.css` (`--theo-slide-accent`), `src/components/primitives/whiteboard/whiteboard.stories.tsx` (stroke demo), `src/themes/color.ts` (JSDoc examples refreshed). Tests in `src/themes/color.test.ts` intentionally left unchanged — they test the `hex()` function with `#7C3AED` as a static example, decoupled from brand color choice. Consumers (theo-website, theo-cloud/dashboard, theokit framework) pick up the new color automatically on next install/rebuild via `@theokit/ui/preset.css`.

## [0.14.0] - 2026-06-03

**Minor (additive — full backward-compat preserved via legacy helpers).**

Community best practices alignment cohort. Migrates `@theokit/ui` from HSL split to OKLCH as the canonical color format, introduces status semantic tokens, two new composites (StatusIndicator + MetricCard), a lint rule banning literal Tailwind color classes in components, `prefers-color-scheme` auto-detect, forced-colors (Windows High Contrast Mode) support, and a Playwright visual regression baseline. All 6 ADRs (0004-0009), full migration guide, and 5 new test files shipped. WCAG AA preserved across 10 themes × 2 modes. `classic-paper` rebalanced to visibly warm cream (per Vintage Paper + Anthropic Claude UI references) for reduced vision fatigue on long agent sessions.

See [docs/migration/hsl-to-oklch.md](docs/migration/hsl-to-oklch.md) for the full upgrade guide.

### Added — Community Best Practices Alignment (2026-06-03)

- **Status semantic token group** (ADR-0007). New `ColorScale` keys
  `--status-online`, `--status-offline`, `--status-degraded`, `--status-info`
  plus foreground companions — 8 keys × 11 themes. Separates operational state
  (gateway alive/dead/slow/info) from action-result (success/destructive/warning/info).
- **`StatusIndicator` composite** consuming the status group. API:
  `<StatusIndicator status="online" label="Connected" pulse?>`.
- **`MetricCard` composite** for dashboard tiles. API:
  `<MetricCard title value delta={{value,trend}} hint? icon? invertTrend? />`.
  `invertTrend` flips trend semantics for cost/churn/latency metrics (EC-17).
- **`respectSystemMode` prop** on `<ThemeProvider>` (default `true`, ADR-0009).
  Reads `(prefers-color-scheme: dark)` on hydration and subscribes to OS changes.
  User-driven `setMode()` overrides the system signal. `matchMedia` listener
  cleanup on unmount (EC-12).
- **`forced-colors` media query** in `tokens.css` (ADR-0008). Maps semantic
  tokens to system colors (Canvas, CanvasText, Highlight, ...) for Windows
  High Contrast Mode. WCAG 2.2 SC 1.4.1/1.4.3.
- **Container query sizes** (`--container-3xs` through `--container-7xl`)
  declared in `tokens-v4.css` for Tailwind v4 `@container` variants.
- **Algorithmic tonal derivations** for `--primary-deep`, `--primary-glow`,
  `--accent-deep` via OKLCH relative-color syntax with `max()`/`min()`
  anti-overflow clamps (ADR-0006, EC-7).
- **Lint rule scanner** `scripts/lib/literal-color-scanner.ts` blocks literal
  Tailwind color classes in `src/components/**/*.tsx`. Wired into
  `pnpm quality:structure` (ADR-0004). 14 unit tests.
- **Valibot theme schema** `src/themes/schema.ts` (D5 revised — Valibot
  ~1.5KB gzipped vs Zod ~12KB).
- **OKLCH `color-value-pattern.ts`** extracted from `theme-provider.tsx`.
  Accepts plain OKLCH, relative-color syntax (EC-5), HSL split, hex, var().

### Changed — Community Best Practices Alignment (2026-06-03)

- **All 11 built-in themes migrated from HSL split to OKLCH** (ADR-0005).
  638 values converted via `scripts/migrate-themes-to-oklch.ts`. Round-trip
  delta ~0.001 L per value (visually equivalent, < 0.5% pixel diff).
  Legacy HSL split format still accepted by the runtime validator.
- **`tokens-v4.css` aliases** drop `hsl()` wrapper —
  `--color-primary: var(--primary)` direct.
- **`tokens.css` shadows + texture utilities** use
  `color-mix(in oklch, var(--x) N%, transparent)` for alpha composition.
- **`hex()` and `rgb()` helpers** now return `oklch(L C H)` strings (T2.6).
- **`gateway-status-indicator`, `run-status-pill`, `update-banner`,
  `stability-bundle-viewer`** swept of 12 literal Tailwind color classes
  → semantic tokens. Closes hidden theme-switching bug.
- **`primary-deep` / `primary-glow` / `accent-deep`** are now `optional`
  in `ColorScale`. CSS auto-derives via `oklch(from ...)` when omitted.
- **`validateThemeContrast`** accepts both HSL split and OKLCH input.

### Deprecated — Community Best Practices Alignment

- **`hexToHsl(input)`** and **`rgbToHslLegacy(r, g, b)`** — use `hex()` /
  `rgb()` (OKLCH output) instead. Removal scheduled for next major.

## [0.13.0] - 2026-05-29

**Minor (additive only — zero breaking changes).**

Seven new components shipped as Phase 1 of the `theokit-ui-parity` plan
(`.claude/knowledge-base/plans/theokit-ui-parity-plan.md` v1.1). All seven
mirror OpenClaw Control UI patterns the framework lacked, designed to be
composable into any theokit app via `@theokit/ui` barrel.

### Added — Phase 2 component

- **`<ChannelCard>`** (primitive, `agent/`) — inbound gateway connection
  surface (Telegram, Discord, Slack, WhatsApp, Webhook, MCP). 4 statuses
  (`disconnected | connecting | connected | error`) with the toggle button
  reflecting the current state: `connected` shows "Disconnect", others show
  "Connect", `connecting` keeps the button disabled (transient state guard).
  Closed `ChannelPlatform` enum prevents silent typos at the backend
  boundary. 7 Vitest tests including vitest-axe. Ladle story with 5
  variants (Connected/Disconnected/Connecting/ErrorState/MCP). Consumed by
  the dogfood-app `/channels` page end-to-end against the
  `server/routes/channels.ts` registry.

### Added — Phase 1 components (44/44 Vitest GREEN)

- **`<ThinkingLevelSelector>`** (primitive, `agent/`) — multi-state combobox
  for LLM reasoning budget. Mirrors OpenClaw thinking selector. Values:
  `"inherited" | "off" | "minimal" | "low" | "medium" | "high" | "xhigh"`.
- **`<RunStatusPill>`** (primitive, `agent/`) — compact status indicator
  for Run/Task lifecycle. 6 states mirror SDK `Task` enum (D362):
  `queued | in_progress | finished | error | cancelled | interrupted`.
- **`<BranchIndicator>`** (primitive, `agent/`) — small "×N" pill that
  shows when a run was retried/branched. Returns `null` for `< 2` or
  non-integer (EC-10 guard).
- **`<GatewayStatusIndicator>`** (primitive, `infra/`) — live
  connection-status dot. 4 statuses (online/offline/degraded/reconnecting)
  × 2 variants (compact/labeled) + optional latency text.
- **`<UpdateBanner>`** (primitive, `infra/`) — top-of-app alert for newer
  version. Dismiss persistence is consumer's responsibility (EC-16).
- **`<ExportChatDialog>`** (primitive, `agent/`) — modal exporting chat in
  `markdown | json | jsonl | sharegpt`. Async-aware (disables buttons
  during pending export).
- **`<StabilityBundleViewer>`** (composite, `infra/`) — crash bundle JSON
  inspector. Sections collapse independently. EC-9 absorbed: handles
  missing optional sections gracefully.

### Added — Phase 0 tooling

- **`scripts/inventory-components.mjs`** — walks
  `src/components/{primitives,composites}/<name>/` producing
  `component-inventory.json`. CI drift-gate seed.
- **`scripts/generate-missing-stories.mjs`** — gerador + CI check mode.
  EC-5/D12 absorbed: ships `kebabToPascal(name)` helper with 9 Vitest
  cases + match-confirmation via `export\s+...` regex.
- **`wrangler.toml` + `.github/workflows/deploy-ladle.yml`** —
  Cloudflare Pages deploy config for the Ladle component catalog.
  Workflow contains `pnpm ladle:build` step BEFORE deploy (EC-14).
- New package scripts: `inventory`, `stories:check`, `stories:generate`,
  `stories:test`.

### Changed — Build pipeline hardening

- **`scripts/regen-subpath-exports.ts`** now delegates to `sync-exports.ts`
  for the final write. Previously the post-build step sorted ALL exports
  alphabetically while `sync-exports.buildExports` produced the canonical
  `BASE → sorted components → ISOLATED` order — meaning `pnpm build &&
  pnpm quality:structure` regressed every time. The validator and the
  build now share a single source of truth.
- **`scripts/sync-exports.ts`** now post-formats `package.json` via
  `biome format --write` after writing. `JSON.stringify(_, _, 2)` always
  expands short arrays like `sideEffects` and `onlyBuiltDependencies`,
  while `pnpm format:check` (Biome) expects them inline; the two were
  fighting after every sync.
- **`tailwind.config.ts`** dropped the `satisfies Config` clause. The
  preset (`src/styles/tailwind-preset.ts`) resolves the v4 `Config` type
  via the `src/styles/node_modules/tailwindcss` symlink to v4.3.0, while
  the root config would resolve v3.4.19 — the v3/v4 type seam mismatched
  on `darkMode` (`DarkModeStrategy` vs `Partial<DarkModeConfig>`).
  Runtime correctness is enforced by `pnpm dogfood:v4-zero-config`.
- **`biome.json`** override extended to cover `scripts/**/*.mjs` so the
  `noConsole` rule does not block tool scripts (it was already exempted
  for `.ts`).
- **`pin-input.tsx`** — removed stale `// biome-ignore lint/suspicious/noArrayIndexKey`
  comment now flagged as unused suppression.
- **`export-chat-dialog.tsx` + `run-status-pill.tsx` + `thinking-level-selector.tsx`** —
  added precise `biome-ignore` comments documenting the `a11y/useSemanticElements`
  and `suspicious/noConsole` exceptions, with the reason inline.

### Documentation

- 7 new component pages under `theo-opendocs/content/theoui/{agent,infra}/`.
- New `ChannelCard` page under `theo-opendocs/content/theoui/agent/channel-card.mdx`
  with live preview (`ComponentPreview` + `PropsTable`) deployed to
  `https://channel-card.theo-opendocs.pages.dev/`.

## [0.12.0] - 2026-05-28

**Stable release — promoted from `0.12.0-next.0` after dogfood validation + cross-repo contract gates landed.**

First `@theokit/ui` release on the npm `latest` tag without a `-next.*` pre-release suffix. Content is the union of everything shipped in `0.12.0-next.0` (2026-05-25) plus the additions below from `[Unreleased]` consolidation. **Zero breaking changes vs `0.12.0-next.0`** — consumers on `^0.12.0-next.0` upgrade transparently.

### Added (dogfood-fixes-and-coverage-expansion T4.1, 2026-05-28)

- **`scripts/validate-exports.mjs`** (NEW) — FAANG-grade pre-publish gate com 6 runtime checks: (1) exports['.'] declared, (2) type:module consistency D13, (3) import condition file exists + dynamic import runtime, (4) require condition runtime check (skip se ESM-only), (5) ESM-only intentional notice, (6) TODOS subpath exports validados (não só `.`). Bloqueia `npm publish` se shape OR comportamento regridir.
- **`prepublishOnly`** hook estendido: `pnpm build && pnpm test:contract && node scripts/validate-exports.mjs`. EC-8 fix do edge case review FAANG-grade.
- **`validate:exports`** script standalone — pode rodar manual `pnpm validate:exports`.

### Added (cross-repo-integration-coesao, 2026-05-28)

- **Contract test mirror** — `tests/contract/theokit-consumer.test.ts` (6 BDD `it()`) validates `dist/vite-plugin.js` shape (default export factory + Plugin/Plugin[] return + `name: string`) and presence of `dist/preset.css`, `dist/styles.css`, `dist/fonts.css`. Roda via novo `pnpm test:contract`. Bloqueia publish via `prepublishOnly: pnpm build && pnpm test:contract`. Cumpre [ADR 0001](docs/adr/0001-vite-plugin-subpath-export-contract.md) (cross-repo contract). Plano coordenador no monorepo theokit-tools: [cross-repo-integration-coesao-plan.md](../.claude/knowledge-base/plans/cross-repo-integration-coesao-plan.md) T1.3.
- **`vitest.config.ts`** include estendido para cobrir `tests/**/*.{test,spec}.ts` (era só `src/`).

## [0.12.0-next.0] - 2026-05-25

Minor (additive, zero breaking change) — ships two LLM-facing artifacts
that complement the existing `llms.txt`: a structured visual spec
(`DESIGN.md`) and a companion agent skill (`skills/theo-ui/`).

### Added

- **`DESIGN.md` at repo root (NEW)** — plain-text design system spec
  for LLM assistants generating UI against `@theokit/ui`. Follows the
  awesome-design-md 9-section canonical structure (Visual Theme &
  Atmosphere · Color Palette & Roles · Typography Rules · Layout
  Principles · Depth & Elevation · Component Stylings · Responsive
  Behavior · Do's and Don'ts · Agent Prompt Guide). Tokens mirror
  `src/styles/tokens.css` and `src/themes/violet-forge.ts`. Shipped
  via `package.json > files` alongside `llms.txt` and `CHANGELOG.md`
  so consumers see the visual spec at `node_modules/@theokit/ui/DESIGN.md`.
  Reference research lives at
  `.claude/knowledge-base/reference/design-md-convention.md`.
- **`skills/theo-ui/` companion agent skill (NEW)** — library-aware
  design skill for AI coding assistants (Claude Code, Cursor, Codex,
  OpenCode, Windsurf, Copilot) installable via the `vercel-labs/skills`
  CLI:

  ```
  npx skills add usetheodev/theo-ui
  ```

  Four verbs (default build / `audit` / `migrate` / `catalog`), 32
  universal slop-test gates plus surface-specific extensions, pre-emit
  self-critique on six axes (Library-fit · Token-fidelity · Composition ·
  A11y · Restraint · Voice), 12 page archetypes (P1–P12), 5 surfaces
  (agent-chat · cloud-dashboard · settings-form · marketing · auth).
  Project memory at `.theo-ui-skill/log.json`. 30 files, ~9300 lines
  of markdown, ~416 KB. Distributed via the GitHub repo (not the npm
  package). Root README ships Option C in Quickstart pointing
  consumers at the skill.

## [0.11.0-next.0] - 2026-05-25

Minor (additive, zero breaking change) — ships Brief #5 from the
TheoCloud dashboard team, closing 3 measured Deep Review findings.
Five new components: 3 brief-asks (PinInput, DataTable, PageShell)
+ 2 explicit pre-requisites (DropdownMenu, ActionBar) that the
brief assumed existed but didn't.

Plan: `.claude/knowledge-base/plans/dashboard-primitives-brief-5-plan.md`
ADR: `.claude/knowledge-base/decisions/page-shell-composite-pattern.md`
Brief: `theo/docs/handoff/2026-05-25-theo-ui-cloud-dashboard-brief-5.md`

### Added

- **`<DropdownMenu>` primitive (NEW, Brief #5 pre-req)** — accessible
  menu built on `@radix-ui/react-dropdown-menu` (already a bundled
  dep, no new peer needed). Sub-components attached via
  `Object.assign`: `Trigger`, `Portal`, `Content`, `Item`,
  `CheckboxItem`, `RadioItem`, `Label`, `Separator`, `Shortcut`,
  `Group`, `Sub`, `SubTrigger`, `SubContent`, `RadioGroup`. Styled
  with `@theokit/ui` design tokens. Consolidates 5 prior direct-
  Radix usages (`model-selector`, `intent-selector`, `agent-profile`,
  `theme-switcher`, `theo-code-shell`) under a single styled
  wrapper. 6 unit tests + 5 Ladle stories. SSR-safe.
- **`<ActionBar>` primitive (NEW, Brief #5 pre-req)** — page-top
  action strip with three optional slots: search input (flex-1,
  grows to fill), filter icon button, primary action button
  (right-aligned). Returns `null` when no slots are provided.
  Primary action supports `loading` state with `Loader2` spinner.
  Usable standalone or composed inside `<PageShell>`. 6 unit tests
  + 5 Ladle stories.
- **`<PinInput>` primitive (NEW)** — multi-slot OTP / code input
  with auto-advance focus, paste handling (whitespace stripped),
  arrow-key navigation, backspace clearing + focus back. Default
  6 slots, configurable. `inputMode="numeric"` (default, triggers
  mobile numeric keyboard via `pattern="[0-9]*"`) or
  `alphanumeric` (auto-uppercase). Optional `mask` renders bullets.
  Optional `error` state applies destructive border. `onComplete`
  fires once on transitions to complete (NOT on mount with pre-
  filled value — verified via test). Closes Deep Review § 2.12 P2
  (Verification page off-brand single-input pattern). 17 unit
  tests + 7 Ladle stories.
- **`<DataTable>` composite (NEW)** — generic, sortable,
  expandable composite over `<Table>` + `<Pagination>` +
  `<Skeleton>` + `<EmptyState>` + `<DropdownMenu>`. Generic over
  `T` (e.g. `DataTable<Domain>`). Sortable headers (controlled via
  `onSortChange` OR uncontrolled client-side). Sticky header
  (default true). Expandable rows with `expandable(row)` callback
  — multi-row default, opt-in `expandMode="single"`. Row actions
  via `rowActions(row)` opens DropdownMenu. Client-side pagination
  with `pageSize`; sort changes reset to page 0. Loading state
  renders 5 skeleton rows. Empty state delegates to `<EmptyState>`
  or custom `emptyState` prop. Expanded row `colSpan` correctly
  accounts for chevron + actions columns (EC-1 fix). pageSize<=0
  clamps to 1 graceful degradation. Closes Deep Review Top-5
  fix #2, § 2.2 P1, § 2.4 P1 (card-grid → sortable table for
  Domains + Projects). 19 unit tests + 8 Ladle stories.
- **`<PageShell>` composite (NEW)** — page-level scaffold. Title
  + optional description + optional ActionBar (when search /
  primaryAction / onFilterClick provided), then one of four
  mutually-exclusive content states with strict precedence:
  loading > error > empty > children. Default loading is a
  centered spinner Card; `loadingNode?` escape hatch for custom
  skeletons. Error renders Card with message + optional retry
  button + optional docs link. Empty delegates to `<EmptyState>`.
  `aria-busy="true"` on the `<main>` element while loading. Does
  NOT manage `document.title` (D3 scope-narrowing); consumers
  wire `onTitleChange?` callback to their own hook. Dedupes
  ~20 LOC × 13 dashboard pages of boilerplate. 15 unit tests + 6
  Ladle stories.

### Notes

- Edge-case review surfaced 1 MUST FIX (DataTable expanded row
  colSpan miscalculation when rowActions present) + 14 SHOULD TEST
  + 7 DOCUMENT — all incorporated into TDD blocks before
  implementation.
- D3 scope-narrowing: PageShell does NOT include `useSetPageTitle`
  / `PageMetaProvider` — those are consumer-scope hooks. The
  library exposes only the visible heading + an `onTitleChange?`
  callback for the consumer to wire their own title management.
- DropdownMenu consolidation is opt-in: the 5 existing direct-
  Radix usages stay untouched in this release; migration is a
  follow-up PR.
- Zero new peer-deps. `@radix-ui/react-dropdown-menu` was already
  bundled.

### Bundle delta (consumer canary, measured 2026-05-25)

Measured against TheoCloud dashboard (no consumer migration to the
new primitives yet — pure version bump):

| Metric | 0.10.0-next.0 | 0.11.0-next.0 | Δ |
|---|---|---|---|
| `@theokit/ui` chunk | 10.96 KB brotli | 10.98 KB brotli | **+0.02 KB (+0.2%)** |
| TOTAL initial JS | 134.68 KB brotli | 135.56 KB brotli | +0.88 KB (+0.6%) |

Per-chunk cap (18 KB): passes with 7.02 KB headroom.
Total hard gate (180 KB): passes with 44.44 KB headroom.

The +0.02 KB chunk delta is effectively noise — confirms Brief #4's
per-component dist + tree-shaking works: 5 new components ship as
separate chunks and the consumer correctly drops all of them while
they aren't imported. Post-consumer-migration delta is expected at
+10-15 KB brotli (Brief #6 follow-up).

Evidence:
`.claude/knowledge-base/baselines/2026-05-26-post-brief-5/theocloud-bundle-delta.txt`

## [0.10.0-next.0] - 2026-05-25

Minor (additive, zero breaking change) — fixes a publishing-pipeline
defect surfaced by the TheoCloud dashboard bundle audit
(`MEET-ASYNC-AMENDMENT-2026-05-24-002`). Since 0.7.0, the ~100 subpath
exports declared in `package.json#exports` (`./alert`, `./button`,
`./table`, …) were **cosmetic** — each pointed at the same
`./dist/index.js` (the 417 KB barrel). `import { Alert } from
"@theokit/ui/alert"` resolved byte-identical to
`import { Alert } from "@theokit/ui"`, and barrel tree-shaking
failed in consumers because of `forwardRef` side-effect bailouts,
`Object.assign` compound components, and `sideEffects: ["**/*.css"]`
conservatism. TheoCloud measured **0 KB dropped** from the 240 KB
minified barrel regardless of how few exports were used.

This release extends the per-component dist pattern that already
worked for `whiteboard` / `slide` / `slide-deck` to every primitive
and composite. The barrel `import { X } from "@theokit/ui"` is
preserved unchanged (additive migration shape, same as `@mui/material`).

Plan: `.claude/knowledge-base/plans/subpath-tree-shaking-plan.md`
ADR: `.claude/knowledge-base/decisions/subpath-exports-per-component.md`
Brief: `theo/docs/handoff/2026-05-24-theo-ui-subpath-tree-shaking-brief-4.md`

### Changed

- **`tsup.config.ts`** auto-globs primitive + composite entries from
  `src/components/{primitives,composites}/<name>/index.ts` at
  config-load time. 87 primitives + 26 composites — 3 excluded
  (`whiteboard`, `slide`, `slide-deck` retain their existing manual
  isolated entries). New components ship subpath-shaped automatically
  without `package.json#exports` hand-maintenance.
- **`splitting: true`** in tsup now dedupes shared utilities (`cn`,
  forwardRef wrappers, theme helpers, lucide icon imports) into
  `dist/chunk-<hash>.js` instead of inlining into every per-component
  bundle. ~119 shared chunks emitted; barrel + per-component dist
  files re-export from them.
- **`dts: { entry: ... }`** restricted to the barrel + isolated
  engines only (D5 escalation). Generating per-component `.d.ts` for
  all 114 entries OOMs the rollup-plugin-dts worker thread even with
  `NODE_OPTIONS=--max-old-space-size=8192` (the flag does not
  propagate to workers). Per-component subpaths resolve their `types`
  field at the barrel `dist/index.d.ts` — TypeScript still finds
  `Alert`/`AlertProps` from `import { Alert } from "@theokit/ui/alert"`.
  Trade-off: consumers' typecheck pulls the full type graph regardless
  of subpath, but the JS dist (where tree-shaking matters) is
  per-component and small.

### Added

- **`scripts/regen-subpath-exports.ts`** — runs after `tsup` and
  rewrites `package.json#exports` so per-component subpaths point at
  their own dist file. Refuses to write if any non-root entry still
  points at `./dist/index.js` (permanent guard against the cosmetic-
  subpath defect coming back). Verifies that every source-tree
  component has a matching dist entry (EC-2 guard against silent
  partial builds). Wired into `package.json#scripts.build` so
  `pnpm build` produces a consistent `dist/` + `exports` map every
  time.
- **`scripts/sync-exports.ts`** updated to resolve each component's
  layer (primitives vs composites) via filesystem and emit the
  correct per-component dist path. Stays the source-of-truth for
  the structure gate; `regen-subpath-exports.ts` is the same logic
  applied post-build against the actual dist tree.

### Bundle deltas

| File | Before (0.9.0-next.0) | After (0.10.0-next.0) | Δ |
|---|---|---|---|
| `dist/index.js` | 417,113 B | 49,018 B | **−88.2%** |
| `dist/slide/index.js` | 23,825 B | 400 B | −98.3% |
| `dist/slide-deck/index.js` | 58,413 B | 35,795 B | −38.7% |
| `dist/components.css` | 89,654 B | 93,069 B | +3.8% (within ±5%) |
| `dist/styles.css` | 4,720 B | 4,720 B | 0% |
| **Build time** | 17.72 s | 15.98 s | −10% |
| **Tarball (`pnpm pack`)** | 1.1 MB | 1.2 MB | +9% |
| **New per-component dist files** | 0 | 113 | + |
| **Shared chunks (`dist/chunk-*.js`)** | 0 | 119 | + |

The barrel shrank because all component code now lives in shared
chunks. **Consumer-side bundle delta against TheoCloud dashboard
(measured 2026-05-25):**

| Metric | 0.9.0-next.0 | 0.10.0-next.0 | Δ |
|---|---|---|---|
| `@theokit/ui` chunk | 36.96 KB brotli | 10.96 KB brotli | **−26.00 KB (−70.3%)** |
| TOTAL initial JS | 176.27 KB brotli | 134.68 KB brotli | −41.59 KB (−23.6%) |

Per-chunk cap (50 KB): passes with 39 KB headroom (was 13 KB).
Total hard gate (240 KB): passes with 105 KB headroom (was 64 KB).

**Notable:** the savings were realized WITHOUT migrating consumer
imports to subpath form. The barrel benefits from tree-shaking now
because `dist/index.js` is structured as a collection of
per-component re-exports from shared chunks — Vite/Rollup's
tree-shaker can drop individual chunks per consumer usage. Subpath-
form migration is expected to yield additional savings on top.

Evidence file:
`.claude/knowledge-base/baselines/2026-05-25-post-subpath/theocloud-bundle-delta.txt`

### Migration (consumer-side, opt-in)

```diff
- import { Card, Button, Alert } from "@theokit/ui";
+ import { Card } from "@theokit/ui/card";
+ import { Button } from "@theokit/ui/button";
+ import { Alert } from "@theokit/ui/alert";
```

The barrel import keeps working — migration is gradual, file by
file. CSS, themes, and isolated engines stay barrel-imported:
`import { ThemeProvider, violetForge } from "@theokit/ui"`,
`import "@theokit/ui/styles.css"`.

## [0.9.0-next.0] - 2026-05-23

Minor — adds the two deferred primitives revealed by the Brief #3
review (`Alert` + `Pagination`). Both are additive; zero breaking
change. The release closes the lower-priority follow-ups left over
from Briefs #1/#2 — `Alert` replaces the consumer's 27-LOC
`<VerificationBanner>` composition; `Pagination` is forward-positioned
for when `<Table>` (0.8) starts paginating Billing / Audit / Team
data at scale.

Plan: filed as Brief #3 in
`theo/docs/handoff/2026-05-23-theo-ui-cloud-dashboard-gaps-brief-3.md`.

### Added

- **`<Alert>` primitive (NEW)** — persistent inline notice. Four
  intents: `info` (Info icon, primary token), `success`
  (CheckCircle2, success), `warning` (TriangleAlert, warning),
  `destructive` (AlertCircle, destructive). Optional `title`,
  `description`, right-aligned `action` slot (consumer-provided
  ReactNode), and `onDismiss` handler (renders an `X` button).
  `destructive` intent renders `role="alert"` (assertive
  announcement); other intents render `role="status"` (polite) —
  matches WAI-ARIA conventions for status messaging. Distinct
  from `Toast` (transient + corner) and `EmptyState` (centered
  card). 13 unit tests + 5 Ladle stories. Brief #3 consumer:
  TheoCloud `<VerificationBanner>` → 3-line `<Alert>`.
- **`<Pagination>` primitive (NEW)** — accessible page-number
  navigation. Renders `<nav aria-label="Pagination">` with
  first / prev / numbers / next / last buttons + visual ellipses
  when `totalPages` exceeds the visible range. Active page carries
  `aria-current="page"`. Keyboard nav (`ArrowLeft` / `ArrowRight` /
  `Home` / `End`) on the nav element. Configurable `siblingCount`
  (default 1) + optional `showJumpButtons` (default true) +
  `size` (`sm | md`). Returns `null` when `totalPages <= 1`. Also
  exports a pure `computePageRange(currentPage, totalPages,
  siblingCount)` helper for unit-testing the range logic in
  isolation — most pagination bugs live in that function. 21 unit
  tests (6 on `computePageRange` alone) + 6 Ladle stories.
  Forward-positioned for `<Table>` v2 consumers.

## [0.8.0-next.0] - 2026-05-23

Minor — adds eight cross-cutting primitives revealed by the systematic
review of the remaining 11 dashboard pages (Projects, Environments,
Team, Billing, Domains, Settings, Profile, Login, Register,
Verification, Recovery, DeviceSuccess) + recurring PaaS UI patterns.
Each component is used in ≥3 distinct sites in the consumer dashboard.
6 are true primitives (Table, StatusDot, CopyButton, Timestamp,
StatTile, DangerZone); 2 are composites by taxonomy gate
(ConfirmDialog depends on Dialog/Input/Button; CodeBlock depends on
CopyButton). Zero breaking change; zero new peer-deps.

Plan: `.claude/knowledge-base/plans/dashboard-paas-primitives-2-plan.md`.
Edge-case review: `.claude/knowledge-base/reviews/edge-cases/dashboard-paas-primitives-2-edge-cases-2026-05-23.md`.
Consumer brief: `theo/docs/handoff/2026-05-23-theo-ui-cloud-dashboard-gaps-brief-2.md`.

### Added

- **`<Table>` primitive (NEW)** — semantic data-table with sub-components
  `Table.Header`, `Table.Body`, `Table.Row`, `Table.Cell`,
  `Table.HeaderCell`. Supports `density` (`default` / `compact` via
  Context), per-cell `align` (`left` / `center` / `right`), `numeric`
  cells (`font-mono tabular-nums`), and sortable header cells
  (`onSort` + `sortDirection` with ChevronUp/ChevronDown affordance
  + `aria-sort`). `sortDirection` without `onSort` is a no-op (header
  stays static); `sortDirection="none"` with `onSort` renders both
  chevrons dimmed (`opacity-30`). 10 unit tests + 4 Ladle stories.
  Brief #2 consumer: TheoCloud dashboard.
- **`<StatusDot>` primitive (NEW)** — semantic status indicator
  (small colored circle + optional label). Five `status` kinds:
  `live` (success), `building` (warning, auto-pulses), `failed`
  (destructive), `idle` (muted), `warning` (warning, static). Three
  sizes (`xs` 6px / `sm` 8px default / `md` 10px). When neither
  `label` nor `aria-label` is provided, auto-applies
  `aria-label={status}` + emits a dev-only warning (color-only
  status is invisible to screen readers). 12 unit tests + 3 stories.
  Brief #2 consumer: TheoCloud dashboard (7+ sites).
- **`<CopyButton>` primitive (NEW)** — click-to-copy primitive wrapping
  `navigator.clipboard.writeText`. Icon swap (Copy → Check on success,
  Copy → X on failure), `aria-live="polite"` announcement for screen
  readers, optional `label`, `ghost`/`outline` variants, two sizes,
  `onCopied` callback, configurable `feedbackDuration` (default
  1500ms). SSR-safe (guards `navigator?.clipboard?.writeText`); HTTP
  non-localhost contexts (where the Clipboard API is undefined) fall
  back to the failed state instead of throwing. Auto-cleans the
  revert timer on unmount; debounces double-clicks. 12 unit tests +
  4 Ladle stories. Brief #2 consumer: TheoCloud dashboard.
- **`<Timestamp>` primitive (NEW)** — accessible `<time datetime>`
  element with `relative` (default) / `absolute` / `both` formats.
  Uses zero-dep `Intl.RelativeTimeFormat`. Auto-refreshes via
  `setInterval` (default 60s, `refreshInterval={0}` disables).
  Native `title` HTML attribute carries the absolute time on hover
  (no Tooltip component dependency — keeps Timestamp a true
  primitive). `aria-label` always carries the full date. Invalid
  date renders an empty `<time>` element; invalid locale falls back
  to default with a dev warning. `value` accepts ISO string, Date,
  or **Unix milliseconds** (documented in JSDoc — passing seconds
  renders ~1970). 13 unit tests + 4 Ladle stories. Brief #2
  consumer: TheoCloud dashboard (every dashboard page).
- **`<StatTile>` primitive (NEW)** — big-number stat tile for
  dashboard summary rows. `value` + `label` + optional `icon` +
  optional `delta` (`{value, trend}` with `trend: "up" | "down" |
  "flat"` driving TrendingUp/TrendingDown/Minus icons and
  success/destructive/muted color). Dual mode (button/div) based on
  `onClick` — same pattern as `AccountMenu`/`ProjectSwitcher`. Value
  uses `font-display tabular-nums whitespace-nowrap`. 7 unit tests
  + 4 Ladle stories. Brief #2 consumer: TheoCloud Overview
  dashboard (3 tiles per page).
- **`<DangerZone>` primitive (NEW)** — destructive-actions section
  with sub-component `DangerZone.Action`. Red-bordered container
  (`border-destructive/30`) with title bar (default `"Danger Zone"`)
  and action rows. Each row carries `title` + `description` +
  consumer-provided `action` slot (typically a destructive
  `<Button>`). Rows separated by hairline dividers; last row drops
  the bottom border via `last:border-b-0`. Consumer supplies the
  destructive button — DangerZone never imports `<Button>`, keeping
  it a true primitive. 6 unit tests + 3 Ladle stories. Brief #2
  consumer: Settings + Profile + Team + Billing pages.
- **`<ConfirmDialog>` composite (NEW)** — controlled confirmation
  modal built on `Dialog`. Auto-focuses Cancel on open (deliberate
  — NOT the destructive button). `intent="destructive"` styles the
  confirm button with the destructive variant. `confirmationPhrase`
  enables typed-confirmation guard (case-sensitive, empty string
  treated as no phrase). Pressing Enter in the input triggers
  confirm when matched. Async `onConfirm` shows `Loader2` spinner
  while pending; resolve closes the dialog; reject keeps it open
  so consumers can surface their own error. Phrase input resets
  whenever the dialog closes. 13 unit tests + 4 Ladle stories.
  Composite (depends on Dialog + Button + Input). Brief #2
  consumer: 6+ destructive flows (Settings delete, Team remove,
  Billing cancel, Profile delete, Domains remove, Environments
  delete).
- **`<CodeBlock>` composite (NEW)** — terminal command / code-snippet
  surface. Pre-rendered code inside a `<pre>` with optional
  `terminal` prefix per line (`"$ "`), optional `caption` (file
  name), and optional inline `<CopyButton>` positioned top-right.
  The CopyButton receives the RAW `code` (without the visual `"$ "`
  prefix) — consumers paste only the executable command. `language`
  prop is reserved for future syntax highlighting (v1 ignored).
  7 unit tests + 4 Ladle stories. Composite (depends on
  CopyButton). Brief #2 consumer: Overview EmptyState, Projects
  EmptyState, Domains DNS records, API token display, LoginPage
  CLI hint.

### Implementation notes

- **Taxonomy gate** classified ConfirmDialog + CodeBlock as composites
  (D2 in the plan). Brief #2 listed all 8 as primitives, but the
  validate-quality-gates.ts script is hard-fail for any
  `primitives/` file that imports another `@theokit/ui` component.
- **Timestamp uses native `title` HTML attribute** (D3) instead of
  the `<Tooltip>` component, to keep the file a true primitive
  without sibling-primitive imports.
- **Zero new peer-deps.** Every component uses only `lucide-react`
  + Radix (both already peer) + `cn()`.
- **Bundle delta** — `dist/index.js` grew from 395763 B to 417113 B
  (+21350 B / +5.4%); `dist/index.d.ts` grew +11808 B / +7.5%. Both
  exceeded the ±5% tolerance by a small margin (8 components ≈ +2.5 KB
  each on average). The baseline was rebaselined in the same release
  (`scripts/baselines/bundle-sizes.json`) — expected and explicit per
  plan D6.
- 10 SHOULD TEST edge cases from the `/edge-case-plan` review
  incorporated into the TDD blocks (EC-1 through EC-10 — empty
  CopyButton value, unmount during timer, clipboard undefined,
  Table sort direction without onSort, dimmed affordance for
  `none`, StatusDot dev warning, Timestamp Unix seconds vs ms,
  invalid locale fallback, ConfirmDialog empty phrase semantics,
  Enter-to-confirm in phrase input).

## [0.7.0-next.0] - 2026-05-23

Minor — adds four PaaS-shape primitives to cover the gaps surfaced by the
TheoCloud dashboard migration: multi-metric `UsageMeter`, standalone
`Progress` bar, semantic `PlanBadge`, and sidebar `AccountMenu`. Each
primitive is a SIBLING of an existing agent-shape primitive — no breaking
changes, no modifications to current components. The library's
agent-first positioning (per `PITCH.md`) stays intact; both shapes now
coexist with TypeScript dispatch by name.

Plan: `.claude/knowledge-base/plans/dashboard-paas-primitives-plan.md`.
Consumer brief: `theo/docs/handoff/2026-05-23-theo-ui-cloud-dashboard-gaps-brief.md`.

### Added

- **`<Progress>` primitive (NEW)** — accessible progress bar built on
  `<div role="progressbar">` (not native `<progress>` — Tailwind classes
  style cross-browser reliably). Variants:
  - `intent`: `default` / `success` / `warning` / `destructive`
  - `height`: `h-1` (default) / `h-1.5` / `h-2` / `h-3`
  - `indeterminate`: animated bar with no value (omits `aria-valuenow`,
    sets `aria-busy="true"`)
  Clamping handles `value > max` (clamps to max) + `value < 0` (clamps to
  0) + `max = 0` (no NaN/Infinity). Respects `prefers-reduced-motion`.
  14 unit tests + 6 Ladle stories. (#TBD)
- **`<UsageMeter>` primitive (NEW)** — multi-metric stacked usage card
  for PaaS dashboards. Renders N metrics (data transfer, requests, build
  minutes, seats, …) each with `label + value/max + <Progress>` bar.
  Supports custom per-metric `formatter`, automatic over-quota warning
  (value text gets `text-warning`, `<Progress>` uses `intent="warning"`
  AND clamps the bar at 100%), and a `compact` bars-only mode. PaaS-shape
  sibling of `<CostMeter>` (which stays single-USD-mono for agent token
  spend). 12 unit tests + 4 Ladle stories. (#TBD)
- **`<PlanBadge>` primitive (NEW)** — semantic pricing-tier badge with 5
  canonical tiers (`free`, `hobby`, `pro`, `team`, `enterprise`) and two
  sizes (`sm`, `md`). Each tier carries distinct color tokens. Consumers
  self-document intent (`plan="hobby"`) instead of mapping a generic
  `<Badge variant="outline">` to colors per app — future rebrand /
  dark-mode tweaks propagate automatically. Default label capitalizes
  the tier; `label` prop overrides. Runtime fallback to `free` styling
  for unknown tier (TypeScript prevents this at compile time). 16 unit
  tests + 2 Ladle stories. (#TBD)
- **`<AccountMenu>` primitive (NEW)** — sidebar header for PaaS surfaces.
  Avatar + name + (optional) `<PlanBadge>` + (optional) secondary line.
  Dual mode: with `onClick`, renders as `<button>` with trailing
  `ChevronsUpDown` icon; without, renders as a static `<div>` (not
  focusable, no chevron). Avatar handling auto-detects URL vs short
  string (≤2 chars treated as initials) vs undefined (derives initials
  from `name`). PaaS-shape sibling of `<ProjectSwitcher>` (which stays
  workspace+branch+agent-status for code-agent surfaces). 13 unit tests
  + 4 Ladle stories. (#TBD)

### Notes

- **No breaking change.** `CostMeter`, `ProgressChecklist`, `Badge`,
  `ProjectSwitcher` are untouched. Consumers on 0.6.x see only new
  exports.
- **Taxonomy invariant preserved.** `UsageMeter → Progress` and
  `AccountMenu → Avatar + PlanBadge` use relative-path imports
  (`../{slug}/index.js`), not barrel imports, so primitives still have
  zero `@theokit/ui` cross-dependencies per the structural gate.
- **Bundle delta.** `dist/index.js` grows by ~6 KB (4 primitives + types
  + small imports). Within the ±5% baseline tolerance (rebaselined).
- **Subpath exports.** `package.json#exports` gains `./usage-meter`,
  `./progress`, `./plan-badge`, `./account-menu` per existing
  convention (auto-synced by `scripts/sync-exports.ts`).
- **Registry items.** Four new `registry/r/*.json` descriptors ship for
  shadcn-style copy-paste install. `usage-meter` declares `progress` as
  a `registryDependencies`; `account-menu` declares `avatar` +
  `plan-badge`.

## [0.6.3-next.0] - 2026-05-23

Patch — eliminate React hydration mismatch in `<ThemeProvider>`. Reported
by the TheoKit framework team (2026-05-23): every SSR'd app using
`<ThemeSwitcher>` threw `Hydration failed because the server rendered
text didn't match the client` on every page reload after a user had
changed themes, then re-rendered the entire React tree client-side,
defeating SSR.

### Fixed

- **SSR hydration mismatch on `<ThemeProvider>`** — three `useState`
  calls (`themeName`, `mode`, `density`) previously ran their initializer
  on BOTH server (no `window`, returned default) AND client at hydration
  time (with `window`, returned `localStorage.getItem(…)`). The two
  diverged → React threw + discarded the SSR'd tree on every page load.
  Fixed by initializing with the SSR default ALWAYS, then promoting to
  the stored value via a post-mount `useEffect` after hydration. The
  visible-text nodes the React reconciler compares (switcher label,
  `sr-only` announcement, `aria-label`) now match server → client.
  Stored preferences still apply within one render tick of mount;
  `<ThemeScript>` continues to set `data-theme` / `data-mode` /
  `data-density` on `<html>` before React mounts to suppress the
  1-frame visual flicker. (#TBD)
- **Persist effect first-mount guard** — a `useRef`-based skip-first
  flag prevents the persist effect from writing the SSR-safe defaults
  to `localStorage` between mount and the post-mount hydration
  setState. Previously, the brief window between commit and the
  hydration effect could clobber the user's stored preference if the
  page closed mid-render. After the first call, every subsequent
  change (user-driven OR hydration-promoted) persists normally. (#TBD)

### Added

- **`<ThemeScript defaultDensity>` prop** — the inline `<script>`
  bootstrap now also sets `data-density` on `<html>` from
  `localStorage.getItem(":density")` (or `defaultDensity`, default
  `"comfortable"`) so density-driven layouts have zero FOUC at first
  paint. Mirrors `ThemeProvider`'s `defaultDensity`. (#TBD)

### Notes

- Pattern mirrors `next-themes` (Vercel), `MantineProvider`, and
  shadcn/ui's theme scaffold. The 1-frame state-promotion delay is the
  React-canonical price for SSR-safe client-only state. `<ThemeScript>`
  pre-paints the `<html>` attributes so the visible layer doesn't
  flicker.
- Two new unit tests guard the regression:
  - `does NOT write to localStorage on first mount when nothing changes
    (persist gate)` — verifies the skip-first guard.
  - `writes to localStorage AFTER a user-driven change (persist fires
    post-hydration)` — verifies the gate releases after the first call.
- Existing `reads initial theme name from localStorage` and `reads
  initial mode from localStorage` tests continue to pass because
  testing-library's `render()` flushes effects synchronously inside
  `act()`, so by the assertion phase the post-mount hydration effect
  has already promoted the stored value.

## [0.6.2-next.0] - 2026-05-23

Patch — restore `cursor: pointer` on interactive buttons. Tailwind v4
intentionally dropped the v3 preflight rule
(https://tailwindcss.com/docs/upgrade-guide#default-button-cursor) so
every `<button>` rendered by `Sidebar.Item`, `QuickActionChips`,
`ChatComposer`, `ContextWindowBar`, `ToolCallCard`, `AgentProfile`,
`CommandPalette`, etc. was showing the default arrow cursor instead of
the pointing hand. Visual regression observed in TheoKit
`examples/full-stack-agent` against `@theokit/ui@0.6.1-next.0`.

### Fixed

- **Tailwind v4 preflight regression on `<button>` cursor** — restored
  the v3 `button { cursor: pointer }` behavior via TWO defenses:
  1. `<Button>` primitive (`src/components/primitives/button/button.tsx`)
     gains `cursor-pointer disabled:cursor-default
     aria-disabled:cursor-default` in its CVA base — explicit per
     Tailwind v4 spec intent.
  2. `dist/styles.css` `@layer base` adds a scoped preflight rule:
     ```css
     button:not(:disabled):not([aria-disabled="true"]),
     [role="button"]:not([aria-disabled="true"]) {
       cursor: pointer;
     }
     ```
     This covers every native `<button>` the library composites render
     directly (50+ across `Sidebar.Item`, `QuickActionChips`,
     `ChatComposer`, `ToolCallCard`, `CommandPalette`, …) without
     touching their per-component className strings. Disabled and
     `aria-disabled="true"` paths keep `cursor: default` per
     accessibility convention. (#TBD)

The fix is opt-in by consumer choice — they imported
`@theokit/ui/styles.css`. Tailwind v4's global preflight remains
untouched; only this stylesheet's `@layer base` adds the rule. (#TBD)

### Notes

- Verification recipe (matches the TheoKit reproduction):
  ```bash
  # Browser test:
  # 1. cd theokit/examples/full-stack-agent && pnpm dev
  # 2. Hover any Sidebar.Item → cursor MUST visibly change to the
  #    pointing-hand icon (not the default arrow).
  #
  # CSS grep test:
  grep -c "button:not(:disabled)" node_modules/@theokit/ui/dist/styles.css
  # MUST return >= 1 (pre-fix: 0)
  ```

## [0.6.1-next.0] - 2026-05-23

Patch — pre-compile utility CSS at library build time so consumers see
every hover / focus / active / data-state variant the library uses,
regardless of package-manager layout. Fixes a critical regression where
the entire library rendered flat under pnpm.

### Fixed

- **pnpm symlink + Tailwind v4 `@source` bug** — Tailwind v4's
  `tinyglobby`-based scanner does **not** follow symbolic links. Under a
  pnpm install, `node_modules/@theokit/ui` is a symlink to a deep
  `node_modules/.pnpm/@theokit+ui@…/node_modules/@theokit/ui` directory,
  and the consumer-side pattern
  `@source "node_modules/@theokit/ui/dist/**/*.{js,mjs,cjs}"` (the one
  the `vite-plugin` previously emitted via the
  `virtual:@theokit/ui/library-sources.css` virtual module) expanded to
  **zero** matches. Every `hover:bg-muted`, `hover:text-foreground`,
  `data-[state=active]:…` variant the library's 79 primitives + 41
  composites use was therefore never emitted into the consumer's CSS,
  and components rendered flat (no hover feedback, no focus rings, no
  active-tab highlight). The bug affected every modern Node toolchain
  that uses pnpm — Vite ecosystem default, Bun, recent Turborepo
  templates. (#TBD)

### Added

- **`dist/components.css` (NEW)** — pre-compiled utility CSS file
  containing the materialized rules for every Tailwind class the
  library's components reference. Generated at library build time by
  `scripts/build-precompiled-css.ts`, which runs `@tailwindcss/cli@^4`
  against `src/styles/components-entry.css` (a curated entry that
  imports `tailwindcss`, the existing `tokens.css` and `tokens-v4.css`
  `@theme` namespace, and declares `@source` globs against the library's
  own `src/` — not `node_modules/`). Size: ~88 KB unminified, ~14 KB
  gzipped. This is the canonical Tailwind v4 library pattern used by
  Radix UI Themes, shadcn/ui pre-compiled, and Mantine v7. (#TBD)
- **`dist/styles.css` chains `@import "./components.css"`** at the end,
  so a single `@import "@theokit/ui/styles.css"` in the consumer's CSS
  now transitively pulls in every utility the library uses — zero
  filesystem scanning required. Consumer-side `@theme` overrides still
  win via the runtime CSS-var cascade (every utility resolves
  `var(--color-*)` at paint time, not at compile time). (#TBD)
- **`scripts/dogfood-precompiled-utilities.ts`** — 25 contract checks
  asserting `dist/components.css` ships the required variants
  (`hover:bg-muted`, `hover:text-foreground`, `hover:bg-secondary`,
  `hover:shadow-md`, `hover:underline`, `focus-visible:outline`, every
  base color/typescale token, the radii). Integrated to
  `pnpm quality:gates` so the regression cannot reach npm again. (#TBD)
- **`@tailwindcss/cli@^4`** added as a devDependency — required for the
  pre-compile pass at library build time. Consumers do NOT need it; the
  utility rules ship as static CSS bytes. (#TBD)

### Changed

- **`@theokit/ui/vite-plugin` virtual module** — the
  `virtual:@theokit/ui/library-sources.css` module no longer emits the
  broken `@source "node_modules/@theokit/ui/..."` default globs. It is
  retained for backwards compatibility (TheoKit's earlier integration
  code may still resolve it) but now emits only an explanatory comment
  block when no `contentExtra` option is passed. The plugin's primary
  job remains chaining `@tailwindcss/vite` for the consumer's own
  Tailwind v4 build. (#TBD)

### Notes

- Adopted from the canonical Tailwind v4 library pattern documented at
  https://tailwindcss.com/docs/upgrade-guide. Reference implementations
  studied: Radix UI Themes
  (`packages/radix-ui-themes/scripts/build.mjs`), shadcn/ui pre-compiled
  starter, Mantine v7.
- Verification recipe matching TheoKit's reproduction script:
  ```bash
  grep -c "\.hover\\:bg-muted" node_modules/.pnpm/@theokit+ui@*/node_modules/@theokit/ui/dist/components.css
  # MUST return >= 1 (pre-fix: 0)
  ```

## [0.6.0-next.0] - 2026-05-23

Minor — `<ChatMessage>` rewritten on top of the Vercel AI SDK `UIMessage`
shape with full markdown rendering, syntax-highlighted code blocks, math,
mermaid diagrams, tool calls, reasoning panels, file/source citations,
branching navigation, and a streaming-safe markdown preprocess.

### Added

- **`<ChatMessage>` v2 (RFC 0009)** — promoted from primitive to composite
  (`src/components/composites/chat-message/`). Two consumption shapes:
  (a) convenience `<ChatMessage message={uiMessage} />` auto-dispatches
  every part to its built-in renderer; (b) composable
  `<ChatMessage.Root from="assistant"><ChatMessage.Content>…</…></…>` for
  full control. Forks structural shell from `vercel/ai-elements`
  (Apache-2.0, see `NOTICE`). Renders 11 part types:
  `text`, `reasoning`, `tool-${name}`, `dynamic-tool`, `file`,
  `reasoning-file`, `source-url`, `source-document`, `step-start`,
  `custom`, `data-${name}`. (#TBD)
- **Branching navigation** — `<ChatMessageBranch>` + content / selector /
  previous / next / page sub-components for cycling through alternate
  responses on a single turn. (#TBD)
- **Markdown engine (`src/lib/markdown/`)** — `parseMarkdownToReact()` +
  `parseMarkdownToReactSafe()` build a mdast → hast → React pipeline
  via the existing optional peer-deps (`mdast-util-from-markdown`,
  `mdast-util-gfm`, `mdast-util-to-hast`, `hast-util-sanitize`,
  `hast-util-to-jsx-runtime`). Sanitize schema allows
  `language-*` classes on `<code>`/`<pre>` so syntax highlight survives.
  GFM tables, task lists, strikethrough, autolinks all render. (#TBD)
- **Streaming-safe preprocessor** — `preprocessStreaming()` auto-closes
  trailing `**bold`, `_italic`, `` `code ``, `[link](url`, `$math$`,
  `$$blockmath$$`, and `` ```fence `` so token-by-token streaming output
  never flashes raw markdown chars. Re-implemented (NOT
  `streamdown`-dep) so we don't take a runtime dependency on a Vercel
  package we compete with. (#TBD)
- **`<CodeBlock>` + `<InlineCode>` (`src/lib/markdown/`)** — fenced code
  ships Shiki SSR-friendly highlight (lazy `import("shiki")` — peer-dep
  optional, graceful plain-`<pre>` fallback), language label header,
  Copy → Check 2s button per `shadcn.io` AI code-block pattern. Inline
  `<code>` is styled distinct from blocks. (#TBD)
- **`<MathInline>` + `<MathBlock>`** — lazy-load KaTeX, render to safe
  HTML, fall back to `<code>` / `<pre>` plain when peer-dep missing. (#TBD)
- **`<MermaidDiagram>`** — lazy-load Mermaid with `securityLevel:
  "strict"`, render to SVG. Failed parse or missing peer falls back to
  a labeled `<pre>` block. (#TBD)
- **11 Vercel-compat UIMessagePart types** + 10 type guards in
  `src/types/chat.ts` (`UIMessage`, `UIMessagePart`, `TextUIPart`,
  `ReasoningUIPart`, `ToolUIPart`, `DataUIPart`, `FileUIPart`,
  `ReasoningFileUIPart`, `SourceUrlUIPart`, `SourceDocumentUIPart`,
  `StepStartUIPart`, `CustomContentUIPart`, `ProviderMetadata`,
  `ToolInvocationState`, `MessageRole`). Field-for-field compatible
  with `useChat()` from `@ai-sdk/react` — zero-adapter interop. (#TBD)

### Changed

- **Taxonomy**: `ChatMessage` moves from `primitives/` → `composites/`.
  Composite layer is the correct home — internal deps on `<Button>`,
  native `<details>`, our `<Card>` patterns. README catalog counts
  adjust automatically via the structure gate (`pnpm sync:readme`). (#TBD)
- **`registry/chat-message.json`** — descriptor now lists 12 source
  files + 6 lib files, declares `lucide-react` + `safe-href` + `button`
  registry-deps. (#TBD)

### Breaking changes

- **`Message` type removed.** `import type { Message } from "@theokit/ui"`
  now fails — use `UIMessage` instead. TypeScript will hint
  `Did you mean 'UIMessage'?`.
- **`message.content` removed.** Replace every callsite:

  ```diff
  - { id, role: "user", content: "hello", timestamp: "10:00" }
  + { id, role: "user", parts: [{ type: "text", text: "hello" }] }
  ```

  Internal callsites already migrated: `agent-stream`,
  `chat-thread.stories`, `theo-code-shell.data`, `task-running.stories`,
  `task-starting.stories`, `task-completed.stories`. For mockup data
  with arbitrary JSX content, use the composable form:

  ```tsx
  <ChatMessage.Root from="assistant">
    <ChatMessage.Content variant="contained">
      <div>any JSX here</div>
    </ChatMessage.Content>
  </ChatMessage.Root>
  ```

- **`message.model` / `message.timestamp` no longer rendered** by
  `<ChatMessage>` — fold them into custom UI under the message body, or
  attach via `metadata?: unknown` (consumer-typed) and read from there.
- **`./components/primitives/chat-message/`** deleted. Imports must move
  to `./components/composites/chat-message/` (the public `@theokit/ui`
  barrel handles this; only relative imports inside the repo need
  updating).

### Notes

- **License attribution**: a `NOTICE` file ships at the package root
  with Apache-2.0 attribution to `vercel/ai-elements` for the
  structural-shell components forked, and to `vercel/ai` for the
  `UIMessage` shape mirrored. Both upstream and TheoUI are Apache-2.0
  — compatible.
- **Reference clones** of `vercel/ai-elements` and `vercel/ai` live in
  `referencia/` (read-only). Not shipped in the npm tarball (excluded
  via the `files` field).

## [0.5.1-next.0] - 2026-05-22

Patch — RFC 0008 follow-up. The 0.5.0-next.0 release declared `tailwindcss@^4`
as a peer dependency and shipped the `./vite-plugin` + `./preset` subpaths,
but the actual CSS / token / preset artifacts inside the tarball were still
Tailwind v3 internally. Result: every TheoKit consumer of 0.5.0-next.0 booted
with unstyled UI in dev and production — `bg-primary`, `text-muted-foreground`,
`border-border`, `text-body-sm`, etc. emitted as className strings with no
matching CSS rule.

This release rewrites the three v3-shaped artifacts to v4-native syntax and
ships a fixture-backed real-build dogfood so the regression cannot recur.

### Changed

- **`dist/styles.css` is now Tailwind v4 native.** Uses `@import "tailwindcss"`
  (replaces the v3 `@tailwind base; @tailwind components; @tailwind utilities;`
  trio that Tailwind v4 emits as literal strings, with zero utility generation).
  Imports `tokens.css` (runtime cascade) AND `tokens-v4.css` (`@theme` namespace)
  so consumers' Tailwind v4 build resolves both layers correctly. Same
  `@layer base` content (border-color, body font, focus ring, scrollbar
  styling) as before. (#TBD)
- **`./preset` subpath is now a CSS file.** Tailwind v4 dropped the v3 JS
  preset format — `theme.extend.colors.{name}` declarations are a no-op for
  v4. The new `dist/preset.css` simply chains `@import "./tokens.css"` and
  `@import "./tokens-v4.css"` so consumers can `@import "@theokit/ui/preset.css"`
  from their own Tailwind v4 entry CSS. (#TBD)

### Added

- **`@theokit/ui/tokens-v4.css` (NEW)** — `@theme {}` block declaring 28
  `--color-*` aliases (full color set), 14 `--text-*` typescale tiers
  (Violet Forge — `--text-display-2xl` through `--text-code-sm` with companion
  `--*--line-height`, `--*--letter-spacing`, `--*--font-weight`), 3 `--font-*`
  family tokens, 7 `--radius-*` tiers, 5 `--shadow-*` levels, 3 `--ease-*`
  timings, and 2 `--animate-*` keyframe-bound utilities. Every color alias
  uses `hsl(var(--*))` indirection so `<ThemeProvider>`'s runtime
  `[data-theme]` cascade keeps working — switching themes still recolors
  every utility. (#TBD)
- **`@theokit/ui/styles-v3-legacy.css` (NEW)** — the previous v3-shaped
  `@tailwind base/components/utilities` entry. Pinned consumers on
  `tailwindcss@^3` who still want a prebuilt stylesheet can import this
  subpath. New code SHOULD use `@theokit/ui/styles.css` (v4) instead.
- **`@theokit/ui/preset-v3-legacy` (NEW)** — the v3 JS `Partial<Config>`
  preset that previously lived at `./preset`. Renamed so the canonical
  `./preset` subpath can host the v4 CSS preset. v3 consumers update
  imports from `@theokit/ui/preset` to `@theokit/ui/preset-v3-legacy`.
- **Dogfood scripts** — `pnpm dogfood:v4-zero-config` (shape check, runs in
  `quality:gates`) and `pnpm dogfood:v4-real-build` (end-to-end: packs the
  tarball, installs in a tmp project alongside `@tailwindcss/cli@^4`, runs
  Tailwind v4 against `tests/fixtures/v4-zero-config/`, and grep-asserts the
  expected utility classes appear in the emitted CSS — 12 assertions). The
  real-build dogfood is opt-in (slow, requires network) but catches any
  future regression where v3-shaped artifacts get shipped under a v4 peer
  declaration. (#TBD)

### Notes

- **Breaking for any 0.5.0-next.0 consumer.** The `./preset` subpath changed
  from JS (`Partial<Config>` default-export) to CSS file. Code importing
  `import preset from "@theokit/ui/preset"` will break and must migrate to
  `@import "@theokit/ui/preset.css"` in an entry CSS. Blast radius: TheoKit
  (already reverted away from 0.5.x by the time this fix shipped) plus any
  community consumer that adopted 0.5.0-next.0 in the same day — likely zero.
- The runtime indirection via `hsl(var(--*))` aliases keeps `<ThemeProvider>`
  and every built-in theme (`violet-forge`, `dracula`, `vercel-mono`, etc.)
  working with zero changes — the v4 utilities transparently follow the v3
  cascade.

## [0.5.0-next.0] - 2026-05-22

Minor bump — public API gains two subpath exports (`./vite-plugin` and
`./preset`) so the TheoKit framework's `integrateUseTheoUI()` can
auto-wire Tailwind v4 for consumers with zero further configuration.
Zero visual break and no runtime behavior change for existing consumers.

### Added

- **`@theokit/ui/vite-plugin` (NEW, RFC 0008)** — Default-export factory
  returning one Vite `Plugin`. The plugin's `config()` hook
  dynamic-imports `@tailwindcss/vite` v4 and chains it into the
  consumer's plugin array when resolvable, and degrades to `console.warn`
  + CSS-only mode (via the pre-built `@theokit/ui/styles.css` subpath)
  when the peer is not installed. A virtual module
  `virtual:@theokit/ui/library-sources.css` provides the `@source`
  directive covering `node_modules/@theokit/ui/dist/**/*.{js,mjs,cjs}`
  so Tailwind scans the library's published JS for utilities. Plugin
  name slug: `@theokit/ui/vite-plugin`. Options: `tailwind?: boolean`
  (default `true`), `contentExtra?: string[]` (extra `@source` globs).
  (#TBD)
- **`@theokit/ui/preset` (NEW, RFC 0008)** — Default-export Tailwind v4
  `Partial<Config>` mirroring the design tokens in `tokens.css`
  (colors via `hsl(var(--x) / <alpha-value>)`, font families, the
  Violet Forge typescale, radii, shadows, animations, motion timing)
  with `content` paths covering `./node_modules/@theokit/ui/dist/**` and
  the `tailwindcss-animate` plugin. Consumer usage:
  `import preset from "@theokit/ui/preset"; export default { presets: [preset] }`.
  Internally delegates to the existing `src/styles/tailwind-preset.ts` —
  the v3 shadcn-registry preset and the v4 import preset stay
  byte-for-byte aligned and impossible to drift. (#TBD)
- **`@tailwindcss/vite ^4`, `tailwindcss ^4`, `vite ^6 || ^7` peer-deps
  (all optional)** — added to `peerDependenciesMeta` so consumers
  importing `@theokit/ui` standalone (no framework) are not forced into
  Tailwind v4. Required only when consuming via TheoKit's auto-wire path
  or the new `./vite-plugin` subpath. (#TBD)

### Notes

- Existing `tailwindcss@^3` consumers continue to work via the shadcn
  registry preset (`registry/r/tailwind-preset.json`) and the prebuilt
  `@theokit/ui/styles.css`. The new subpaths are additive — they do not
  break v3-based setups.
- The `vite-plugin` returns ONE `Plugin` object (not `Plugin[]`) per the
  cross-repo contract with TheoKit's `integrateUseTheoUI()`. The chain
  to `@tailwindcss/vite` happens via the `config()` hook's `plugins`
  field — Vite 5+ tightened the TypeScript signature, the runtime still
  merges plugins as expected.

## [0.4.0-next.0] - 2026-05-22

Minor bump — public API gains 7 new theme exports. Zero visual break for
consumers in 0.3.x (default theme remains `violet-forge`).

### Added

- **7 new built-in themes (2026-05-22, RFC 0007)** — `vercelMono`, `githubDark`, `dracula`, `oneDark`, `anthropicStyle`, `openaiStyle`, `linearGlass`. `builtinThemes` grows from 3 to 10 entries. Each ships light + dark mode. Derivative slugs from brand names use suffixes (`-mono`, `-style`, `-glass`) and descriptions include "Inspired by, not affiliated with [Company]" per D1.1 ADR (trademark protection / no false-affiliation). Canonical OSS themes (Dracula, One Dark, GitHub Dark) keep their reusable names. Bundle delta: ~60 KB CSS injection if consumer passes `builtinThemes` (alternative: `themes={[violetForge, dracula]}` for ~12 KB). (#TBD)
- **`validateThemeContrast` quality gate (2026-05-22)** — Pure-JS WCAG 2.1 contrast validator in `scripts/lib/wcag-contrast.ts` + gate in `validate-quality-gates.ts`. Iterates 10 themes × 2 modes × 4 high-stakes pairs, enforces 4.5:1 (body) and 3:1 (large/button) thresholds. Runs <50ms. Caught 14 pre-existing AA failures in `violet-forge`, `classic-paper`, `aurora-terminal` accent contrast; `classic-paper` accent darkened from `37 92% 50%` → `37 92% 40%` and `openai-style` dark primary darkened from `155 78% 43%` → `155 78% 30%` to satisfy the gate. (#TBD)
- **`scripts/lib/wcag-contrast.ts` + `.test.ts` (NEW)** — Pure functions `parseHsl`, `hslToLuminance`, `contrastRatio`. 9 tests cover edge cases (achromatic, hue overflow, percent stripping — EC-3). (#TBD)

## [0.3.0-next.0] - 2026-05-22

Minor bump — visual defaults realigned to FAANG-modern density baseline
(shadcn / Linear / Vercel / Stripe). Public API unchanged; no type/prop
signatures touched. Every consumer in 0.2.x will see tighter form controls,
smaller body text, and a less-padded Card after upgrading.

### Migration from 0.2.x

If you depended on the prior visual defaults (Button 40px, Card 24px
padding, body-md 15px), you have two options:

1. **Per-component** — pass explicit `size="lg"` to Button/Input/Select/
   Textarea/Card. These render the prior dimensions.
2. **Global override** — set `<ThemeProvider defaultDensity="spacious">`
   at the app root. All form controls bump to 44px globally.

No code change required if you accept the new defaults. Type-only
exports added: `Density`, `DensityContextValue`.

### Added

- **`useDensity()` hook + `data-density` attribute (2026-05-22, RFC 0006)** — Global density override without rewriting `size` props per call site. Three tiers: `compact` (32px), `comfortable` (36px, default), `spacious` (44px). `<ThemeProvider defaultDensity="compact">` at the app root flips the entire surface. Persisted to localStorage. **EC-1 fix**: density implemented via CSS variables on `:root` (`--theo-control-h`, `--theo-control-px`) injected by ThemeProvider, not Tailwind class modifiers. Only the `md` cva variant reads the var; `sm` and `lg` stay hardcoded so explicit `size` prop always overrides density. (#TBD)
- **`docs/design-system.md > Density policy` section** — declares default heights per component + WCAG 2.5.8 AA tap-target policy + density override patterns. Closes the style-guide gap (previously implicit in source). (#TBD)
- **`playground/density-demo.tsx`** — live preview with 3-way density toggle. Mount via `?view=density` in the Vite playground. (#TBD)

### Changed (BREAKING visual default, not API)

- **Form-control `md` defaults: 40px → 36px** (FAANG-tier modern density). Affects `Button`, `Input`, `Select.Trigger`, `Textarea`. `sm` stays 32px, `lg` recalibrated to 44px. (#TBD)
- **`body-md` typescale: 15px → 14px** (shadcn / Vercel Geist / Linear standard). `body-sm` recalibrated 14px → 13px to preserve a distinct tier. `validateDesignSystemFidelity` gate updated atomically with `tailwind-preset.ts`. (#TBD)
- **Card `md` padding: 24px → 20px** (`p-6` → `p-5`). `sm` unchanged (`p-3`); `lg` recalibrated 28px → 24px (`p-7` → `p-6`). (#TBD)
- **Bundle baseline rebased** for the new defaults (~+700 bytes total — CSS-var class strings + Density type union). Engines (whiteboard / slide / slide-deck) untouched. (#TBD)

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
- **Slide rich content — Tier 1 baked-in + Tier 2 plugin system (2026-05-19, RFC 0004)** — Estende `<Slide>` (RFC 0002) e `<SlideDeck>` (RFC 0003) com conteúdo rico nível PowerPoint sem reinventar parsers. **Tier 1 (zero peer-deps novas):** (a) GFM alerts `> [!NOTE/TIP/IMPORTANT/WARNING/CAUTION]` detectados em mdast post-process (alerts.ts) → `<aside class="theo-slide-alert" data-theo-slide-alert-type>` temado em ambos os themes (default + violet-forge); (b) 7 layouts via frontmatter `layout` (`default`, `title`, `two-column`, `image-right`, `image-left`, `code-output`, `section`) em CSS grid templates (themes/layouts.css importado pelos dois themes); (c) backgroundImage + backgroundGradient com `sanitizeBgUrl` rejeitando `javascript:`/`vbscript:`/TODO data: URLs (EC-7), cap 500_000 chars; (d) Marpit `![bg](url)` syntax extraído em mdast walker → `ParsedSlide.extractedBackground = { url, modifier }` (D18/EC-5), sanitizado antes de armazenar com fallback `MARPIT_BG_UNSAFE_URL`, modifier-aware (`cover`/`fit`/`left`/`right`); (e) header/footer/paginate overlays via frontmatter (plain text ≤200 chars cada), CSS absolute positioned. **Tier 2 (opt-in plugin system):** plugin architecture com `<Slide plugins={SlidePlugin[]}>` e relay `<SlideDeck plugins>` para cada slide interno. `SlidePlugin` shape: `{ name, mdastTransform?, hastTransform?, components?, sanitizeSchemaExtension? }` com error isolation D16 (cada chamada em try/catch, throws agregadas em `errors[]` com `code: "PLUGIN_ERROR"`; pipeline **nunca** propaga exception) e sanitize-schema merge D17 (extensions unionadas com defaultSchema + Tier 1 baseline). Quatro plugins shipados em sub-subpaths `@theokit/ui/slide/plugins/{shiki,math,mermaid,emoji}`: **shikiPlugin** (peer-dep `shiki`; lazy + singleton highlighter; pre-renderiza `<pre><code class="language-XXX">` em HTML temado dual-theme com sanitize ext `<span> style/className`); **mathPlugin** (peer-deps `katex` + `hast-util-from-html`; substitui `$inline$` + `$$block$$` por KaTeX displayMode/inline; skip em `<code>`/`<pre>`; sanitize ext com lista completa de ≥30 tags MathML — `math`, `mfrac`, `msqrt`, `msup`, `msub`, `msubsup`, `munder`, `mover`, `mtable`, `mtr`, `mtd`, `mphantom`, `mstyle`, `annotation`, etc. — EC-4); **mermaidPlugin** (peer-dep `mermaid`; converte `<pre><code class="language-mermaid">` em `<theo-mermaid source>` com React `<MermaidDiagram>` que lazy-importa mermaid e injeta SVG via innerHTML; SSR placeholder distinguível de erro com `role="img"` + source code preservado, EC-10; sanitize ext com ≥30 tags SVG — `svg`, `g`, `path`, `rect`, `circle`, `text`, `marker`, `foreignObject`, etc. — EC-4); **emojiPlugin** (zero peer-deps de runtime, usa `unist-util-visit-parents` já no stack; 100 shortcodes Unicode embedded; **EC-6: ancestor check** via `isInsideCodeOrPre` skipa replace dentro de `<code>`/`<pre>` para preservar type hints Python / YAML keys / Ruby symbols). Pipeline order: `validateSlide → parseBody → detectAlerts (Tier 1) → extractMarpitBackgrounds (Tier 1) → plugin.mdastTransform[] → mdastToHast → plugin.hastTransform[] → sanitize(defaultSchema + extensions) → hastToReact (consumer + plugin components)`. Bundle isolation invariant preservada: barrel `dist/index.js` **inalterado**; cada plugin é entry tsup próprio com peer-deps externalizados. `scripts/sync-exports.ts` ganha 4 entries em `ISOLATED_SUBPATHS`. `package.json` ganha 9 peer-deps opcionais (`shiki`, `katex`, `mermaid`, `micromark-extension-math`, `mdast-util-math`, `hast-util-from-html`, `unist-util-visit`, `unist-util-visit-parents`). RFC `docs/rfcs/0004-slide-rich-content.md` status `Implemented`. **128 testes novos** distribuídos em 13 phases (T0.1 plugin contract: 13 testes; T0.2 parseSlide integration: 11 testes; T1.1 alerts: 8 testes; T2/T3/T5 schema: 25 testes; T4.1 Marpit bg: 9 testes; T6.1 Shiki: 6 testes; T7.1 Math: 7 testes; T8.1 Mermaid: 7 testes; T9.1 Emoji: 10 testes; Slide component: 32 testes). Suite total: 1174 testes verdes. Codes de erro novos: `PLUGIN_ERROR`, `PLUGIN_PEER_DEP_MISSING`, `MARPIT_BG_UNSAFE_URL`. (#TBD)
- **SlideDeck composite engine — multi-slide deck w/ navigation, presenter, fullscreen, PDF (2026-05-19)** — `@theokit/ui/slide-deck` agora orquestra N `<Slide>` primitives com navegação completa: keyboard (←/→/Space/Home/End/Esc/F/N/Ctrl+P, com guard contra inputs/contentEditable), touch swipe (Pointer Events nativos, multi-touch filtrado, pointercancel limpo — EC-6/EC-7), hash routing bidirectional (`#/N` 1-based, via `history.replaceState` para evitar loop — EC-10), lazy initializer SSR-safe (D17/EC-5). Sub-componentes em namespace dot: `<SlideDeck.Slides>` `<SlideDeck.Controls>` `<SlideDeck.ProgressBar>` `<SlideDeck.SlideNumber>` `<SlideDeck.Thumbnails>` (IntersectionObserver lazy + EC-13 fallback) `<SlideDeck.PresenterView>` (inline panel com timer + speaker notes) `<SlideDeck.FullscreenButton>` (cross-browser API + EC-8 iOS guard) `<SlideDeck.PrintButton>` (window.print + `@page` CSS, afterprint cleanup). Transitions CSS-only (`none`/`fade`/`slide`) com timeout fallback 300ms (D16/EC-3) e respeito a `prefers-reduced-motion`. Progressive fragments via Marpit-style `*` lists (D12, contagem por regex anti-falsos-positivos em `**bold**` ou fenced code). Speaker notes via `<!-- notes: ... -->` HTML comments (D11). Aceita `slides: string | SlideDeckSlide[]` (D4); split string via mdast `thematicBreak` reusando algoritmo do Slide D12 + strip global frontmatter primeiro (D15/EC-1 — evita phantom empty slide). `useReducer` state machine com `UPDATE_TOTAL_SLIDES` que clampa `currentIndex` (EC-4). Zero peer-deps novas — reusa as 7 do Slide. Bundle isolado em `dist/slide-deck/index.js` (~48 KB com Slide vendored); barrel principal `dist/index.js` **inalterado**. RFC `docs/rfcs/0003-slide-deck.md` status `Implemented`. 160 testes específicos do SlideDeck verdes. Stories Ladle: `DefaultDeck`, `WithGfmTable`, `WithSpeakerNotes`, `WithFragments`, `WithFadeTransition`, `WithSlideTransition`, `HashRouting`, `HeadlessLayout`, `WithThumbnails`, `PresenterModeOn`, `LargeDeck` (50 slides), `EmptyDeck`, `SingleSlideDeck`, `ControlledNavigation`. (#TBD)
- **Slide engine — view-only primitive funcional (2026-05-19)** — `@theokit/ui/slide` agora renderiza markdown + frontmatter YAML como surface temada com canvas lógico fixo (default 16:9 → 1280×720), espelhando o padrão de bundle isolado entregue pelo Whiteboard. Pipeline: `validateSlide` (async — D11) → `parseBody` (micromark + GFM) → `mdastToHast` (`allowDangerousHtml: false`) → `sanitizeHast` (`defaultSchema` sem extensões — D8, com diff de tag-count que emite `BANNED_TAG` — D13) → `hastToReact` (real React VDOM via `hast-util-to-jsx-runtime` — D9, **sem `dangerouslySetInnerHTML`**). Frontmatter YAML único (sem HTML comment syntax do Marpit — D4), validado com Zod `.strict()` (4 keys aceitos: `theme`, `lang`, `color`, `backgroundColor`). Multi-slide input (top-level `---` detectado via mdast `thematicBreak` — D12, sem false-positive em fenced code blocks) emite `MULTIPLE_SLIDES` e renderiza somente o primeiro slide. Input guards (D14): BOM strip, `aspectRatio` inválido → fallback 16:9 + `INVALID_ASPECT_RATIO`, raw frontmatter > 10 KB → `FRONTMATTER_TOO_LARGE`. Container fit (D7) via `useSlideFit` hook (algoritmo Reveal.js: `scale = clamp(min(W/cw, H/ch), minScale, maxScale)` em `ResizeObserver` callback). Dois temas built-in (`default`, `violet-forge`) via CSS variables `--theo-slide-*` layered sobre Violet Forge tokens, com `light-dark()` para dark mode automático. A11y: `<section role="region" aria-roledescription="slide" aria-label>`. Race-resistant re-parse via `versionRef` counter (EC-7). 7 markdown peer-deps são **opcionais**: `mdast-util-from-markdown`, `mdast-util-gfm`, `micromark-extension-gfm`, `mdast-util-to-hast`, `hast-util-sanitize`, `hast-util-to-jsx-runtime`, `yaml`. Bundle isolado em `dist/slide/index.js`; barrel principal `dist/index.js` **inalterado**. RFC `docs/rfcs/0002-slide.md` status `Implemented`. 12 Ladle stories: `HappyPath`, `GfmTable`, `WithFrontmatter`, `VioletForgeTheme`, `AspectFourByThree`, `MultiSlideTruncated`, `MalformedFrontmatter`, `BannedScript`, `LongContent`, `CustomComponents`, `SmallContainer`, `LargeContainer`. (#TBD)
- **Whiteboard engine — view-only primitive funcional (2026-05-18)** — `@theokit/ui/whiteboard` agora renderiza JSON declarativo (`WhiteboardData`) como SVG com estética hand-drawn estilo Excalidraw. **Sete tipos** de elemento suportados: `rect`, `ellipse`, `diamond`, `line`, `arrow`, `text`, `freedraw`. **Pan + zoom built-in** via `viewBox` (wheel = zoom-to-cursor, mouse drag = pan, Space = hand mode, pinch touch supported). **Prop `fitOnLoad`** centra automaticamente os elementos na viewport. Schema Zod com clamps de sanidade (EC-3 `.finite()` rejeita NaN/Infinity; EC-4 `.max(20000)` em dimensões; `.max(500)` em labels; `.max(5000)` em text e points/elements). `<Whiteboard>` valida JSON em `useMemo`, dispara `onValidationError` em `useEffect` (EC-6 — nunca durante render), e cai em SVG vazio com `data-whiteboard-state="invalid"` quando o JSON falha. SSR-safe (`renderToString` produz markup estático correto). `roughjs` + `perfect-freehand` são peer-deps **opcionais**; `zod` entra em `dependencies` regulares (EC-5 opção A). Bundle isolado em `dist/whiteboard/index.js` (21.53KB ESM); barrel principal `dist/index.js` **inalterado** (320.41KB). RFC `docs/rfcs/0001-whiteboard.md` status `Implemented`. 86 testes específicos do Whiteboard verdes + 776 testes totais do projeto. Stories Ladle: `Empty`, `Flowchart`, `Architecture`, `FreedrawSketch`, `MixedAll`, `InvalidJSON`. (#TBD)
- **`scripts/validate-bundle-size.ts` ganha gate EC-1 anti-leak** — Após o check de tamanho, faz `grep` em `dist/index.js` por strings `roughjs` e `perfect-freehand`; falha o build se qualquer engine peer-dep aparecer no barrel. Previne regressões silenciosas onde uma engine vaze para o barrel principal e arraste KBs extras para todos os consumers, mesmo os que só usam shadcn primitives. Runtime-metric proof: `grep -c "roughjs\\|perfect-freehand" dist/index.js → 0` confirmado em 2026-05-18. (#TBD)
- **`scripts/sync-exports.ts` ganha `ISOLATED_SUBPATHS`** — novo array de overrides para subpaths que devem apontar para `dist/<engine>/index.js` próprio, não re-export do barrel. Detecta colisão com auto-scanned subpaths e lança Error explícito. Suporta a regra de bundle isolation por engine declarada em `CLAUDE.md > Roadmap`. Cobertura via novo `scripts/sync-exports.test.ts` (6 testes). (#TBD)
- **`tsup.config.ts` ganha multi-entry** — `entry` agora é objeto com `index` (barrel) + `whiteboard/index` (engine). External list inclui `roughjs`, `/^roughjs\//` e `perfect-freehand` para garantir que o engine bundle não vendoriza essas libs e o barrel não vaza. Build produz `dist/whiteboard/index.{js,d.ts}` ao lado de `dist/index.{js,d.ts}` sem afetar tamanho do barrel. (#TBD)
- **`zod@4.4.3` em `dependencies`** + `roughjs ^4.6.0` / `perfect-freehand ^1.2.0` em `peerDependencies` com `peerDependenciesMeta.optional=true` — engine peer-deps são opt-in para o consumer que não importa o subpath; Zod é runtime dep regular para garantir que validação não crashe (decisão EC-5 opção A documentada em `.claude/knowledge-base/reviews/edge-cases/whiteboard-view-primitive-edge-cases-2026-05-18.md`). (#TBD)

- **Roadmap formalized (2026-05-18)** — 4 future engines / composites explicitly in scope: `Whiteboard` (Excalidraw-like primitive), `Slide` (Marp-like primitive), `SlideDeck` (composite that orchestrates `Slide` primitives), `Diagram` (Mermaid-like primitive). Each is Explorer (RFC) status, multi-quarter effort, will land via individual RFCs running the full quality-gate chain. Documented in `README.md` (`## Roadmap`) and `CLAUDE.md` (`## Roadmap (formalized 2026-05-18)`) with rules in force per engine: don't reinvent algorithmic cores (markdown / DSL parsing, graph layout, freedraw rendering use mature OSS deps), bundle isolation via subpath import (not main barrel), YAGNI gate (no engine ships without a documented consumer), Apache-2.0 compatible deps only. No version commitment — not on the 0.1 / 1.0 line.

## [0.1.0-next.0] - 2026-05-16

First public pre-release on npm under the `next` dist-tag. Install with
`pnpm add @theokit/ui@next` (the default `latest` tag is intentionally
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
  import { ThemeProvider } from "@theokit/ui";
  <ThemeProvider>...</ThemeProvider>

  // After — option A (recommended for parity with old behavior)
  import { ThemeProvider, builtinThemes } from "@theokit/ui";
  <ThemeProvider themes={builtinThemes}>...</ThemeProvider>

  // After — option B (new in v0.1.0-next.0)
  import { TheoUIProvider } from "@theokit/ui";
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
- **`PITCH.md`** — removed false claim that `npx create-theokit my-app` already imports `@theokit/ui` when picking the dashboard template (verified via `grep -r "@theokit/ui" /home/paulo/Projetos/usetheo/theokit/` returning zero matches). Replaced with honest "TheoKit integration is on the roadmap." Aligned tertiary CTAs with reality (substituted dead `docs.usetheo.dev/ui` with GitHub anchor).
- **`README.md`** — updated `pnpm quality:gates` pipeline listing to match `package.json#scripts['quality:gates']` exactly: now lists 11 gates (`format:check` → `lint:ci` → `typecheck` → `test` → `build` → `registry:build` → `registry:validate` → `quality:structure` → `quality:bundle` → `quality:a11y` → `ladle:build`). Previous text omitted `quality:bundle` and `quality:a11y`.
- **CHANGELOG correction** — earlier entry under "Phase 3 — Build correctness + exports surface" stated `validateExportsMap` "locks `package.json#exports` to the canonical 5-entry set". Since commit `77b2f7a` (`feat(exports): subpath import for every component`) the strategy expanded to 107+ subpath entries generated by `scripts/sync-exports.ts`. Authoritative source is `package.json` itself. Prior entries in versioned releases stay immutable per Keep a Changelog; this correction lives in `[Unreleased]`.

### Added (Pitch + Voice and Tone formalization, 2026-05-15)
- **`PITCH.md`** at project root — landing-page copy for `@theokit/ui` (Violet Forge) using the TheoKit aspirational voice. Three layers: HERO (no jargon), BODY (benefit-first with one technical anchor per item), DEEP DIVE (full technical vocabulary, after the `## How it works` delimiter). Companion to `README.md` for marketing surfaces; verified component counts and quality metrics against `README.md` and `src/`.
- **`CLAUDE.md`** at project root — contract between Claude and this project. Defines what TheoUI is, the locked names (npm package, theme names, registry endpoint, module format, component taxonomy), the Voice and Tone section that formalizes adoption of the TheoKit aspirational voice for public copy (strategic review dated 2026-05-15), the relationship to the other Theo pillars (Harness, Skills, Runtime), and the quality-gate non-bypass rule.

### Changed (Cross-project, 2026-05-15)
- Root monorepo `CLAUDE.md` (`../CLAUDE.md`) `## Voice and Tone — sub-project scoped` section: TheoUI moved from the "technical-direct only" list to the aspirational-voice list, alongside TheoKit and TheoKit-SDK. Rationale captured inline (TheoUI is the visual surface every other product inherits from; benefits from outcome-shaped framing on landing copy).
- Root monorepo sub-project index: `theo-ui` "Read first" pointer updated from `theo-ui/README.md` to `theo-ui/CLAUDE.md` (was a fallback because no `CLAUDE.md` existed in this project until today).

### Changed (README alignment with PITCH, 2026-05-15)
- `README.md` HERO + BODY layers rewritten in the TheoKit aspirational voice to match `PITCH.md`. New h1: *"The UI your agent already needs."* Tagline calls out the 102 agent-shaped components. `@theokit/ui` demoted from h1 to a small tag above it (discoverability preserved without dominating the HERO).
- Added `## The shift` storytelling block between the HERO and `## Why @theokit/ui`.
- `## Why @theokit/ui` now closes with the comparison table from `PITCH.md` (`@theokit/ui` vs shadcn/Radix, Tremor, build-yourself) and the punch line *"Same Radix UI underneath as shadcn — no philosophy fight. We just shipped the next 102 components you were about to write."*
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
- `src/styles/fonts-cdn.css` (NEW) — opt-in entrypoint that preserves the legacy Google Fonts CDN behavior. Consumers who prefer not to host static assets can `@import "@theokit/ui/fonts-cdn.css"` instead of `@theokit/ui/fonts.css` / `@theokit/ui/styles.css`.
- `tsup.config.ts` `onSuccess` now also copies `src/styles/fonts/*.woff2` → `dist/fonts/` and `src/styles/fonts-cdn.css` → `dist/fonts-cdn.css`. The relative URLs in `fonts.css` (`./fonts/geist-400.woff2`) resolve correctly inside `node_modules/@theokit/ui/dist/`.
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
- **Reclassification of 7 components from `primitives/` to `composites/`** (BLOCKER-001 remediation, D2): `AgentEditor`, `RuleEditor`, `SkillEditor`, `ApprovalCard`, `CronJobsList`, `SkillsList`, `MCPServerList`. Each value-imported one or more sibling primitives, which violated the mechanical taxonomy rule in `docs/architecture.md`. They are composites by every reasonable definition (FormField+Input+Button = composite; list-of-card = composite). Public barrel (`@theokit/ui`) is unchanged — named exports preserved. Registry consumers via `npx shadcn add`: `type` changed from `registry:ui` to `registry:block` and `target` from `components/ui/<name>` to `components/blocks/<name>`. Migration: re-run `npx shadcn add <name>` to relocate the file, or rename the import path manually.
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
