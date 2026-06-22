# Review — M5-7 `splitUsagePoints`/`toUsageMetrics` + chart props (`@theokit/ui`)

**Date:** 2026-06-21
**Slug:** m5-usage-metrics
**Commits:** feat → `45348f6` (review fixes)
**Reviewers:** 2 independent agents (code-correctness + test-quality/cross-validation)
**Verdict:** **READY_TO_MERGE**

## Scope

Pure `toUsageMetrics`/`splitUsagePoints` helpers + `maxScale` (fixed y-axis) + `splitSeries` (grouped bars) props on `TokenUsageChart`.

## Findings & disposition

| ID | Sev | Finding | Disposition |
|---|---|---|---|
| A-stackclamp | MEDIUM | When a STACKED bar exceeds `maxScale` (incl. any binned bar over a fixed scale), input/output heights clamped independently → segments overlap, ratio destroyed (50/50 renders as 100% accent). | **FIXED** `45348f6` — clamp the total, then split it PROPORTIONALLY (`outputH = totalH*output/total`, `inputH = totalH - outputH`) so segments tile to the clamped total without overlap, preserving ratio. Grouped path stays independent (correct there). +regression test asserting heights `[50,50]` not `[100,100]`. |
| B-defaultgeom | HIGH | "Default rendering unchanged" only asserted bar width, not the stacked same-x geometry. | **FIXED** — default test now asserts both segments share one `x` (stacked); grouped test asserts two distinct `x`. |
| B-binmaxscale | MEDIUM | `binPoints` × `maxScale` interaction untested (new-prop tests used single points). | **FIXED** — added a 120-point/maxBars=10/maxScale=100 test asserting binned bars clamp ≤ 100. |
| B-peak1 | LOW | Single-point `peak` untested. | **FIXED** — added a one-point peak test. |
| A-arialabel / A-empty / B-equallen | LOW/INFO | `aria-label` stale under splitSeries; empty `points` untested; `splitUsagePoints` equal-length not asserted as an explicit invariant. | **ACCEPTED** — aria-label "Token usage over time" remains accurate under splitSeries; empty points render safely (no div-by-zero; `barWidth=100/max(1,0)`); the transpose test value-pins exact arrays (implies equal length). Non-blocking. |

### Clean (both reviewers, INFO)

- **`toUsageMetrics`/`splitUsagePoints`** — totals/peak correct (peak 0 for empty); transpose produces equal-length parallel arrays; pure (no input mutation).
- **`maxScale` guard** — `maxScale > 0` falls back to autoMax for 0/negative (no div-by-zero); `pct` clamps to ≤100.
- **binPoints sum-preserving** — the DRY total via `toUsageMetrics(series)` equals the pre-change inline total (binning sums windows).
- **grouped geometry** — two half-width bars, independent scale, no overlap (correct for comparison).
- **a11y** — the `sr-only` table renders TRUE values regardless of the visual clamp (proven by the clamp-honesty test).
- **Type safety** — no `any`/`as`/`@ts-ignore`; explicit return types; `data-slot` preserved; existing chart tests (title/legend/sr-only/a11y) unregressed.

## Gate evidence

| Gate | Result |
|---|---|
| `vitest run token-usage-chart/` | **18 passed** (was 16 pre-review; existing 6 + helpers + props) |
| `tsc --noEmit` | 0 errors |
| `biome check` (changed) | clean |
| `validate-quality-gates.ts` | PASS |
| full suite | 2007 passed |
| code-quality | PASS_WITH_CAVEATS (only `symbol_fab_unverifiable` fixture SOFT_FLOOR; zero in slice files) |
| CHANGELOG + changeset | present |

## Verdict

**READY_TO_MERGE.** One MEDIUM correctness defect (stacked clamp overlap) was fixed in-cycle with a proportional clamp + regression test; two MEDIUM/HIGH test gaps (default geometry, binPoints×maxScale) + a LOW (single-point peak) closed. Helpers are pure + total; the chart's default rendering is unchanged and the new props are clamp-safe and honest (true values in the a11y table). No BLOCKER, zero open HIGH.
