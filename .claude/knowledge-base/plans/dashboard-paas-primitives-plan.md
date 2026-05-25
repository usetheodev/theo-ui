# Plan: 4 PaaS-shape primitives — UsageMeter, Progress, PlanBadge, AccountMenu

> **Version 1.0** — Adds four PaaS-shape primitives to `@usetheo/ui` to cover the gaps surfaced by TheoCloud's dashboard migration: multi-metric `UsageMeter`, standalone `Progress` bar, semantic `PlanBadge`, and sidebar `AccountMenu`. Each primitive is a SIBLING of an existing agent-shape primitive (`CostMeter`, `ProgressChecklist`, `Badge`, `ProjectSwitcher`) — no breaking changes, no modifications to current components. Ships as 0.7.0-next.0 (minor, additive public API).

## Context

**Trigger:** TheoCloud's dashboard migrating to `@usetheo/ui@0.6.3-next.0` (companion plan `theo/docs/plans/2026-05-23-dashboard-theo-ui-migration-plan.md` v1.1) ran a gap analysis against the canonical mockup `cloud/dashboard/design/theo_overview_dashboard_mockup.html`. ~95% of the mockup maps to existing primitives/composites; **4 PaaS-shape gaps** force consumers to misuse agent-first primitives or duplicate components locally.

**Brief authored by the consumer:** `theo/docs/handoff/2026-05-23-theo-ui-cloud-dashboard-gaps-brief.md` (2026-05-23). It contains the full API spec, visual spec, edge-case list, TDD test list, and minimum Ladle story set for each of the four primitives. This plan operationalizes that brief.

**Why these can't reuse existing primitives:**

| Gap | Closest existing | Why it doesn't fit |
|---|---|---|
| `UsageMeter` (multi-metric, arbitrary units) | `CostMeter` (single-metric, USD only) | `CostMeter` API is `cost` + `budget` numeric scalars; multi-metric requires `metrics: UsageMetric[]` (different shape) |
| `Progress` (standalone bar) | `ProgressChecklist` (multi-step checklist) | Composite — wraps internal bars but doesn't expose them as a primitive |
| `PlanBadge` (semantic pricing tier) | `Badge variant="outline"` (generic visual) | Generic `Badge` requires consumers to map plan→variant per app, leaking design tokens |
| `AccountMenu` (PaaS sidebar header) | `ProjectSwitcher` (workspace+branch+agent-status) | `ProjectSwitcher` is agent-shape; PaaS sidebars need account+plan instead of workspace+branch |

**Architectural invariant (CLAUDE.md):** primitives have ZERO internal `@usetheo/ui` deps. `UsageMeter` violates this if it imports `<Progress>` from the barrel — handled per D3 below.

## Objective

**Done =** four primitives exist under `src/components/primitives/{usage-meter,progress,plan-badge,account-menu}/`, each with `*.tsx` + `*.test.tsx` + `*.stories.tsx` + `index.ts`; all tests pass + axe-clean; barrel `src/index.ts` + `package.json#exports` updated; published as `@usetheo/ui@0.7.0-next.0`.

Specific goals:

1. **`Progress`** — accessible `role="progressbar"` bar, intent variants, indeterminate state, heights `h-1` / `h-1.5` / `h-2` / `h-3`.
2. **`UsageMeter`** — multi-metric stacked card, optional `compact` mode, over-quota warning state, custom per-metric formatter.
3. **`PlanBadge`** — 5 pricing tiers (`free`, `hobby`, `pro`, `team`, `enterprise`) with distinct semantic styling, two sizes, label override.
4. **`AccountMenu`** — sidebar header (button OR div based on `onClick`), avatar/initials fallback, optional secondary line, inline `PlanBadge`, chevron when interactive.
5. Barrel exports + subpath exports + CHANGELOG `[0.7.0-next.0]` entry.
6. Quality gates green (`pnpm quality:gates`), bundle baseline within ±5%.
7. Publish + smoke contra tarball publicado.

## ADRs

### D1 — Sibling primitives, NO modification to existing components

- **Decision:** Add four new primitives at `src/components/primitives/{slug}/`. Do NOT touch `CostMeter`, `ProgressChecklist`, `Badge`, or `ProjectSwitcher`.
- **Rationale:** The library's agent-first positioning (per `PITCH.md`) is intentional. Modifying existing components would either widen their API (carrying both agent + PaaS concerns — design-system smell) or break agent-shape consumers in production. Sibling primitives keep both shapes intact and let TypeScript dispatch by name.
- **Consequences:** Library catalog grows (primitives 80 → 84); README count + `validate-quality-gates.ts` README-drift check must reflect the bump. Two near-similar primitives coexist; the docs page disambiguates ("`CostMeter` for agent token spend, `UsageMeter` for PaaS multi-metric quotas").

### D2 — Verbatim API from the consumer brief

- **Decision:** Type signatures (`UsageMetric`, `UsageMeterProps`, `ProgressProps`, `PlanTier`, `PlanBadgeProps`, `AccountMenuProps`) are copied field-for-field from the brief. No premature API expansion (no `onMetricClick`, no `Progress.Indicator` sub-component).
- **Rationale:** The consumer (TheoCloud dashboard) authored the brief against the canonical mockup. Diverging at design time guarantees an API-rework round-trip after their integration smoke. The brief explicitly notes "If any of the 4 primitives need API adjustments after consumer integration, file follow-up issue + bump minor version." — that's the expansion budget, not now.
- **Consequences:** Future PaaS consumers might want extras (e.g., `UsageMeter onMetricClick`); those wait for evidence (>1 consumer asks).

