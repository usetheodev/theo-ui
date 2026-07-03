# Pivot Roadmap — `@theokit/ui` AI-exclusive split

> Macro tracker for the AI-exclusive pivot. Hand-written (the `/roadmap-init` and
> `/roadmap-feature` skills don't fit: init is for greenfield inception on a mature
> project; feature needs a per-repo `ROADMAP.md` that doesn't exist; and the pivot spans
> **two repos** so no single per-repo roadmap owns it). This file is the single source of
> truth for milestone status across both repos.
>
> Last updated: 2026-07-03.

## What the pivot is

Narrow `@theokit/ui` to an **AI-exclusive** component library; extract the non-AI surface
(generic shadcn-like primitives + the shared Violet Forge foundation + cloud/PaaS
components) into a **separate published `@usetheo/ui` repo**. `@theokit/ui` then depends on
`@usetheo/ui`. Migration is a **breaking major + codemod** for consumers.

### Release policy (locked 2026-07-03)

**Commit locally per milestone; cut a `/release` (develop→main PR + semver tag) ONLY when the entire roadmap (M-A..M-E) is complete.** No per-milestone release. Milestones accumulate on `develop`; the whole pivot ships as one release at the end. Rationale: M-A..M-D are internal groundwork with no standalone consumer value; the breaking major (M-C) + repositioning (M-E) are the consumer-facing event and should ship together.

### Locked decisions

| Decision | Value | Source |
| --- | --- | --- |
| Structure | Separate published `@usetheo/ui` repo (not a monorepo) | user 2026-07-03 |
| Migration | Breaking major + codemod | user 2026-07-03 |
| M-B scope | All 59 non-AI at once (47 `generic` + 12 `cloud-ops`) | grill Q1 |
| `@usetheo/ui` identity | Carries the Violet Forge design system (foundation + primitives); `@theokit/ui` depends on it | grill Q2 |
| Move mechanism | Copy source + adapt imports (no git-filter) | grill Q4 |
| `usetheo-ui` tooling | Full quality-gate mirror (minus AI-engine dogfood + classify:check) | grill Q5 |
| Publish | npm `@usetheo/ui`, ESM-only, Apache-2.0, v0.1.0; registry on gh-pages `usetheodev.github.io/usetheo-ui` | grill Q6 |
| Boundary rule | "AI-agent surface vocabulary" (coding-agent + chat), not structure | blueprint §Q2 |

### Current classification split (M-A manifest)

**136 components → 82 `ai` (`@theokit/ui`) · 54 non-AI (`@usetheo/ui`): 47 `generic` + 12 `cloud-ops`.**
Source of truth: `theo-ui/registry/component-classification.json`, enforced by `pnpm classify:check`.

## Milestones

| ID | Repo | Milestone | Status | Depends on |
| --- | --- | --- | --- | --- |
| **M-A** | theo-ui | Component classification manifest + drift gate | `[x]` done — on `develop`, unreleased | — |
| **M-B** | usetheo-ui | Bootstrap repo + seed 54 non-AI + foundation + full toolchain (publishable) | `[x]` DONE — READY_TO_MERGE, 664 tests, 0 AI leakage | M-A |
| **M-C** | theo-ui | Depend on `@usetheo/ui`; remove 59; re-point AI imports; breaking major + codemod | `[ ]` not started | M-B |
| **M-D** | both | Registry split — `@theokit/ui` entries cross-reference `@usetheo/ui` via `registryDependencies` URLs | `[ ]` not started | M-C |
| **M-E** | theo-ui | Narrative / README AI-native repositioning (`docs/`, HERO, CLAUDE.md voice) | `[ ]` not started | M-C |

Dependency chain: `M-A → M-B → M-C → { M-D, M-E }`.

---

### M-A — Classification manifest + gate  ·  theo-ui  ·  DONE (unreleased)

**Objective:** tag all 136 component dirs `ai`/`generic`/`cloud-ops` + target package, enforced by `pnpm classify:check` (0 drift).

