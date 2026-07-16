---
slug: m3-code-agent-builder-parity-extensions
milestone_id: M3
created_at: 2026-07-16
goal: Extend 4 existing components (diff-viewer, created-files-card, chat-message, intent-selector) for 1:1 Builder parity — additive only, no breaking change to the 82 — then publish the @theokit/ui minor.
---

# Plan — M3 Code-agent Builder parity extensions + publish

Consumes the M2 cross-validation + blueprint. Extends EXISTING components (additive) so the
studio Builder covers 1:1; then publishes the minor that unblocks Fase B. Dep: M2 (merged).

## Baseline

M2 merged to main; `develop == main`; `quality:gates` green; package `@theokit/ui@1.0.4`.

## Tasks (additive — every existing test must still pass)

### T1 — `diff-viewer`: accept a unified `diff: string`

- Export `parseUnifiedDiff(diff: string): DiffHunk[]` (maps `+`/`-`/context/`@@`/`+++`/`---`
  to `DiffLine`/`DiffHunk`). Make `hunks` optional; add `diff?: string`. Resolve:
  `hunks ?? (diff != null ? parseUnifiedDiff(diff) : [])`.
- TDD: `parses_unified_string_into_hunks`, `renders_added_removed_from_string`, `hunks_prop_still_works` (regression).
- AC: existing diff-viewer tests still green; new tests green.

### T2 — `created-files-card`: "edited" semantics

- `CreatedFile` gains optional `additions?`/`deletions?`. Add `variant?: "created" | "edited"`
  (default `"created"`; `"edited"` flips the default title to "Edited N files"); per-file
  `+A -B` shown when additions/deletions present. `cta` already covers Review/Undo actions.
- TDD: `edited_variant_shows_edited_title`, `renders_per_file_add_del`, `created_variant_unchanged` (regression).
- AC: existing tests green; additive props only.

### T3 — `chat-message`: Builder thread parity (verify-first)

- The Builder thread = user right-aligned bubble + assistant plain text. `ChatMessageRoot`
  (role) + `ChatMessageContent` (`contained`/`flat`) likely already cover this. VERIFY:
  add a story reproducing the Builder thread. Only extend if a real gap is found (YAGNI).
- TDD/story: `builder_thread_parity` story; a test asserting `flat` assistant + role=user bubble.
- AC: no breaking change; parity demonstrated.

### T4 — `intent-selector`: tiles layout

- Add `layout?: "menu" | "tiles"` (default `"menu"` — current behavior). `"tiles"` renders a
  responsive 2-col grid of tile buttons (icon chip + label), reproducing the Builder BUILD_INTENTS.
- TDD: `tiles_layout_renders_grid_of_options`, `menu_layout_unchanged` (regression), `emits_onChange`.
- AC: existing intent-selector tests green; default unchanged.

### T5 — Gates + publish

- `pnpm quality:gates` green. Update registry descriptors (deps unchanged; regen r/*.json).
  Update the 4 stories. CHANGELOG.
- **Publish**: bump `@theokit/ui` minor (1.0.4 → 1.1.0) carrying M2 + M3; `npm publish`
  (or the repo's release flow); tag; PR develop→main + merge; flip M3.
- AC: `quality:gates` green; npm shows the new version; ROADMAP M3 `[x]`.

## Coverage Matrix

| Goal claim | Task |
| --- | --- |
| diff-viewer unified | T1 |
| created-files-card edited | T2 |
| chat-message variants | T3 |
| intent-selector tiles | T4 |
| no breaking change to 82 | every task (regression tests) + T5 gates |
| publish minor | T5 |

## Drawbacks & Risks

- **R1 — breaking the 82.** Mitigation: additive-only props (new optional props / new variant
  values with the current behavior as default); regression tests assert old behavior; `quality:gates`.
- **R2 — publish coordination.** Mitigation: bump + publish is the last step, after all gates green.

## Prior art

- Builder (`theokit-studio`) — fidelity spec. M2 components (just shipped) — same pattern.