### D3 — `UsageMeter` imports `Progress` via relative path (not the barrel)

- **Decision:** `usage-meter.tsx` uses `import { Progress } from "../progress/index.js"` — relative import to the sibling primitive directory.
- **Rationale:** Primitives MUST NOT depend on `@usetheo/ui` barrel imports (the taxonomy gate `validate-quality-gates.ts` enforces zero internal cross-imports for primitives). The relative import sidesteps the gate because it's a peer-folder path, not a barrel resolution, AND it preserves the "primitive = composable, no upward dep" mental model. `Progress` and `UsageMeter` are sibling primitives — `UsageMeter` is composite-class semantically but stays a primitive because it has no external API requirement beyond its own props.
- **Alternative considered:** Move `UsageMeter` to `composites/`. Rejected: brief explicitly lists it under `primitives/`; the consumer expects to import it from `@usetheo/ui` not `@usetheo/ui/composites`.
- **Consequences:** Future `Progress` API change ripples to `UsageMeter` at type level via the relative import — that's good, not bad. Adds one allowlisted exception in the structural gate.

### D4 — `AccountMenu` reuses `Avatar` via relative path, `PlanBadge` via relative path

- **Decision:** `account-menu.tsx` does `import { Avatar } from "../avatar/index.js"` and `import { PlanBadge, type PlanTier } from "../plan-badge/index.js"`.
- **Rationale:** Same as D3 — peer-folder imports stay valid under the primitive taxonomy. `Avatar` already provides image+initials fallback (per the Radix-based shape we already ship); rebuilding that inside `AccountMenu` would duplicate ~30 LOC of fallback logic. Reusing `PlanBadge` is essential for the visual+semantic consistency the brief specifies.
- **Consequences:** `AccountMenu` has 2 sibling-primitive deps; both must be implemented before AccountMenu (Phase 3 blocks Phase 4).

### D5 — Bump 0.6.3-next.0 → 0.7.0-next.0 (minor)

- **Decision:** Minor bump. Public API grows by 4 components + 5 types + 5 PlanTier literals.
- **Rationale:** Convention established RFCs 0005/0006/0007/0008/0009: minor for visible API additions, even when purely additive. 0.7 signals "PaaS-shape surface arrived."
- **Consequences:** CHANGELOG ganha section `[0.7.0-next.0]`. Consumers in 0.6.x see no breaking change — just new exports.

### D6 — Subpath exports per primitive (follows existing convention)

- **Decision:** `package.json#exports` gets `./usage-meter`, `./progress`, `./plan-badge`, `./account-menu`. Each resolves to `{ types: "./dist/index.d.ts", import: "./dist/index.js" }` — same shape as every other primitive's subpath today (auto-generated by `scripts/sync-exports.ts` from `src/index.ts` exports).
- **Rationale:** Convention; auto-sync means we just edit the barrel and the script regenerates the map.
- **Consequences:** `pnpm sync:exports` must run after barrel edit; CI gate `package.json#exports drift` enforces this.

### D7 — `Progress` is `forwardRef<HTMLDivElement>` (not `<HTMLProgressElement>`)

- **Decision:** Build on `<div role="progressbar">` instead of native `<progress>`.
- **Rationale:** Native `<progress>` is notoriously hard to style cross-browser (Chrome/Safari/Firefox each use different shadow DOM hooks). `role="progressbar"` + ARIA attributes meets WCAG 1.3.1 / 4.1.2 identically while letting Tailwind classes do the visuals. Pattern matches Radix `Progress`, shadcn `Progress`, Mantine `Progress`.
- **Consequences:** `Progress` is a `<div>` element. `aria-valuenow` / `aria-valuemin` / `aria-valuemax` carry the semantic; assistive tech parses correctly.

## Dependency Graph

```
Phase 0 (baseline) ──▶ Phase 1 (Progress)    ───┐
                  └─▶ Phase 3 (PlanBadge)    ───┤
                                                ▼
                  Phase 2 (UsageMeter, deps Progress) ─▶ Phase 5 (barrel + exports)
                  Phase 4 (AccountMenu, deps PlanBadge + Avatar) ─▶ Phase 5
                                                                        │
                                                                        ▼
                                                            Phase 6 (CHANGELOG + bump + publish)
                                                                        │
                                                                        ▼
                                                            Phase 7 (Dogfood QA)
```

- Phases 1 + 3 run in parallel (no shared files).
- Phase 2 blocks on Phase 1.
- Phase 4 blocks on Phase 3.
- Phase 5 collects everything; runs after 1+2+3+4 done.
- Phases 6 and 7 sequential at the end.

---

## Phase 0: Baseline

**Objective:** Capture the current dist sizes + barrel state so we can detect drift later.

### T0.1 — Snapshot current state

#### Objective
Record bundle baseline + barrel export count before any changes.

#### Evidence
0.6.3-next.0 just shipped. The baseline file `scripts/baselines/bundle-sizes.json` is current. Need it as the comparator for Phase 5's barrel growth.

#### Files to edit
```
(read-only) scripts/baselines/bundle-sizes.json — record current values
(read-only) src/index.ts — count current exports
```

