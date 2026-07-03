# Blueprint: TheoUI AI-Exclusive Pivot — split non-AI into `@usetheo/ui`

> **Version 1.0** — Synthesizes how Vercel's **AI Elements** (`@repo/elements`) is architected on top of a separate generic-primitives package (`@repo/shadcn-ui`), and how the canonical **shadcn/ui** registry model works, to inform splitting `@theokit/ui` (154 components) into an AI-exclusive `@theokit/ui` + a non-AI `@usetheo/ui`. Headline finding: **Vercel already ships exactly this two-package split** — 45/48 AI components import generic primitives from a separate workspace package via a clean one-directional dependency. The pivot is not novel; it has a battle-tested precedent. This blueprint gives the dependency model, the AI/non-AI boundary rule, the registry-split mechanism, and a component-placement table for our real inventory.

**Slug:** `theokit-ui-ai-exclusive-pivot`
**Source plan:** `.claude/knowledge-base/discoveries/plans/theokit-ui-ai-exclusive-pivot-plan.md` (v1.1)
**Owner:** paulohenriquevn
**Generated:** 2026-07-02 via `/discover-execute` (run inline — 5 questions over local clones, no ralph-loop needed; no active loop per pre-flight)
**Confidence verdict:** SHIPPABLE (98.7) — scored 2026-07-02 via `/discover-confidence`

## Context

Strategic decision (2026-07-02): narrow `@theokit/ui` to AI-exclusive, extract the non-AI surface (generic primitives + cloud/PaaS components) into `@usetheo/ui`. Three blockers drove this discovery: (1) the dependency inversion — AI composites import generic primitives; (2) an ambiguous AI/non-AI boundary; (3) the registry + subpath split across two packages. The AI Elements CLI README frames Vercel's product as "a component library built on top of shadcn/ui to help you build AI-native applications faster" (`.claude/knowledge-base/references/ai-elements/packages/cli/README.md`) — the precise two-layer split under evaluation.

## Objective

Decide **how to split `@theokit/ui` into an AI-exclusive package + a non-AI `@usetheo/ui`**, with prior-art evidence for the cross-package dependency, the boundary rule, and the registry division.

---

## Coverage Corner 1 — Integration Tests

### ai-elements (how AI components that depend on a separate primitives package are tested)

- **Pattern:** Tests render the **real** AI component through `@testing-library/react` and import it directly from the package source — they do NOT mock the generic shadcn primitives. Cross-package primitives resolve through the workspace, exercised for real.
  - `.claude/knowledge-base/references/ai-elements/packages/elements/__tests__/conversation.test.tsx:1` imports `render, screen` from `@testing-library/react`; line `:4` imports the real `Conversation*` components from the package.
- **What IS mocked:** only heavy external non-primitive deps — e.g. `use-stick-to-bottom` is `vi.mock`'d at `.claude/knowledge-base/references/ai-elements/packages/elements/__tests__/conversation.test.tsx:50`. The shadcn primitives (`button`, `tooltip`, `collapsible`) are never mocked.
- **Implication for the split:** When `@theokit/ui`'s tests run, the primitives from `@usetheo/ui` must be **really available** (workspace link or published dep), not stubbed. Our existing vitest-axe + structural suite (`quality:a11y`, `scripts/validate-quality-gates.ts`) will need `@usetheo/ui` resolvable at test time — a build-graph consequence, not a test-rewrite. Tests survive the move as long as the dependency is wired.

---

## Coverage Corner 2 — Dependencies

The dependency split is clean and semantically meaningful: **generic UI runtime → primitives package; AI-domain runtime → AI package.**

### ai-elements AI package (`@repo/elements`) — AI-domain deps

| Dependency | Role | Citation |
|---|---|---|
| `ai` | Vercel AI SDK — `UIMessage`, `ToolUIPart` types | `.claude/knowledge-base/references/ai-elements/packages/elements/package.json` |
| `@streamdown/{cjk,code,math,mermaid}`, `streamdown` | streaming markdown for chat | `.claude/knowledge-base/references/ai-elements/packages/elements/package.json` |
| `shiki`, `katex` | code/math rendering in AI output | same |
| `@xyflow/react` | agent flow/canvas view | same |
| `use-stick-to-bottom`, `tokenlens`, `media-chrome`, `@rive-app/react-webgl2`, `motion` | chat scroll, token counting, media, animation | same |
| `@repo/shadcn-ui` | **the primitives package, via `workspace:*`** | `.claude/knowledge-base/references/ai-elements/packages/elements/package.json` |

