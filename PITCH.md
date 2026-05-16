<!--
Pitch copy for @usetheo/ui (Violet Forge) landing page.
Voice: TheoKit aspirational voice (extended to TheoUI 2026-05-15 via strategic review — see ../CLAUDE.md and ./CLAUDE.md).
Three layers: HERO (no jargon), BODY (benefit-first, one technical anchor per item), DEEP DIVE (full technical vocabulary, after the "## How it works" delimiter).
Every named component, count, and quality metric is verified against README.md and src/.
Restructure 2026-05-16 (PITCH Audit): "Built for surfaces nobody else builds for" + "The shift" fused into single bridge section (eliminated redundancy). Long list of 11 components on the bridge shortened. Quality gates paragraph (line ~164) broken into list. "Where this fits" rewritten to use the locked funnel (TheoCode → TheoCreate/TheoKit → Theo PaaS) instead of the deprecated four-pillar framing (UI/Harness/Skills/Runtime). Status of Theo PaaS aligned with founder decision (production, 2026-05-16).
-->

# The UI your agent already needs.

### 102 React components for AI agent surfaces and PaaS dashboards — the ones you'd otherwise build from scratch.

*Editorial typography. Three runtime-swappable themes. shadcn-compatible registry. Apache-2.0.*

**102 components (81 primitives + 21 composites) · 453 tests passing · 126 Ladle stories · zero a11y violations · ESM-only · Apache-2.0**

---

## Surfaces nobody else builds for

Other libraries ship `Button` and `Card`. We shipped `AgentEvent`, `ToolCall`, `DeploymentRow`, `BuildLogStream`, and 98 others.

Generic primitives optimize for marketing pages. `@usetheo/ui` is built for the surfaces agents and dashboards actually need. You write product logic. We ship the interface.

## What you get

- **102 components, agent-shaped.** 81 primitives (`AgentEvent`, `ChatMessage`, `ToolCall`, `MCPServerCard`, `MemoryEditor`, `PermissionMatrix`, `TokenUsageChart`, `ContextCard`, `SkillCard`, `RunStats`, …) and 21 composites (`AgentComposer`, `ChatComposer`, `DeploymentRow`, `EnvVarEditor`, `RollbackUI`, `CommandPalette`, `PermissionModal`, …). No `Button`-shaped libraries pretending to fit agent surfaces.
- **Three themes, runtime-swappable.** Violet Forge (dark, AI workspace energy), Classic Paper (warm light, document-first), Aurora Terminal (high-contrast dev). Swap live via `<ThemeProvider />`. Or define your own — HSL-split CSS variables, no fork required.
- **Copy-paste OR install.** `npx shadcn add` to copy a single component into your repo, or `pnpm add @usetheo/ui` for the whole package. Same registry powers both paths.
- **Framework-agnostic.** React peer-deps only. Drop into Vite, Next 14+, Remix, Astro, Tanstack Start.
- **Quality-gated, not promised.** 453 tests passing. Zero a11y violations across 126 Ladle stories asserted by axe-core. Bundle size enforced ±5% of baseline. Structural taxonomy enforced. No PR ships otherwise.

## Feel it

