<div align="center">

<img src="https://usetheo.dev/logo-128.webp" alt="Theo" width="96" height="96" />

# `@usetheo/ui`

**Violet Forge** — a framework-agnostic React component library for AI agents and developer tools.

Editorial typography. Dark-first violet palette. Burnt-sienna accents. Runtime-swappable themes.

[![license](https://img.shields.io/badge/license-Apache--2.0-7C3AED?style=flat-square)](./LICENSE)
[![react](https://img.shields.io/badge/react-18+-7C3AED?style=flat-square&logo=react&logoColor=white)](https://react.dev)
[![tests](https://img.shields.io/badge/tests-162%20passing-success?style=flat-square)](#quality-gates)
[![components](https://img.shields.io/badge/components-84-7C3AED?style=flat-square)](#component-catalog)
[![shadcn](https://img.shields.io/badge/shadcn-compatible-000?style=flat-square)](https://ui.shadcn.com/docs/registry)

[Quickstart](#quickstart) · [Components](#component-catalog) · [Themes](#themes) · [Design System](./docs/design-system.md) · [Quality Gates](./docs/quality-gates.md)

</div>

---

## Why `@usetheo/ui`

Most component libraries optimize for marketing pages. `@usetheo/ui` is built for the surfaces that AI agents and PaaS dashboards actually need — surfaces where transparency, density of information, and developer trust matter more than hero sections.

- **Built for AI agents.** Primitives for skills, cron jobs, permission matrices, MCP servers, memory editing, hook config, audit logs, model cards, token usage charts, sub-agent dispatch — the components a transparent agent UI actually needs.
- **Built for PaaS.** Composites for project cards, deployment rows, build log streams, env var editors, domain config, preview environments, rollback flows, metrics panels.
- **Themeable at runtime.** Ship three themes out of the box, swap them live via `<ThemeProvider />`, or define your own.
- **shadcn-compatible registry.** Copy individual components into your project (`npx shadcn add …`) or install the whole package — your call.
- **Framework-agnostic.** Peer-deps on React only. Works under Vite, Next, Remix, Astro, Tanstack Start.

---

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
import { Button, ThemeProvider } from "@usetheo/ui";

export default function App() {
  return (
    <ThemeProvider defaultTheme="violet-forge">
      <Button>Deploy</Button>
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

---

## Component catalog

**84 components**, organized by mechanical rule: a *primitive* imports no other `@usetheo/ui` component; a *composite* does.

<details>
<summary><b>Primitives</b> (72) — building blocks</summary>

**Form & input** · `Button` `Input` `Textarea` `Select` `Checkbox` `RadioGroup` `Switch` `Label` `FormField`

**Surface** · `Card` `Dialog` `Tabs` `Tooltip` `ScrollArea` `Badge` `Skeleton` `EmptyState` `Avatar`

**App chrome** · `Sidebar` `TopNav` `Toast` / `Toaster` / `useToast`

**Agent transparency** · `SkillCard` `CronJobCard` `CronJobsList` `PermissionMatrix` `ToolPalette` `MCPServerCard` `MCPServerList` `MemoryEditor` `ModelCard` `ModelSelector` `HookConfig` `HookEventLog` `CapabilityIndicator` `SessionTimeline` `AuditLogEntry` `TokenUsageChart` `AutoCompactNotice` `AgentHandoff` `AgentProfile` `AgentStartingState` `AgentEvent` `SubAgentDispatch` `LaneBoard` `RunStats` `CostMeter` `ContextWindowBar` `ContextCard`

**Chat & cowork** · `ChatMessage` `ChatThread` `AttachmentChip` `QuickActionChips` `ArtifactPreview` `BrowserControls` `FolderContextCard` `FolderSelector` `RecentFoldersList` `CreatedFilesCard` `ProgressChecklist` `RunningTasksPanel`

**Code workspace** · `DiffViewer` `TerminalLine` `TerminalPane` `TaskBreadcrumbs` `TaskStatusPill` `ShellCommandCard`

**PaaS metrics** · `BuildLogStream` `MetricsPanel` (and friends below as composites)

</details>

<details>
<summary><b>Composites</b> (12) — assembled flows</summary>

`AgentTimeline` · `ChatComposer` · `CommandPalette` · `DeploymentRow` · `DomainConfig` · `EnvVarEditor` · `PermissionModal` · `PreviewEnvCard` · `PreviewPanel` · `ProjectCard` · `RollbackUI` · `TaskHeader`

</details>

Browse them all in **Ladle**:

```bash
pnpm dev   # http://localhost:61000
```

---

## Themes

Three themes ship out of the box, all driven by HSL-split CSS variables. Swap at runtime with `<ThemeProvider />` + `<ThemeSwitcher />`.

| Theme | Vibe | Primary | Accent |
|---|---|---|---|
| `violet-forge` *(default)* | Editorial dark, AI workspace energy | Theo violet `#7C3AED` | Burnt sienna `#C96442` |
| `classic-paper` | Warm light, document-first reading | Theo violet | Burnt sienna |
| `aurora-terminal` | High-contrast dev terminal feel | Mint `#3FE0A0` | Magenta `#FF4D8D` |

```tsx
import { ThemeProvider, ThemeSwitcher } from "@usetheo/ui";

<ThemeProvider defaultTheme="violet-forge">
  <ThemeSwitcher />
  {/* your app */}
</ThemeProvider>
```

Define your own theme by extending `Theme` from `@usetheo/ui` — see [`docs/design-system.md`](./docs/design-system.md).

---

## Design system: Violet Forge

| Token | Light (`classic-paper`) | Dark (`violet-forge`) |
|---|---|---|
| Primary (Theo violet) | `#7C3AED` | `#7C3AED` |
| Accent (burnt sienna) | `#C96442` | `#C96442` |
| Background | `#FAF9F7` warm off-white | `#0E0B14` charcoal violet-tinted |
| Display font | **Geist Sans** | **Geist Sans** |
| Body font | **Geist Sans** | **Geist Sans** |
| Mono | **Geist Mono** | **Geist Mono** |

**Type scale (Vercel-inspired):** `64 / 48 / 40 / 32 / 28 / 24 / 20 / 18 / 15` px.

Full spec: [`docs/design-system.md`](./docs/design-system.md). Visual audit of competitors (Vercel, Railway, Render, Fly.io, Netlify, Coolify): [`docs/design-audit.md`](./docs/design-audit.md).

---

## Quality Gates

Every change is validated through a strict chain — no PR ships otherwise.

```bash
pnpm quality:gates
```

Runs in order: `format:check` → `lint:ci` → `typecheck` → `test` → `build` → `registry:build` → `registry:validate` → `quality:structure` → `ladle:build`.

The structural validator ([`scripts/validate-quality-gates.ts`](./scripts/validate-quality-gates.ts)) enforces taxonomy (primitive vs composite by import graph), registry/test/story presence per item, public-export surface, and design-system fidelity (Geist fonts + Vercel type scale). Full spec: [`docs/quality-gates.md`](./docs/quality-gates.md).

**Current status:** 162/162 tests passing · 33 registry items validated · zero lint errors.

---

## Development

```bash
pnpm install
pnpm dev               # Ladle component preview (http://localhost:61000)
pnpm test              # Vitest (vitest run)
pnpm test:watch        # Vitest watch mode
pnpm typecheck         # tsc --noEmit
pnpm lint              # Biome check
pnpm lint:fix          # Biome check --write
pnpm build             # tsup → dist/
pnpm registry:build    # registry/*.json → registry/r/*.json
pnpm quality:gates     # full chain
```

---

## Architecture

```
src/
  components/
    primitives/    72 building blocks (no internal deps)
    composites/    12 assembled flows
  foundations/     Ladle stories for colors, typography, spacing, elevation, motion
  themes/          ThemeProvider, ThemeSwitcher, 3 themes
  styles/          tokens.css, fonts.css, global.css
  lib/             cn, types
  test/            Vitest setup (with happy-dom polyfills)
.ladle/            Ladle config
registry/          shadcn-compatible registry descriptors (input)
  r/               built registry items (output of registry:build)
scripts/           build-registry, validate-registry, validate-quality-gates
docs/              design-system, quality-gates, architecture, design-audit
```

---

## Roadmap

- [x] Reorganization & visual audit of 6 PaaS competitors
- [x] Violet Forge design system
- [x] shadcn-compatible registry
- [x] 72 primitives (form, surface, app chrome, agent transparency, chat & cowork, code workspace)
- [x] 12 PaaS composites
- [x] Theme system (3 themes, runtime-swappable)
- [x] Quality Gates with structural enforcement
- [ ] Preview in `theo-agents` integration
- [ ] First public release on npm
- [ ] Per-component docs site

---

## License

[Apache-2.0](./LICENSE) © [usetheo.dev](https://usetheo.dev)
