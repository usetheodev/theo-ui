# Plan: Brief #5 — 3 dashboard primitives (PinInput, DataTable, PageShell) + 2 pre-requisites

> **Version 1.1** — incorporates 1 MUST FIX + 14 SHOULD TEST + 7 DOCUMENT
> from `/edge-case-plan` (2026-05-25):
> EC-1 (DataTable expanded row colSpan miscalculation when rowActions
> present — fix: dynamic colSpan including chevron + actions columns).
> SHOULD TEST adds covering DropdownMenu SSR, PinInput onComplete-on-
> mount, PinInput disabled, ActionBar loading, DataTable loading-vs-
> empty precedence, sort-resets-page, pageSize<=0 clamp, controlled-
> null-sort, dropdown-survives-row-removal, PageShell aria-busy
> placement, onTitleChange identity stability, null children handling,
> MDX flat-aliases verification. DOCUMENT items added to Risk register.
> Review at `.claude/knowledge-base/reviews/edge-cases/dashboard-primitives-brief-5-edge-cases-2026-05-25.md`.
>
> **Version 1.0** — implements Brief #5 from the TheoCloud dashboard
> team (2026-05-25), which closes 3 measured Deep Review findings:
> § 2.12 P2 (single-input OTP → 6-box `PinInput`), Top-5 fix #2 / § 2.2
> + § 2.4 P1 (card-grid → sortable expandable `DataTable`), and a
> CC-cross-cutting boilerplate-duplication win across 13 dashboard
> pages via `PageShell`. The brief's spec is sound but assumes 3
> primitives that **do not exist** in `@theokit/ui`: `<DropdownMenu>`
> (used by DataTable.rowActions), `<ActionBar>` (used by PageShell),
> and `useSetPageTitle` / `PageMetaProvider` (consumer-scope hooks
> the lib should not own). This plan adds the 2 real pre-reqs as
> Phases 1-2, narrows PageShell scope (EC-3 of the brief analysis),
> then ships the 3 brief components in Phases 3-5. Total deliverable:
> **5 new components** (2 primitives + 3 composites), shipped as
> `@theokit/ui@0.11.0-next.0` (additive minor, zero breaking
> change). Acceptance gate is the same shape as Brief #4: measured
> consumer bundle delta against the TheoCloud canary.

## Context