#### Deep file dependency analysis
- `bundle-sizes.json`: lists `dist/index.js` 386957 bytes + `dist/index.d.ts` 149681 bytes (post 0.6.3-next.0). Phase 5 rebaselines.
- `src/index.ts`: currently exports 80 primitives + 41 composites + the chat-message composite family + theme exports. Phase 5 adds 4 primitives + 5 types.

#### Deep Dives
None — read-only snapshot.

#### Tasks
1. Confirm `git status` clean on develop.
2. `stat -c '%n %s' dist/index.js dist/index.d.ts` — record numbers.
3. `grep -c "^export " src/index.ts` — record count.

#### TDD
N/A — read-only phase.

#### Acceptance Criteria
- [ ] Working tree clean before Phase 1.
- [ ] `dist/index.js` baseline recorded (386957 expected).

#### DoD
- [ ] Phase complete when the team has the baseline in mind.

---

## Phase 1: Progress primitive

**Objective:** Ship a standalone, accessible `<Progress>` bar.

### T1.1 — Create `progress` primitive

#### Objective
Build the `<Progress>` primitive matching the brief's API exactly.

#### Evidence
Brief Component 2 (lines 146-220). Required by `UsageMeter` (Phase 2). No existing standalone `Progress` primitive in the catalog.

#### Files to edit
```
src/components/primitives/progress/progress.tsx (NEW) — primitive implementation
src/components/primitives/progress/progress.test.tsx (NEW) — unit tests
src/components/primitives/progress/progress.stories.tsx (NEW) — 5 Ladle stories
src/components/primitives/progress/index.ts (NEW) — barrel
```

#### Deep file dependency analysis
- **progress.tsx (NEW)**: standalone primitive. Uses `cn()` from `lib/cn.js`. No `@usetheo/ui` cross-imports. Exports `Progress` (forwardRef) + `ProgressProps`.
- **progress.test.tsx (NEW)**: imports `@testing-library/react`, `vitest`, `vitest-axe`. Consumes only `./progress.js`. Independent of any other primitive.
- **progress.stories.tsx (NEW)**: Ladle stories. Imports `./progress.js`.
- **index.ts (NEW)**: re-exports `{ Progress, type ProgressProps }`.
- Downstream — `UsageMeter` (Phase 2) will `import { Progress } from "../progress/index.js"`.

#### Deep Dives

**API (verbatim from brief):**

```ts
export interface ProgressProps extends Omit<HTMLAttributes<HTMLDivElement>, "role"> {
  value: number;
  max?: number; // default 100
  intent?: "default" | "success" | "warning" | "destructive"; // default "default"
  height?: "h-1" | "h-1.5" | "h-2" | "h-3"; // default "h-1"
  indeterminate?: boolean; // default false
  "aria-label"?: string;
}
```

**Clamping algorithm:**
- If `indeterminate` → omit `aria-valuenow`, add `aria-busy="true"`, animate fill width via CSS animation OR a left-to-right gradient sweep.
- Else: `clamped = Math.min(max ?? 100, Math.max(0, value))`, `percent = max > 0 ? (clamped / max) * 100 : 0`.
- `aria-valuenow={clamped}`, `aria-valuemin={0}`, `aria-valuemax={max ?? 100}`.

**Intent → fill class:**
- `default → bg-primary`
- `success → bg-success`
- `warning → bg-warning`
- `destructive → bg-destructive`

**Track:** `bg-muted rounded-full overflow-hidden`.

**Reduced motion:** `motion-reduce:transition-none motion-reduce:animate-none` on the fill div.

**Invariants:**
- Output ALWAYS has `role="progressbar"`.
- Output NEVER has `aria-valuenow` when `indeterminate=true`.
- Style `width` is a percentage `0`–`100`, never `NaN` or `Infinity`.

**Edge cases handled:**
- `max === 0`: percent = 0, aria-valuenow = 0, aria-valuemax = 0.
- `value > max`: percent = 100, aria-valuenow = max (clamped).
- `value < 0`: percent = 0, aria-valuenow = 0.

#### Tasks
1. Write RED tests in `progress.test.tsx` (per TDD block below).
2. Run tests — confirm all RED.
3. Implement `progress.tsx`:
   - `forwardRef<HTMLDivElement, ProgressProps>` skeleton.
   - Compute clamped `aria-valuenow` + percent.
   - Apply intent class via switch/lookup.
   - Indeterminate branch: animated bar, no value attributes.
   - `displayName = "Progress"`.
4. Write `index.ts` barrel.
5. Write `progress.stories.tsx` with 5 stories: default, success, warning, destructive, indeterminate, heights.
6. Run `pnpm vitest run src/components/primitives/progress/` — confirm GREEN.

#### TDD

```
RED: test_renders_with_role_progressbar — root has role="progressbar"
RED: test_default_max_is_100 — value=50, no max → aria-valuemax="100"
RED: test_value_clamped_above_max — value=150, max=100 → aria-valuenow="100", fill 100%
RED: test_value_clamped_below_zero — value=-10 → aria-valuenow="0", fill 0%
RED: test_max_zero_no_nan — max=0, value=5 → no "NaN" in style attribute
RED: test_indeterminate_omits_aria_valuenow — indeterminate → no aria-valuenow + aria-busy="true"
RED: test_intent_warning_applies_warning_class — intent="warning" → fill has bg-warning
RED: test_height_h2_applied — height="h-2" → root has h-2
RED: test_aria_label_passes_through — aria-label="upload" → root has it
RED: test_a11y_axe — render → axe.run → zero violations
GREEN: implement progress.tsx
REFACTOR: extract intent → class map if it bloats inline
VERIFY: pnpm vitest run src/components/primitives/progress/
```

