---
type: Architecture Decision Record
title: "ADR — PageShell: what a page scaffold composite owns and what it refuses"
description: PageShell owns the visible header and the state precedence, but deliberately not document.title or a shape-matching skeleton — both are consumer scope.
tags: [adr, composite, scope, layering, api-design]
sources:
  - id: adr
    resource: "archive:94d9b11:.claude/knowledge-base/decisions/page-shell-composite-pattern.md"
    author: "human:theoui-maintainers"
    last_modified: "2026-05-25"
generated:
  by: "claude-code/opus-5"
  at: "2026-08-11"
status: stable
---

| Field | Value |
| --- | --- |
| Status | **Accepted** |
| Date | 2026-05-25 |
| Deciders | TheoUI maintainer team |

# Context

A dashboard team identified roughly **20 LOC of boilerplate × 13 pages** — auth check, page
title, action bar, and a loading/error/empty/content state machine. Each page hand-rolled a
slight variation, which produced the empty-state density inconsistencies a deep review had
flagged.

Two scope questions arose during edge-case review:

1. Should PageShell manage `document.title`?
2. Should the loading state render a generic spinner, or a skeleton matching the children's
   layout?

# Decision

PageShell owns the **visible page header** (title `<h1>`, optional description, optional
ActionBar) and the **state precedence**.

State precedence is strict — when multiple states are set simultaneously, only the
highest-priority one renders:

```
loading > error > empty > children
```

Switching between states **unmounts** the prior state.

## What it explicitly does not own

`document.title`
: Consumers use their own hook (`useSetPageTitle`, react-helmet, `next/head`). PageShell
  exposes an optional `onTitleChange?: (title: string) => void` that fires when the title
  prop changes. Owning it would mean **picking winners** between react-helmet, next/head,
  Vite SSG, and custom providers — each consumer app has its own convention. This is
  consumer scope, and layer-correctness beats one-liner DX.

A skeleton matching the children's shape
: A generic skeleton requires knowing the children's layout (KPI strip + panels vs
  table-only vs form). Default loading is a centered spinner Card. Consumers needing
  precision pass `loadingNode?: ReactNode` as an escape hatch — which covers all real cases
  without a combinatorial API explosion.

# Trade-offs (accepted, not hidden)

| Trade-off | Assessment |
| --- | --- |
| Tarball grows ~3–4 KB compressed | Acceptable — deduplicates ~20 LOC × 13 pages ≈ 260 LOC in the consumer. |
| Scroll position resets when switching loading → content, because the prior state unmounts | Documented. Consumers wrap with their own scroll-restoration if needed. |
| Generic spinner does not match children's shape | The `loadingNode` prop covers precision cases. |
| No `document.title` management | Consumer wires their own hook to `onTitleChange`. Deliberate. |

# Rejected alternatives

| Alternative | Why not |
| --- | --- |
| PageShell owns `document.title` via an internal hook | Picks winners among competing consumer conventions. Layer-incorrect. |
| A skeleton loading mode with templated layouts (KPI / table / form) | Too rigid for the variety of dashboard pages. |
| Sub-component compound (`<PageShell.Header>`, `<PageShell.Body>`) | Explicitly rejected by the brief; the prop-driven API is easier to typecheck. |
| Keep children mounted across transitions via conditional visibility | Adds complexity for marginal benefit. |

# Companion decisions from the same release

| ID | Decision |
| --- | --- |
| D1 | `<DropdownMenu>` shipped as a new primitive — prerequisite for `DataTable.rowActions`, consolidates five prior direct-Radix usages. |
| D2 | `<ActionBar>` shipped as a new primitive. PageShell composes it; it is also usable standalone. |
| D4 | `<DataTable>` types resolve via the barrel `dist/index.d.ts`. Generic `DataTable<T>` works correctly. |
| D5 | `<DataTable>` expandable defaults to multi-row; `expandMode="single"` is opt-in. |
| D6 | `<DataTable>` sort and pagination support both controlled and uncontrolled modes from v1. |
| D7 | `<PinInput>` is props-driven — no `<PinInput.Slot>` compound at v1. |

# Validation methodology

PageShell's value is measured by **boilerplate reduction in the consumer**, not by any
property of the component itself. The consuming team reports the LOC delta after migrating
their 13 pages. Expected shape: ~20 LOC of bootstrap per page collapsing to ~5–10.

# Industry precedent

Vercel's dashboard `<DashboardPage>` wrapper with header/content slots; Linear's `<Page>`
scaffold with title/actions/states; GitHub's per-route layouts owning header plus state
machine.

# Note on current location

`PageShell`, `DataTable`, `DropdownMenu`, `ActionBar`, and `PinInput` all moved to
`@usetheo/ui` in the [AI-exclusive pivot](/history/ai-exclusive-pivot.md). This record is
retained because the **scope reasoning** — what a scaffold composite owns and what belongs
to the consumer — still governs how composites are designed here.
