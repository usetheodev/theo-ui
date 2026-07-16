---
slug: m2-code-agent-builder-gaps
milestone_id: M2
created_at: 2026-07-16
goal: Ship the 4 code-agent Builder gap components in @theokit/ui with fidelity to the studio Builder, quality:gates green, 82 existing untouched.
---

# Plan — M2 Code-agent Builder gap components

Consumes `.claude/knowledge-base/discoveries/blueprints/m2-code-agent-builder-gaps-blueprint.md`
(4 APIs, ADRs D1-D3). Fidelity spec = the studio Builder.

## Goal

Ship `work-log`, `approval-mode-selector`, `model-effort-picker`, `code-review-panel` — each
with test + story + registry + barrel export — reproducing the Builder's DOM/tokens/behavior,
with `pnpm quality:gates` green and the 82 existing components untouched.

## Baseline context

- Baseline green after `b931ae6` (pre-existing format/lint/knip debt fixed).
- Convention: `src/components/{primitives|composites}/<name>/{<name>.tsx,.stories.tsx,.test.tsx,index.ts}` → barrel `src/index.ts` → `registry/component-classification.json` → `registry:build`.
- Existing to reuse: `@radix-ui/react-dropdown-menu` (dep), `cn`, lucide, CVA.

## Coverage Matrix

| Goal claim | Task |
| --- | --- |
| work-log (collapsible + steps) | T1 |
| approval-mode-selector (3-state) | T2 |
| model-effort-picker (single dropdown) | T3 |
| code-review-panel (tree + multi-diff + toolbar) | T4 |
| barrel + classification + registry for all 4 | each task's WIRING step + T5 |
| quality:gates green, 82 untouched | T5 |
| CHANGELOG | T6 |

## Tasks (ordered — simplest first to validate the pipeline end-to-end before the complex one)

### T1 — `work-log` (primitive) [pipeline validator]

- TDD RED: `test_worklog_collapsed_by_default_and_toggles`, `test_worklog_renders_steps_when_open`, `test_worklog_shows_worked_for_label`.
- GREEN: minimal component (button + Clock + label + chevron + `aria-expanded`; `ul` of steps when open); `data-slot="work-log"`.
- WIRING: `index.ts`; barrel export in `src/index.ts`; add to `component-classification.json` as primitive; story with real Builder example.
- AC: 3 tests pass; `classify:check` + `registry:build`/`validate` green; story renders.

### T2 — `approval-mode-selector` (primitive)

- TDD RED: `test_approval_selector_reflects_value`, `test_approval_selector_emits_onChange`, `test_approval_selector_has_three_modes`.
- GREEN: 3-state control (ask/auto-edits/read-only), locked labels, Hand icon, inline chip styling; `data-slot`.
- WIRING: barrel + classification (primitive) + story.
- AC: tests pass; a11y (option semantics) clean.

### T3 — `model-effort-picker` (composite)

- TDD RED: `test_picker_shows_active_model_and_effort`, `test_picker_emits_onModelChange`, `test_picker_emits_onEffortChange`.
- GREEN: Radix dropdown, model RadioGroup (name+blurb+id) + effort RadioGroup, Sparkles trigger; `data-slot`.
- WIRING: barrel + classification (composite — uses Radix, no internal @theokit dep → still primitive? NO: composite means imports ≥1 @theokit/ui component; this imports none → **primitive**). Re-class as primitive. Story.
- AC: tests pass; dropdown keyboard-navigable (Radix).

### T4 — `code-review-panel` (composite) [fidelity pilot — largest]

- TDD RED: `test_review_panel_renders_all_files_by_default`, `test_review_panel_filters_to_selected_file`, `test_review_panel_shows_aggregate_counts`, `test_review_panel_parses_diff_into_add_del_ctx_rows`, `test_review_panel_close_calls_onClose`.
- GREEN: toolbar + diff column (self-contained `parseDiff` per D1) + `All files` tree; `data-slot`.
- WIRING: barrel + classification. **Bundle check (D3):** if barrel bundle blows ±5%, isolate to subpath.
- AC: 5 tests pass; visual fidelity to Builder `review.tsx` confirmed in story.

### T5 — Gate

- `pnpm quality:gates` green (format, lint, typecheck, knip, test, build, publint, registry, structure, classify, bundle, a11y, visual, ladle). The 82 existing components unchanged (diff shows only new dirs + barrel + classification + registry).
- AC: `quality:gates` exit 0; a11y vitest-axe covers the new interactive components.

### T6 — CHANGELOG

- `[Unreleased] § Added` entries for the 4 components.

## Test Plan

TDD per component (RED before GREEN). Gates: `pnpm test` (unit + a11y), `pnpm quality:structure` (per-component test/story/registry presence), `pnpm quality:bundle` (barrel budget), `pnpm classify:check`. Fidelity: Ladle story per component mirrors the Builder's exact example props.

## Drawbacks & Risks

- **R1 — fidelity drift.** Mitigation: reproduce the Builder's exact Tailwind tokens/markup; the story uses the Builder's real example data.
- **R2 — `code-review-panel` bundle weight** (D3). Mitigation: subpath isolation if the baseline blows.
- **R3 — classification error** (primitive vs composite). Mitigation: `classify:check` gate; the mechanical rule (imports ≥1 @theokit component?) decides — all 4 import zero → all **primitive**.

## Unresolved questions

- (none) — `code-review-panel` diff rendering is self-contained per D1; the M3 `diff-viewer`
  unified extension is out of M2 scope.

## Prior art

- Builder (`theokit-studio`) — the fidelity spec.
- Existing primitives (`agent-event`, `model-selector`, `steps-rail`) — convention templates.
