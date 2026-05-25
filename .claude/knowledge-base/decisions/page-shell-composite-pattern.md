# ADR: PageShell — page-level scaffold composite (scope and state machine)

- **Status:** Accepted
- **Date:** 2026-05-25
- **Deciders:** TheoUI maintainer team
- **Plan:** `.claude/knowledge-base/plans/dashboard-primitives-brief-5-plan.md`
- **Brief:** `theo/docs/handoff/2026-05-25-theo-ui-cloud-dashboard-brief-5.md`
- **Edge-case review:** `.claude/knowledge-base/reviews/edge-cases/dashboard-primitives-brief-5-edge-cases-2026-05-25.md`

## Context

Brief #5 from the TheoCloud dashboard team identified ~20 LOC of
boilerplate × 13 dashboard pages — auth check, page title, ActionBar,
loading/error/empty/content state machine — as a refactor target.
Each page hand-rolls its own slight variation, leading to the
empty-state density violations the Deep Review flagged in CC-3.

The brief proposed a `<PageShell>` composite that owns the scaffold.
Two questions of scope arose during the edge-case review:

1. Should PageShell manage `document.title`?
2. Should loading state render a generic spinner OR a skeleton
   matching the children's layout?

## Decision

PageShell owns the **visible** page header (title `<h1>`, optional
description, optional ActionBar) and the **state precedence**
(loading > error > empty > children). It does NOT own:

- **`document.title` management** — consumers use their own hook
  (`useSetPageTitle`, react-helmet, next/head, etc.). PageShell
  exposes an optional `onTitleChange?: (title: string) => void`
  callback that fires when the title prop changes.
- **Skeleton matching children shape** — generic skeleton requires
  knowing the children layout (KPI strip + panels vs table-only vs
  form). Default loading is a centered spinner Card. Consumers who
  need precision pass `loadingNode?: ReactNode` as an escape hatch.

State precedence is strict: when multiple states are set
simultaneously, only the highest-priority one renders. The order is
loading > error > empty > children. Switching between states
unmounts the prior state (no scroll-position preservation across
states; document as accepted trade-off).

## Alternatives rejected

- **PageShell owns `document.title` via internal hook** — picks
  winners between react-helmet / next/head / Vite SSG / custom
  PageMetaProvider. Each consumer's app has its own conventions.
  Layer-correctness: this is consumer-scope.
- **Skeleton loading mode** — requires templated layouts (KPI / table
  / form). Too rigid for the variety of dashboard pages. The
  `loadingNode` escape hatch covers all real cases without a
  combinatorial API explosion.
- **Sub-component compound (`<PageShell.Header>`, `<PageShell.Body>`,
  ...)** — Brief #5 explicitly rejected this; current API is prop-
  driven and easier to TypeScript-check.
- **Preserve children mounted across state transitions** —
  conditional class visibility instead of unmount. Adds complexity
  for marginal benefit; consumer can wrap with their own scroll-
  restoration if needed.

## Trade-offs

- **Tarball:** +~3-4 KB compressed for PageShell + its imports.
  Acceptable; PageShell deduplicates ~20 LOC × 13 pages = ~260 LOC
  in the consumer.
- **Unmount on state change:** scroll position resets when switching
  loading → content. Documented as accepted trade-off; consumer
  uses scroll-restoration libs if needed.
- **Generic loading spinner:** doesn't match children shape. The
  `loadingNode` prop lets consumers swap in a custom skeleton when
  precision matters.
- **No document.title management:** consumer must wire their own
  hook to `onTitleChange`. Trade-off accepted: layer-correctness
  beats one-liner DX.

## Companion decisions (from the plan ADRs)

- **D1** — `<DropdownMenu>` shipped as a new primitive in the same
  release. Pre-requisite for `DataTable.rowActions` and
  consolidates 5 prior direct-Radix usages.
- **D2** — `<ActionBar>` shipped as a new primitive in the same
  release. PageShell composes it; consumers can also use it
  standalone.
- **D4** — `<DataTable>` types resolve via the barrel `dist/index.d.ts`
  (Brief #4 D5 escalation). Generic `DataTable<T>` works correctly.
- **D5** — `<DataTable>` expandable defaults to multi-row;
  `expandMode="single"` opt-in.
- **D6** — `<DataTable>` sort and pagination support both controlled
  and uncontrolled modes from v1.
- **D7** — `<PinInput>` is props-driven (no `<PinInput.Slot>`
  compound at v1). Brief author confirmed via open question.

## Validation methodology

PageShell's value is measured by **boilerplate reduction in the
consumer**. TheoCloud will report LOC delta after migrating their 13
pages in a follow-up PR (out of scope for this plan). The expected
shape: ~20 LOC of bootstrap per page collapses to ~5-10 LOC.

## Industry precedent

- **Vercel dashboard** — `<DashboardPage>` wrapper with
  header / content slots
- **Linear** — `<Page>` scaffold with title / actions / states
- **GitHub** — per-route layouts that own header + state machine

## Consequences

- 13 dashboard pages in TheoCloud can migrate to `<PageShell>` in a
  follow-up consumer PR.
- Empty-state density violations (CC-3) close naturally: PageShell's
  empty prop delegates to `<EmptyState>`, which has consistent
  height + spacing across the library.
- Future page-level patterns (e.g. tabs, breadcrumbs) can be added
  as additional optional slots on PageShell without breaking
  existing consumers.
- Consumers wanting `document.title` integration with their stack
  (Next.js `<Head>`, react-helmet) wire it through
  `onTitleChange`. No library coupling.