```tsx
import { ThemeProvider, AgentEvent, ToolCall, DeploymentRow } from "@usetheo/ui";
import "@usetheo/ui/tokens.css";
import "@usetheo/ui/styles.css";

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

Three components. Three primitives nobody else ships. Themed by default.

## What you'd build

- **Coding assistant interface.** Chat thread, streaming assistant, tool-call timeline, file diff viewer, permission matrix, sub-agent dispatch. Everything Cursor and Claude Code surface.
- **Agent dashboard.** Run stats, session timeline, MCP server admin, cron job scheduler, memory editor, audit log, model card, cost meter, token usage chart.
- **PaaS dashboard.** Project switcher, deployment row, build log stream, env var editor, domain config, preview environments, rollback flows, metrics panels.
- **Internal AI tools.** Quick-action chips, intent selector, system-prompt editor, skill manager, rule editor, lane board.
- **Onboarding & auth surfaces.** Login split, social auth row, folder selector, recent folders list, project card.

## Why @usetheo/ui

The agent UI gap is real. Most teams reach for shadcn for the primitives and then build the agent-specific parts from scratch — losing weeks before shipping a real surface.

| Surface need | `@usetheo/ui` | shadcn / Radix | Tremor | Build it yourself |
|---|---|---|---|---|
| **Frame** | The UI your agent already needs | "Copy-paste components" | "Dashboard primitives" | (you) |
| Generic primitives (Button, Card, Dialog) | **Yes** (same Radix foundation) | Yes | Limited | Slow |
| Agent-specific primitives (`AgentEvent`, `ToolCall`, `MCPServerCard`) | **Yes — 81 of them** | None | None | Weeks |
| PaaS-specific composites (`DeploymentRow`, `BuildLogStream`, `RollbackUI`) | **Yes — 21 of them** | None | None | Weeks |
| Three runtime-swappable themes | **Built-in** | DIY | DIY | DIY |
| shadcn-compatible registry | **Yes** | Original | No | N/A |
| ESM-only, tree-shake via barrel | **Yes** | Yes | Yes | DIY |
| a11y enforced as a quality gate | **Yes** — vitest-axe on 126 stories | Per-component, manual | Manual | Often skipped |

Same Radix UI underneath as shadcn — no philosophy fight. We just shipped the next 102 components you were about to write — real components for real agent surfaces, not yet another button library.

## Why now

Agent surfaces emerged as a UI category in 2026. The components nobody had a name for last year — `ToolCall`, `AgentEvent`, `MCPServerCard` — are now the building blocks of every agent product.

---

## How it works

> Below this line, full technical vocabulary is in play.

### Install — two paths

```bash
pnpm add @usetheo/ui
```

```tsx
import { Button, ThemeProvider } from "@usetheo/ui";
import "@usetheo/ui/tokens.css";
import "@usetheo/ui/styles.css";

<ThemeProvider defaultTheme="violet-forge" defaultMode="dark">
  <Button>Deploy</Button>
</ThemeProvider>;
```

Or copy individual components shadcn-style:

```bash
npx shadcn@latest add https://ui.usetheo.dev/r/button.json
npx shadcn@latest add https://ui.usetheo.dev/r/deployment-row.json
```

Every item in [`registry/r/`](./registry/r) is a standalone copy-paste unit with declared `registryDependencies`. The Tailwind preset (`registry/tailwind-preset.json`) ships the Violet Forge tokens and is a dependency of every UI / block item — so copy-paste consumers get the full typescale and color system, not just the markup.

### SSR (Next.js / Astro / Remix)

Inject `<ThemeScript />` in `<head>` to prevent FOUC and hydration mismatch:

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

### Themes

| Theme | Vibe | Primary | Accent |
|---|---|---|---|
| `violet-forge` *(default)* | Editorial dark, AI workspace energy | Theo violet `#7C3AED` | Burnt sienna `#C96442` |
| `classic-paper` | Warm light, document-first reading | Indigo `#2563EB` | Amber `#F59E0B` |
| `aurora-terminal` | High-contrast dev terminal feel | Cyan-aurora `#3DD9D6` | Aurora pink `#FF5C8A` |

Define your own by extending `Theme` from `@usetheo/ui`. HSL-split CSS variables drive every component. Full spec: [`docs/design-system.md`](./docs/design-system.md).

### Taxonomy — mechanical, not subjective

Components split by a single rule:

- **Primitive** — imports no other `@usetheo/ui` component. 81 of these.
- **Composite** — depends on one or more primitives via the barrel. 21 of these.

Enforced by [`scripts/validate-quality-gates.ts`](./scripts/validate-quality-gates.ts). Cross-imports across the boundary fail the gate.

### Bundle & module format

- **ESM-only.** Single `dist/index.js` (ESM) + per-component `.d.ts`. No CJS. Modern Vite / Next 14+ / Remix / Astro are ESM-first by assumption.
- **Tree-shaking via the barrel.** `sideEffects: ["**/*.css"]` lets bundlers drop unused components from `import { Button } from "@usetheo/ui"`.
- **CSS distribution.** `dist/styles.css` is the recommended single import (tokens + fonts + Tailwind base/components/utilities). `@usetheo/ui/tokens.css`, `@usetheo/ui/fonts.css`, and `@usetheo/ui/fonts-cdn.css` are available for finer control.
- **Self-hosted fonts.** Geist Sans + Geist Mono ship as woff2 in `dist/fonts/` (~290 KB total). Opt into Google Fonts CDN with `@import "@usetheo/ui/fonts-cdn.css"` if you prefer not to host static assets.

### Quality gates

```bash
pnpm quality:gates
```

Pipeline runs: `format:check` → `lint:ci` → `typecheck` → `test` → `build` → `registry:build` → `registry:validate` → `quality:structure` → `quality:bundle` → `quality:a11y` → `ladle:build`.

