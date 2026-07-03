# Review: component-classification-manifest

**Date:** 2026-07-03
**Reviewer:** single-pass manual review (right-weighted for a small change; the 7-agent cycle-review pipeline was NOT spawned — see § Method)
**Scope:** commits `fb92ba4`, `b967fbe`, `b67a76b` (+ CHANGELOG commit) on `develop`
**Findings:** 6 total (BLOCKER: 0, HIGH: 1, MEDIUM: 2, LOW: 2, INFO: 1)
**Verdict:** READY_TO_MERGE (with the 1 HIGH explicitly mitigated below)

## Method (honesty note)

The heavyweight `/review` skill's own guidance defers small PRs to a lighter review, and its hard pre-condition (a `/code-quality` audit with PASS verdict) is unmet — `code-quality-languages.txt` is empty, so `/code-quality` is not configured for TypeScript in this repo. Rather than force-fit the 5-7-agent machinery around a missing prerequisite, this is a focused manual review of the diff against the plan. It is NOT a substitute for the full pipeline on a larger change.

## HIGH findings

### F1: ~125 of 136 classifications are unreviewed author judgment (only 3 flagged `disputed`)
- Severity: HIGH
- Found by: domain (classification correctness)
- File: `registry/component-classification.json`
- Plan reference: T1.2 (Blueprint §Q2 boundary rule); Unresolved Q1/Q2
- Summary: The plan's checkpoint only required the **11 named** ambiguous components to match Blueprint §Q2. The other ~125 were classified by the author (via the throwaway generator) applying the surface-vocabulary rule by judgment. Several beyond the 3 `disputed` are genuinely debatable: `lane-board` (ai — could be a generic kanban), `channel-card` (cloud-ops — could be generic), `folder-selector` / `recent-folders-list` (ai as coding-agent file context — could be generic pickers), `gateway-status-indicator` / `capability-indicator` (ai). A wrong tag mis-routes a component in M-B/M-C.
- **Mitigation (why this does NOT block merge):** (1) the manifest is DATA behind a gate — any re-tag is a one-line edit that `classify:check` re-validates; (2) it has zero runtime effect until M-C actually moves components; (3) M-B/M-C re-examine the boundary before extraction. The correct action is a human pass over the full manifest before M-C, NOT before this merge.
- Recommended action: Before M-C, a maintainer reviews the full 136-row manifest (not just the 3 disputed) and flags/re-tags borderline entries. Consider widening the `disputed` set now.

## MEDIUM findings

### F2: Rationales are tier-templated, not per-component
- Severity: MEDIUM
- File: `registry/component-classification.json`
- Plan reference: T1.2 ("one-line `rationale` per entry")
- Summary: All non-disputed entries share one of three templated rationale strings by tier ("AI-agent surface vocabulary…", "Generic shadcn-like primitive…", "Cloud/PaaS dashboard…"). The plan asked for a per-entry rationale; templated strings satisfy "a rationale field exists" but carry no component-specific reasoning, so a reader cannot tell WHY `lane-board` is `ai` vs `metrics-panel` is `cloud-ops`.
- Recommended action: Acceptable for the gate; enrich borderline entries with specific rationales during the F1 human pass.

### F3: The manifest was machine-generated, not hand-authored
- Severity: MEDIUM
- File: `registry/component-classification.json` (via `/tmp/gen_classification.py`, not committed)
- Summary: The plan framed T1.2 as authoring data; it was produced by a throwaway generator embedding three name-sets. This is efficient and the gate validates the output, but the generator is not in the repo, so the mapping's provenance (which names went in which set) is not reproducible from the tree. Low risk (the JSON is the source of truth now) but worth noting.
- Recommended action: None required; if the manifest is regenerated later, commit the generator or edit the JSON directly.

## LOW findings

### F4: CLI dispatch (`isMain` block) is not exercised by a test
- Severity: LOW
- File: `scripts/classify-components.ts:148-155`
- Summary: The 3-line `isMain` → `loadAndCheck().then(report → console → process.exit)` dispatch is uncovered (the ~7% gap under 100%). `report()` and `loadAndCheck()` are tested; only the process-exit shell is not. Covering it needs a subprocess spawn — disproportionate.
- Recommended action: Accept; coverage is 93% (DoD ≥90%), critical path 100%.

### F5: `disputed` accuracy is not gate-enforced beyond `env-var-editor`
- Severity: LOW
- File: `scripts/classify-components.test.ts`
- Summary: Only `disputed_flag_present_on_envvareditor` is asserted. `build-log-stream` and `metrics-panel` are also flagged `disputed` in the data but no test pins them, so a future edit could silently drop those flags.
- Recommended action: Optional — add assertions for the other two disputed flags.

## INFO

### F6: Gate + tests + wiring are clean
- The pure `checkClassification` covers all offender branches; `loadAndCheck` guards absent/malformed/non-array; `report()` both exit codes. SRP is clean (pure logic / I/O / render separated). Wired into `quality:gates`. No SOLID/DIP violations (leaf script). File 155 lines (≤500).

## Cross-validation summary (plan vs implementation)

- Plan tasks: 2 (T1.1, T1.2). Both fully implemented.
- ADRs honored: D1 (separate script ✓), D2 (JSON manifest ✓), D3 (surface-vocabulary classification ✓).
- Edge cases absorbed (EC-1..6): all present as tests/behavior; EC-6 drift injection proven live.
- Acceptance Criteria: all met (10→16 tests, 136 entries, Q2 placement asserted, `disputed` on env-var-editor, coverage 93%, `classify:check` exit 0).
- DoD: tsc 0, lint 0, tests green, CHANGELOG updated. ✓
- Divergences: none. The manifest was machine-generated (F3) but content-equivalent to the specified hand-authoring.

## Quality gates summary

- `tsc --noEmit`: PASS (0 errors)
- `biome check`: PASS (0 warnings on changed files)
- `vitest`: PASS (16/16)
- Coverage (`classify-components.ts`): 93.4% stmts / 92.5% lines (critical path 100%)
- `classify:check`: PASS (136 classified, 0 drift); fails-closed on injected drift (EC-6)
- `quality:structure` (existing taxonomy gate): PASS (unaffected)
- Wiring triad: (a) caller ✓ (classify:check + quality:gates), (b) integration ✓ (real-manifest test + EC-6), (c) metric N/A (none declared)

## Handoff decision

**READY_TO_MERGE.** No BLOCKER. The single HIGH (F1 — unreviewed borderline classifications) is mitigated: the manifest is correctable data behind a gate with zero runtime effect until M-C, and the human classification pass is correctly scheduled BEFORE M-C, not before this merge. F2/F3 are documented debt; F4/F5 are optional.

**Pre-release note:** the working tree carries a pre-existing `M .claude/hooks/stop-validation.sh` (not part of this plan). It must be resolved (committed separately by its owner, or stashed) before `/release`, which requires a clean tree.
```

