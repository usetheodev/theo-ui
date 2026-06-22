---
slug: m5-usage-metrics
created_at: 2026-06-21
goal: Ship pure splitUsagePoints/toUsageMetrics helpers plus maxScale + splitSeries props on TokenUsageChart in @theokit/ui, measured by src/components/primitives/token-usage-chart/usage-metrics.test.ts and token-usage-chart.test.tsx passing green.
---

# Plan — M5-7 `splitUsagePoints`/`toUsageMetrics` + chart props (`@theokit/ui`)

## Goal

Ship the pure `splitUsagePoints` + `toUsageMetrics` helpers and add `maxScale` + `splitSeries` props to `TokenUsageChart` in `@theokit/ui`, measured by `pnpm exec vitest run src/components/primitives/token-usage-chart/usage-metrics.test.ts src/components/primitives/token-usage-chart/token-usage-chart.test.tsx` reporting all tests passed.

## Context

`TokenUsageChart` (`src/components/primitives/token-usage-chart/token-usage-chart.tsx`) renders a stacked input+output bar chart with an auto-derived y-axis max (`Math.max(1, ...series.map(p => p.input+p.output))`, line 76). Two gaps: (1) the y scale cannot be fixed — comparing two charts side-by-side needs a shared `maxScale`; (2) there is no way to see input vs output as adjacent (grouped) bars. And the only metric derived from the data is the inline `total`; there is no reusable aggregate/transpose helper, so consumers re-compute totals/peaks/series by hand.

M5-7 adds: pure `toUsageMetrics(points)` (totals/peak) + `splitUsagePoints(points)` (transpose into parallel series arrays) helpers, and the `maxScale` (fixed y-axis cap) + `splitSeries` (grouped bars) props on the chart. The helpers are pure (no React) and the chart consumes `toUsageMetrics` for its `total` header (DRY).

## Baseline Context

### Files that will be touched

| File | LoC today | Last touch (sha) | Why it exists / will change |
|---|---|---|---|
| `src/components/primitives/token-usage-chart/usage-metrics.ts` (NEW) | 0 | — | Pure `toUsageMetrics` + `splitUsagePoints` + `UsageMetrics`/`UsageSeries` types. |
| `src/components/primitives/token-usage-chart/usage-metrics.test.ts` (NEW) | 0 | — | Pure helper tests (RED). |
| `src/components/primitives/token-usage-chart/token-usage-chart.tsx` | ~232 | — | Add `maxScale?` + `splitSeries?` props; use `toUsageMetrics` for the total; clamp bar heights to the scale; render grouped bars when `splitSeries`. |
| `src/components/primitives/token-usage-chart/token-usage-chart.test.tsx` (NEW) | 0 | — | Component tests for the new props (RED). |
| `src/components/primitives/token-usage-chart/index.ts` | 1 | — | Re-export the helpers + types. |
| `src/index.ts` (root barrel) | — | — | Re-export the helpers + types. |
| `CHANGELOG.md` | — | — | `[Unreleased] § Added` (Unbreakable Rule 6). |
| `.changeset/m5-usage-metrics.md` (NEW) | 0 | — | `@theokit/ui` minor changeset. |

### Current callers / dependents

- `TokenUsageChart` consumes `TokenUsagePoint[]` (`{label, input, output}`, `token-usage-chart.tsx:5-11`); auto-max at `:76`; the stacked-bar loop at `:132-160` (input bottom/accent, output top/primary); the inline `total` at `:80`.
- `TokenUsageChart` is exported from the chart barrel (`index.ts:1`) + root (`src/index.ts`); has a `data-slot="token-usage-chart"` root + an `sr-only` a11y table (`:185-203`).
- No existing test file for the chart (a new `token-usage-chart.test.tsx` is added).

### Domain glossary

- **usage point** — `{ label, input, output }` (tokens per period).
- **maxScale** — the token value mapped to the chart's 100% height; when set, bars are clamped to it (shared scale for side-by-side charts).
- **splitSeries** — render input + output as two adjacent (grouped) bars per period instead of one stacked bar.
- **usage metrics** — aggregate `{ totalInput, totalOutput, total, peak, pointCount }`.

### Architecture boundaries affected

