<div align="center">

<img src="https://usetheo.dev/logo-128.webp" alt="Theo" width="96" height="96" />

**`@usetheo/ui`**

# The UI your agent already needs.

A React component library built for AI agent surfaces and PaaS dashboards. **102 components** designed for what you'd otherwise build from scratch.

*Editorial typography. Three runtime-swappable themes. shadcn-compatible registry. Apache-2.0.*

<!-- BEGIN:counts -->
[![license](https://img.shields.io/badge/license-Apache--2.0-7C3AED?style=flat-square)](./LICENSE)
[![react](https://img.shields.io/badge/react-18+-7C3AED?style=flat-square&logo=react&logoColor=white)](https://react.dev)
[![tests](https://img.shields.io/badge/tests-514%20passing-success?style=flat-square)](#quality-gates)
[![components](https://img.shields.io/badge/components-101-7C3AED?style=flat-square)](#component-catalog)
[![shadcn](https://img.shields.io/badge/shadcn-compatible-000?style=flat-square)](https://ui.shadcn.com/docs/registry)
<!-- END:counts -->

[Quickstart](#quickstart) · [Components](#component-catalog) · [Themes](#themes) · [Design System](./docs/design-system.md) · [Quality Gates](./docs/quality-gates.md) · [Contributing](./CONTRIBUTING.md) · [Security](./SECURITY.md)

</div>

---

## The shift

There is a version of your product where the agent UI is half-built before you start.

The chat thread, the tool calls, the streaming assistant message, the model selector, the cost meter, the context window indicator, the audit log row, the permission modal, the deployment status, the build log stream — all rendered. All themed. All accessible. You write product logic. The interface ships with you.

## Why `@usetheo/ui`

Most component libraries optimize for marketing pages. `@usetheo/ui` is built for the surfaces that AI agents and PaaS dashboards actually need — surfaces where transparency, density of information, and developer trust matter more than hero sections.

- **Built for AI agents.** Primitives for skills, cron jobs, permission matrices, MCP servers, memory editing, hook config, audit logs, model cards, token usage charts, sub-agent dispatch — the components a transparent agent UI actually needs.
- **Built for PaaS.** Composites for project cards, deployment rows, build log streams, env var editors, domain config, preview environments, rollback flows, metrics panels.
- **Themeable at runtime.** Ship three themes out of the box, swap them live via `<ThemeProvider />`, or define your own.
- **shadcn-compatible registry.** Copy individual components into your project (`npx shadcn add …`) or install the whole package — your call.
- **Framework-agnostic.** Peer-deps on React only. Works under Vite, Next, Remix, Astro, Tanstack Start.

The agent UI gap is real — most teams reach for shadcn for the primitives and build the agent-specific parts from scratch, losing weeks before shipping a real surface.

| Surface need | `@usetheo/ui` | shadcn / Radix | Tremor | Build it yourself |
|---|---|---|---|---|
| Generic primitives (Button, Card, Dialog) | **Yes** (same Radix foundation) | Yes | Limited | Slow |
| Agent-specific primitives (`AgentEvent`, `ToolCall`, `MCPServerCard`) | **Yes — 81 of them** | None | None | Weeks |
| PaaS-specific composites (`DeploymentRow`, `BuildLogStream`, `RollbackUI`) | **Yes — 21 of them** | None | None | Weeks |
| Three runtime-swappable themes | **Built-in** | DIY | DIY | DIY |
| shadcn-compatible registry | **Yes** | Original | No | N/A |
| ESM-only, tree-shake via barrel | **Yes** | Yes | Yes | DIY |
| a11y enforced as a quality gate | **Yes** — vitest-axe on 126 stories | Per-component, manual | Manual | Often skipped |

Same Radix UI underneath as shadcn — no philosophy fight. We just shipped the next 102 components you were about to write.

## What you'd build

- **Coding assistant interface.** Chat thread, streaming assistant, tool-call timeline, file diff viewer, permission matrix, sub-agent dispatch.
- **Agent dashboard.** Run stats, session timeline, MCP server admin, cron job scheduler, memory editor, audit log, model card, cost meter.
- **PaaS dashboard.** Project switcher, deployment row, build log stream, env var editor, domain config, preview environments, rollback flows, metrics panels.
- **Internal AI tools.** Quick-action chips, intent selector, system-prompt editor, skill manager, rule editor, lane board.
- **Onboarding & auth surfaces.** Login split, social auth row, folder selector, recent folders list, project card.

---

## How it works

Below this line, full technical vocabulary is in play. Installation, themes, the component catalog, design system, quality gates.

## Quickstart

### Option A — install the package

```bash
pnpm add @usetheo/ui
```

```css
/* app entrypoint */
@import "@usetheo/ui/tokens.css";
@import "@usetheo/ui/styles.css";
```

```tsx
import { ThemeProvider, AgentEvent, ToolCall, DeploymentRow } from "@usetheo/ui";

export default function App() {
  return (
    <ThemeProvider defaultTheme="violet-forge" defaultMode="dark">
      <AgentEvent kind="thinking" text="Reading repository structure..." />
      <ToolCall name="readFile" status="completed" />
      <DeploymentRow status="ready" env="production" branch="main" />
    </ThemeProvider>
  );
}
```

### Option B — copy individual components (shadcn-style)

```bash
npx shadcn@latest add https://ui.usetheo.dev/r/button.json
npx shadcn@latest add https://ui.usetheo.dev/r/deployment-row.json
```

Every item under [`registry/r/`](./registry/r) is a standalone copy-paste unit with its dependencies declared.

**Precondition.** Copy-paste install requires `@/` configured as a path alias in your `tsconfig.json` (`{ "paths": { "@/*": ["./src/*"] } }`) — the shadcn-ui 2.0 convention. Inlined source uses `@/lib/cn` and similar `@/components/ui/...` imports. If your project uses a different alias (Vite default `~/`, etc.), either add the `@/` mapping or rewrite the imports after copy-paste. The shipped `registry/index.json` declares this requirement under `metadata.requires.tsconfigPathAlias`.

### SSR (Next.js / Astro / Remix)

Inject `<ThemeScript>` in `<head>` to prevent FOUC and hydration mismatch:

```tsx
import { ThemeProvider, ThemeScript } from "@usetheo/ui";

<html lang="en" suppressHydrationWarning>
  <head>
    <ThemeScript defaultTheme="violet-forge" defaultMode="dark" />
  </head>
  <body>
    <ThemeProvider defaultTheme="violet-forge" defaultMode="dark">
      {children}
    </ThemeProvider>
  </body>
</html>
```

---

## Component catalog

<!-- BEGIN:component-catalog-intro -->
**101 components**, organized by mechanical rule: a *primitive* imports no other `@usetheo/ui` component; a *composite* does.
<!-- END:component-catalog-intro -->

<details>
<summary>
<!-- BEGIN:primitives-count -->
**Primitives** (80) — building blocks
<!-- END:primitives-count -->
</summary>

<!-- BEGIN:primitives -->
`AgentErrorCard` · `AgentEvent` · `AgentHandoff` · `AgentProfile` · `AgentStartingState` · `AgentStreaming`
`ArtifactPreview` · `AttachmentChip` · `AuditLogEntry` · `AutoCompactNotice` · `Avatar` · `Badge`
`BrowserControls` · `BuildLogStream` · `Button` · `CapabilityIndicator` · `Card` · `ChatMessage`
`ChatThread` · `Checkbox` · `ContextCard` · `ContextWindowBar` · `CostMeter` · `CreatedFilesCard`
`CronJobCard` · `Dialog` · `DiffViewer` · `EmptyState` · `FolderContextCard` · `FolderSelector`
`FormField` · `HookConfig` · `HookEventLog` · `Input` · `IntentSelector` · `Label`
`LaneBoard` · `LoginSplit` · `MCPServerCard` · `MemoryEditor` · `MentionMenu` · `MetricsPanel`
`ModelCard` · `ModelSelector` · `PermissionMatrix` · `ProgressChecklist` · `ProjectSwitcher` · `QuickActionChips`
`RadioGroup` · `RecentFoldersList` · `RuleCard` · `RunStats` · `RunningTasksPanel` · `ScrollArea`
`Select` · `SessionListItem` · `SessionTimeline` · `Sheet` · `Sidebar` · `Skeleton`
`SkillCard` · `SocialAuthRow` · `StepsRail` · `SubAgentDispatch` · `Switch` · `SystemPromptEditor`
`Tabs` · `TaskNode` · `TaskPlan` · `TerminalPanel` · `Textarea` · `Toast`
`Toaster` · `TokenUsageChart` · `ToolCall` · `ToolCallCard` · `ToolResult` · `ToolsList`
`Tooltip` · `TopNav`
<!-- END:primitives -->

</details>

<details>
<summary>
<!-- BEGIN:composites-count -->
**Composites** (21) — assembled flows
<!-- END:composites-count -->
</summary>

<!-- BEGIN:composites -->
`AgentComposer` · `AgentEditor` · `AgentStream` · `AgentTimeline` · `ApprovalCard` · `ChatComposer` · `CommandPalette` · `CronJobsList` · `DeploymentRow` · `DomainConfig` · `EnvVarEditor` · `MCPServerList` · `PermissionModal` · `PreviewEnvCard` · `PreviewPanel` · `ProjectCard` · `RollbackUI` · `RuleEditor` · `SkillEditor` · `SkillsList` · `TaskHeader`
<!-- END:composites -->

</details>

Browse them all in **Ladle**:

```bash
pnpm dev   # http://localhost:61000
```

There's also a playground app for full-page demos:

```bash
pnpm playground   # http://localhost:5180
```

---

## Themes

Three themes ship out of the box, all driven by HSL-split CSS variables. Swap at runtime with `<ThemeProvider />` + `<ThemeSwitcher />`.

| Theme | Vibe | Primary | Accent |
|---|---|---|---|
| `violet-forge` *(default)* | Editorial dark, AI workspace energy | Theo violet `#7C3AED` | Burnt sienna `#C96442` |
| `classic-paper` | Warm light, document-first reading | Indigo `#2563EB` | Amber `#F59E0B` |
| `aurora-terminal` | High-contrast dev terminal feel | Cyan-aurora `#3DD9D6` | Aurora pink `#FF5C8A` |

```tsx
import { ThemeProvider, ThemeSwitcher, builtinThemes } from "@usetheo/ui";

<ThemeProvider defaultTheme="violet-forge" themes={builtinThemes}>
  <ThemeSwitcher />
  {/* your app */}
</ThemeProvider>
```

Define your own theme by extending `Theme` from `@usetheo/ui` — see [`docs/design-system.md`](./docs/design-system.md).

---

## Design system: Violet Forge

| Token | Light | Dark |
|---|---|---|
| Primary (Theo violet) | `#7C3AED` | `#7C3AED` |
| Accent (burnt sienna) | `#C96442` | `#C96442` |
| Background | `#FFFFFF` pure white (Vercel-style) | `#0A0A0A` charcoal |
| Display font | **Geist Sans** | **Geist Sans** |
| Body font | **Geist Sans** | **Geist Sans** |
| Mono | **Geist Mono** | **Geist Mono** |

**Type scale (Vercel-inspired):** `64 / 48 / 40 / 32 / 28 / 24 / 20 / 18 / 15 / 14 / 12` px.

Full spec: [`docs/design-system.md`](./docs/design-system.md). Visual audit of competitors (Vercel, Railway, Render, Fly.io, Netlify, Coolify): [`docs/design-audit.md`](./docs/design-audit.md).

### Self-hosting fonts

By default `@usetheo/ui/styles.css` `@import`s Geist + Geist Mono from `fonts.googleapis.com`. For GDPR-sensitive deployments or strict CSP environments, self-host instead:

1. Download Geist from [Vercel](https://vercel.com/font) (or the `geist` npm package).
2. Drop the assets into your `public/fonts/` folder.
3. In your app's global CSS, comment the `@usetheo/ui/styles.css` `@import` rule for Google Fonts (or import `@usetheo/ui/tokens.css` only) and add your own `@font-face` blocks for `Geist` and `Geist Mono`.

The CSS variables (`--font-body`, `--font-display`, `--font-mono`) are already wired to consume whichever `@font-face` rules are present — no component changes needed.

---

## Quality Gates

Every change is validated through a strict chain — no PR ships otherwise.

```bash
pnpm quality:gates
```

Runs in order: `format:check` → `lint:ci` → `typecheck` → `test` → `build` → `registry:build` → `registry:validate` → `quality:structure` → `quality:bundle` → `quality:a11y` → `ladle:build`.

The structural validator ([`scripts/validate-quality-gates.ts`](./scripts/validate-quality-gates.ts)) enforces taxonomy (primitive vs composite by import graph), registry/test/story presence per item (test gate is **hard-fail**), public-export surface, design-system fidelity (Geist fonts + Vercel type scale), governance files (LICENSE + CHANGELOG), README ↔ exports drift, docs typography drift, composite-via-barrel imports, compound-pattern uniformity (`Object.assign /*#__PURE__*/`), README/architecture census consistency, vitest-axe coverage on ≥30 interactive primitives, and zero stray `*.bak` / `*.json.tmp` artifacts in the working tree. Full spec: [`docs/quality-gates.md`](./docs/quality-gates.md).

---

## Development

```bash
pnpm install
pnpm dev               # Ladle component preview (http://localhost:61000)
pnpm playground        # Full-page demo app (http://localhost:5180)
pnpm test              # Vitest (vitest run)
pnpm test:watch        # Vitest watch mode
pnpm test:coverage     # Vitest with coverage report
pnpm typecheck         # tsc --noEmit
pnpm lint              # Biome check
pnpm lint:fix          # Biome check --write
pnpm build             # tsup → dist/
pnpm registry:build    # registry/*.json → registry/r/*.json
pnpm sync:readme       # Regenerate README counts + catalog from source
pnpm test:registry     # Fixture install test (registry copy-paste check)
pnpm quality:gates     # full chain
```

---

## Architecture

```
src/
  components/
    primitives/    atomic building blocks (no internal @usetheo/ui deps)
    composites/    assembled flows (compose primitives via barrel imports)
  foundations/     Ladle stories for colors, typography, spacing, elevation, motion
  themes/          ThemeProvider, ThemeScript, ThemeSwitcher, 3 themes
  styles/          tokens.css, fonts.css, global.css
  lib/             cn, types
  test/            Vitest setup (with happy-dom polyfills)
.ladle/            Ladle config
registry/          shadcn-compatible registry descriptors (input)
  r/               built registry items (output of registry:build)
scripts/           build-registry, validate-registry, sync-readme, validate-quality-gates
docs/              design-system, quality-gates, architecture, design-audit
tests/             fixture-shadcn-app/ (registry install integration test)
```

---

## Bundle & module format

- **ESM-only** — `@usetheo/ui` ships a single `dist/index.js` (ESM) plus
  per-component `dist/components/.../index.d.ts` type declarations. No CJS
  build. Consumers running on CommonJS Node need to transpile or use a
  bundler. This is intentional: the four-pillar audience (modern Vite,
  Next 14+, Astro, Remix) is ESM-first.
- **Tree-shaking via the barrel** — modern bundlers (Vite, esbuild, Rollup,
  webpack 5, Bun) read the `sideEffects: ["**/*.css"]` hint and tree-shake
  unused components from the barrel import (`import { Button } from
  "@usetheo/ui"` drops every other component from the final bundle). No
  per-component subpath exports are needed for this to work.
- **Subpath imports are aliases (not separate bundles).** `package.json#exports`
  publishes 99 component subpaths (`@usetheo/ui/button`, `@usetheo/ui/agent-event`,
  …). Every subpath resolves to the same `dist/index.js`. tsup is configured with
  `splitting: false` deliberately — a 99-entry split would duplicate shared code
  (cn, types, Radix runtime) into every chunk and inflate the tarball. Subpath
  imports exist for IDE intellisense and import organization. Modern bundlers
  tree-shake the same way whether you write `import { Button } from "@usetheo/ui"`
  or `import { Button } from "@usetheo/ui/button"`. Runtimes that don't tree-shake
  (Jest classic, Node REPL, raw browser ESM) will load the full barrel either way
  — accept that cost or pre-bundle with the consumer's tooling.
- **CSS distribution** — `dist/styles.css` is the recommended single import
  (combines tokens, fonts self-hosted, Tailwind base/components/utilities).
  `@usetheo/ui/tokens.css`, `@usetheo/ui/fonts.css`, and
  `@usetheo/ui/fonts-cdn.css` (opt-in) are available for finer control.
- **Self-hosted fonts** — Geist Sans + Geist Mono ship as woff2 under
  `dist/fonts/` (~290 KB total). Opt into Google Fonts CDN with
  `@import "@usetheo/ui/fonts-cdn.css"` instead of the default if you
  prefer not to host static assets.

---

## Status

Honest claims only.

- **Production.** 102 components, 453 tests passing, zero a11y violations on 126 Ladle stories, bundle size enforced. Quality gates run on every PR.
- **Registry distribution.** Artifacts shipped at `registry/r/*.json` in this repo; canonical `ui.usetheo.dev/r/*.json` URL is the planned distribution target.
- **ESM-only.** Modern bundlers only. Consumers on CommonJS Node need to transpile or use a bundler.
- **Component count is the floor, not the ceiling.** New agent and PaaS surfaces ship through PRs; every addition runs the same quality gates.

## License

[Apache-2.0](./LICENSE) © [usetheo.dev](https://usetheo.dev)

## Community

- Discord: https://discord.usetheo.dev/
- X: https://x.com/usetheodev
- LinkedIn: https://linkedin.com/company/usetheodev
