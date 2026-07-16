# Review — M2 Code-agent Builder gap components

Date: 2026-07-16. Cycle: REVIEW. Slug: `m2-code-agent-builder-gaps`. Verdict: **READY_TO_MERGE**.

## Scope

4 new primitives sourced 1:1 from the studio Builder (fidelity spec): `WorkLog`,
`ApprovalModeSelector`, `ModelEffortPicker`, `CodeReviewPanel`. Commit `43d5193`.

## Gate evidence (each step green)

| Gate | Result |
| --- | --- |
| format:check | OK |
| lint:ci | OK |
| typecheck | OK |
| knip | OK |
| test | 1435 passed (163 files) — 24 new + 82 existing untouched |
| build | EXIT 0 (dts strict + use-client inject + subpath regen) |
| publint | All good! |
| registry build+validate | 100 items (4 new descriptors + generated r/*.json) |
| quality:structure | passed (README/docs/exports synced, RSC use-client present) |
| classify:check | 86 components, 0 drift (all AI / @theokit/ui) |
| quality:bundle | passed, 15 files ±5% (rebaselined +370B css — intentional, 4 comps) |
| quality:a11y | 176 passed (vitest-axe covers the new interactive components) |
| quality:visual | 105 passed (no regression) |
| ladle:build | EXIT 0 (all stories, incl. 4 new, compile) |
| dogfood ×6 | whiteboard, slide, slide-deck, slide-rich, v4-zero-config, precompiled-utilities all OK |

## Fidelity findings

- Each component reproduces the Builder's exact markup/tokens (`review.tsx`,
  `session-view.tsx`, `model-picker.tsx`, `index.tsx`), with `data-slot` added.
- **Deviation (justified):** diff coloring uses the design-system tokens
  `success`/`destructive` (like the existing `diff-viewer`) instead of the Builder's literal
  `emerald`/`red` — ADR-0004 forbids literal Tailwind colors. Fase B renders identically
  because the studio shares the same token system. This is the canonical color, not a
  regression.
- All 4 are **primitives** (import zero `@theokit/ui` components) — the mechanical rule.

## Defects fixed during implement/review (root-cause, no workaround)

1. tsc-strict: `approval` `current` possibly undefined → optional chaining;
   `code-review-panel` `onSelect` collided with native `HTMLAttributes.onSelect` → `Omit`.
2. Registry: created 4 `registry/<name>.json` descriptors (registry:build is descriptor-driven).
3. Pipeline: `sync:readme` + `sync:exports` + `build` required per new component (mapped).
4. classify test hardcoded 82 → updated to 86 (the 4 new).
5. format/lint (biome) on new files — formatted + import-sorted.

## DoD status (ROADMAP.md M2)

All DoD bullets satisfied — 4 components with test+story+registry, quality:gates green,
82 untouched, CHANGELOG updated. Proceed to RELEASE.
