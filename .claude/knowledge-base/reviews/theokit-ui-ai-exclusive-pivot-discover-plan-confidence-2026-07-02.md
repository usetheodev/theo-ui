# Discover-Plan-Confidence — theokit-ui-ai-exclusive-pivot

Date: 2026-07-02
Plan scored: `.claude/knowledge-base/discoveries/plans/theokit-ui-ai-exclusive-pivot-plan.md` (v1.1)
JSON: `theokit-ui-ai-exclusive-pivot-discover-plan-confidence-2026-07-02.json`

## Verdict: `SHIPPABLE_WITH_CAVEATS` (89)

Weighted avg 98.3, capped at 89 by one soft floor (citation density). Clears the plan-gate → proceed to `/discover-execute`.

| Dimension | Score | Notes |
|---|---|---|
| research_coverage | 100 | 4/4 corners populated (tests 1Q, deps 1Q, tools 1Q, techniques 2Q) |
| reference_citations | 100 | 12/12 verified, **0 fabricated** |
| plan_completeness | 100 | 10/10 mandatory sections, 3 ADRs, question budget OK (5 Qs) |
| structural_risk | 89 | −11 penalty: 3 weak_imperatives + 1 vague_pronoun |

**Hard caps triggered:** none.
**Soft caps:** `soft_floor_citation_density_low` (0.91 citations / 200 words, threshold 1.0) — caps at 89. Marginal; not blocking.

## Caveats (explicit, not hidden)

1. **Citation density 0.91 < 1.0** — the plan is one nudge below the density floor. Adding a couple more concrete `path:line` citations inside the question rows would lift the verdict to `SHIPPABLE` (98.3). NOT padded artificially — gaming the metric is an anti-pattern.
2. **Structural-risk smells** — 3 "weak imperative" phrasings + 1 vague pronoun. Cosmetic; do not affect the investigation's soundness.

## Tooling defect found + fixed during scoring

`.claude/rules/discover-plan-thresholds.txt` was authored in `KEY = VALUE` format, but `run_discover_plan_score.py::_parse_thresholds` (and the working sibling `discover-blueprint-thresholds.txt`) use **pipe-delimited** `NAME|SCORE`. The malformed file parsed to `{}`, so `_verdict_for` returned `INVALID` for **every** plan regardless of score — a false negative that would have blocked all discovery plans in this project. Fixed the verdict-band lines to pipe format (values unchanged: 90/70/50/0). This is a pre-existing project-config bug, not a defect of this plan. Worth reporting upstream to the cycle-kit source if it ships the malformed file.

## Next step

`/discover-execute theokit-ui-ai-exclusive-pivot` — produces the blueprint with the deep line-by-line comparison.
