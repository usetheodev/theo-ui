---
"@theokit/ui": minor
---

`TokenUsageChart` gains `maxScale` (fixed y-axis for shared-scale comparison, with clamping) and `splitSeries` (grouped input/output bars instead of stacked). Adds pure `toUsageMetrics` (totals + peak) and `splitUsagePoints` (transpose into parallel series) helpers, exported from `@theokit/ui/token-usage-chart` and the root barrel.