### ai-elements primitives package (`@repo/shadcn-ui`) — generic UI deps

| Dependency | Role | Citation |
|---|---|---|
| `radix-ui`, `@radix-ui/react-icons` | headless primitives | `.claude/knowledge-base/references/ai-elements/packages/shadcn-ui/package.json` |
| `cmdk`, `vaul`, `sonner`, `embla-carousel-react`, `react-day-picker`, `input-otp`, `react-resizable-panels`, `recharts` | generic UI widgets | same |
| `react-hook-form`, `@hookform/resolvers`, `zod` | forms | same |
| `tailwind-merge`, `clsx`, `class-variance-authority`, `next-themes` | styling/theming | same |

- **Shared across both:** `react`, `class-variance-authority`, `lucide-react`.
- **Recommendation for our split:** `@usetheo/ui` takes the generic UI toolkit (Radix, CVA, cmdk, tailwind-merge, lucide, recharts for generic charts). `@theokit/ui` takes the AI-domain deps we already ship in `src/lib/markdown/` (mermaid/math/shiki-style streaming preprocess) + any SDK adapter deps, and declares `@usetheo/ui` as a dependency. This matches the project's locked foundations (`CLAUDE.md`: Radix/CVA/cmdk/lucide/tailwind-merge) — they land in `@usetheo/ui`, the shared base.

---

## Coverage Corner 3 — Tools

### Distribution: one shadcn-compatible registry per package, cross-referenced by `registryDependencies`

- **ai-elements CLI is a thin remote-registry shim.** It maps each requested component to a remote URL and shells out to the canonical shadcn CLI — it ships **no local registry JSON**:
  - `.claude/knowledge-base/references/ai-elements/packages/cli/index.js:37` builds `targetUrls` as `https://elements.ai-sdk.dev/api/registry/{component}.json`; `:46` runs `shadcn@latest add {targetUrls}`.
- **The cross-package linkage is `registryDependencies`.** In shadcn's registry definition a component declares which other registry items it needs; e.g. the style item declares `registryDependencies: ["utils"]` at `.claude/knowledge-base/references/shadcn-ui/apps/v4/registry/new-york-v4/registry.ts:27`. When a user adds an AI component, shadcn transitively pulls its declared primitive deps.
- **We already use this exact mechanism — with full URLs.** `registry/r/agent-composer.json` declares `registryDependencies: ["https://usetheodev.github.io/theo-ui/r/chat-composer.json", ".../cn.json", ".../mention-menu.json", ".../tailwind-preset.json"]`. Our registry entries **already reference sibling components by absolute URL** — so pointing an `@theokit/ui` entry at an `@usetheo/ui`-hosted primitive is a one-line URL change, not a new mechanism.
- **Subpath engines (`@theokit/ui/whiteboard`, `@theokit/ui/slide`):** these are AI/agent-surface view-only renderers (agent artifacts). They stay in `@theokit/ui` as subpaths; they are not generic primitives and do not belong in `@usetheo/ui`.

---

## Coverage Corner 4 — Techniques

### Q1 — Cross-package dependency model (the core question)

**Finding: AI components depend one-directionally on the primitives package via a normal package import.** 45/48 AI components import from `@repo/shadcn-ui`:

- `.claude/knowledge-base/references/ai-elements/packages/elements/src/message.tsx:3` — `import { Button } from "@repo/shadcn-ui/components/ui/button"`; `:14` — `import { cn } from "@repo/shadcn-ui/lib/utils"`.
- `.claude/knowledge-base/references/ai-elements/packages/elements/src/tool.tsx:3` — `Badge`; `:9` — `cn`.
- `.claude/knowledge-base/references/ai-elements/packages/elements/src/conversation.tsx:3` — `Button`; `:4` — `cn`.

The dependency is **directional and acyclic**: AI package → primitives package, never the reverse. The primitives package (`@repo/shadcn-ui`) has zero imports from `elements`.

**Answer to our dependency-inversion blocker:** the correct model is `@theokit/ui` **depends on** `@usetheo/ui` (option "depend", NOT duplicate, NOT reclassify-as-internal). This is precisely how the project's mechanical `primitive`/`composite` taxonomy already thinks — composites depend on primitives — only now the primitive layer lives in a sibling package. `rules/architecture.md § 2` (DIP / acyclic dependency) is satisfied: the high-level AI layer depends on the stable low-level primitive layer.

