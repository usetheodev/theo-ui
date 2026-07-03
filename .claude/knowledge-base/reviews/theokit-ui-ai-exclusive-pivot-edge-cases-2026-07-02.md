# Discover Edge Case Review — theokit-ui-ai-exclusive-pivot

Date: 2026-07-02
Discovery plan analyzed: .claude/knowledge-base/discoveries/plans/theokit-ui-ai-exclusive-pivot-plan.md
Research questions analyzed: 5
Edge cases found: 5 (MUST FIX: 2, SHOULD TEST: 1, DOCUMENT: 2)

All cited reference paths were re-verified against the clones. Two questions (Q4, Q2) rest on a source that either does not exist locally or is not declared in the plan — those are the MUST FIX items below.

## MUST FIX

### EC-1: Q4's registry-shape source is not readable where the plan points it
- **Affected question:** Q4 (tools — registry/CLI distribution)
- **Family:** Reference path / Method
- **Scenario:** Q4 Fase B says "Read the CLI README distribution section + shadcn registry entry shape to capture how a component declares its cross-package `registryDependencies`." But: (a) `ai-elements` ships **no** registry JSON in the clone — the CLI (`packages/cli/index.js:41-46`) only shells out to `shadcn add https://elements.ai-sdk.dev/api/registry/...`, i.e. the registry is server-generated and remote; (b) the `shadcn-ui` reference `apps/v4/registry/new-york-v4/ui/` contains `.tsx` **source files**, not JSON entries with `registryDependencies` (0 `.json` files there). The registry there is defined programmatically in `apps/v4/registry/new-york-v4/registry.ts` + `apps/v4/registry/config.ts`.
- **Impact:** `/discover-execute` marks Q4 BLOCKED ("path not found / no JSON entry") or, worse, fabricates a `registryDependencies` shape it never read — corrupting the registry-split recommendation.
- **Suggested fix:** Repoint Q4 Fase B to the sources that actually carry the shape: shadcn's programmatic `apps/v4/registry/new-york-v4/registry.ts` (how `registryDependencies` are declared) + `packages/cli/index.js` (remote-registry indirection) + our own already-built `registry/r/*.json` (which DO carry a `registryDependencies` array — confirmed in `registry/r/agent-composer.json`), noting the latter is the target repo, not a reference.

### EC-2: Q2's deliverable (placement table for OUR components) has no declared source
- **Affected question:** Q2 (techniques — AI/non-AI boundary)
- **Family:** Reference path / Coverage
- **Scenario:** Q2's expected answer and the Q2 halt-loop checkpoint both require a placement table mapping our real ambiguous components (`EnvVarEditor`, `DeploymentRow`, `BuildLogStream`, `MetricsPanel`, `CronJobCard`) to a package. But the plan's In-Scope table declares only `knowledge-base/references/...`; our own component inventory (`src/components/primitives/`, `src/components/composites/`, README catalog) is never declared as a readable source. The executor cannot produce the deliverable from references alone.
- **Impact:** Q2 either stalls (no source for our component list) or the executor improvises our inventory from memory, risking a placement table over components that don't exist or missing ones that do.
- **Suggested fix:** Add a row to In-Scope: `theo-ui (self / mutation target)` → `src/components/primitives/`, `src/components/composites/`, `README.md` catalog block → "read-only during discovery; the inventory Q2 classifies." Keep it clearly separate from the read-only references zone.

## SHOULD TEST

### EC-3: Prior art only demonstrates the monorepo `workspace:*` pattern, not published-package cross-dependency
- **Affected question:** Q1 (techniques — cross-package dependency model)
- **Suggested halt-loop checkpoint:** Before marking Q1 done, assert its answer explicitly states whether the observed pattern is **monorepo-only** (`workspace:*`, both packages in one repo) and whether it generalizes to `@theokit/ui`/`@usetheo/ui` if those are **published npm packages** in separate repos. The references (`ai-elements`, `shadcn-ui`) both use in-repo workspace linkage; neither demonstrates a published-package consumer, so Q1 must flag that generalization as inference, not evidence.

## DOCUMENT

### EC-4: The AI/non-AI boundary is interpretive, not deterministic
- **Accepted risk:** Q2 asks "what makes a component AI for Vercel?" — a judgment call, not a grep result. This is acceptable because the plan already mitigates it with the Q2 specificity checkpoint (every placement must cite a Vercel/shadcn precedent, e.g. `terminal.tsx`/`sandbox.tsx`/`environment-variables.tsx` living in `packages/elements/src/`). The rule is derived from where Vercel *actually placed* each component (evidence), then applied to ours (judgment) — the interpretation is bounded by cited precedent, so it stays honest.

### EC-5: Single-lineage prior art (Vercel + shadcn share ancestry)
- **Accepted risk:** Per ADR D3, Tremor and assistant-ui are deferred (not cloned). Both in-scope references descend from the same shadcn lineage — `@repo/elements` is literally built on `@repo/shadcn-ui`. So the blueprint's dependency-model and boundary recommendation rests on one architectural school, not a diversity of them. Accepted for the 6h budget; the blueprint must state this as a limitation and name assistant-ui as the follow-up second-opinion slug if a gap surfaces.

## Summary

| Question | Edges found | MUST FIX | SHOULD TEST | DOCUMENT |
|----------|-------------|----------|-------------|----------|
| Q1 | 1 | 0 | 1 | 0 |
| Q2 | 2 | 1 | 0 | 1 |
| Q3 | 0 | 0 | 0 | 0 |
| Q4 | 1 | 1 | 0 | 0 |
| Q5 | 0 | 0 | 0 | 0 |
| D3 (plan-wide) | 1 | 0 | 0 | 1 |

**Verdict:** DISCOVERY PLAN NEEDS ADJUSTMENT

Two MUST FIX items (EC-1 repath Q4's registry source; EC-2 declare our own inventory as Q2's source) must be absorbed into a v1.1 of the plan before `/discover-execute`. EC-3 adds one halt-loop checkpoint. EC-4/EC-5 are accepted risks the blueprint must surface as limitations. Q3 and Q5 are clean — their cited paths (`packages/shadcn-ui/package.json`, `packages/elements/__tests__/{message,conversation,tool}.test.tsx`) all verified present.