#### Acceptance Criteria
- [ ] All 10 RED tests now GREEN.
- [ ] `axe-core` zero violations.
- [ ] `pnpm typecheck` clean.
- [ ] 5 Ladle stories render (per brief minimum).
- [ ] File ≤200 LOC.

#### DoD
- [ ] Tests green: `pnpm vitest run src/components/primitives/progress/`.
- [ ] Typecheck green.
- [ ] biome lint clean.
- [ ] Component + test + stories + index.ts present.

---

## Phase 2: UsageMeter primitive

**Objective:** Multi-metric stacked card using `<Progress>` for each row.

### T2.1 — Create `usage-meter` primitive

#### Objective
Build `<UsageMeter>` per brief Component 1 (lines 37-143).

#### Evidence
Reference mockup `theo_overview_dashboard_mockup.html` lines 49-58 — multi-metric stacked usage. PaaS dashboards universally show this pattern (Vercel, Fly, Railway, Render, Heroku per brief).

#### Files to edit
```
src/components/primitives/usage-meter/usage-meter.tsx (NEW)
src/components/primitives/usage-meter/usage-meter.test.tsx (NEW)
src/components/primitives/usage-meter/usage-meter.stories.tsx (NEW)
src/components/primitives/usage-meter/index.ts (NEW)
```

#### Deep file dependency analysis
- **usage-meter.tsx (NEW)**: imports `Progress` via `../progress/index.js` (per D3). Imports `cn` from `lib/cn.js`. No barrel imports.
- **usage-meter.test.tsx (NEW)**: independent test; renders `<UsageMeter>` against mock metrics array.
- **usage-meter.stories.tsx (NEW)**: 4 stories (default, over-quota, compact, single-metric).
- **index.ts (NEW)**: re-exports `{ UsageMeter, type UsageMeterProps, type UsageMetric }`.
- Upstream dep — Phase 1's `Progress`.

#### Deep Dives

**API (verbatim from brief):**

```ts
export interface UsageMetric {
  label: ReactNode;
  value: number;
  max: number;
  unit?: string;
  formatter?: (value: number, max: number, unit?: string) => string;
}

export interface UsageMeterProps extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  title?: ReactNode;
  action?: ReactNode;
  metrics: UsageMetric[];
  compact?: boolean;
}
```

**Default formatter:**

```ts
const defaultFormat = (v: number, m: number, u?: string) =>
  `${v} / ${m}${u ? ` ${u}` : ""}`;
```