- All new code is in the existing `token-usage-chart` primitive dir; the helper module is a pure `.ts` (no component import) → the primitive boundary holds (a primitive imports zero theo-ui components).
- Ships via the existing `@theokit/ui/token-usage-chart` subpath + root barrel — no new subpath wiring.

## Prior Art & Related Work

- **Internal:** the chart's own `binPoints` (`:30-46`) is the existing pure transform; `toUsageMetrics`/`splitUsagePoints` extend that pure-helper pattern. The `UsageMeter` primitive is a sibling usage surface.
- **External:** grouped vs stacked bars + fixed-domain axes are standard charting affordances (Recharts `Bar` stacked/grouped, D3 scale domain); we implement the minimal SVG variant — no chart lib (Rule 9: the algorithm is a height computation, a lib would be heavier than the math).

## ADRs

### D1 — `maxScale` clamps; auto-max remains the default

**Decision:** `const max = maxScale && maxScale > 0 ? maxScale : autoMax`; every rendered bar height is clamped to ≤ 100% (`Math.min(100, (value/max)*100)`).

**Rationale:** a fixed scale lets two charts share a y-axis for comparison. Clamping prevents a bar taller than the viewBox when a value exceeds `maxScale` (the a11y table + tooltip still show the true number).

**Alternatives rejected:**
- *No clamp (let bars overflow the viewBox)* — visually broken bars escaping the chart box. Rejected.
- *Scale-to-fit ignoring maxScale when a value exceeds it* — defeats the shared-scale purpose. Rejected (clamp + true value in tooltip/table is honest).

### D2 — `splitSeries` renders grouped (adjacent) bars; default stays stacked

**Decision:** when `splitSeries` is true, each period's inner width is split into two half-bars (input + output side by side), each scaled independently to `max`. Default (false) keeps the existing stacked rendering.

**Rationale:** grouped bars make input-vs-output magnitudes directly comparable per period; stacked shows the per-period total. Both are valid; a boolean toggle is the minimal surface (YAGNI — no need for a strategy object).

**Alternatives rejected:**
- *Separate `<GroupedTokenUsageChart>` component* — duplicates the axis/legend/a11y chrome. Rejected (a prop reuses it).

### D3 — `toUsageMetrics` is the single source for the `total` (DRY)

**Decision:** the chart computes its header `total` via `toUsageMetrics(series).total` instead of an inline `reduce`.

**Rationale:** one authoritative aggregate; the helper is independently tested, so the chart's total is covered transitively.

**Alternatives rejected:**
- *Keep the inline `reduce` + a separate helper* — two representations of the same knowledge (DRY violation). Rejected.

## Dependencies

### Existing — use as-is

| Package | Version | Ecosystem | Why |
|---|---|---|---|
| `react` | `^19` | npm | the chart component (unchanged dep). |

### New — to be introduced

| Package | Version | Ecosystem | Rule 9 rationale | Why this one |
|---|---|---|---|---|
| (none) | | | Pure arithmetic over in-repo types; a chart lib is heavier than the height math. | — |

### Removed

| Package | Last version | Why removed |
|---|---|---|
| (none) | | |

## Dependency Graph

```
T1 (toUsageMetrics + splitUsagePoints, pure) ─→ T2 (maxScale + splitSeries props + DRY total) ─→ T3 (barrel + root export + changelog)
```

## Phase 1 — Pure helpers

### T1.1 — `toUsageMetrics` + `splitUsagePoints`

#### Why this step

**Action:** implement pure `toUsageMetrics(points): { totalInput; totalOutput; total; peak; pointCount }` (peak = max per-period `input+output`, 0 for empty) and `splitUsagePoints(points): { labels: string[]; input: number[]; output: number[] }` (transpose).

**Reasoning:** the testable kernel — totals/peak (ADR D3) + the parallel-series transpose consumers need for grouped rendering or external charts. Pure, total, no DOM. Cited: `TokenUsagePoint` shape `:5-11`.

#### Files to edit
- `src/components/primitives/token-usage-chart/usage-metrics.ts` (NEW)
- `src/components/primitives/token-usage-chart/usage-metrics.test.ts` (NEW)

#### Deep file dependency analysis
- Imports the `TokenUsagePoint` type from `./token-usage-chart.js` (type-only). No runtime/component import.