**Caveat (EC-3):** the references demonstrate this via monorepo `workspace:*` only. Neither reference ships a **published-npm** consumer. Generalizing to "`@theokit/ui` is a published package that npm-depends on published `@usetheo/ui`" is sound inference (npm resolves the same import graph), but it is inference, not observed evidence. Two viable packagings: (a) monorepo + `workspace:*` (exact prior art), (b) two published packages with `@usetheo/ui` as a normal `dependency` of `@theokit/ui`.

### Q2 — The AI vs non-AI boundary rule

**Finding: Vercel's boundary is "AI-agent surface vocabulary," NOT "carries agent data" and NOT "looks like ops."** The "coding-agent ops" components live in the AI package despite being structurally generic wrappers:

- `terminal.tsx` — `TerminalHeaderProps = HTMLAttributes<HTMLDivElement>` (`.claude/knowledge-base/references/ai-elements/packages/elements/src/terminal.tsx:31`) — a styled div, no agent data.
- `environment-variables.tsx` — `EnvironmentVariablesProps = HTMLAttributes<HTMLDivElement> & {...}` (`.claude/knowledge-base/references/ai-elements/packages/elements/src/environment-variables.tsx:34`).
- `sandbox.tsx` — `SandboxRootProps = ComponentProps<typeof Collapsible>` (`.claude/knowledge-base/references/ai-elements/packages/elements/src/sandbox.tsx:21`).
- `web-preview.tsx` — `WebPreviewProps = ComponentProps<"div"> & {...}` (`.claude/knowledge-base/references/ai-elements/packages/elements/src/web-preview.tsx:44`).

