---
slug: m-b-usetheo-ui-bootstrap
date: 2026-07-03
questions_asked: 6
decisions_resolved: 6
verdict: READY_FOR_PLAN
---

# Grill: M-B — bootstrap the `@usetheo/ui` repo + seed the non-AI surface

Milestone B of the `@theokit/ui` AI-exclusive pivot. Creates the separate `@usetheo/ui`
package and moves the 59 non-AI components + the shared Violet Forge foundation into it.
Consumes M-A's classification manifest (`registry/component-classification.json`) as the
authoritative "who moves" contract.

## Decision tree resolved

1. **Scope of the first cut** — ALL 59 non-AI components at once (47 `generic` + 12 `cloud-ops`), not generic-first. (User override of the generic-first recommendation.)
2. **Design identity** — `@usetheo/ui` CARRIES the Violet Forge design system (`lib/cn.ts` + `styles/tailwind-preset.ts` + `themes/` + `ThemeProvider`), becoming the shared foundation `@theokit/ui` depends on for primitives AND theming. Not theme-neutral. (Behavior/appearance preservation; mirrors ai-elements→shadcn-ui; theme-neutral refactor is YAGNI.)
3. **Repo location** — new git repo at `theokit-tools/usetheo-ui/`, remote `git@github-usetheo:usetheodev/usetheo-ui.git`. **Already created by the user** (empty except `.git`). npm scope `@usetheo` publish access still to be confirmed (blocks release, not dev).
4. **Move mechanism** — copy source + adapt imports (NOT `git filter-repo` history preservation). Provenance recorded as "seeded from theo-ui @ <sha>" in the new repo's README/CHANGELOG.
5. **Tooling** — mirror the FULL quality toolchain (biome, vitest, tsc, vite build, `registry:build`/`validate`, `quality:visual`, `quality:a11y`, `quality:bundle`, ladle/structural). Skip ONLY the AI-engine-specific gates that don't apply: `dogfood:whiteboard/slide/slide-deck/slide-rich` and `classify:check`. ("Não adiar nada" — same quality bar as @theokit/ui from day one.)
6. **Publish + registry** — npm `@usetheo/ui`, ESM-only, Apache-2.0, initial v0.1.0. Registry JSON on GitHub Pages at `usetheodev.github.io/usetheo-ui/r/*.json`, mirroring theo-ui's model. Cross-package `registryDependencies` URL linkage is mostly M-C.

## Findings surfaced during the grill (codebase-first)

- **Foundation coupling (Q2 evidence):** generic primitives (`button`/`card`/`input`/`dialog`/`select`) import only Radix + CVA + lucide + `cn` (`lib/cn.ts`). None import `themes`/`ThemeProvider` directly. But `lib/cn.ts` is a tailwind-merge "taught about the Violet Forge typescale" (references `styles/tailwind-preset.ts`). So the extraction MUST carry `cn` + `tailwind-preset` — hence @usetheo/ui carries Violet Forge (Q2).
- **Reverse-dependency bug fixed mid-grill:** the dependency check found `preview-panel` (was `cloud-ops`) importing `browser-controls` (`ai`) + referencing `build-log-stream` — a would-be `@usetheo/ui → @theokit/ui` reverse dep. Reclassified `preview-panel` → `ai` (coding-agent preview surface). Committed to M-A. Split is now **77 `ai` / 59 non-AI**. No production reverse-dep violations remain.
- **Gate enhancement candidate:** `classify:check` could additionally enforce import direction (no `@usetheo/ui`-tiered component imports an `@theokit/ui`-tiered one) — it would have caught the preview-panel bug mechanically. Candidate task for M-B or a follow-up.

## Scope boundary (M-B vs M-C)

- **M-B (this plan):** usetheo-ui repo receives the 59 components + Violet Forge foundation, mirrors the toolchain, builds + tests green, publishes `@usetheo/ui` v0.1.0 with a hosted registry. Ends when `@usetheo/ui` is on npm.
- **M-C (separate):** theo-ui removes the 59 non-AI components, adds `@usetheo/ui` as a dependency, re-points AI-component imports (`../../primitives/*` → `@usetheo/ui`), de-duplicates the foundation, ships the breaking major + codemod for consumers.

## Cross-repo execution caveat (IMPORTANT)

M-B's deliverable lives in a DIFFERENT repo (`theokit-tools/usetheo-ui/`). The cycle-kit's
`/implement` halt-loop, gates, and hooks are scoped to `theo-ui` (the `.claude/` tooling is
here). The M-B plan produced by `/to-plan` is therefore a SPEC for work performed IN
usetheo-ui — it will NOT be driven by a normal theo-ui `/implement` halt-loop. Execution
options: (a) work directly in usetheo-ui with manual TDD discipline, or (b) run
`/roadmap-init`-style bootstrap inside usetheo-ui. `/to-plan` here should frame tasks as
"in the usetheo-ui repo, do X" and the human/agent executes them there.

## Q&A log

### Q1: scope of the first cut — 47 generic only, or all 60 non-AI?
**Recommended**: generic-first (~47 primitives; AI components only depend on generic primitives; cloud-ops have no urgent consumer; smaller cut = safer).
**User decision**: ALL 60 non-AI at once (later 59 after preview-panel reclassification).

### Q2: does @usetheo/ui carry Violet Forge or ship theme-neutral primitives?
**Recommended**: carry Violet Forge (design system + primitives in @usetheo/ui; @theokit/ui depends on it) — behavior preservation, mirrors prior art, theme-neutral is YAGNI.
**User decision**: accepted.

### Q3: where does the repo live / how is it created?
**Recommended**: new git repo at `theokit-tools/usetheo-ui/`, npm `@usetheo/ui`; confirm npm scope access.
**User decision**: accepted; repo already created (remote usetheodev/usetheo-ui, empty).

### Q4: move mechanism — copy + adapt vs git-filter history?
**Recommended**: copy source + adapt imports; record provenance in README/CHANGELOG.
**User decision**: accepted.

### Q5: tooling — full mirror vs core vs minimal?
**Recommended**: mirror core build/lint/test/registry, defer heavy gates (visual/a11y/bundle) to a follow-up.
**User decision**: "não adiar nada" — mirror the FULL quality toolchain from day one; skip only the AI-engine dogfood gates + classify:check.

### Q6: publish + registry hosting?
**Recommended**: npm `@usetheo/ui` ESM-only Apache-2.0 v0.1.0; registry on gh-pages `usetheodev.github.io/usetheo-ui`; mirror theo-ui's model.
**User decision**: accepted.