The structural validator enforces:

- **Taxonomy:** primitive vs composite split by import graph.
- **Coverage:** registry, test, and story presence per item (test gate is hard-fail).
- **Public-export surface:** declared exports match shipped barrel.
- **Design-system fidelity:** Geist fonts + Vercel-inspired typescale.
- **Governance:** LICENSE + CHANGELOG present and well-formed.
- **Drift:** README ↔ exports parity; docs typography parity.
- **Composite hygiene:** composites import primitives via the barrel.
- **Compound pattern uniformity:** `Object.assign /*#__PURE__*/` for sub-component attachment.
- **Census consistency:** README/architecture component counts match registry.
- **Accessibility:** vitest-axe coverage on ≥30 interactive primitives.
- **Cleanliness:** zero stray `*.bak` / `*.json.tmp` artifacts.

Full spec: [`docs/quality-gates.md`](./docs/quality-gates.md).

### Stack

- **React** 18+ peer-dep.
- **Radix UI** primitives underneath (`@radix-ui/react-*`).
- **CVA** (`class-variance-authority`) for variant styling, **tailwind-merge** for class-conflict resolution.
- **cmdk** for `CommandPalette`.
- **lucide-react** for icons.
- **TypeScript** 5.7+. **tsup** for build. **Vitest** + **happy-dom** + **vitest-axe** for tests. **Ladle** for stories. **Biome** for lint/format.

## Where this fits

`@usetheo/ui` is a **community auxiliary** of the [usetheo](https://usetheo.dev) ecosystem.

| Step | Product | What it does |
|---|---|---|
| 1 | **TheoCode** | Autonomous coding agent. Plan / Code / Infra modes. CLI + Desktop. |
| 2 | **TheoCreate** | Scaffolds the project — TheoKit for Full-Stack AI Agents, or one of 18+ multi-language stacks. |
| 3 | **TheoKit** | The full-stack framework for AI agents. Routing, auth, real-time, deploy. |
| 4 | **Theo PaaS** | Managed runtime. `theo deploy` → live URL in ~4 minutes. **The paid product; the OSS stack is the funnel.** |

> `@usetheo/ui` runs standalone — no commitment to the rest of the stack. Pairs naturally with TheoKit (the framework) and `@usetheo/sdk` (the agent runtime) when you build agents end-to-end.

## Mission

**Theo's mission.** From prompt to production. We give every developer the opinion, the infrastructure, and the speed to build and ship real AI agents and applications — with no repetitive setup, no vendor lock-in, and no manual ops.

**Theo's vision.** Be to AI agents what Vercel became to the web: the default, obvious, developer-respected path — with an open runtime end to end.

**`@usetheo/ui`'s vision.** The component library every AI agent UI and PaaS dashboard converges on — built for surfaces nobody else builds for.

> The full identity (mission, vision, values) lives in [`/IDENTITY.md`](../IDENTITY.md).

## Status

- **Production.** 102 components, 453 tests passing, zero a11y violations on 126 Ladle stories, bundle size enforced. Quality gates run on every PR.
- **Registry distribution.** Artifacts shipped at `registry/r/*.json` in this repo; canonical `ui.usetheo.dev/r/*.json` URL is the planned distribution target.
- **ESM-only.** Modern bundlers only. Consumers on CommonJS Node need to transpile or use a bundler.
- **Component count is the floor, not the ceiling.** New agent and PaaS surfaces ship through PRs; every addition runs the same quality gates.

## License

[Apache-2.0](./LICENSE) © [usetheo.dev](https://usetheo.dev). Fork the library. Build on Violet Forge. Keep shipping.

## Next step

**Primary:** Install the library.

```bash
pnpm add @usetheo/ui
```

**Or copy individual components shadcn-style:**

```bash
npx shadcn@latest add https://ui.usetheo.dev/r/button.json
```

**Next in the funnel:** Build any React surface today — install `@usetheo/ui@next` and ship 102 components in minutes. TheoKit integration is on the roadmap.

**Tertiary:** [Component catalog](https://github.com/usetheodev/theo-ui#component-catalog) · Gallery (coming soon at ui.usetheo.dev) · [GitHub](https://github.com/usetheodev/theo-ui)

## Community

- Discord: https://discord.usetheo.dev/
- X: https://x.com/usetheodev
- LinkedIn: https://linkedin.com/company/usetheodev