#### TDD
RED — `usage-metrics.test.ts`:
```ts
const pts = [{ label: "a", input: 10, output: 5 }, { label: "b", input: 2, output: 20 }]
expect(toUsageMetrics(pts)).toEqual({ totalInput: 12, totalOutput: 25, total: 37, peak: 22, pointCount: 2 })
expect(toUsageMetrics([])).toEqual({ totalInput: 0, totalOutput: 0, total: 0, peak: 0, pointCount: 0 })
expect(splitUsagePoints(pts)).toEqual({ labels: ["a", "b"], input: [10, 2], output: [5, 20] })
expect(splitUsagePoints([])).toEqual({ labels: [], input: [], output: [] })
```
GREEN — implement both with `reduce`/`map`.
REFACTOR — keep each ≤ ~12 LoC.

#### Acceptance criteria
- [ ] `pnpm exec vitest run src/components/primitives/token-usage-chart/usage-metrics.test.ts` exits 0 with the totals/peak + transpose + empty cases green.
- [ ] `toUsageMetrics` peak is the max per-period total and is 0 for empty input (asserted).
- [ ] `splitUsagePoints` produces parallel `labels`/`input`/`output` arrays of equal length (asserted).

#### DoD
- [ ] `pnpm exec tsc --noEmit` exits 0.
- [ ] `pnpm exec biome check src/components/primitives/token-usage-chart/` clean.

## Phase 2 — Chart props

### T2.1 — `maxScale` + `splitSeries` + DRY total

#### Why this step

**Action:** add `maxScale?: number` + `splitSeries?: boolean` to `TokenUsageChartProps`. Compute `max = maxScale && maxScale > 0 ? maxScale : autoMax`; clamp all bar heights via `pct(v) = Math.min(100, (v / max) * 100)`. When `splitSeries`, render two adjacent half-bars (input + output) per period; else keep stacked. Replace the inline total `reduce` with `toUsageMetrics(series).total`.

**Reasoning:** the two new affordances (ADR D1/D2) + the DRY total (ADR D3). Clamping keeps bars inside the viewBox while the a11y table/tooltip keep true values. Cited: `:76` (auto-max), `:132-160` (bar loop), `:80` (total).

#### Files to edit
- `src/components/primitives/token-usage-chart/token-usage-chart.tsx`
- `src/components/primitives/token-usage-chart/token-usage-chart.test.tsx` (NEW)

#### Deep file dependency analysis
- Adds two OPTIONAL props (backward compatible — default behavior byte-identical). `TokenUsageChart` is widely consumable; existing callers unaffected.

#### TDD
RED — `token-usage-chart.test.tsx` (happy-dom + @testing-library/react):
```tsx
// maxScale: the y-axis top label reflects the fixed scale, not the data max
const pts = [{ label: "a", input: 10, output: 10 }]
render(<TokenUsageChart points={pts} maxScale={1000} />)
expect(screen.getByText("1.0k")).toBeInTheDocument() // formatTokens(1000)
// default (no maxScale) shows the data-derived max (20)
const { container } = render(<TokenUsageChart points={pts} />)
expect(container.querySelector('[data-slot="token-usage-chart"]')).toBeInTheDocument()
// splitSeries renders two bars per period (grouped); stacked renders the stacked group
const grouped = render(<TokenUsageChart points={pts} splitSeries />)
expect(grouped.container.querySelectorAll("rect").length).toBeGreaterThanOrEqual(2)
// total header uses toUsageMetrics — visible total reflects sum
render(<TokenUsageChart points={[{ label: "x", input: 1000, output: 1000 }]} />)
expect(screen.getByText(/total · 2.0k/)).toBeInTheDocument()
```
GREEN — implement props + `pct` clamp + grouped branch + DRY total.
REFACTOR — extract `pct`; keep the bar loop readable.

#### Acceptance criteria
- [ ] `pnpm exec vitest run src/components/primitives/token-usage-chart/token-usage-chart.test.tsx` exits 0 with maxScale, default, splitSeries, and total cases green.
- [ ] With `maxScale`, the y-axis top tick renders the fixed scale (asserted by visible text).
- [ ] With `splitSeries`, grouped bars render (≥ 2 rects for a single period) (asserted).
- [ ] Default rendering (no new props) is unchanged — existing stacked behavior + total via `toUsageMetrics`.