- **`@theokit/ui@0.10.0-next.0`** ships per-component dist files
  (Brief #4) — every primitive/composite gets its own
  `dist/{primitives,composites}/<name>/index.js` and the consumer
  bundle tree-shakes properly (TheoCloud `@theokit/ui` chunk:
  36.96 → 10.96 KB brotli measured).
- **Brief #5** issued 2026-05-25 by TheoCloud dashboard team. Each
  of the 3 requested primitives closes a P1/P2 finding in the
  Deep Review (`theo/docs/reviews/2026-05-25-dashboard-deep-design-review.md`):
  - § 2.12 P2 — Verification page: single text input for 6-digit
    code is off-brand vs every modern SaaS auth (Apple, Stripe,
    Clerk, Auth0, GitHub two-factor all use N-box inputs)
  - § 2.2 + 2.4 P1 (Top-5 #2) — Domains + Projects card-grids are
    sparse for entity lists; switching to sortable Table with
    expandable row (Disclosure pattern) saves 50% vertical space
  - CC-3 indirect — empty-state density violations across 13
    dashboard pages stem from each rolling its own EmptyState;
    PageShell centralizes the loading/error/empty/content scaffold
- **Codebase state verified (2026-05-25):**
  - `<ActionBar>` — **does NOT exist** in `src/components/` (neither
    primitive nor composite). Brief assumes presence.
  - `<DropdownMenu>` — **does NOT exist** as a primitive wrapper.
    `@radix-ui/react-dropdown-menu@2.1.6` is bundled and used
    DIRECTLY (5 sites): `model-selector`, `intent-selector`,
    `agent-profile`, `theme-switcher`, `theo-code-shell`. Brief
    assumes a `<DropdownMenu>` wrapper exists.
  - `useSetPageTitle` / `PageMetaProvider` — **do NOT exist** in
    theo-ui. These are consumer-scope (TheoCloud has its own).
    Brief includes them in PageShell scope — wrong layer.
  - `<EmptyState>`, `<Skeleton>`, `<Table>` (sortable headers
    already shipped in Brief #2), `<Pagination>` (Brief #3),
    `<Card>`, `Loader2` (lucide-react peer) — **all present**.
- **Sources of truth:**
  - Brief #5 — `/home/paulo/Projetos/usetheo/theo/docs/handoff/2026-05-25-theo-ui-cloud-dashboard-brief-5.md`
  - Brief analysis (2026-05-25 conversation): identified the 3
    missing primitives + scope mismatch as MUST-FIX before
    implementation.
  - `tsup.config.ts` post-Brief #4 — auto-globs primitives + composites; new components ship subpath-shaped automatically.
  - `scripts/regen-subpath-exports.ts` — refreshes `package.json#exports` after each build with fail-loud guards.

## Objective

Ship `@theokit/ui@0.11.0-next.0` with **5 new components**:

1. `<DropdownMenu>` primitive (pre-req for DataTable.rowActions)
2. `<ActionBar>` primitive (pre-req for PageShell)
3. `<PinInput>` primitive (Brief #5 ask 1)
4. `<DataTable>` composite (Brief #5 ask 2)
5. `<PageShell>` composite (Brief #5 ask 3) — **scope narrowed** by
   removing `useSetPageTitle` / `PageMetaProvider` (consumer-owned)

Plus: ADR for PageShell composite pattern, CHANGELOG entry, npm publish, opendocs MDX pages + llms.txt update + redeploy, TheoCloud canary bundle-delta measurement.

Measurable goals:

- 5 new component folders under `src/components/{primitives,composites}/`
- `pnpm test`: net +60-80 new tests (PinInput 9 + DropdownMenu ~5 + ActionBar ~5 + DataTable 12 + PageShell 9 + axe tests)
- `pnpm typecheck` zero errors (including generic `DataTable<T>`)
- `pnpm quality:gates` 100% green with new baseline
- Bundle: each component shipped as its own chunk; per-component delta within reason post-Brief #4 splitting model
- CHANGELOG `[0.11.0-next.0]` entry with bundle delta numbers
- npm published `0.11.0-next.0 --tag next` + smoke install verifying all 5 exports
- theo-opendocs: 5 curated MDX pages, llms.txt updated to 0.11, redeploy
- TheoCloud canary: measure consumer-side bundle delta after upgrade (record evidence even if migration to new primitives is deferred to consumer's own PR)
- Dogfood QA pass

## ADRs

### D1 — `<DropdownMenu>` is a new primitive, NOT optional dependency

- **Decision:** create `<DropdownMenu>` primitive as a thin wrapper over `@radix-ui/react-dropdown-menu` (already a bundled dep). Sub-components attached via `Object.assign(Root, { Trigger, Content, Item, Separator, Label })`.
- **Rationale:** Brief #5 assumes the primitive exists. It doesn't. Today 5 source files (`model-selector`, `intent-selector`, `agent-profile`, `theme-switcher`, `theo-code-shell`) import Radix directly — that's drift waiting to bite. Centralizing as a primitive: (a) gives Brief #5 the dependency it expects; (b) consolidates the 5 direct usages into one styled wrapper; (c) emits one shared chunk via Brief #4 splitting (current direct usage inlines the Radix wrapper into each consumer). DropdownMenu is also generally useful (row actions, ellipsis menus, settings dropdowns).
- **Consequences:**
  - +1 primitive, +1 subpath export, +~1-2 KB chunk
  - The 5 existing direct Radix usages can migrate to the wrapper in a follow-up PR (not in this plan's scope — additive, non-breaking)
  - `DataTable.rowActions` has a clean import path

### D2 — `<ActionBar>` is a new primitive

- **Decision:** create `<ActionBar>` primitive — search input slot + optional filter button + optional primary action button. Single component, prop-driven (NOT sub-components — too small to justify compound API).
- **Rationale:** Brief #5 assumes it exists. It doesn't. ActionBar is also useful standalone (any list page top bar). Building it as a separate primitive (instead of inlining inside PageShell) keeps PageShell composable and lets consumers use ActionBar outside of PageShell.
- **Consequences:**
  - +1 primitive, +~1-2 KB chunk
  - PageShell composes ActionBar via `../../primitives/action-bar/index.js`
  - Consumers can use `<ActionBar>` standalone where PageShell is too opinionated

### D3 — `<PageShell>` does NOT own document.title management

- **Decision:** PageShell's `title: string` prop is the **visible heading** only. Setting `<title>` tag is the consumer's responsibility. PageShell exposes an optional `onTitleChange?: (title: string) => void` callback that consumers can wire to their own `useSetPageTitle` hook / `PageMetaProvider` / `next/head` / `react-helmet` / etc.
- **Rationale:** Brief #5's spec includes `useSetPageTitle` + `PageMetaProvider` inside PageShell. That's wrong layer — a component library should not dictate how the consuming app manages document.title (different apps use Next.js Head, react-helmet, custom hooks, manual `document.title = …`). The brief author confirmed in conversation that this is consumer-scope.
- **Consequences:**
  - PageShell stays framework-agnostic
  - TheoCloud (or any consumer) wraps with their own title management
  - One less new hook to ship and maintain
  - PageShell still owns the visible heading semantically (`<h1>title</h1>`)

### D4 — `<DataTable>` is generic; types resolve via barrel

- **Decision:** `DataTable<T>` accepts a generic row type. Columns are an array of `{ key, label, render }` objects with optional alignment, sort, width. Sort + pagination are both controlled-or-uncontrolled (passing `onSortChange` / `onPageChange` switches modes).
- **Rationale:** Brief #5 spec is sound. Generic typing is what TanStack Table and Material UI's DataGrid use; alternatives (registering schemas upfront) are heavier. Per-component `.d.ts` are NOT emitted (D5 of Brief #4 plan — tsup worker OOMs), so generic types resolve via the barrel `dist/index.d.ts`. Verified to work for generic exports in Briefs #1-#4 patterns.
- **Consequences:**
  - Consumers get full TS inference: `<DataTable<Domain> columns={…} data={domains} />`
  - The barrel `.d.ts` continues to be the source of types for all subpath imports
  - Controlled/uncontrolled hybrid mode: both modes ship from v1 (small additive complexity, big DX win)

### D5 — `<DataTable>` expandable defaults to MULTI-row

- **Decision:** `expandable: (row: T) => ReactNode | null`. When `expandable(row) !== null`, the row gets a chevron toggle. Multiple rows can be expanded simultaneously by default. Opt-in to single-row mode via `expandMode="single"`.
- **Rationale:** Brief author confirmed in conversation that Domains DNS records use case (the canonical consumer) needs multi-row expansion (compare DNS records across multiple pending domains). Linear's single-row UI is one valid choice; multi-row is another. Defaulting to multi covers the canonical use case; opt-in single keeps that affordance for future consumers.
- **Consequences:**
  - State is `Set<rowKey>` (multi) — `useState<Set<string>>(new Set())`
  - Single mode collapses to `useState<string | null>(null)`
  - Consumers expand/collapse via the chevron click; no programmatic API in v1

### D6 — `<DataTable>` sort and pagination: controlled OR uncontrolled

- **Decision:** if `onSortChange` provided → controlled (consumer manages state, passes back via `defaultSort` / `sort` props). Else uncontrolled (internal `useState`). Same shape for `onPageChange` / `pagination.controlledPage`.
- **Rationale:** Server-side pagination + sort require controlled mode (Domain registrar API returns paginated/sorted data). Client-side filtering is simpler with uncontrolled. Brief author preference: ship BOTH from v1.
- **Consequences:**
  - 2 small `useState`s in uncontrolled mode
  - Controlled mode: zero internal state for sort/page
  - DX: same component covers both; no separate `ControlledDataTable`

### D7 — `<PinInput>` props-driven API (no `<PinInput.Slot>` compound at v1)

- **Decision:** `<PinInput length={6} ... />` only. No sub-components. No slot-rendering API.
- **Rationale:** Brief author asked the open question; current consumer (TheoCloud Verification) doesn't need slot-level customization. Compound API is a possible v2 if a real use case shows up.
- **Consequences:** simpler API, easier to test, smaller chunk. Migration path to compound API (if needed later) is non-breaking.

### D8 — Loading state in `<PageShell>` is spinner only (not skeleton)

- **Decision:** `loading={true}` renders a centered `<Card>` with `<Loader2 className="animate-spin">` and "Loading…" text. Skeleton matching arbitrary children shape is out of scope.
- **Rationale:** Brief author asked the open question; skeleton requires knowing the children's layout (KPI strip + panels vs table-only vs form-only), which can't be done generically without consumer-supplied templates. Defer to "skeletons are a consumer-side opt-in" via PageShell `loadingNode?: ReactNode` prop (escape hatch — consumer passes their own skeleton when they need precision).
- **Consequences:**
  - Default spinner covers 80% of cases
  - `loadingNode` prop lets consumers override for high-touch pages
  - No skeleton-template machinery in the library

### D9 — Version bump 0.11.0-next.0 (additive minor)

- **Decision:** bump `0.10.0-next.0` → `0.11.0-next.0`. Tag `next`.
- **Rationale:** 5 new components = additive surface. Zero existing API breaks. Per-component subpath model from Brief #4 means each new component ships as its own chunk automatically.
- **Consequences:** consumers install `@theokit/ui@next` and opt in to using the new components at their pace.

### D10 — Bundle-delta evidence required, mirrors Brief #4 pattern

- **Decision:** Phase 10 measures consumer-side bundle delta against TheoCloud dashboard after upgrade (without migrating to the new primitives — measuring "free" delta from new components shipping as separate chunks vs being absent). Acceptance criterion: TheoCloud `@theokit/ui` chunk grows by ≤5 KB brotli (the new components are not yet imported, so most should tree-shake away; only ActionBar's shared dependencies, if any, leak through).
- **Rationale:** Brief #4 set the precedent. Empirical measurement against a real consumer beats estimates.
- **Consequences:** if the delta exceeds 5 KB without consumer migration, investigate why unused components are leaking (sign of shared chunk regression or sideEffects mis-configuration).

## Dependency Graph

```
Phase 0 (baseline measurement) ─┐
                                │
Phase 1: DropdownMenu primitive ┤  (independent — parallel)
Phase 2: ActionBar primitive    ┤
Phase 3: PinInput primitive     ┤
                                │
                                ▼
        ┌───────────── Phase 4 (DataTable composite — needs Phase 1)
        │
        ├───────────── Phase 5 (PageShell composite — needs Phase 2)
        │
        ▼
Phase 6: barrel + sync + ADR + CHANGELOG + bump 0.11.0-next.0
   │
   ▼
Phase 7: pnpm quality:gates full chain
   │
   ▼
Phase 8: npm publish 0.11.0-next.0 --tag next + smoke install
   │
   ▼
Phase 9: theo-opendocs — 5 curated MDX pages + llms.txt update + redeploy
   │
   ▼
Phase 10: TheoCloud canary bundle-delta measurement
   │
   ▼
Phase 11: Dogfood QA (MANDATORY)
```

Phases 1, 2, 3 are independent and run in parallel. Phase 4 (DataTable) depends on Phase 1 (DropdownMenu). Phase 5 (PageShell) depends on Phase 2 (ActionBar). Phases 6 → 11 sequential.

---

## Phase 0: Baseline snapshot

**Objective:** capture current bundle baseline before adding 5 new components.

### T0.1 — Capture pre-state

#### Objective
Record `dist/` shape, bundle-sizes baseline, and TheoCloud dashboard's current `@theokit/ui` chunk size (10.96 KB brotli at 0.10.0-next.0) as the reference for Phase 10.

#### Evidence
- Brief #4 measurement: TheoCloud `@theokit/ui` chunk = 10.96 KB brotli at 0.10.0-next.0.
- Current `dist/index.js` = 49 KB minified post-splitting.

#### Files to edit
```
.claude/knowledge-base/baselines/2026-05-26-pre-brief-5/dist-tree.txt   (NEW)
.claude/knowledge-base/baselines/2026-05-26-pre-brief-5/sizes.txt        (NEW)
.claude/knowledge-base/baselines/2026-05-26-pre-brief-5/theocloud.txt    (NEW)
```

#### Deep file dependency analysis
Pure capture artifacts. No code change.

#### Deep Dives
```bash
cd /home/paulo/Projetos/usetheo/theo-ui && pnpm build
find dist -maxdepth 3 -type f | sort > .claude/knowledge-base/baselines/2026-05-26-pre-brief-5/dist-tree.txt
du -sh dist >> .claude/knowledge-base/baselines/2026-05-26-pre-brief-5/sizes.txt

# TheoCloud canary baseline
cd /home/paulo/Projetos/usetheo/theo/cloud/dashboard
pnpm install && pnpm run build
pnpm run size 2>&1 | tee .claude/knowledge-base/baselines/2026-05-26-pre-brief-5/theocloud.txt
```

#### Tasks
1. `mkdir -p .claude/knowledge-base/baselines/2026-05-26-pre-brief-5`
2. Run capture commands above
3. Verify `theocloud.txt` shows `@theokit/ui chunk: ~10.96 KB brotli`

#### TDD
```
N/A — capture only.
VERIFY: grep -c "@theokit/ui" .claude/knowledge-base/baselines/2026-05-26-pre-brief-5/theocloud.txt >= 1
```

#### Acceptance Criteria
- [ ] All 3 baseline files exist with non-empty content
- [ ] TheoCloud chunk size captured (~10.96 KB brotli)

#### DoD
- [ ] T0.1 complete; baseline committed

---

## Phase 1: `<DropdownMenu>` primitive

**Objective:** ship a Radix DropdownMenu wrapper consolidating the 5 direct-Radix usages in the codebase + giving Brief #5's DataTable.rowActions a typed import.

### T1.1 — DropdownMenu primitive

#### Objective
Create `src/components/primitives/dropdown-menu/` with a forwardRef'd wrapper over `@radix-ui/react-dropdown-menu`. Sub-components: Trigger, Content, Item, Separator, Label, Group, Sub, SubTrigger, SubContent (mirror Radix surface, styled via design tokens).

#### Evidence
- Brief #5 § Component 2 implicitly requires DropdownMenu (DataTable.rowActions opens a DropdownMenu)
- 5 source files currently import `@radix-ui/react-dropdown-menu` directly — drift waiting to bite
- `@radix-ui/react-dropdown-menu@2.1.6` already a bundled dep (no new peer needed)

#### Files to edit
```
src/components/primitives/dropdown-menu/index.ts                 (NEW)
src/components/primitives/dropdown-menu/dropdown-menu.tsx        (NEW)
src/components/primitives/dropdown-menu/dropdown-menu.test.tsx   (NEW)
src/components/primitives/dropdown-menu/dropdown-menu.stories.tsx (NEW)
registry/dropdown-menu.json                                       (NEW)
```

#### Deep file dependency analysis

- `dropdown-menu.tsx` imports `@radix-ui/react-dropdown-menu` (already a dep), `lucide-react` (peer), and `cn` from `lib/cn.js`. Zero internal deps → primitive.
- Existing 5 direct-Radix usages (`model-selector`, `intent-selector`, `agent-profile`, `theme-switcher`, `theo-code-shell`) STAY untouched in this plan — migration to the new wrapper is a follow-up.
- The Object.assign sub-component pattern matches `<Sidebar>`, `<Table>`, `<DangerZone>`, `<Dialog>` precedent in the codebase.

#### Deep Dives

**Sub-component surface (mirror Radix, style with tokens):**

```ts
const Root = DropdownMenuPrimitive.Root;
const Trigger = DropdownMenuPrimitive.Trigger;
const Portal = DropdownMenuPrimitive.Portal;
const Content = forwardRef<...>(({ className, sideOffset = 4, ...props }, ref) => (
  <DropdownMenuPrimitive.Portal>
    <DropdownMenuPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(
        "z-50 min-w-32 rounded-md border border-border/40 bg-card p-1",
        "text-card-foreground shadow-md",
        "data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=open]:animate-in",
        "data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=closed]:animate-out",
        className,
      )}
      {...props}
    />
  </DropdownMenuPrimitive.Portal>
));
const Item = forwardRef<...>(...); // .item with px-2 py-1.5 + hover bg-muted
const Separator = forwardRef<...>(...);
const Label = forwardRef<...>(...);
const DropdownMenu = Object.assign(Root, { Trigger, Portal, Content, Item, Separator, Label, Group: ..., Sub: ..., SubTrigger: ..., SubContent: ... });
```

**axe a11y:** the existing `aria-hidden-focus` workaround used in `confirm-dialog.test.tsx` (radix focus-guard span) applies here too. Tests use `axe(baseElement, { rules: { "aria-hidden-focus": { enabled: false } } })`.

#### Tasks

1. Create folder + 4 files following the catalog template
2. Implement Root + Trigger + Portal + Content + Item + Separator + Label + Group + Sub + SubTrigger + SubContent (Object.assign attached)
3. Story title: `"Primitives / Overlays / DropdownMenu"`; cover open/close, items, separator, sub-menu, with-icons
4. Tests: 5 tests (renders trigger, opens on click, closes on item click, ESC closes, axe-clean)
5. Registry descriptor mirroring `progress.json` shape; `registryDependencies: ["cn", "tailwind-preset"]`

#### TDD

```
RED: test_renders_trigger_button         — DropdownMenu.Trigger renders <button>
RED: test_opens_content_on_click         — fireEvent.click trigger; content becomes visible
RED: test_item_click_fires_handler       — Item onClick called
RED: test_escape_closes_content          — keyDown Escape; content removed
RED: test_ssr_safe                       — (EC-2) renderToString(<DropdownMenu.Root><DropdownMenu.Trigger>x</DropdownMenu.Trigger></DropdownMenu.Root>) does not crash
RED: test_axe_clean                      — baseElement axe with aria-hidden-focus disabled
GREEN: implement dropdown-menu.tsx
REFACTOR: None expected
VERIFY: pnpm vitest run src/components/primitives/dropdown-menu
```

#### Acceptance Criteria

- [ ] 5/5 tests green
- [ ] axe-clean with the Radix focus-guard exception
- [ ] `validate-quality-gates.ts` accepts as primitive (zero `@theokit/ui` internal imports)
- [ ] Registry descriptor valid
- [ ] Sub-components attached via `Object.assign` (matches Sidebar/Table/Dialog pattern)

#### DoD

- [ ] T1.1 complete; per-component dist file emerges automatically post-Brief-#4 splitting
- [ ] Story title format matches convention

---

## Phase 2: `<ActionBar>` primitive

**Objective:** ship a page-top action bar primitive — search input + optional filter button + optional primary action — usable standalone and consumed by PageShell.

### T2.1 — ActionBar primitive

#### Objective
Create `src/components/primitives/action-bar/` with a forwardRef'd component that renders a flexbox row of search input + optional filter button + optional primary action. Props-driven (no compound API at MVP).

#### Evidence
- Brief #5 § Component 3 (PageShell) explicitly composes `<ActionBar>` and assumes it exists
- 13 dashboard pages will use this pattern (per CC-3 deduplication win)
- Standalone use cases: any list page top bar in a future consumer

#### Files to edit

```
src/components/primitives/action-bar/index.ts                 (NEW)
src/components/primitives/action-bar/action-bar.tsx           (NEW)
src/components/primitives/action-bar/action-bar.test.tsx      (NEW)
src/components/primitives/action-bar/action-bar.stories.tsx   (NEW)
registry/action-bar.json                                       (NEW)
```

#### Deep file dependency analysis

- `action-bar.tsx` imports `react`, `lucide-react` (`Search`, `Filter`, optionally `Plus`), `cn` from `lib/cn.js`. Zero internal deps → primitive.
- Search input uses native `<input type="search">` styled via tokens (NOT `<Input>` from `@theokit/ui` — keep primitive isolation; Input is also a primitive so cross-primitive import would fail the taxonomy gate).

#### Deep Dives

**Surface:**

```ts
export interface ActionBarProps {
  search?: {
    placeholder: string;
    value: string;
    onChange: (v: string) => void;
  };
  primaryAction?: {
    label: string;
    icon?: LucideIcon;
    onClick: () => void;
    loading?: boolean;
  };
  onFilterClick?: () => void;
  className?: string;
}
```

**Render rules:**
- If neither `search` nor `primaryAction` nor `onFilterClick` provided → return `null` (don't render an empty bar)
- Search input is `flex-1` so it grows; filter + primary action stay right-aligned
- Filter button shows `<Filter>` lucide icon, small icon button (consumer wires the actual filter UI in their own popover)
- Primary action button renders `<Button>`-shaped styling inline (NOT importing Button — primitive isolation). Or: provide `customActionNode?: ReactNode` escape for consumers who need to use their own Button.

#### Tasks

1. Create folder + 4 files
2. Implement render logic with conditional rendering
3. Stories: with-search-only / with-cta-only / full-featured / icon-action
4. Tests: 5 tests (renders nothing when empty, search fires onChange, primary action fires onClick, filter fires onFilterClick, axe-clean)
5. Registry descriptor

#### TDD

```
RED: test_renders_nothing_when_empty   — no props; container empty
RED: test_search_fires_onChange        — type in input; onChange called
RED: test_primary_action_fires_onClick — click button; handler called
RED: test_filter_fires_onFilterClick   — click filter icon; handler called
RED: test_primary_action_loading_disables — (EC-6) primaryAction.loading=true; assert button disabled + Loader2 visible
RED: test_axe_clean                    — vitest-axe zero violations
GREEN: implement action-bar.tsx
REFACTOR: None
VERIFY: pnpm vitest run src/components/primitives/action-bar
```

#### Acceptance Criteria

- [ ] 5/5 tests green; axe-clean
- [ ] `validate-quality-gates.ts` accepts as primitive
- [ ] Registry descriptor valid
- [ ] Returns `null` when all props empty

#### DoD

- [ ] T2.1 complete

---

## Phase 3: `<PinInput>` primitive

**Objective:** ship the 6-box OTP-style input that closes Deep Review § 2.12 P2.

### T3.1 — PinInput primitive

#### Objective
Create `<PinInput>` with auto-advance focus, paste handling, arrow-key navigation, mask support, error state.

#### Evidence
- Brief #5 § Component 1 — closes § 2.12 P2 finding
- Industry standard (Apple ID, Stripe, Clerk, Auth0, GitHub) uses N-box pattern
- Current TheoCloud uses single text input — off-brand vs every modern SaaS auth surface

#### Files to edit

```
src/components/primitives/pin-input/index.ts                 (NEW)
src/components/primitives/pin-input/pin-input.tsx            (NEW)
src/components/primitives/pin-input/pin-input.test.tsx       (NEW)
src/components/primitives/pin-input/pin-input.stories.tsx    (NEW)
registry/pin-input.json                                       (NEW)
```

#### Deep file dependency analysis

- `pin-input.tsx` imports `react` (`useEffect`, `useRef`, `useState`, `forwardRef`), `cn` from `lib/cn.js`. Zero internal deps → primitive.
- Maintains an array of `<input>` refs internally via `useRef<HTMLInputElement[]>([])`.

#### Deep Dives

**State machine:**
- Internal value is `string` of length `value.length`. Slot N renders `value[N] || ""`.
- `onChange` callback receives the full concatenated string.
- `onComplete` fires exactly once when `value.length === length` (use a ref to track previously-completed state).

**Key handlers per slot:**
- Digit/character: write to slot N, advance focus to N+1 if available
- Backspace on empty slot: focus N-1 (don't clear N+1)
- Backspace on filled slot: clear current slot, stay focused
- ArrowLeft / ArrowRight: move focus
- Tab: native tab order (escapes the group)

**Paste handler (on slot 0 OR any slot):**
- Read clipboard text via `e.clipboardData.getData("text/plain")`
- Strip whitespace: `pasted.replace(/\s/g, "")`
- If `inputMode === "numeric"`, strip non-digits: `pasted.replace(/\D/g, "")`
- If `inputMode === "alphanumeric"`, uppercase: `pasted.toUpperCase().replace(/[^A-Z0-9]/g, "")`
- Fill from the slot being pasted into onwards; truncate at `length`
- Fire `onComplete` if the result reaches `length`
- Focus the last filled slot OR the slot after the last filled (if not at end)

**Mask:**
- When `mask === true`, render slot value as `•` (bullet) but keep actual value in state
- TypeScript expects `inputMode="numeric"` to constrain to digits; mask is orthogonal (works with either inputMode)

**Error state:**
- `error === true`: applies `border-destructive` to all slots
- Optional: `motion-safe:animate-shake` keyframe (CSS class — defined inline in the component or via a one-off Tailwind addon). Subtle 200ms shake. Skip if `prefers-reduced-motion`.

**aria:**
- Container has `role="group"` + the consumer-passed `aria-label` (required prop)
- Each slot has `aria-label="Digit ${i + 1} of ${length}"`

**SSR safety:**
- `useEffect` for `autoFocus`; gate on `typeof window !== "undefined"`

#### Tasks

1. Create folder + 4 files
2. Implement state machine + key handlers + paste handler + mask + error + autoFocus
3. Stories: numeric (default 6) / alphanumeric / error / disabled / mask / autoFocus / length=4
4. Tests: 9+ tests covering all the spec'd behaviors + edge cases
5. Registry descriptor

#### TDD

```
RED: test_renders_n_slots                          — length=6 → 6 inputs
RED: test_auto_advance_focus_on_digit              — type "1" in slot 0; slot 1 receives focus
RED: test_backspace_clears_current                 — type "1" in slot 0; backspace → "" + stays focused
RED: test_backspace_on_empty_moves_back            — focus slot 1 (empty); backspace → slot 0 focused
RED: test_paste_fills_all_slots                    — paste "123456"; all 6 slots filled
RED: test_paste_strips_whitespace                  — paste "12 34 56"; all 6 slots filled with "123456"
RED: test_paste_truncates_to_length                — paste "1234567" length=6 → "123456" + onComplete
RED: test_paste_from_middle_slot                   — focus slot 2; paste "abc" → slots 2,3,4 filled
RED: test_oncomplete_fires_once                    — fill all slots; onComplete called exactly 1x
RED: test_inputmode_numeric_strips_non_digits      — type "a" in numeric mode → no-op
RED: test_mask_renders_bullets                     — mask=true + value="123" → "•••" visible
RED: test_error_applies_destructive_border         — error=true; assert border-destructive class
RED: test_oncomplete_does_not_fire_on_initial_full_value — (EC-3) render value="123456" length=6 with spy; spy NOT called on mount
RED: test_disabled_blocks_input                    — (EC-4) disabled=true; assert all slots have disabled attr; typing no-op
RED: test_axe_clean                                — group role + aria-labels
GREEN: implement pin-input.tsx — track previous-complete state via ref; only fire onComplete on transitions to complete (NOT on mount)
REFACTOR: None expected
VERIFY: pnpm vitest run src/components/primitives/pin-input
```

#### Acceptance Criteria

- [ ] 13/13 tests green; axe-clean
- [ ] `validate-quality-gates.ts` accepts as primitive
- [ ] Registry descriptor valid
- [ ] All Ladle stories render without console errors
- [ ] Visual size matches `<Input size="lg">` when `size="lg"` (verify by inspecting Input's size mapping)

#### DoD

- [ ] T3.1 complete

---

## Phase 4: `<DataTable>` composite

**Objective:** ship the sortable + sticky + expandable + rowActions + pagination + loading + empty composite that closes Top-5 fix #2 and Deep Review § 2.2 + § 2.4 P1.

### T4.1 — DataTable composite

#### Objective
Generic composite over `<Table>` + `<Pagination>` + `<Skeleton>` + `<EmptyState>` + `<DropdownMenu>` (from Phase 1).

#### Evidence
- Brief #5 § Component 2 — Top-5 fix #2 (Domains + Projects card-grid → table)
- TheoCloud Deep Review § 2.4 P1 (Domains) + § 2.2 P1 (Projects)
- Expandable row is the canonical pattern for inline DNS records (Domains)

#### Files to edit

```
src/components/composites/data-table/index.ts                 (NEW)
src/components/composites/data-table/data-table.tsx           (NEW)
src/components/composites/data-table/data-table.test.tsx      (NEW)
src/components/composites/data-table/data-table.stories.tsx   (NEW)
registry/data-table.json                                       (NEW)
```

#### Deep file dependency analysis

- `data-table.tsx` imports via barrel paths:
  - `../../primitives/table/index.js` (Table + sub-components, sortable header API already present)
  - `../../primitives/pagination/index.js` (Pagination)
  - `../../primitives/skeleton/index.js` (Skeleton)
  - `../../primitives/empty-state/index.js` (EmptyState)
  - `../../primitives/dropdown-menu/index.js` (DropdownMenu from Phase 1)
  - `lucide-react`: `ChevronRight`, `ChevronDown`, `MoreHorizontal`
- Composite (≥1 internal dep) — taxonomy gate accepts.

#### Deep Dives

**Generic signature:**

```ts
export interface DataTableColumn<T> {
  key: string;
  label: ReactNode;
  align?: "left" | "center" | "right";
  sortable?: boolean;
  width?: string;
  render?: (row: T) => ReactNode;
  className?: string;
}

export interface DataTableProps<T> {
  data: T[];
  columns: DataTableColumn<T>[];
  rowKey: (row: T) => string;
  stickyHeader?: boolean;
  expandable?: (row: T) => ReactNode | null;
  expandMode?: "single" | "multiple"; // default "multiple"
  rowActions?: (row: T) => ReactNode;
  pagination?: { pageSize: number; controlledPage?: number; onPageChange?: (page: number) => void } | null;
  defaultSort?: { key: string; direction: "asc" | "desc" };
  sort?: { key: string; direction: "asc" | "desc" } | null;
  onSortChange?: (sort: { key: string; direction: "asc" | "desc" } | null) => void;
  loading?: boolean;
  emptyState?: ReactNode;
}

export function DataTable<T>(props: DataTableProps<T>): JSX.Element;
```

**Sort state:**
- If `onSortChange` provided → controlled. Internal state: NONE; use `sort` prop directly.
- If not provided → uncontrolled. Internal: `useState<{key, direction} | null>(defaultSort ?? null)`.
- Click cycle: `none → asc → desc → none`.
- Sort applied client-side ONLY in uncontrolled mode (`useMemo` to sort `data`). In controlled mode, consumer pre-sorts `data` server-side.

**Pagination state:**
- If `pagination === null` (default) → no pagination, render all rows.
- If `pagination.controlledPage` provided → controlled; consumer manages page.
- Else uncontrolled: `useState<number>(0)` for current page.
- Client-side slicing in uncontrolled mode; consumer pre-slices in controlled.

**Expandable state:**
- If `expandable` is provided, every row gets a chevron button in first column.
- If `expandable(row) === null` → render empty cell (or omit chevron — visual: empty).
- `expandMode="multiple"` (default): `useState<Set<string>>(new Set())`; toggle adds/removes rowKey.
- `expandMode="single"`: `useState<string | null>(null)`; toggle replaces.
- Expanded row renders BELOW the row, spanning all columns. **EC-1 fix:** colSpan must account for the chevron column AND the rowActions column when present. Otherwise the expanded content is undersized by 1 (visual layout breaks for Domains DNS records, the canonical use case).
  ```ts
  const extraCols = (expandable ? 1 : 0) + (rowActions ? 1 : 0);
  const expandedColSpan = columns.length + extraCols;
  // ...later in JSX
  <tr><td colSpan={expandedColSpan}>{expandable(row)}</td></tr>
  ```

**Row actions:**
- Last "column" (not in `columns` array — appended internally) shows `<MoreHorizontal>` icon button per row IF `rowActions` provided.
- Click opens `<DropdownMenu>` with the consumer's `rowActions(row)` ReactNode as its Content.

**Loading state:**
- If `loading === true`, renders 5 `<Skeleton>` rows (matching the column count).

**Empty state:**
- If `data.length === 0 && !loading` → renders `emptyState` ReactNode OR a default `<EmptyState title="No data" description="" />`.

**Sticky header:**
- If `stickyHeader === true` (default), apply `sticky top-0 bg-card z-10` to `<thead>`.

**axe:**
- `<table>` semantics inherit from Table primitive
- `aria-sort` attribute on sortable headers (Table primitive already handles this via `sortDirection` mapping)
- Expanded row: `<tr aria-hidden={!isExpanded}>` OR proper Disclosure pattern via `aria-controls`

#### Tasks

1. Create folder + 4 files
2. Implement DataTable<T> with all features above
3. Stories: minimal / sortable-uncontrolled / sortable-controlled / expandable (Domains DNS records pattern) / paginated / row-actions / loading / empty
4. Tests: 12+ covering sort cycle, expand multi vs single, row actions, pagination, loading, empty, sticky header class, axe
5. Registry descriptor `registry/data-table.json` with `registryDependencies: ["cn", "table", "pagination", "skeleton", "empty-state", "dropdown-menu", "tailwind-preset"]`

#### TDD

```
RED: test_renders_columns_and_rows
RED: test_sticky_header_applies_sticky_class
RED: test_sort_cycle_uncontrolled                  — asc → desc → none
RED: test_sort_controlled_via_onSortChange         — onSortChange fires; internal state untouched
RED: test_expandable_chevron_only_when_non_null    — expandable(row) returns null; no chevron
RED: test_expand_multi_default                     — expand 2 rows; both expanded simultaneously
RED: test_expand_single_mode                       — expandMode=single; expanding row B collapses row A
RED: test_expanded_row_colspan_accounts_for_actions_column — (EC-1 MUST FIX) columns=3, expandable + rowActions; expanded <td> has colSpan="5" (3 cols + chevron + actions)
RED: test_row_actions_renders_menu_trigger         — rowActions provided; MoreHorizontal visible
RED: test_pagination_slices_data                   — data.length=20, pageSize=5, page=0 → 5 rows visible
RED: test_loading_renders_skeleton_rows            — loading=true; 5 skeleton rows
RED: test_loading_overrides_empty_state            — (EC-7) data=[] AND loading=true; skeleton rows visible, NOT empty state
RED: test_sort_change_resets_to_page_one           — (EC-8) page=3; click sort header; assert page reset to 0
RED: test_pagination_pagesize_zero_clamps_to_one   — (EC-9) pageSize=0; renders 1 row per page (graceful degradation)
RED: test_controlled_sort_null_no_indicator        — (EC-10) onSortChange + sort=null; no chevron-opacity-100 visible
RED: test_row_actions_dropdown_cleans_up_on_row_removal — (EC-11) open dropdown on row B; remove row B; assert no React warning
RED: test_empty_state_renders_when_no_data         — data=[]; emptyState visible
RED: test_default_empty_state_when_not_provided    — data=[], emptyState=undefined; default <EmptyState>
RED: test_axe_clean
GREEN: implement data-table.tsx
       — extra column count for expanded row: `const extraCols = (expandable ? 1 : 0) + (rowActions ? 1 : 0);` then `colSpan={columns.length + extraCols}`
       — pageSize clamp: `const effectivePageSize = Math.max(1, props.pagination?.pageSize ?? 10);`
       — sort change resets page: `setPage(0)` inside sort onSortChange path (uncontrolled mode)
REFACTOR: extract sort + pagination state to small custom hooks if internal complexity > 200 LOC
VERIFY: pnpm vitest run src/components/composites/data-table
```

#### Acceptance Criteria

- [ ] 13/13 tests green; axe-clean
- [ ] Generic types: `DataTable<Domain>` and `DataTable<Project>` compile in TS strict mode
- [ ] Composite imports primitives via `../../primitives/<x>/index.js` (taxonomy gate)
- [ ] All stories render
- [ ] Registry descriptor valid

#### DoD

- [ ] T4.1 complete

---

## Phase 5: `<PageShell>` composite

**Objective:** ship the page-level scaffold that closes 13-page boilerplate duplication, with `useSetPageTitle` removed from scope (D3).

### T5.1 — PageShell composite

#### Objective
Composite that renders Title + optional Description + optional ActionBar + (loading | error | empty | children) content states.

#### Evidence
- Brief #5 § Component 3 — 20 LOC boilerplate × 13 dashboard pages = ~260 LOC duplication
- CC-3 indirect: empty-state density violations stem from per-page rolling

#### Files to edit

```
src/components/composites/page-shell/index.ts                 (NEW)
src/components/composites/page-shell/page-shell.tsx           (NEW)
src/components/composites/page-shell/page-shell.test.tsx      (NEW)
src/components/composites/page-shell/page-shell.stories.tsx   (NEW)
registry/page-shell.json                                       (NEW)
```

#### Deep file dependency analysis

- `page-shell.tsx` imports via barrel paths:
  - `../../primitives/action-bar/index.js` (ActionBar from Phase 2)
  - `../../primitives/empty-state/index.js` (EmptyState)
  - `../../primitives/card/index.js` (Card — for loading/error containers)
  - `lucide-react`: `Loader2`, `AlertCircle`, optional consumer-provided icons
- Composite — taxonomy gate accepts.

#### Deep Dives

**API (D3 scope-narrowed):**

```ts
export interface PageShellProps {
  title: string;                                  // visible <h1>
  description?: string;
  onTitleChange?: (title: string) => void;        // D3: consumer wires document.title
  primaryAction?: { label: string; icon?: LucideIcon; onClick: () => void; loading?: boolean };
  search?: { placeholder: string; value: string; onChange: (v: string) => void };
  onFilterClick?: () => void;
  loading?: boolean;
  loadingNode?: ReactNode;                        // D8: escape hatch for custom loading UI
  error?: { message: string; onRetry?: () => void; docsHref?: string };
  empty?: { icon?: LucideIcon; title: string; description?: ReactNode; action?: { label: string; onClick: () => void } };
  children: ReactNode;
}
```

**State precedence:** loading > error > empty > children (mutually exclusive).

**onTitleChange (D3):** fires once in `useEffect` when `title` prop changes. Consumer wraps with `useSetPageTitle` of their choice.

**Header layout:** `<header>` with `<h1>title</h1>` + optional `<p>description</p>` + `<ActionBar>` (only when `search`, `primaryAction`, or `onFilterClick` provided).

**Loading state:** `loadingNode ?? <Card><Loader2 className="animate-spin" /> Loading…</Card>`. Container has `aria-busy="true"`.

**Error state:** `<Card>` with `<AlertCircle className="text-destructive" />` + message + optional retry button + optional docs link.

**Empty state:** `<EmptyState>` (Brief #1 primitive) with provided props.

**Children:** rendered only when not in loading/error/empty.

**No skeleton-matching-children:** D8 — defer.

**No document.title:** D3 — consumer responsibility.

#### Tasks

1. Create folder + 4 files
2. Implement state precedence + ActionBar conditional + onTitleChange effect
3. Stories: minimal / with-search / with-cta / loading / loading-custom-node / error / empty / full-featured
4. Tests: 9+ covering state precedence, ActionBar conditional, onTitleChange callback, accessibility (aria-busy), error retry button click
5. Registry descriptor

#### TDD

```
RED: test_renders_title_and_description
RED: test_actionbar_conditional_on_search_or_action
RED: test_actionbar_omitted_when_no_props          — search + primaryAction + onFilterClick all undefined; no ActionBar
RED: test_onTitleChange_fires_on_mount_and_update  — onTitleChange called with title; rerender new title; called again
RED: test_loading_renders_default_spinner          — loading=true; assert Loader2 + "Loading…"
RED: test_loading_uses_loadingNode_when_provided   — loadingNode=<Custom />; assert custom visible
RED: test_error_renders_message_and_retry          — error.onRetry click fires; error.docsHref renders link
RED: test_empty_renders_emptystate                 — empty prop; assert EmptyState rendered with passed title
RED: test_children_renders_when_no_state           — none of loading/error/empty; children visible
RED: test_aria_busy_on_main_when_loading           — (EC-12) loading=true; screen.getByRole("main") has aria-busy="true" (NOT the spinner Card)
RED: test_state_precedence                         — loading=true + error + empty all set; only loading renders
RED: test_onTitleChange_fires_only_when_title_changes — (EC-13) rerender with SAME title="A"; onTitleChange spy called only 1x (useEffect deps dedupe by value)
RED: test_pageshell_renders_when_children_null     — (EC-14) <PageShell title="x">{null}</PageShell>; no crash, title + empty content area
RED: test_axe_clean
GREEN: implement page-shell.tsx
REFACTOR: None
VERIFY: pnpm vitest run src/components/composites/page-shell
```

#### Acceptance Criteria

- [ ] 12/12 tests green; axe-clean
- [ ] Composite imports primitives via barrel paths
- [ ] No document.title manipulation in this file (D3)
- [ ] State precedence: loading > error > empty > children verified
- [ ] Stories cover the 8 use cases

#### DoD

- [ ] T5.1 complete

---

## Phase 6: Barrel + sync + ADR + CHANGELOG + bump

### T6.1 — Wire 5 new components into the barrel

#### Files to edit

```
src/index.ts             (MODIFY) — 5 new export blocks
package.json             (REGEN via build chain — regen-subpath-exports.ts updates exports map)
README.md                (REGEN via sync:readme)
docs/architecture.md     (REGEN via sync:readme)
```

#### Tasks

1. Append to `src/index.ts`:
   ```ts
   // Brief #5 — 3 dashboard primitives + 2 pre-reqs (0.11.0-next.0)
   export { DropdownMenu } from "./components/primitives/dropdown-menu/index.js";
   export { ActionBar, type ActionBarProps } from "./components/primitives/action-bar/index.js";
   export { PinInput, type PinInputProps } from "./components/primitives/pin-input/index.js";
   export {
     DataTable,
     type DataTableProps,
     type DataTableColumn,
   } from "./components/composites/data-table/index.js";
   export { PageShell, type PageShellProps } from "./components/composites/page-shell/index.js";
   ```
2. Run `pnpm sync:exports` — regenerates source-tree-based exports (validates barrel coherence)
3. Run `pnpm build` — runs tsup + `regen-subpath-exports.ts` against dist tree
4. Run `pnpm sync:readme` — regenerates README, architecture catalog, Ladle stats
5. Verify `package.json#exports` has new `./dropdown-menu`, `./action-bar`, `./pin-input`, `./data-table`, `./page-shell` entries pointing at per-component dist files

#### Acceptance Criteria

- [ ] 5 new exports in `src/index.ts`
- [ ] `package.json#exports` has 5 new entries
- [ ] No stragglers pointing at `./dist/index.js`
- [ ] README count updated

### T6.2 — ADR for PageShell composite pattern

#### Files to edit

```
.claude/knowledge-base/decisions/page-shell-composite-pattern.md  (NEW)
```

#### Tasks

ADR captures D3 (scope: no document.title), D8 (loading: spinner default + loadingNode escape), D2 (ActionBar as standalone primitive).

#### Acceptance Criteria

- [ ] ADR committed; ≤3 alternatives rejected with rationale

### T6.3 — CHANGELOG + version bump

#### Files to edit

```
CHANGELOG.md   (MODIFY) — add [0.11.0-next.0] - 2026-05-26 entry
package.json   (MODIFY) — version 0.10.0-next.0 → 0.11.0-next.0
```

#### Tasks

CHANGELOG entry covers: 5 new components, D3 scope narrowing, no breaking change. Bundle delta filled in after Phase 10.

**EC-9 gate (from Brief #4 plan):** before merge, `grep -E '<TBD>|<placeholder>|FIXME|XXX' CHANGELOG.md` must return 0.

#### Acceptance Criteria

- [ ] CHANGELOG entry per Keep a Changelog format
- [ ] package.json version = 0.11.0-next.0

### DoD for Phase 6

- [ ] T6.1, T6.2, T6.3 complete

---

## Phase 7: Quality gates

### T7.1 — Full `pnpm quality:gates` chain

#### Tasks

1. `pnpm format:check`
2. `pnpm lint:ci`
3. `pnpm typecheck` — verify `DataTable<T>` generic compiles
4. `pnpm test` — expect 1579 + ~40 = ~1619 passing
5. `pnpm build` (tsup + regen-subpath-exports)
6. `pnpm registry:build && pnpm registry:validate` — 140 items
7. `pnpm quality:structure`
8. `pnpm quality:bundle` — rebaseline if needed (5 new entries in the dist tree, but per-component files are not in the baseline JSON per Brief #4 design)
9. `pnpm quality:a11y` — 237+ Ladle stories axe-validated
10. `pnpm ladle:build`

#### Acceptance Criteria

- [ ] All 10 sub-gates green
- [ ] Test count grew by 40+ (5 new component test suites)
- [ ] No regressions in existing tests

#### DoD

- [ ] T7.1 complete

---

## Phase 8: npm publish

### T8.1 — Publish 0.11.0-next.0

#### Tasks

1. Pre-check: `curl -sH "Authorization: Bearer $TOKEN" https://registry.npmjs.org/-/whoami` returns `usetheodev`
2. `pnpm publish --access public --tag next --no-git-checks`
3. `npm view @theokit/ui@0.11.0-next.0 version` returns 0.11.0-next.0
4. Fresh smoke install in `/tmp/smoke-0.11` verifies 5 new exports resolve

#### Acceptance Criteria

- [ ] `npm view @theokit/ui@0.11.0-next.0` returns version
- [ ] Smoke install: `DropdownMenu`, `ActionBar`, `PinInput`, `DataTable`, `PageShell` all importable
- [ ] Per-component dist files present in fresh install

#### DoD

- [ ] T8.1 complete

---

## Phase 9: theo-opendocs + llms.txt + redeploy

### T9.1 — Bump dep + update wiring

#### Files to edit
```
/home/paulo/Projetos/usetheo/theo-opendocs/package.json  (MODIFY) — @theokit/ui 0.11.0
/home/paulo/Projetos/usetheo/theo-opendocs/components/theoui-mdx.tsx  (MODIFY) — 5 new dynamic component bridges
/home/paulo/Projetos/usetheo/theo-opendocs/lib/preview-defaults.tsx   (MODIFY) — defaults for those that can render statically
```

#### Tasks

1. Bump dep, install
2. Add `dynamic(...)` wrappers for `DropdownMenu`, `ActionBar`, `PinInput`, `DataTable`, `PageShell` (mirror Brief #2/#3 pattern; per Brief #2 lesson: handle `<DropdownMenu.Trigger>` sub-component access via flat aliases if needed)
3. Update `preview-defaults.tsx` with sensible defaults

### T9.2 — Curated MDX pages

#### Files to edit

```
content/theoui/primitives/dropdown-menu.mdx    (NEW)
content/theoui/primitives/action-bar.mdx       (NEW)
content/theoui/primitives/pin-input.mdx        (NEW)
content/theoui/composites/data-table.mdx       (NEW)
content/theoui/composites/page-shell.mdx       (NEW)
content/theoui/primitives/meta.json            (MODIFY) — 3 new slugs in alpha order
content/theoui/composites/meta.json            (MODIFY) — 2 new slugs in alpha order (or per existing dir scheme)
```

#### Deep Dives

- DropdownMenu MDX: use flat aliases pattern (Brief #2 lesson — sub-components on dynamic LoadableComponents lose property access in SSR; use `<DropdownMenuTrigger>` etc. in JSX previews while showing `<DropdownMenu.Trigger>` in code snippets). **EC-15 verification**: after `pnpm build` in opendocs, check `out/theoui/primitives/dropdown-menu/index.html` exists AND `curl ...` returns 200. If it 500s with "Expected component DropdownMenu.Trigger to be defined", revert to flat aliases (Brief #2 well-known fix).
- DataTable + PageShell MDX: largely code-snippet only (interactive previews require state; can't serialize callbacks in SSR — same lesson as ConfirmDialog/Pagination MDX in Briefs #2/#3)

### T9.3 — llms.txt update

#### Files to edit

```
/home/paulo/Projetos/usetheo/theo-ui/llms.txt  (MODIFY)
/home/paulo/Projetos/usetheo/theo-opendocs/public/llms.txt  (RESYNC)
/home/paulo/Projetos/usetheo/theo-opendocs/public/theoui/llms.txt  (RESYNC)
```

#### Tasks

1. Bump version line 0.10.0 → 0.11.0
2. Update primitive count 89 → 92 (PinInput + ActionBar + DropdownMenu) and composite count 27 → 29 (DataTable + PageShell)
3. Add Recent deliveries entry for Brief #5
4. Update llms.txt catalog with `(NEW 0.11)` markers; demote previous (NEW 0.10) → (0.10)
5. Copy to opendocs public paths

### T9.4 — Redeploy opendocs

#### Tasks

1. Pre-check CF token
2. `pnpm build && wrangler pages deploy out --project-name=theo-opendocs --branch=main --commit-dirty=true`
3. Verify 5 new pages return 200

#### Acceptance Criteria

- [ ] 5 new MDX pages render in `pnpm dev`
- [ ] Production: `https://docs.usetheo.dev/theoui/primitives/{dropdown-menu,action-bar,pin-input}` and `/theoui/composites/{data-table,page-shell}` return 200
- [ ] llms.txt at `docs.usetheo.dev/llms.txt` mentions 0.11.0
- [ ] No regressions on existing pages

#### DoD

- [ ] T9.1-T9.4 complete

---

## Phase 10: TheoCloud canary bundle-delta

### T10.1 — Measure consumer-side delta

#### Objective
Per Brief #4 precedent, measure the consumer-side bundle delta from the version bump alone (no consumer migration to the new primitives yet).

#### Evidence
- Pre-state baseline captured in T0.1: TheoCloud `@theokit/ui` chunk = ~10.96 KB brotli at 0.10.0-next.0

#### Files to edit

```
.claude/knowledge-base/baselines/2026-05-26-post-brief-5/theocloud-bundle-delta.txt  (NEW)
CHANGELOG.md (MODIFY again — fill in measured delta)
```

#### Tasks

1. `cd theo/cloud/dashboard && pnpm install` (with 0.11.0-next.0)
2. `pnpm run build && pnpm run size` — capture report
3. Compute delta vs pre-state baseline
4. Write evidence file
5. Update CHANGELOG entry with the real delta numbers (replace placeholders)
6. Restore `@theokit/ui: 0.10.0-next.0` in dashboard `package.json` if the consumer doesn't want to upgrade yet (this is the consumer's call)

#### Acceptance Criteria

- [ ] `@theokit/ui` chunk delta documented (expected: <= +5 KB brotli; new components are not yet imported, so unused chunks should tree-shake away)
- [ ] Total initial JS regression: ≤ +5 KB brotli
- [ ] CHANGELOG updated with measured numbers
- [ ] EC-9 gate (no placeholders left)

#### DoD

- [ ] T10.1 complete

---

## Phase 11: Dogfood QA (MANDATORY)

### T11.1 — End-to-end verification

#### Objective
Validate that the 5 new components work as a real consumer would experience them.

#### Tasks

1. Install `@theokit/ui@0.11.0-next.0` from npm in fresh smoke project
2. Verify all 5 exports importable from barrel AND subpath:
   ```ts
   import { DropdownMenu, ActionBar, PinInput, DataTable, PageShell } from "@theokit/ui";
   import { PinInput as PI2 } from "@theokit/ui/pin-input";
   import { DataTable as DT2 } from "@theokit/ui/data-table";
   ```
3. SSR render PinInput / ActionBar to confirm no crash
4. Pull up live docs pages — 5 new pages return 200
5. Verify llms.txt at docs.usetheo.dev mentions 0.11
6. Confirm bundle-delta evidence file present

#### Acceptance Criteria

- [ ] Both import styles work for all 5 components
- [ ] SSR-safe for components that should be (PinInput, ActionBar)
- [ ] 5 new docs pages live and return 200
- [ ] llms.txt updated and live
- [ ] Bundle-delta evidence on file

#### DoD

- [ ] T11.1 complete

---

## Coverage Matrix

| # | Requirement (Brief #5 + analysis) | Task(s) | Resolution |
|---|---|---|---|
| 1 | `<PinInput>` primitive — closes § 2.12 P2 | T3.1 | 13 tests + 7 stories; auto-advance + paste + mask + error + axe |
| 2 | `<DataTable>` composite — closes § 2.2 + § 2.4 P1 (Top-5 #2) | T4.1 | 13 tests + 8 stories; sortable + sticky + expandable + actions + pagination + loading + empty |
| 3 | `<PageShell>` composite — closes CC-3 indirect | T5.1 | 12 tests + 8 stories; state precedence + onTitleChange + ActionBar conditional |
| 4 | (Brief gap) `<DropdownMenu>` pre-req — DataTable.rowActions | T1.1 | 5 tests + 5 stories; Radix wrapper + sub-components |
| 5 | (Brief gap) `<ActionBar>` pre-req — PageShell composes | T2.1 | 5 tests + 4 stories; search + filter + primary action |
| 6 | (Brief gap) `useSetPageTitle` scope: NOT in lib (D3) | T5.1 D3 | PageShell exposes `onTitleChange?` callback; consumer wires their own hook |
| 7 | Bump 0.11.0-next.0 (additive minor) | T6.3 | CHANGELOG + version |
| 8 | npm publish --tag next | T8.1 | Standard publish flow |
| 9 | Subpath exports for 5 new components | T6.1 | regen-subpath-exports.ts handles automatically via tsup auto-glob |
| 10 | Per-component dist files (post-Brief #4 splitting) | T6.1 | tsup auto-glob picks up new folders |
| 11 | Bundle-delta evidence (TheoCloud canary) | T10.1 | Mirrors Brief #4 measurement methodology |
| 12 | ADR for PageShell composite pattern | T6.2 | `.claude/knowledge-base/decisions/page-shell-composite-pattern.md` |
| 13 | Curated MDX docs (5 pages) | T9.2 | `content/theoui/{primitives,composites}/<slug>.mdx` |
| 14 | llms.txt updated to 0.11 | T9.3 | Version line, catalog, recent-deliveries entry |
| 15 | theo-opendocs redeploy | T9.4 | wrangler pages deploy |
| 16 | Dogfood QA pass | T11.1 | Smoke install + docs verify + bundle-delta file present |
| 17 | Test framework: vitest + vitest-axe | T1.1-T5.1 | Standard convention; aria-hidden-focus exception for Radix per Brief #2 lesson |
| 18 | DataTable generic types resolve via barrel (D4) | T4.1 + T6.1 | Per Brief #4 D5 escalation; types via `dist/index.d.ts` |
| 19 | Sort + pagination controlled OR uncontrolled (D6) | T4.1 | Hybrid mode via callback presence |
| 20 | Expandable: multi default + single opt-in (D5) | T4.1 | `expandMode` prop |

**Coverage: 20/20 (100%)**

---

## Global Definition of Done

- [ ] All 11 phases (Phase 0 through Phase 11) completed
- [ ] All tests passing (`pnpm test`) — net +40+ new tests
- [ ] Zero typecheck / lint warnings
- [ ] `pnpm quality:gates` 100% green
- [ ] Backward compatibility preserved (zero breaking change to existing components)
- [ ] ADR `page-shell-composite-pattern.md` committed
- [ ] CHANGELOG `[0.11.0-next.0]` entry with measured bundle delta
- [ ] `package.json` version = `0.11.0-next.0`
- [ ] npm published `@theokit/ui@0.11.0-next.0 --tag next`
- [ ] Subpath imports work for all 5 new components from both barrel and `@theokit/ui/<slug>`
- [ ] theo-opendocs: 5 new MDX pages live; llms.txt mentions 0.11
- [ ] TheoCloud canary measurement on file; delta ≤ +5 KB brotli without consumer migration
- [ ] **Dogfood QA PASS** — T11.1 verifies all 5 components importable, SSR-safe where applicable, docs live, evidence on file
- [ ] **Runtime-metric proof** — bundle delta measured empirically against real consumer build (TheoCloud), not estimated

## Final Phase: Dogfood QA (MANDATORY)

(Phase 11 above.)

---

## Risk register

| Risk | Severity | Mitigation |
|---|---|---|
| DataTable generic types fail to resolve via barrel (D4) | Medium | T7.1 typecheck verifies; SSR smoke from `/tmp/smoke-0.11` confirms |
| DropdownMenu axe violations from Radix focus-guard | Low | Same workaround as ConfirmDialog (Brief #2): `axe(baseElement, { rules: { "aria-hidden-focus": { enabled: false } } })` |
| PinInput paste-from-middle UX confusing | Low | Documented: fills from current slot onwards (convention) |
| PageShell unmount-on-state-change loses scroll | Low (D8) | Documented trade-off; conditional rendering, not preserved state. Consumer can wrap with scroll-restoration if needed |
| ActionBar styled <button>/<input> diverges from Input/Button primitives | Medium | Visually align via shared tokens; story side-by-side comparison to detect drift |
| DataTable expand mode state churn on large tables (1000+ rows) | Medium | Document: consumer should memoize `expandable(row)`. Use rowKey as Set key |
| Sort + pagination interaction (changing sort resets to page 1?) | Low | Convention: yes. Documented in JSDoc; test asserts behavior |
| MDX `<DropdownMenu.Trigger>` access fails under Next dynamic() | Low | Apply Brief #2 lesson: use flat aliases (`<DropdownMenuTrigger>`) in preview JSX; show dotted form in code snippets only |
| Tarball size grows | Very Low | Brief #4 baseline ~1.2 MB; 5 small components ≈ +50 KB compressed |
| Bundle delta on TheoCloud exceeds +5 KB without migration | Medium | T10.1 measures; if exceeded, investigate sideEffects / shared chunk regression |
| DropdownMenu + Dialog z-index portal stacking (EC-16) | Low | Radix internally elevates child portals via React tree; document; accept if consumer sees issue, escalate |
| ActionBar narrow viewport (<320px) overflow (EC-17) | Very Low | TheoCloud is desktop-first; consumer wraps for mobile-first apps |
| PinInput IME composition unsupported (EC-18) | Low | OTP codes use numeric keyboard (no IME); doc limitation in JSDoc; consumer uses <Input> for i18n cases |
| DataTable expandable(row) called per row per render (EC-19) | Medium | Doc in JSDoc: consumer should memoize for >1000-row tables; accepted trade-off for API simplicity |
| DataTable sticky header needs overflow ancestor (EC-20) | Low | Doc in JSDoc; degrades gracefully (non-sticky) when missing |
| DataTable uncontrolled state persists across data changes (EC-21) | Low | Consumer can force reset via `key` prop; documented as escape hatch |
| TheoCloud canary requires consumer to bump dep (EC-22) | Medium | Phase 10 happens whenever consumer chooses to upgrade; not blocking npm publish (same precedent as Brief #4) |

---

## Open questions resolved (from brief, per analysis)

| Brief #5 question | Resolution (this plan) |
|---|---|
| `PinInput.Slot` compound? | NO — props-driven MVP only (D7) |
| DataTable controlled sort v1? | YES — both modes (D6) |
| DataTable expandable: single vs multi default? | Multi default + opt-in single via `expandMode` (D5) |
| PageShell loading: spinner vs skeleton? | Spinner default + `loadingNode?` escape hatch (D8) |
| PageShell error: retry vs docs link? | Both as optional props |
| Other consumers besides TheoCloud? | Only TheoCloud uses `@theokit/ui` directly today |