These are generic containers, yet Vercel places them in `elements` (AI), not in `shadcn-ui` (generic — see `.claude/knowledge-base/references/ai-elements/packages/shadcn-ui/components/ui/`, which holds only classic primitives: button, card, dialog, input, table…). The distinguishing rule: **a component is "AI" if it belongs to the visual vocabulary of an AI-agent surface** (what a coding agent's UI shows: terminal, sandbox, env panel, web preview, file tree, test results, stack trace), even when it is structurally a thin `div` wrapper.

**Placement table for our real ambiguous components** (applying Vercel's surface-vocabulary rule):

| Our component | Vercel precedent | Placement | Rationale |
|---|---|---|---|
| `TerminalPanel` | `terminal.tsx` in AI pkg | **`@theokit/ui`** | Direct precedent — terminal is agent-surface vocabulary |
| `BuildLogStream` | `test-results`/`stack-trace` in AI pkg | **`@theokit/ui`** (borderline) | Coding-agent run output; agent-surface. Flag: also a generic PaaS build artifact |
| `EnvVarEditor` | `environment-variables.tsx` in AI pkg | **Split/duplicate** | Vercel treats env-vars as AI-surface (sandbox config); ours is described as PaaS-deployment env. Decision hinges on usage — if agent-sandbox env → `@theokit/ui`; if deployment env → `@usetheo/ui`. Strongest candidate for living in BOTH |
| `MetricsPanel` | shadcn `chart.tsx` is generic | **`@usetheo/ui`** | Generic recharts dashboard viz; no agent-surface precedent unless it renders agent-run metrics |
| `DeploymentRow` | none in ai-elements | **`@usetheo/ui`** | PaaS deployment ops — not agent-surface |
| `DomainConfig` | none | **`@usetheo/ui`** | PaaS domain ops |
| `RollbackUI` | none | **`@usetheo/ui`** | PaaS release ops |
| `CronJobCard` / `CronJobsList` | none | **`@usetheo/ui`** | PaaS scheduling ops |
| `PreviewEnvCard` | none | **`@usetheo/ui`** | PaaS preview-env ops |
| `ProjectCard` | none | **`@usetheo/ui`** | PaaS project ops |

The rule cleanly separates **coding-agent-surface** (terminal/log/env when agent-scoped → keep) from **cloud-platform ops** (deploy/domain/rollback/cron/preview/project → extract). `EnvVarEditor` is the one genuine both-sides case.

---

## Cross-cutting comparison

| Dimension | ai-elements (`@repo/elements`) | shadcn-ui | TheoUI today | TheoUI after pivot |
|---|---|---|---|---|
| AI components | ~48, in AI pkg | 0 | ~85 (AI-shaped) | `@theokit/ui` |
| Generic primitives | in separate `@repo/shadcn-ui` | the canonical set | ~40, same pkg as AI | `@usetheo/ui` |
| PaaS/ops components | none (terminal/env/sandbox are agent-surface) | none | ~20, same pkg | `@usetheo/ui` |
| Dependency direction | AI → primitives (`workspace:*`) | n/a | composites → primitives (same pkg) | `@theokit/ui` → `@usetheo/ui` |
| Distribution | remote shadcn registry + CLI shim | canonical shadcn registry | own gh-pages registry w/ URL `registryDependencies` | two registries, cross-referenced by URL |

---

## Recommendations

1. **Dependency model:** `@theokit/ui` **depends on** `@usetheo/ui`, one-directional/acyclic (mirror elements→shadcn-ui). Prefer a **monorepo with `workspace:*`** to match the exact prior art; a published-package `dependency` also works (inference, EC-3). Do NOT duplicate primitives; do NOT keep them as private internals of `@theokit/ui` (that re-couples the two surfaces).
2. **Boundary rule:** classify by **AI-agent surface vocabulary**, not structure and not "looks like ops." Coding-agent surface (terminal/log/env-when-agent-scoped) stays in `@theokit/ui`; cloud-platform ops (deploy/domain/rollback/cron/preview/project) go to `@usetheo/ui`. See placement table.
3. **Registry split:** two registries (or two URL namespaces). `@theokit/ui` entries list their `@usetheo/ui` primitives in `registryDependencies` by absolute URL — **already our pattern** (`registry/r/agent-composer.json`), so it is a host/URL change, not a redesign.
4. **Subpaths:** `whiteboard`/`slide` stay in `@theokit/ui`.
5. **`EnvVarEditor`:** decide its single home by intended consumer, or ship in both — the one true both-sides component.
6. **Tests:** ensure `@usetheo/ui` is resolvable at `@theokit/ui` test time (workspace link) — Vercel's tests render real primitives, don't mock them.

## ADRs (synthesized decisions)

### D1 — `@theokit/ui` depends on `@usetheo/ui` (one-directional)
- **Decision:** AI package depends on primitives package; never the reverse.
- **Rationale:** Direct prior art — 45/48 ai-elements components import `@repo/shadcn-ui` acyclically. Satisfies `rules/architecture.md § 2` (DIP, acyclic). Alternatives (duplicate primitives; keep as internal) rejected — duplication violates DRY; internalizing re-merges the two surfaces the pivot exists to separate.
- **Consequence:** requires a build-graph decision (monorepo `workspace:*` vs published dep). Open (EC-3).

### D2 — Boundary = AI-agent surface vocabulary
- **Decision:** a component is `@theokit/ui` if it belongs to the AI-agent visual surface, regardless of whether it structurally carries agent data.
- **Rationale:** Vercel places structurally-generic wrappers (terminal/sandbox/env/web-preview) in the AI package by surface vocabulary. Evidence: `terminal.tsx:31`, `environment-variables.tsx:34`, `sandbox.tsx:21`, `web-preview.tsx:44`.
- **Consequence:** `EnvVarEditor` is genuinely dual (agent-sandbox vs deployment); resolve per consumer or ship in both.

### D3 — Registry cross-reference via `registryDependencies` URLs
- **Decision:** `@theokit/ui` registry entries reference `@usetheo/ui` primitives by absolute URL in `registryDependencies`.
- **Rationale:** Matches ai-elements' remote-registry model (`cli/index.js:37,46`) and, more directly, our own existing entries (`registry/r/agent-composer.json` already uses full-URL `registryDependencies`).
- **Consequence:** two registry hosts/namespaces to publish; the shadcn CLI resolves the cross-package graph transitively.

## Limitations (honest)

- **EC-3 — packaging generalization is inference.** Prior art proves the monorepo `workspace:*` model; the published-npm-package variant is sound but unobserved. Validate when the packaging decision is made.
- **EC-4 — the boundary is interpretive.** The surface-vocabulary rule is applied by judgment; each placement above cites a Vercel precedent or its explicit absence, but reasonable people could move `BuildLogStream`/`MetricsPanel`.
- **EC-5 — single-lineage prior art.** ai-elements and shadcn-ui share ancestry (elements is literally built on shadcn). No architecturally-independent second opinion. If a gap surfaces, the follow-up discovery slug is `assistant-ui` (a chat runtime with a different lineage), per plan ADR D3.

## Blocked questions

None. All 5 research questions answered with verifiable citations.