#### DoD
- [ ] `pnpm exec tsc --noEmit` exits 0.
- [ ] `pnpm exec biome check src/components/primitives/token-usage-chart/` clean.

## Phase 3 — Integration Validation

### T3.1 — barrel + root export + changelog + changeset

#### Why this step

**Action:** re-export `toUsageMetrics`, `splitUsagePoints`, `UsageMetrics`, `UsageSeries` from `token-usage-chart/index.ts` and `src/index.ts`; add CHANGELOG `[Unreleased] § Added` + `.changeset/m5-usage-metrics.md` (`@theokit/ui` minor).

**Reasoning:** G7 — every export consumed/tested; ships via the existing token-usage-chart subpath + root barrel. Unbreakable Rule 6.

#### Files to edit
- `src/components/primitives/token-usage-chart/index.ts`
- `src/index.ts`
- `CHANGELOG.md`
- `.changeset/m5-usage-metrics.md` (NEW)

#### Deep file dependency analysis
- Additive re-exports; `token-usage-chart` already an auto-globbed subpath.

#### TDD
RED — barrel wiring test (in usage-metrics.test.ts):
```ts
const mod = await import("./index.js")
expect(typeof mod.toUsageMetrics).toBe("function")
expect(typeof mod.splitUsagePoints).toBe("function")
```
GREEN — add re-exports.
REFACTOR — none.

#### Acceptance criteria
- [ ] `pnpm exec vitest run src/components/primitives/token-usage-chart/usage-metrics.test.ts` exits 0 including the barrel wiring case.
- [ ] `pnpm build` exits 0; `pnpm exec tsx scripts/validate-quality-gates.ts` PASS.
- [ ] CHANGELOG `[Unreleased] § Added` has an entry and `.changeset/m5-usage-metrics.md` exists.

#### DoD
- [ ] `pnpm exec tsc --noEmit` exits 0; `pnpm exec biome check .` clean on changed files.
- [ ] `pnpm exec vitest run` shows no NEW failures vs baseline.

## Coverage Matrix

| Requirement (Goal + roadmap M5-7) | Task(s) |
|---|---|
| `toUsageMetrics` helper | T1.1 |
| `splitUsagePoints` helper | T1.1 |
| `maxScale` prop (fixed y-axis + clamp) | T2.1 (D1) |
| `splitSeries` prop (grouped bars) | T2.1 (D2) |
| total via `toUsageMetrics` (DRY) | T2.1 (D3) |
| default rendering unchanged | T2.1 |
| public export | T3.1 |

## Global DoD

- [ ] All three phases' acceptance criteria met.
- [ ] `pnpm exec tsc --noEmit` exits 0 (no `any`, explicit return types on public API).
- [ ] `pnpm exec biome check .` clean on changed files.
- [ ] `pnpm exec vitest run` shows no NEW failures vs baseline.
- [ ] `pnpm exec tsx scripts/validate-quality-gates.ts` PASS (primitive boundary + data-slot held).
- [ ] File-size budget respected (helper ≤ ~60 LoC; chart stays a single primitive ≤ ~320 LoC).
- [ ] CHANGELOG `[Unreleased]` updated + changeset present (Unbreakable Rule 6).

## Drawbacks & Risks

| Risk | Severity | Mitigation | Owner |
|---|---|---|---|
| `maxScale` clamp hides that a bar exceeded the scale (visually capped at 100%). | Medium | The per-bar `<title>` tooltip + the `sr-only` a11y table render the TRUE values, so the real number is never lost — only the bar height is clamped (the documented purpose of a fixed scale). | plan owner |
| `splitSeries` grouped rendering changes the SVG node count + per-period layout, risking a regression in the existing stacked path. | Medium | `splitSeries` defaults to false; the stacked branch is unchanged; a test asserts default rendering still produces the stacked group, and a separate test asserts grouped rendering. | plan owner |

## Unresolved Questions

- Whether to support an arbitrary number of series (beyond input/output) — deferred: `TokenUsagePoint` is fixed to input/output and no consumer needs N-series; `splitUsagePoints` returns the two named series. YAGNI. Not in this slice.