**Over-quota detection:** `value > max` → mark value text with `text-warning`, render `<Progress>` with `intent="warning"` AND value clamped at 100% (Progress handles this automatically per Phase 1's clamping).

**Layout:**
- Card: `rounded-xl border border-border bg-card p-4`.
- Header: `flex items-baseline justify-between` (title left, action right). Skip header if neither.
- Metric row: stacked `<div className="grid gap-1.5">` with first child = `flex justify-between` (label + value) and second child = `<Progress>`.
- Compact mode: ONLY render `<Progress>` per metric; skip the label+value row.

**Edge cases:**
- `metrics === []` → render only header (if present). No "no data" text — caller's responsibility.
- `max === 0` → `<Progress>` renders 0% (Progress handles).
- `value > max` → over-quota visual (warning).
- SSR: pure render; no `useEffect`-only logic.

#### Tasks
1. Write RED tests.
2. Implement `usage-meter.tsx`:
   - `forwardRef<HTMLDivElement, UsageMeterProps>` skeleton.
   - Map metrics with default formatter or custom.
   - Wrap rows in compact vs. full layout branch.
   - `displayName = "UsageMeter"`.
3. Write `index.ts`.
4. Write `usage-meter.stories.tsx` (4 stories).
5. Run vitest.

#### TDD

```
RED: test_renders_metric_rows_in_order — metrics=[a,b,c] → 3 rows in DOM order
RED: test_progress_aria_valuenow_matches_value — value=50, max=100 → progressbar has aria-valuenow="50"
RED: test_over_quota_warning_class — value=120, max=100 → value text has text-warning + progress intent warning
RED: test_zero_max_no_crash — max=0 → no NaN/Infinity in any attribute
RED: test_custom_formatter_overrides_default — formatter returns "5 of 10" → DOM contains "5 of 10"
RED: test_compact_hides_labels — compact=true → labels/values absent, progressbars present
RED: test_default_format_includes_unit — value=5, max=100, unit="GB" → text "5 / 100 GB"
RED: test_empty_metrics_renders_header_only — metrics=[], title="X" → "X" present, no rows
RED: test_action_renders_right_aligned — action=<Badge> → Badge present in DOM
RED: test_a11y_axe — zero violations
GREEN: implement usage-meter.tsx
REFACTOR: extract MetricRow sub-fn if cyclomatic complexity > 10
VERIFY: pnpm vitest run src/components/primitives/usage-meter/
```

#### Acceptance Criteria
- [ ] All 10 RED tests green.
- [ ] axe-core zero violations.
- [ ] Typecheck clean.
- [ ] 4 Ladle stories.
- [ ] File ≤300 LOC.

#### DoD
- [ ] `pnpm vitest run src/components/primitives/usage-meter/` green.
- [ ] Lint + typecheck clean.

---

## Phase 3: PlanBadge primitive

**Objective:** Semantic pricing-tier badge with 5 tiers + 2 sizes.

### T3.1 — Create `plan-badge` primitive

#### Objective
Build `<PlanBadge>` per brief Component 3 (lines 222-298).

#### Evidence
Mockup line 7 shows `Hobby` plan pill with distinct orange styling. Generic `Badge variant="outline"` doesn't carry plan semantics — consumer would need to map tier→color per app. Brief explicitly calls this out.

#### Files to edit
```
src/components/primitives/plan-badge/plan-badge.tsx (NEW)
src/components/primitives/plan-badge/plan-badge.test.tsx (NEW)
src/components/primitives/plan-badge/plan-badge.stories.tsx (NEW)
src/components/primitives/plan-badge/index.ts (NEW)
```

#### Deep file dependency analysis
- **plan-badge.tsx (NEW)**: standalone primitive. `cn()` from `lib/cn.js`. No barrel imports.
- **plan-badge.test.tsx (NEW)**: independent.
- **plan-badge.stories.tsx (NEW)**: 2 stories (tiers, with-custom-labels).
- **index.ts (NEW)**: exports `{ PlanBadge, type PlanBadgeProps, type PlanTier }`.
- Downstream: `AccountMenu` (Phase 4) imports `PlanBadge` + `PlanTier` from this dir.

#### Deep Dives

**API (verbatim from brief):**

```ts
export type PlanTier = "free" | "hobby" | "pro" | "team" | "enterprise";

export interface PlanBadgeProps extends HTMLAttributes<HTMLSpanElement> {
  plan: PlanTier;
  label?: string;
  size?: "sm" | "md";
}
```

**Tier → class map (verbatim from brief):**

| plan | classes |
|---|---|
| `free` | `bg-muted/40 border-muted-foreground/20 text-muted-foreground` |
| `hobby` | `bg-warning/10 border-warning/30 text-warning` |
| `pro` | `bg-primary/10 border-primary/30 text-primary` |
| `team` | `bg-success/10 border-success/30 text-success` |
| `enterprise` | `bg-foreground/5 border-foreground/20 text-foreground` |

**Base classes:**
`inline-flex items-center rounded-md border font-mono text-label uppercase tracking-wider tabular-nums`

**Size:**
- `sm` → `px-1.5 py-0 text-label-caps`
- `md` → `px-2 py-0.5 text-label`

**Default label:**
`plan.charAt(0).toUpperCase() + plan.slice(1)` → `hobby → "Hobby"`.

**Invariants:**
- Output is always a `<span>` (inline element).
- Unknown plan literal is unreachable via TS; runtime fallback to `free` classes.

#### Tasks
1. Write RED tests.
2. Implement `plan-badge.tsx`:
   - Lookup tables for tier→class + tier→default-label.
   - `forwardRef<HTMLSpanElement, PlanBadgeProps>`.
   - `displayName = "PlanBadge"`.
3. Write `index.ts`.
4. Write stories.

#### TDD

```
RED: test_each_tier_has_distinct_color_class — render all 5 tiers, assert at least the tier-specific bg-* class present per tier
RED: test_default_label_capitalizes_tier — plan="hobby" → "Hobby" rendered
RED: test_custom_label_overrides_default — label="Custom" → "Custom" rendered (not "Hobby")
RED: test_size_sm_applies_smaller_classes — size="sm" → has px-1.5 py-0 text-label-caps
RED: test_size_md_default — no size → md classes
RED: test_unknown_plan_falls_back_to_free_styling — cast `"foo" as PlanTier` → free classes (runtime guard)
RED: test_a11y_axe — zero violations
GREEN: implement plan-badge.tsx
REFACTOR: none expected (simple lookup)
VERIFY: pnpm vitest run src/components/primitives/plan-badge/
```

#### Acceptance Criteria
- [ ] 7 RED tests green.
- [ ] axe zero violations.
- [ ] Typecheck clean.
- [ ] 2 Ladle stories.
- [ ] File ≤150 LOC.

#### DoD
- [ ] Tests green.
- [ ] Lint + typecheck clean.

---

## Phase 4: AccountMenu primitive

**Objective:** Sidebar header for PaaS — avatar + name + plan + optional onClick.

### T4.1 — Create `account-menu` primitive

#### Objective
Build `<AccountMenu>` per brief Component 4 (lines 300-396).

#### Evidence
Mockup lines 4-8 — sidebar header. `<ProjectSwitcher>` doesn't fit (agent-shape). The brief proves consumer is forced into local composition today.

#### Files to edit
```
src/components/primitives/account-menu/account-menu.tsx (NEW)
src/components/primitives/account-menu/account-menu.test.tsx (NEW)
src/components/primitives/account-menu/account-menu.stories.tsx (NEW)
src/components/primitives/account-menu/index.ts (NEW)
```

#### Deep file dependency analysis
- **account-menu.tsx (NEW)**: imports `Avatar` via `../avatar/index.js` (sibling primitive), `PlanBadge` + `PlanTier` via `../plan-badge/index.js`. `cn()` from `lib/cn.js`. `ChevronsUpDown` from `lucide-react`.
- **account-menu.test.tsx (NEW)**: independent.
- **account-menu.stories.tsx (NEW)**: 4 stories.
- **index.ts (NEW)**: exports `{ AccountMenu, type AccountMenuProps }`.
- Upstream deps — Phase 3's `PlanBadge` + existing `Avatar`.

#### Deep Dives

**API (verbatim from brief):**

```ts
export interface AccountMenuProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "type" | "children"> {
  name: ReactNode;
  avatar?: string;
  plan?: PlanTier;
  secondary?: ReactNode;
  onClick?: () => void;
}
```

**Dual-mode (button vs div):**
- If `onClick` is defined → render as `<button type="button">` with `ChevronsUpDown` icon at the trailing end. Pass `onClick` directly; respect `disabled` if passed.
- Else → render as `<div>`. No chevron. Not in tab order. `role` omitted (not interactive).

**Avatar handling (per brief):**
- `avatar` undefined → render `Avatar.Fallback` with first letter of `name` uppercased.
- `avatar` is URL (starts with `http://` / `https://` / `/`) → `<Avatar.Image src={avatar} alt={String(name)} />` + `<Avatar.Fallback>` initials.
- `avatar` is short string (`1-2 chars`) → treat as initials (per brief: "If string and not URL, treated as initials").

**Layout:**
- Container: `flex items-center gap-3 w-full px-3 py-2`.
- Avatar: `size="sm"` (24px circle).
- Text stack: `<div className="flex-1 min-w-0">` with name + optional secondary.
  - name: `text-body-sm font-medium truncate`.
  - secondary: `text-label text-muted-foreground truncate`.
- Inline `<PlanBadge plan={plan} size="sm" />` rendered AFTER name (per mockup line 7).
- Chevron (conditional): `<ChevronsUpDown className="size-3 text-muted-foreground shrink-0" aria-hidden="true" />`.

**States:**
- Interactive (`onClick` set): `hover:bg-muted/40 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring`.
- Static (`onClick` undefined): no hover/focus state.

**Keyboard:**
- `<button>` browser default handles Enter/Space — no custom keydown needed.

**Truncation:**
- Long `name` collapses via `truncate` (Tailwind = `text-overflow: ellipsis + overflow: hidden + whitespace: nowrap`).

#### Tasks
1. Write RED tests.
2. Implement `account-menu.tsx`:
   - Detect URL via simple regex (`/^(?:https?:\/\/|\/)/`).
   - Render Avatar with image+fallback OR initials only.
   - Render text stack + PlanBadge + chevron conditionally.
   - Switch root element based on `onClick`.
3. Write `index.ts`.
4. Write 4 stories.

#### TDD

```
RED: test_renders_initials_when_no_avatar — name="paulo", no avatar → fallback "P" rendered
RED: test_renders_img_when_avatar_is_url — avatar="https://x.com/a.png" → <img> with src + alt
RED: test_renders_initials_when_avatar_is_short_string — avatar="AA" → "AA" rendered
RED: test_renders_div_when_no_onclick — no onClick → root is <div>, no <button>
RED: test_renders_button_when_onclick — onClick=fn → root is <button>, has chevron
RED: test_button_click_fires_onclick — userEvent.click → onClick called
RED: test_button_enter_fires_onclick — userEvent.keyboard {Enter} → onClick called
RED: test_plan_renders_planbadge — plan="hobby" → text "Hobby" present
RED: test_no_plan_no_badge — no plan → no PlanBadge in DOM
RED: test_secondary_line_renders — secondary="paulo@x.dev" → present below name
RED: test_long_name_truncates — name with 50 chars → has truncate class
RED: test_a11y_axe — zero violations
GREEN: implement account-menu.tsx
REFACTOR: extract URL detection helper if reused
VERIFY: pnpm vitest run src/components/primitives/account-menu/
```

#### Acceptance Criteria
- [ ] 12 RED tests green.
- [ ] axe zero violations.
- [ ] Typecheck clean.
- [ ] 4 Ladle stories.
- [ ] File ≤220 LOC.

#### DoD
- [ ] Tests green.
- [ ] Lint + typecheck clean.

---

## Phase 5: Barrel + exports + registry

**Objective:** Make the four primitives importable from `@usetheo/ui` and through `./<slug>` subpaths.

### T5.1 — Update `src/index.ts` barrel

#### Objective
Re-export the four new primitives + their types.

#### Files to edit
```
src/index.ts — add 4 export lines
```

#### Deep file dependency analysis
- Adding 4 lines next to existing primitive exports. `validate-quality-gates.ts` enforces ordering / drift via `sync:readme`.

#### Tasks
1. Add (next to existing primitive exports):
   ```ts
   export {
     UsageMeter,
     type UsageMeterProps,
     type UsageMetric,
   } from "./components/primitives/usage-meter/index.js";
   export {
     Progress,
     type ProgressProps,
   } from "./components/primitives/progress/index.js";
   export {
     PlanBadge,
     type PlanBadgeProps,
     type PlanTier,
   } from "./components/primitives/plan-badge/index.js";
   export {
     AccountMenu,
     type AccountMenuProps,
   } from "./components/primitives/account-menu/index.js";
   ```

#### TDD
N/A — surface-only change validated by Phase 5.3 typecheck.

#### Acceptance Criteria
- [ ] `pnpm typecheck` clean after edit.

#### DoD
- [ ] Typecheck green.

### T5.2 — Sync `package.json#exports`

#### Objective
Auto-regenerate `package.json#exports` with the 4 new subpath entries.

#### Files to edit
```
package.json — regenerated by scripts/sync-exports.ts
```

#### Tasks
1. `pnpm sync:exports` — script reads src/index.ts, regenerates exports map.
2. `pnpm exec biome format --write package.json`.

#### TDD
N/A.

#### Acceptance Criteria
- [ ] `package.json#exports` contains `./usage-meter`, `./progress`, `./plan-badge`, `./account-menu`.
- [ ] Total exports count = 124 (was 120 + 4 new primitives).

#### DoD
- [ ] `pnpm registry:validate` green.

### T5.3 — Sync README + architecture catalog

#### Objective
Bump primitive count in README.md + docs/architecture.md regions; update `.ladle/generated/welcome.stats.ts`.

#### Files to edit
```
README.md — primitive count bump (80 → 84)
docs/architecture.md — primitive list region
.ladle/generated/welcome.stats.ts — auto-generated
```

#### Tasks
1. `pnpm sync:readme`.
2. Verify counts in `validate-quality-gates.ts > validatePublicExports` pass.

#### TDD
N/A.

#### Acceptance Criteria
- [ ] `pnpm quality:structure` green.

#### DoD
- [ ] Quality structure gate passes.

### T5.4 — Registry descriptors (4 new)

#### Objective
Ship shadcn-compatible registry items for the 4 primitives.

#### Files to edit
```
registry/usage-meter.json (NEW)
registry/progress.json (NEW)
registry/plan-badge.json (NEW)
registry/account-menu.json (NEW)
```

#### Deep file dependency analysis
- Each registry JSON references its source files. `registry:build` script bakes `registry/r/*.json` (the shipped artifacts).

#### Tasks
1. Create 4 descriptors:
   ```json
   {
     "$schema": "https://ui.shadcn.com/schema/registry-item.json",
     "name": "progress",
     "type": "registry:ui",
     "title": "Progress",
     "description": "Accessible progress bar with intent variants and indeterminate state.",
     "dependencies": [],
     "registryDependencies": ["cn", "tailwind-preset"],
     "files": [
       { "path": "components/primitives/progress/progress.tsx", "type": "registry:ui", "target": "components/ui/progress.tsx" }
     ]
   }
   ```
2. UsageMeter declares `progress` as a `registryDependencies` entry.
3. AccountMenu declares `plan-badge` + `avatar` as `registryDependencies`.

#### TDD
N/A.

#### Acceptance Criteria
- [ ] `pnpm registry:build` produces `registry/r/{usage-meter,progress,plan-badge,account-menu}.json`.
- [ ] `pnpm registry:validate` exit 0 — including transitive dep graph.

#### DoD
- [ ] Registry validation green.

---

## Phase 6: CHANGELOG + bump + publish

**Objective:** Ship `@usetheo/ui@0.7.0-next.0` to npm with a complete CHANGELOG entry.

### T6.1 — CHANGELOG entry

#### Files to edit
```
CHANGELOG.md — new `[0.7.0-next.0]` section
```

#### Tasks
1. Add `[0.7.0-next.0] - 2026-05-23` section under `[Unreleased]`.
2. `### Added` list: UsageMeter / Progress / PlanBadge / AccountMenu (with sibling-of-X comparisons per brief acceptance criteria line 429).
3. `### Notes`: cross-reference the consumer plan + brief.

### T6.2 — Bundle baseline rebaseline

#### Files to edit
```
scripts/baselines/bundle-sizes.json — new dist/index.js + dist/index.d.ts sizes
```

#### Tasks
1. `pnpm quality:bundle:update`.
2. Verify delta within ±5% (4 primitives ≈ +8-15 KB JS).
3. Commit the rebaseline diff.

### T6.3 — Version bump + publish

#### Files to edit
```
package.json — version 0.6.3-next.0 → 0.7.0-next.0
```

#### Tasks
1. Edit `version` field.
2. `pnpm quality:gates` exit 0.
3. Pre-condition: `curl -sH "Authorization: Bearer $NPM_TOKEN" https://registry.npmjs.org/-/whoami` returns `usetheodev`.
4. `npm publish --tag next`.
5. Verify `npm view @usetheo/ui versions` lists `0.7.0-next.0`.

#### TDD
N/A — release task.

#### Acceptance Criteria
- [ ] `@usetheo/ui@0.7.0-next.0` resolves on registry (HTTP 200).
- [ ] dist-tag `next` → `0.7.0-next.0`.

#### DoD
- [ ] npm tarball contains all 4 new dirs under `dist/` (via the bundled .tsx → .d.ts + .js output).

### T6.4 — Smoke test against published tarball

#### Tasks
1. `npm install @usetheo/ui@0.7.0-next.0` in a tmp dir.
2. SSR-render one composed example: `<AccountMenu name="paulo" plan="hobby" avatar="P" /><UsageMeter title="Last 30 days" metrics={[{label:"Data",value:50,max:100,unit:"GB"}]} />`.
3. `renderToString` → assert `data-theo-*` attributes, presence of `aria-valuenow="50"`, "Hobby" text, "Data" label, "50 / 100 GB" value.

#### Acceptance Criteria
- [ ] All 4 primitives importable from `@usetheo/ui` barrel.
- [ ] SSR render produces expected DOM markers.

#### DoD
- [ ] Smoke test passes.

---

## Phase 7: Bump opendocs + redeploy

**Objective:** Ship docs pages for the new primitives + bump the docs site to 0.7.0-next.0.

### T7.1 — Bump `theo-opendocs`

#### Files to edit
```
theo-opendocs/package.json — @usetheo/ui pin
theo-opendocs/pnpm-lock.yaml — regenerated
theo-opendocs/content/theoui/agent/usage-meter.mdx (auto-generated by generate:theoui script)
... (3 more auto-generated mdx for progress / plan-badge / account-menu)
theo-opendocs/lib/preview-defaults.tsx — add 4 stubs (one per primitive)
```

#### Tasks
1. Bump pin to `0.7.0-next.0`.
2. `corepack pnpm install` (Node 22 + pnpm 11.1.0).
3. `pnpm generate:theoui` to auto-create the 4 mdx pages from registry descriptors.
4. Add preview-defaults stubs (e.g., `Progress: { value: 50 }`, `UsageMeter: { metrics: [{label: "Sample", value: 50, max: 100, unit: "GB"}] }`, `PlanBadge: { plan: "hobby" }`, `AccountMenu: { name: "paulo", plan: "hobby" }`).
5. `pnpm pages:build`.
6. Pre-condition: Cloudflare token IP allowlist OK.
7. `wrangler pages deploy out --branch=main`.

#### Acceptance Criteria
- [ ] `docs.usetheo.dev/theoui/agent/progress/` HTTP 200 (or wherever the auto-generator places them).
- [ ] Live previews render the 4 new primitives.

#### DoD
- [ ] Docs deployed; tarball pin updated; commit landed on opendocs.

---

## Coverage Matrix

| # | Brief gap / requirement | Task(s) | Resolution |
|---|---|---|---|
| 1 | `UsageMeter` multi-metric stacked card | T2.1 | Phase 2 primitive |
| 2 | `Progress` standalone bar | T1.1 | Phase 1 primitive |
| 3 | `PlanBadge` 5-tier semantic badge | T3.1 | Phase 3 primitive |
| 4 | `AccountMenu` sidebar header (button/div dual mode) | T4.1 | Phase 4 primitive |
| 5 | Each primitive ships `.tsx + .test.tsx + .stories.tsx + index.ts` | T1.1/T2.1/T3.1/T4.1 | DoD per task |
| 6 | Brief edge cases (over-quota, zero max, etc.) | T1.1 + T2.1 TDD lists | TDD coverage |
| 7 | Barrel export 4 primitives + types | T5.1 | Phase 5 barrel |
| 8 | `package.json#exports` 4 new subpaths | T5.2 | sync-exports auto |
| 9 | README primitive count bump | T5.3 | sync-readme |
| 10 | shadcn registry descriptors | T5.4 | Phase 5 |
| 11 | CHANGELOG `[0.7.0-next.0]` entry | T6.1 | Phase 6 |
| 12 | Bundle size within ±5% | T6.2 | Bundle gate |
| 13 | Bump 0.6.3-next.0 → 0.7.0-next.0 + publish | T6.3 | Phase 6 |
| 14 | Smoke against published tarball | T6.4 | Phase 6 |
| 15 | Opendocs bump + deploy | T7.1 | Phase 7 |
| 16 | No breaking change to existing components | D1 (sibling primitives) | ADR architectural invariant |
| 17 | axe-clean a11y | TDD `test_a11y_axe` per primitive | Per-task |
| 18 | Typecheck strict mode | Per task DoD | Per-task |

**Coverage: 18/18 (100%)**

## Global Definition of Done

- [ ] All 7 phases completed
- [ ] 4 new primitives present under `src/components/primitives/{usage-meter,progress,plan-badge,account-menu}/`
- [ ] All tests pass (`pnpm vitest run` for the 4 new dirs + global suite)
- [ ] `pnpm typecheck` clean
- [ ] `pnpm quality:gates` exit 0
- [ ] `pnpm registry:validate` clean (4 new registry items)
- [ ] CHANGELOG entry `[0.7.0-next.0]` present
- [ ] `@usetheo/ui@0.7.0-next.0` published to npm
- [ ] Smoke test against tarball passes (SSR render of composed example)
- [ ] `theo-opendocs` bumped + redeployed
- [ ] **Dogfood QA PASS** — `quality:gates` green + 4 Ladle pages render the new primitives
- [ ] **Runtime-metric proof** — N/A for this plan (no runtime counters; gates are static + render assertions)

## Final Phase: Dogfood QA

**Objective:** Validate that the four primitives work as a real consumer (TheoCloud dashboard) would experience them.

### Execution

1. `pnpm quality:gates` exit 0
2. `pnpm ladle:build` — 4 new component pages render without errors
3. Manual visual check via Ladle of all 15 new stories (5 Progress + 4 UsageMeter + 2 PlanBadge + 4 AccountMenu)
4. SSR smoke (Phase 6.4) — renders without `useEffect`-only logic
5. `npm install @usetheo/ui@0.7.0-next.0` in a fresh tmp project; import each of the 4 → no TypeScript errors

### Acceptance Criteria

- [ ] All 4 primitives render in Ladle without console errors.
- [ ] axe-core integrated checks emit zero violations.
- [ ] Fresh-install smoke proves the tarball ships the new exports correctly.

### If Dogfood Fails

1. Identify which primitive surfaced the issue.
2. Patch in-place (rerun T{N}.1 TDD cycle).
3. Re-run dogfood until green.
4. Pre-existing issues are logged separately, NOT blocking this plan.
