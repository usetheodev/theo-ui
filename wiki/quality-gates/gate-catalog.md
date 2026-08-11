---
type: Quality Gate Catalog
title: The eleven quality gates
description: Gate 0 through Gate 10 — what each blocks, stated as the pass condition a reviewer checks.
tags: [quality-gates, review, checklist, normative]
sources:
  - id: gates-doc
    resource: "git:94d9b11:docs/quality-gates.md"
generated:
  by: "claude-code/opus-5"
  at: "2026-08-11"
status: stable
---

# Gate 0 — Definition of Ready

Work may start only when all of these are true:

- [ ] The component has a clear owner layer: `primitive`, `composite`, or `screen`.
- [ ] The target user job is stated in one sentence.
- [ ] Required states are listed **before** implementation: empty, loading/running,
      success, error, disabled, permission-required where applicable.
- [ ] Required interactions are listed before implementation: keyboard, pointer, async
      callbacks, destructive confirmation, copy/open actions.
- [ ] If the component enters the registry, its install target and dependencies are known
      upfront.

Failing Gate 0 means the work is still product/design exploration, not implementation.

# Gate 1 — Taxonomy and componentization

Extends [`/architecture/taxonomy-rule.md`](/architecture/taxonomy-rule.md).

## Primitive

- [ ] Imports no other Theo component.
- [ ] May import React, Radix, lucide, CVA, `cn`, shared types, same-file subparts.
- [ ] Stateless by default, unless local UI state is intrinsic to the control (`open`,
      roving focus, filter text, selected tab).
- [ ] Exposes semantic props rather than leaking implementation details.
- [ ] Forwards refs when it renders a concrete interactive or layout element.
- [ ] **No** fetch, filesystem, IPC, agent, deploy, or auth side effects.

## Composite

- [ ] Composes primitives through public APIs.
- [ ] Domain props typed from `src/types` or local exported interfaces.
- [ ] Accepts callbacks for mutations instead of performing them internally.
- [ ] Does not import screens or app-specific code.
- [ ] Handles all required user-visible states without making consumers invent layout
      around a missing one.

## Screen / story

- [ ] Demonstrates a real workflow, not a decorative layout.
- [ ] Uses realistic data, long labels, and empty/error states where relevant.
- [ ] Is **not** exported from the barrel.
- [ ] Proves how primitives and composites should be assembled.

# Gate 2 — Registry compatibility

Full detail in [`/quality-gates/registry-gate.md`](/quality-gates/registry-gate.md).

# Gate 3 — Design system fidelity

A component passes only if it implements the Theo identity, not a generic shadcn clone.

- [ ] Uses `tokens.css` and Tailwind theme tokens — no raw hex except for static assets or
      a documented edge case.
- [ ] Works in light **and** dark modes.
- [ ] Respects the Violet Forge palette; no unrelated gradients.
- [ ] Uses the normative typography ([`/design-system/typography.md`](/design-system/typography.md)).
- [ ] Introduces no one-off spacing, radii, or shadows without documenting why.
- [ ] Keeps text inside controls at every supported width.
- [ ] Uses lucide icons where a standard icon exists.
- [ ] Ships no decorative control without behavior.

Design-system drift is **blocking**, because the UI library *is* the product surface.

# Gate 4 — Accessibility and interaction

See [`/design-system/accessibility.md`](/design-system/accessibility.md) for the full
checklist and the automated gates behind it.

# Gate 5 — Test coverage

Minimum per component:

- [ ] Smoke render.
- [ ] Variant/prop matrix for visual or semantic branches.
- [ ] Keyboard and pointer behavior for interactive components.
- [ ] Callback payload assertions.
- [ ] Accessibility-critical assertions: labels, roles, disabled state, selected state,
      focus behavior where practical.
- [ ] **A regression test for every bug fixed after release**, written before the fix.

Broaden coverage when the component is a shared primitive, is in the registry, is used
across agent surfaces, or governs permission / destructive action / deployment / rollback /
code execution.

# Gate 6 — Documentation and examples

- [ ] Ladle story under the correct group.
- [ ] The story shows realistic data and at least one edge state.
- [ ] Props typed and exported when consumers need them.
- [ ] Exported from `src/index.ts` **only** when it is public API.
- [ ] Registry items carry clear title, description, and dependency metadata.
- [ ] Docs explain when to use it *and when not to*, when the choice is not obvious.

Avoid documentation that restates the JSX. Show product intent and integration shape.

# Gate 7 — AI coworker local-first value

An AI-coworker component passes only if it increases user trust, control, or task
completion.

Local context is visible
: Selected folder, files touched, paths, scope.

Permission is explicit
: Read/write/execute actions clearly ask for, or display, authorization state.

Progress is inspectable
: Timeline, commands, tool calls, files read and written, current step.

Results are verifiable
: Created files, diffs, artifact previews, validation rows.

The user can intervene
: Stop, retry, edit instruction, approve, deny, rollback, open result.

No fake affordances
: Mic, attach, model, folder, PR, deploy, and copy controls either work through callbacks
  or are not rendered at all.

Worked examples: `ChatComposer` must not show attach/mic by default unless wired or
intentionally disabled with accessible state. `PermissionModal` must show operation, path,
risk, duration/scope, and choices. `AgentTimeline` must distinguish planned, running,
succeeded, and failed work.

# Gate 8 — Cloud-ops value (now in `@usetheo/ui`)

The cloud-ops components (`DeploymentRow`, `RollbackUI`, `DomainConfig`, `PreviewEnvCard`,
`EnvVarEditor`, `MetricsPanel`, `ProjectCard`) moved to `@usetheo/ui` in the
[AI-exclusive pivot](/history/ai-exclusive-pivot.md), and their operational-value gates
moved with them — precise status (queued → live → failed), obvious next action,
confirmation on risky operations, degraded-state handling, copyable operational metadata.

`BuildLogStream` is the one cloud-ops-shaped primitive that stayed in `@theokit/ui`; it
renders agent and build output and is judged by the Gate 7 coworker gates, not a separate
PaaS gate.

# Gate 9 — Release readiness

See [`/quality-gates/release-readiness.md`](/quality-gates/release-readiness.md).

# Gate 10 — Community best-practices alignment

Added by the 2026-06-03 cohort. All wired into `pnpm quality:gates`.

| Gate function | Enforces | ADR |
| --- | --- | --- |
| `validateNoLiteralTailwindColors` | No literal Tailwind color classes in `src/components/**` | [ADR-0004](/decisions/adr-0004-no-literal-tailwind-colors.md) |
| `validateThemeContrast` | WCAG AA across 10 themes × 2 modes × 8 pairs | [themes](/design-system/themes.md) |
| `quality:visual` | Playwright snapshot diff, 100 committed PNGs | [accessibility](/design-system/accessibility.md) |

# Review checklist

Use this in PR review:

- [ ] Layer is correct: primitive, composite, or screen.
- [ ] Public API is stable and typed.
- [ ] Visuals follow Violet Forge tokens and typography.
- [ ] Light and dark modes are covered.
- [ ] Keyboard and focus behavior are correct.
- [ ] Empty / loading / error / running states exist where needed.
- [ ] AI-coworker trust gates are met, if applicable.
- [ ] Registry install path is valid, if applicable.
- [ ] Tests cover behavior, not only rendering.
- [ ] Story demonstrates a realistic workflow.
- [ ] `pnpm quality:gates` passes.
