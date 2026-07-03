# Discovery Plan: TheoUI AI-Exclusive Pivot — extract non-AI into `@usetheo/ui`

> **Version 1.1** — Revised 2026-07-02 after `/discover-edge-cases` (report: `knowledge-base/reviews/theokit-ui-ai-exclusive-pivot-edge-cases-2026-07-02.md`). Absorbed MUST FIX EC-1 (Q4 registry-shape source repointed — ai-elements registry is remote-only), EC-2 (declared our own inventory as Q2's source), and SHOULD TEST EC-3 (Q1 monorepo-vs-published checkpoint).
>
> This discovery investigates how Vercel's **AI Elements** monorepo (`@repo/elements`) is architected on top of a separate generic-primitives package (`@repo/shadcn-ui`), and how the canonical **shadcn/ui** repo shapes a pure-primitives package + copy-paste registry. The goal is a blueprint that lets us decide, with prior-art evidence, how to split `@theokit/ui` (154 components) into an AI-exclusive `@theokit/ui` package and a non-AI `@usetheo/ui` package — resolving the dependency inversion where AI composites currently import generic primitives, drawing the exact AI/non-AI boundary (including "coding-agent ops" components), and splitting the shadcn-compatible registry + subpaths across the two packages. In-scope references: `ai-elements`, `shadcn-ui`. Blueprint output: `knowledge-base/discoveries/blueprints/theokit-ui-ai-exclusive-pivot-blueprint.md`.

**Slug:** `theokit-ui-ai-exclusive-pivot`
**Owner:** paulohenriquevn
**Created:** 2026-07-02
**Time budget:** 6h (per-project breakdown in ADR D1)

## Context

A strategic-review decision (2026-07-02) narrows `@theokit/ui` to an **AI-exclusive** component library, extracting the non-AI surface into a separate `@usetheo/ui` package. Two classes of components leave: (a) generic shadcn-like primitives (`Button`, `Card`, `Dialog`, `Input`, `Table`, `Tabs`…), and (b) cloud/PaaS-dashboard components (`DeploymentRow`, `EnvVarEditor`, `RollbackUI`, `DomainConfig`, `BuildLogStream`, `MetricsPanel`, `CronJobCard`…). Scope of the pivot: **positioning + code cut** (not just marketing).

Three concrete blockers motivate this discovery NOW, none of which we should resolve by guessing:

1. **Dependency inversion.** AI composites in `src/components/composites/` import generic primitives (`ChatComposer`→`Button`+`Textarea`, `ApprovalCard`→`Dialog`+`Card`). The project's own `primitive` vs `composite` taxonomy is mechanically enforced by `scripts/validate-quality-gates.ts` (cross-boundary import fails the gate). If the generic primitives move to `@usetheo/ui`, `@theokit/ui` must either depend on `@usetheo/ui`, duplicate them, or reclassify them as internal foundations. This is a Dependency Inversion Principle boundary decision (`rules/architecture.md § 2`) that must be evidence-backed.
2. **Ambiguous AON/non-AI boundary.** Preliminary inspection shows Vercel keeps "coding-agent ops" components (`terminal.tsx`, `sandbox.tsx`, `environment-variables.tsx`, `file-tree.tsx`, `test-results.tsx`) INSIDE `ai-elements`, not in generic primitives — contradicting a naive "env-vars = non-AI = extract" rule. The boundary is not obvious and must be drawn from prior-art precedent, not intuition.
3. **Locked narrative + registry split.** `CLAUDE.md § What this project is` locks "built for AI agents **+ cloud dashboards**" as the categorical wedge, and the shadcn-compatible registry (`registry/r/*.json`, `registry:build`) plus subpaths (`@theokit/ui/whiteboard`, `@theokit/ui/slide`) must be divided between the two packages. Weakening the locked narrative requires a monorepo-level strategic review — this blueprint supplies the evidence for that decision.

Prior art already cloned under `.claude/knowledge-base/references/`: `ai-elements` (Vercel's `@repo/elements` component library, ~48 AI components) and `shadcn-ui` (canonical primitives + registry). The AI Elements CLI README states it is "a component library built on top of shadcn/ui to help you build AI-native applications faster" — the exact two-layer split we are evaluating.

## Objective

Produce a blueprint that lets us decide **how to split `@theokit/ui` into an AI-exclusive package plus a non-AI `@usetheo/ui` package** — with a prior-art-backed answer for the cross-package dependency, the AI/non-AI boundary, and the registry/subpath division.

Measurable success criteria for the blueprint:

- [ ] All research questions in this plan answered with citations to `.claude/knowledge-base/references/`
- [ ] Cross-cutting comparison table populated for both in-scope reference projects (ai-elements, shadcn-ui)
- [ ] Recommendations section provides at least one concrete decision proposal per in-scope research question (dependency model, boundary rule, registry split)
- [ ] `/discover-confidence` verdict ≥ SHIPPABLE_WITH_CAVEATS

## In-Scope / Out-of-Scope

### In-Scope (per reference project)

| Project | In-scope subdirectories | Reason |
|---|---|---|
| `.claude/knowledge-base/references/ai-elements/` | `packages/elements/src/`, `packages/elements/__tests__/`, `packages/elements/package.json`, `packages/shadcn-ui/components/ui/`, `packages/cli/` | The canonical prior art for AI-components-on-separate-primitives-package + shadcn-compatible CLI distribution |
| `.claude/knowledge-base/references/shadcn-ui/` | `apps/v4/registry/new-york-v4/ui/`, `apps/v4/registry/new-york-v4/registry.ts`, `apps/v4/registry/config.ts`, `packages/` | Canonical pure-primitives package shape + **programmatic** registry model (the registry is defined in `.ts`, not JSON) that both AI Elements and `@usetheo/ui` would target |
| `theo-ui` (self / mutation target — NOT a read-only reference) | `src/components/primitives/`, `src/components/composites/`, `README.md` catalog block, `registry/r/*.json` | Q2 classifies OUR 154-component inventory into AI vs non-AI; Q4 reads OUR already-built registry entries which carry `registryDependencies`. Read-only **during discovery** (the pivot mutates it later, not now). Absorbed from EC-2. |

### Out-of-Scope (explicit)

| Project / Subdir | Why excluded |
|---|---|
| `.claude/knowledge-base/references/ai-elements/apps/` | Demo/docs apps, not the library source |
| `.claude/knowledge-base/references/ai-elements/packages/examples/`, `packages/scripts/`, `packages/typescript-config/` | Tooling/examples, not the component-boundary decision |
| `.claude/knowledge-base/references/shadcn-ui/apps/v4/styles/` | Theme variants; only the registry `ui/` dir + `registry.ts` and package shape are in scope (this clone has no `apps/www`) |
| `.claude/knowledge-base/references/*/pnpm-lock.yaml`, `node_modules/`, `dist/`, build artifacts | Not source of truth |
| Any project NOT cloned into `.claude/knowledge-base/references/` (e.g., Tremor, assistant-ui) | Cross-Project Rule: never claim a project feature without reading its source. Tremor/assistant-ui were candidate refs but are not cloned — deferred (see ADR D3) |

## ADRs

### D1 — Time budget + stop conditions

**Decision:** `ai-elements`: 4h (primary — it IS the two-layer split we are evaluating). `shadcn-ui`: 2h (secondary — pure-primitives + registry shape only).

**Rationale:** `ai-elements` is the closest analog (AI components on a separate shadcn-ui package via `workspace:*`), so it gets the deepest dive. `shadcn-ui` is consulted only for the canonical primitives-package + registry shape that `@usetheo/ui` would mirror.

**Alternatives considered:** equal split (rejected — shadcn-ui adds little beyond the registry model); ai-elements-only (rejected — the pure-primitives package shape is best read from canonical shadcn, not the monorepo copy).

**Stop condition — per question (mandatory):** When a question's Fase A returns empty matches after 3 consecutive retries with different query variants (pattern → kind-based → alternate path → broader scope), mark the question BLOCKED with reason "Fase A exhausted — no hotspots found" and continue. Do NOT pad with unrelated hotspots.

**Stop condition — per project (mandatory):** When a project's time budget is exhausted with N questions pending, mark remaining questions BLOCKED with reason "budget exhausted" and continue. If every remaining project is in the same state (every question `done` or honestly `blocked`), emit `<promise>BLUEPRINT_BLOCKED</promise>` with the honest report. Never emit `BLUEPRINT_COMPLETE` from a state with blocked questions.

**Anti-pattern:** NEVER fabricate Fase B answers to close a question whose Fase A was exhausted. Honest BLOCKED with reason is required (Unbreakable Rule 3).

**Consequences:** the halt-loop stops iterating a project when its budget is exhausted; the blueprint surfaces blocked questions explicitly as next-discovery seed.

### D2 — Investigation depth

**Decision:** Read each in-scope component/config file end-to-end for the dependency + boundary + registry questions; use ast-grep only to build the initial hotspot map (import statements, package boundaries).

**Rationale:** The decisions hinge on intent (why a component sits in one package vs the other) and on exact import/dependency wiring, which requires reading package.json + import blocks in full, not symbol counts. Alternatives: grep-only (rejected — misses the rationale in comments/structure); full-repo read (rejected — busts the time budget).

**Consequences:** Deep but narrow; the blueprint's boundary recommendation is grounded in read evidence, at the cost of not surveying every one of the ~48 ai-elements components (a representative sample of ops-vs-chat components suffices).

### D3 — Defer Tremor / assistant-ui

**Decision:** Do not investigate Tremor or assistant-ui in this cycle; they are not cloned under `.claude/knowledge-base/references/`.

**Rationale:** The Cross-Project Rule forbids claiming a project's features without reading its source. Cloning + investigating two more monorepos busts the 6h budget. `ai-elements` + `shadcn-ui` already supply the two-layer split and registry model — the core questions. Tremor (dashboard charts) and assistant-ui (chat runtime) become a follow-up discovery slug if the blueprint surfaces a gap.

**Consequences:** The blueprint's boundary/dependency recommendation rests on Vercel + shadcn precedent only; a second opinion from assistant-ui is deferred, noted as a limitation in the blueprint.

## Research Questions

- **Fase A (broad, ast-grep)** — hotspot map: where to look, what AST kind. Mandatory for code-shape questions; skipped for text-shape (package.json, README, registry JSON).
- **Fase B (deep, Read)** — reads each hotspot in detail, capturing intent + edge-cases; produces prose + line-exact citation.

| # | Question | Corner | Reference project(s) | Fase A (broad — ast-grep map) | Fase B (deep — Read at each hotspot) | Expected answer shape |
|---|---|---|---|---|---|---|
| Q1 | How does `@repo/elements` (AI components) depend on the separate generic-primitives package `@repo/shadcn-ui`? Is it a `workspace:*` package dependency, path alias, or duplication? | techniques | `.claude/knowledge-base/references/ai-elements/packages/elements/` | SKIP Fase A (text-shape) — Read `packages/elements/package.json`; then `ast-grep run -p '$$$ from "@repo/shadcn-ui/$$$"' --lang tsx packages/elements/src/` to map the import edges | Read the dependency block + a sample of AI components (`message.tsx`, `conversation.tsx`, `tool.tsx`) to see exactly what they import from the primitives package and how the alias resolves | Dependency model description (workspace vs alias vs copy) + import-edge table with `path:line` per row + verdict: does this map to `@theokit/ui` → `@usetheo/ui`? |
| Q2 | What is the exact AI-vs-generic boundary in `ai-elements`? Specifically, which "coding-agent ops" components (`terminal`, `sandbox`, `environment-variables`, `file-tree`, `test-results`, `web-preview`, `stack-trace`, `package-info`) live in the AI `elements` package vs the generic `shadcn-ui` package, and what distinguishes them? | techniques | `.claude/knowledge-base/references/ai-elements/packages/elements/src/`, `.claude/knowledge-base/references/ai-elements/packages/shadcn-ui/components/ui/` | `ast-grep`/`ls` to enumerate component files in BOTH package dirs (two Fase A listings, one per package) | Read `terminal.tsx`, `sandbox.tsx`, `environment-variables.tsx`, `file-tree.tsx` in `elements/src/` to confirm they are AI-agent-shaped (agent-context props) vs generic; confirm none appear in `shadcn-ui/components/ui/` | Boundary rule (what makes a component "AI" for Vercel) + placement table for our ambiguous cloud/PaaS set (`EnvVarEditor`, `DeploymentRow`, `BuildLogStream`…) → keep-in-`@theokit/ui` vs move-to-`@usetheo/ui`, with citations |
| Q3 | How are runtime dependencies split between the AI `elements` package and the `shadcn-ui` primitives package? Which deps belong to each layer (Radix, CVA, lucide, ai-sdk)? | deps | `.claude/knowledge-base/references/ai-elements/packages/elements/`, `.claude/knowledge-base/references/ai-elements/packages/shadcn-ui/` | SKIP Fase A (text-shape) — Read both `package.json` `dependencies`/`peerDependencies` blocks | Read each `dependencies` block; diff which deps are unique to the AI layer vs the primitives layer | Two-column dep table (elements-only vs shadcn-only vs shared) + version ranges + recommendation for how `@theokit/ui` vs `@usetheo/ui` should split deps |
| Q4 | How does `ai-elements` distribute two coupled packages through a single shadcn-compatible registry/CLI, and how would subpath-style engines (our `@theokit/ui/whiteboard`, `@theokit/ui/slide`) map into that model? | tools | `.claude/knowledge-base/references/ai-elements/packages/cli/`, `.claude/knowledge-base/references/shadcn-ui/apps/v4/registry/`, `theo-ui/registry/r/` (self) | SKIP Fase A (text-shape). **Note (EC-1): ai-elements ships NO local registry JSON — its registry is served remotely (`packages/cli/index.js:41-46` shells `shadcn add https://elements.ai-sdk.dev/api/registry/...`); shadcn's `ui/` dir is `.tsx` source, not JSON.** So read the shape from where it actually lives: Read `packages/cli/index.js` + `packages/cli/README.md` (remote-registry indirection) + `shadcn-ui/apps/v4/registry/new-york-v4/registry.ts` + `config.ts` (how `registryDependencies` are declared programmatically) + our own `registry/r/agent-composer.json` (a built entry that already carries a `registryDependencies` array) | Read the CLI indirection + shadcn's programmatic registry definition + our own registry entry shape to capture how a component declares its cross-package (`registryDependencies`) primitives | Distribution model description (single registry pointing across packages, `registryDependencies` mechanism, remote-vs-published trade-off) + mapping proposal for our `registry/r/*.json` and subpaths across `@theokit/ui` / `@usetheo/ui` |
| Q5 | How does `ai-elements` test AI components that depend on the separate `shadcn-ui` package — do tests import the real workspace primitives, mock them, or render through the alias? | tests | `.claude/knowledge-base/references/ai-elements/packages/elements/__tests__/` | `ast-grep run -p '$$$ from "@repo/shadcn-ui/$$$"' --lang tsx packages/elements/__tests__/` to find cross-package imports in tests; fallback `ast-grep run -p 'render($$$)' --lang tsx` | Read `message.test.tsx` + `conversation.test.tsx` (or nearest existing) to see how the cross-package dependency is exercised in tests | Test-strategy description (real vs mocked primitives) + `path:line` citations + implication for how `@theokit/ui`'s vitest-axe + structural tests survive the primitives moving to `@usetheo/ui` |

## Coverage Matrix

| Corner | Questions mapped | Status |
|---|---|---|
| Integration tests | Q5 | Covered |
| Dependencies | Q3 | Covered |
| Tools | Q4 | Covered |
| Techniques | Q1, Q2 | Covered |

**Coverage: 4/4 corners covered (100%)**

## Halt-loop Checkpoints

| Checkpoint | Assertion | Action if fails |
|---|---|---|
| Before answering Qx | Every `.claude/knowledge-base/references/{project}/{path}` declared in Fase A exists | Mark Qx BLOCKED with reason "path not found", continue |
| Per-question Fase A budget | Fase A returned ≥1 hotspot OR 3 query-variant retries attempted | After 3 retries empty, mark Qx BLOCKED "Fase A exhausted"; continue |
| After answering Qx | Blueprint section under Qx has ≥1 citation to `.claude/knowledge-base/references/` | Re-iterate Qx (1 retry max) |
| Q2 boundary specificity | The placement table maps our real ambiguous components (`EnvVarEditor`, `DeploymentRow`, `BuildLogStream`, `MetricsPanel`, `CronJobCard`) to a package, each justified by a Vercel-precedent citation | Re-iterate Q2 — a boundary rule without our-component placement is incomplete |
| Q1 pattern generalization (EC-3) | Q1's answer explicitly states whether the observed dependency pattern is monorepo-only (`workspace:*`) and whether it generalizes to `@theokit/ui`/`@usetheo/ui` as **published npm packages** — flagging that generalization as inference, since neither reference demonstrates a published-package consumer | Re-iterate Q1 — an answer that silently assumes our packaging model is incomplete |
| Per-project time budget | Project budget not exhausted | When exhausted, mark remaining Qx for that project BLOCKED "budget exhausted"; advance |
| Before promising complete | All 4 coverage corners have populated sections | Refuse promise, continue iterating |

## Acceptance Criteria

- [ ] All research questions answered OR explicitly marked BLOCKED with reason
- [ ] All four coverage corners have populated sections in the blueprint
- [ ] Every citation in the blueprint points to a real `.claude/knowledge-base/references/{...}` path
- [ ] Q2 delivers a placement decision for our real ambiguous cloud/PaaS components, each backed by a Vercel/shadcn precedent citation
- [ ] At least one ADR section in the blueprint synthesizes the dependency-model + boundary + registry-split decisions
- [ ] Time budget respected per project
- [ ] `/discover-confidence` verdict ≥ SHIPPABLE_WITH_CAVEATS
- [ ] Blueprint saved at `knowledge-base/discoveries/blueprints/theokit-ui-ai-exclusive-pivot-blueprint.md`

## Global Definition of Done

- [ ] All phases completed (plan → edge-cases → plan-confidence → execute → confidence → improve if needed → confidence re-score)
- [ ] Final `/discover-confidence` verdict recorded in the blueprint header
- [ ] No fabricated citations
- [ ] Coverage Matrix 100% covered
- [ ] ADRs reference at least one principle from project rules — `rules/architecture.md § 2` (Dependency Inversion, the cross-package dependency question) and `rules/architecture.md § 3` (module cohesion, the AI/non-AI boundary); the pivot's positioning constraint is governed by `CLAUDE.md § Voice and Tone` + `rules/public-copy.md`
