---
slug: code-agent-builder-parity
generated_by: roadmap-feature
date: 2026-07-16
status: completed
milestones: [M2, M3]
---

# Grill — Code-agent Builder parity component set

Source: cross-validation `theokit-studio/builder` (code agent UI) × `@theokit/ui`
(2026-07-16). The Builder reimplements ~11 agent-surface pieces by hand and imports 0
components from `@theokit/ui` despite `@theokit/ui@1.0.4` being installed.

## Q1 — What / why now

Implement in `@theokit/ui` the components the code-agent **Builder** (theokit-studio,
`packages/studio/src/pages/builder/`) currently hand-rolls, so the Builder can adopt the
library 100% **while keeping EXACTLY the same experience**. Why now: the cross-validation
found 0% adoption despite the dep being installed, ~11 duplicated surfaces + 2-3 real
gaps. `@theokit/ui` is declaredly the library for code-agent surfaces — the Builder is the
proof consumer.

Decision: split into two milestones (owner, 2026-07-16) — **create new** (M2) vs **evolve
existing** (M3), different risk profiles, separate releases.

## Q2 — Dependencies

M0 (satisfied — `@theokit/ui@1.0.0` exists). Independent of M1 (voice cluster). M3 depends
on M2.

## Q3 — Definition of done

Components shipped with test + story + registry each; `pnpm quality:gates` green; the 82
existing components untouched; fidelity to the Builder validated (the Builder markup /
tokens / behavior is the spec). M3 additionally publishes the `@theokit/ui` minor that
unblocks the studio Fase B.

## Q4 — Top new risks

1. **"Exactly the same experience" fidelity** — a lib component that renders slightly
   differently breaks the contract. Mitigation: move the Builder's exact markup/tokens into
   the components, parametrized; validate with before/after visual + preserved `data-testid`.
2. **Regression on the 82 / bundle bloat** — extensions must be additive (no breaking API);
   `code-review-panel` may be heavy. Mitigation: `pnpm quality:gates` + subpath isolation if
   the bundle baseline blows.

## Scope note

Fase B (substitute the hand-rolled UI in the studio Builder) lives in the **theokit-studio**
repo → it becomes a milestone in the studio's ROADMAP, not this one.