- **Outcome:** delivered. 82 ai / 54 non-AI, 3 disputed (channel/cron) (resolved from component evidence). Gate wired into `quality:gates`. Reviewed `READY_TO_MERGE` (1 HIGH mitigated). Held on `develop` — not released solo (internal groundwork; release with M-C or when consumer-facing).
- **Artifacts:**
  - Plan: `knowledge-base/plans/component-classification-manifest-plan.md` (v1.1, plan-confidence SHIPPABLE 90.4)
  - Edge-cases: `knowledge-base/reviews/component-classification-manifest-edge-cases-2026-07-03.md`
  - Deps-audit: `knowledge-base/audits/component-classification-manifest-deps-audit-2026-07-03.md` (PASS)
  - Review: `knowledge-base/reviews/component-classification-manifest-review-2026-07-03.md` (READY_TO_MERGE)
  - Code: `scripts/classify-components.ts` + `.test.ts` (16 tests, 93% cov), `registry/component-classification.json`
- **Open follow-ups:**
  - F1 (review): a human pass over the full manifest before M-C (borderline non-flagged tags). Scope decision (coding-agent + chat = ai) already validated the broad set.
  - Gate enhancement candidate: `classify:check` could also enforce import direction (no `@usetheo/ui` component imports a `@theokit/ui` one) — would have caught the preview-panel reverse-dep. → M-B task.

### M-B — Bootstrap `@usetheo/ui`  ·  usetheo-ui  ·  DONE (READY_TO_MERGE, unpublished)

**Objective:** stand up the `@usetheo/ui` package: seed the 59 non-AI components + Violet Forge foundation, mirror the quality toolchain, build+test green, publish v0.1.0 with a hosted registry.

- **Repo:** created at `theokit-tools/usetheo-ui/` (remote `usetheodev/usetheo-ui`, empty).
- **Foundation to carry (beyond the 59 components):** `lib/cn.ts`, `styles/tailwind-preset.ts`, `themes/`, `ThemeProvider` (`theo-ui-provider.tsx`), and shared libs the primitives use (`safe-href`, `live-region-context`, `env`).
- **Artifacts:** grill `knowledge-base/grills/m-b-usetheo-ui-bootstrap-grill.md` (READY_FOR_PLAN). Blueprint `knowledge-base/discoveries/blueprints/theokit-ui-ai-exclusive-pivot-blueprint.md`.
- **Cross-repo caveat:** execution is IN usetheo-ui; the theo-ui `/implement` halt-loop won't drive it. The `/to-plan` output is a spec for work done there.
- **Outcome:** `@usetheo/ui` on usetheo-ui `develop` (2 commits): 39 primitives + 15 composites + Violet Forge foundation, mirrored toolchain, 664 tests, build 170KB ESM, npm pack OK, 0 AI leakage. 2-agent review READY_TO_MERGE (evidence + review reports 2026-07-03). Publish deferred to end-of-roadmap release.
- **Next:** M-C (theo-ui depends on @usetheo/ui; breaking major + codemod).

### M-C — theo-ui consumes `@usetheo/ui`  ·  theo-ui  ·  NOT STARTED

**Objective:** `@theokit/ui` depends on `@usetheo/ui`; remove the 59 moved components; re-point AI-component imports (`../../primitives/*` → `@usetheo/ui`); de-duplicate the foundation; ship the breaking major + a codemod for consumers.

- **Pre-req:** `@usetheo/ui` published (M-B).
- **Notes:** this is where the `EnvVarEditor`-class product edge-cases and the codemod land. The manifest's `@usetheo/ui` set drives which dirs are removed.

### M-D — Registry split  ·  both  ·  NOT STARTED

**Objective:** `@theokit/ui` registry entries reference `@usetheo/ui` primitives via `registryDependencies` URLs (already our pattern — a host/URL change). Two registries, cross-referenced.

### M-E — AI-native repositioning  ·  theo-ui  ·  NOT STARTED

**Objective:** narrative/positioning — README HERO, `docs/`, CLAUDE.md voice — reframe `@theokit/ui` as AI-native. Requires monorepo-level strategic review to weaken the locked "built for AI agents + cloud dashboards" narrative (per CLAUDE.md).

---

## References

- Strategic decision + design: `knowledge-base/discoveries/blueprints/theokit-ui-ai-exclusive-pivot-blueprint.md` (SHIPPABLE 98.7)
- Discovery plan: `knowledge-base/discoveries/plans/theokit-ui-ai-exclusive-pivot-plan.md`
- Memory: `theokit-ui-ai-exclusive-pivot` (locked decisions)
- Ecosystem macro roadmap (cross-pillar, separate altitude): `../../../ROADMAP.md`
