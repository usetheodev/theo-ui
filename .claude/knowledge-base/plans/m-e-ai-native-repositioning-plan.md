# Plan: M-E — AI-native repositioning

> **Version 1.0** — Milestone E (final of the pivot): reframe `@theokit/ui`'s public narrative from "built for AI agents **+ cloud dashboards**" to **AI-native**. The cloud/generic layer moved to `@usetheo/ui` (M-B/M-C); theo-ui is now the 82-component AI-exclusive package that depends on `@usetheo/ui`. This is a copy/narrative milestone (README HERO, `package.json` description, CLAUDE.md narrative anchors, docs) — no code. It touches the CLAUDE.md **locked** "built for AI agents + cloud dashboards" wedge; per CLAUDE.md that requires a monorepo-level strategic review — the user's pivot decision IS that review (documented in this ADR). Gates that apply: `quality:structure` (README ↔ exports drift + docs typography drift) + the public-copy lint. "Benchmark" for a narrative milestone = measured doc-consistency (gates green) + the narrative delta, NOT a throughput number (that would be theatre — forbidden by the FAANG/no-workaround bar).

## Goal

> "Reframe `@theokit/ui`'s public narrative to AI-native (drop the co-equal 'cloud dashboards' wedge; 82 components; point generic/cloud consumers to `@usetheo/ui`), measured by `pnpm quality:structure` + the public-copy lint exiting 0 with 0 references to moved components as theo-ui exports."

## Context

Final milestone of the pivot (`knowledge-base/pivot-roadmap.md`). M-C already de-referenced 3 moved components from README prose. Baseline (2026-07-03): README HERO + `package.json` description + `CLAUDE.md` §"What this project is"/§ narrative anchors + docs still say "AI agents + cloud dashboards", "153 components" (now 82), and the README "cloud dashboard" example list enumerates 7 components that MOVED to `@usetheo/ui` (deployment-row, env-var-editor, domain-config, preview-env-card, project-card, metrics-panel, rollback-ui). The `Voice and Tone` lock (CLAUDE.md) still governs the copy.

## Baseline Context

### Files that will be touched

| File | What changes | Invariant |
|---|---|---|
| `README.md` | HERO + "cloud dashboard" example section + counts → AI-native; 82; generics → @usetheo/ui | auto-count blocks (`BEGIN:counts`, catalog) stay sync:readme-generated |
| `package.json` | `description` → AI-native (drop "framework-agnostic ... cloud dashboards ... developer-tooling") | valid JSON |
| `CLAUDE.md` | §"What this project is" (153→82, drop co-equal cloud-dashboards) + narrative-anchor bullet + ADR documenting the locked-wedge change | Voice/Tone lock still honored; cross-project anchors from root CLAUDE.md not contradicted |
| `docs/*.md` | reconcile any stale count/positioning drift (sync:readme handles architecture.md census) | typography-drift gate green |

### Current callers / dependents

- **Public copy** — README/package.json/CLAUDE.md are consumer/contributor-facing; no code depends on them.
- **Gates:** `quality:structure` checks README ↔ exports drift + docs typography; `hooks/public-copy-lint.sh` checks banned framings. `sync:readme` regenerates counts/catalog/census.
- **Locked narrative:** CLAUDE.md §"What this project is" + §"Voice and Tone" + the cross-project anchors. Changing the "AI agents + cloud dashboards" wedge needs strategic review (this ADR = the user's pivot decision).

### Domain glossary

- **HERO** — the first screen of the README; outcome-shaped, not implementation-shaped (public-copy.md § 2).
- **wedge** — the categorical positioning claim that differentiates the library.
- **AI-native** — the post-pivot identity: components for AI-agent surfaces (chat, tools, reasoning, models, MCP, sessions, coding-agent shells), depending on `@usetheo/ui` for generics.

### Architecture boundaries affected

- None (docs only). The AI-exclusive identity reflects the M-C code boundary already shipped.

## Prior Art & Related Work

- **Blueprint** §"Recommendations" (5) — "positioning: AI-native; the generic primitives + cloud-ops move to @usetheo/ui".
- **CLAUDE.md § Voice and Tone** + `rules/public-copy.md` — the copy rules M-E must honor.
- **Pivot roadmap** — M-E is the repositioning milestone.

## Dependencies

This is a docs-only milestone. No package dependency change.

### Existing — used as-is
| Package | Ecosystem | Why |
|---|---|---|
| (none — docs only) | | |

### New — to be introduced
(none)

### Removed
(none)

## Objective

- [ ] README HERO reframed AI-native (drop co-equal "cloud dashboards"; 82; the "cloud dashboard" section points generics/cloud to `@usetheo/ui`).
- [ ] `package.json` description reframed AI-native.
- [ ] CLAUDE.md §"What this project is" + narrative anchor updated (82; AI-exclusive; depends on `@usetheo/ui`) + an ADR documenting the locked-wedge change.
- [ ] docs/ count/positioning drift reconciled (sync:readme + manual).
- [ ] 0 references to moved components as theo-ui exports/features in public copy.
- [ ] `pnpm quality:structure` exit 0; public-copy lint clean.
- [ ] Benchmark: narrative delta (word/section/count deltas) + gates-green evidence.

## ADRs

### D1 — Reframe the locked "AI agents + cloud dashboards" wedge to AI-native (strategic decision = the pivot)
- **Decision:** narrow the CLAUDE.md categorical wedge from "AI agents + cloud dashboards" to **AI-native** (AI-agent surfaces only); the cloud/generic layer is `@usetheo/ui`, which `@theokit/ui` depends on.
- **Rationale:** the pivot (M-A..M-D, user-driven) physically moved the generic + cloud-ops components to `@usetheo/ui`. The copy MUST reflect shipped reality (honesty — rules/public-copy.md § 3). CLAUDE.md requires a strategic review to change the locked wedge; the user's explicit pivot decision (2026-07-03, recorded in the pivot roadmap + memory) IS that review. Alternatives: keep the old wedge (rejected — the copy would lie about what theo-ui ships); soften to "AI + optional cloud" (rejected — cloud-ops moved; theo-ui no longer ships them).
- **Consequences:** the "cloud dashboards" co-equal wedge is retired from theo-ui's identity; it becomes `@usetheo/ui`'s territory. The cross-project anchor "UI pillar of Theo" is unchanged. Documented at the monorepo level via this ADR + the pivot roadmap.

### D2 — Auto-generated counts stay generated; only prose is hand-edited
- **Decision:** let `sync:readme` regenerate the count badges/catalog/census (82); hand-edit only the HERO/prose/CLAUDE.md narrative.
- **Rationale:** DRY — the counts have one source (the barrel/exports); hand-editing them re-introduces drift the sync script exists to prevent. Alternative: hand-edit counts (rejected — drift risk, the structure gate would catch it).
- **Consequences:** the count-accuracy is gate-enforced; prose is the human judgment.

## Drawbacks & Risks

| Risk | Severity | Mitigation | Owner |
|---|---|---|---|
| Copy contradicts the root CLAUDE.md cross-project anchors | Medium | D1 preserves "UI pillar of Theo"; only the cloud-dashboards wedge changes; re-read anchors before publishing | maintainer |
| README prose still references a moved component | High | grep proof: 0 moved-component names as theo-ui exports in README/package.json | impl |
| Voice/Tone lock violated (banned framings) | Medium | public-copy lint gate; honor the HERO/BODY/DEEP-DIVE rules | impl |
| Count drift after edits | Medium | sync:readme + quality:structure gate | impl |

## Unresolved Questions

- Q1 — Does the CLAUDE.md `Voice and Tone` lock need a companion update, or only §"What this project is"? Assumed: only the narrative/wedge; the voice RULES are unchanged (still aspirational). Resolve in Phase 1.

## Dependency Graph

```
Phase 0 (reframe README + package.json + CLAUDE.md + docs) ─▶ Phase 1 (sync + gates + grep-proof) ─▶ Final (integration validation)
```

---

## Phase 0: Reframe the narrative

### T0.1 — Reframe README HERO + package.json + CLAUDE.md + docs to AI-native
**Objective:** the public copy says AI-native (82; generics/cloud → @usetheo/ui); 0 moved-component references as theo-ui exports.
**Why:** the copy must match the shipped AI-exclusive reality (honesty; D1).
**Evidence:** baseline grep — README HERO "AI agents + cloud dashboards", "153 components", the "cloud dashboard" example section enumerates 7 moved components; package.json "framework-agnostic ... cloud dashboards"; CLAUDE.md line 11/53.
**Files to edit:** `README.md`, `package.json`, `CLAUDE.md`, `docs/*.md` (as drift requires).
**TDD (docs adaptation of RED-GREEN):**
```
RED:   grep of moved-component names as theo-ui exports in README/package.json returns > 0; quality:structure flags README/docs drift.
GREEN: reframe -> grep returns 0; quality:structure PASS; public-copy lint clean.
VERIFY: pnpm sync:readme && pnpm quality:structure && bash .claude/hooks/public-copy-lint.sh README.md (advisory)
```
**Concurrency tests:** (none — single-threaded)
**Acceptance:** [ ] README HERO AI-native (no co-equal cloud-dashboards); [ ] package.json description AI-native; [ ] CLAUDE.md §"What this project is" 82 + AI-exclusive + @usetheo/ui + ADR; [ ] `grep -iE "deployment-row|env-var-editor|domain-config|preview-env|rollback-ui|metrics-panel" README.md package.json` returns 0 as theo-ui exports.
**DoD:** [ ] copy reframed; grep-proof 0.

## Phase 1: Sync + gates + proof

### T1.1 — sync:readme + quality:structure + public-copy lint + narrative benchmark
**Objective:** counts regenerated (82); `quality:structure` exit 0; public-copy lint clean; narrative delta recorded.
**Why:** the gates prove the copy is consistent + honest; the benchmark is the measured delta (§ goal — appropriate to a narrative milestone).
**Files to edit:** (regenerated) README count blocks, docs/architecture.md census.
**TDD:**
```
RED:   quality:structure fails on README↔exports drift before sync.
GREEN: pnpm sync:readme -> counts 82; quality:structure exit 0.
VERIFY: pnpm quality:structure && pnpm typecheck (docs edits don't affect code, sanity)
```
**Concurrency tests:** (none — single-threaded)
**Acceptance:** [ ] `pnpm sync:readme` regenerates counts to 82; [ ] `pnpm quality:structure` exit 0; [ ] public-copy lint clean; [ ] narrative benchmark recorded (before/after HERO, count delta, moved-refs 0).
**DoD:** [ ] gates green; benchmark recorded.

---

## Coverage Matrix

| # | Requirement | Task | Resolution |
|---|---|---|---|
| 1 | README HERO AI-native | T0.1 | reframed |
| 2 | package.json description | T0.1 | reframed |
| 3 | CLAUDE.md narrative + ADR | T0.1 | reframed + D1 documented |
| 4 | 0 moved-component refs as exports | T0.1 | grep-proof |
| 5 | counts → 82 | T1.1 | sync:readme |
| 6 | quality:structure + public-copy green | T1.1 | gates |
| 7 | narrative benchmark | T1.1 | delta recorded |

**Coverage: 7/7 (100%)**

## Global Definition of Done

- [ ] README HERO + package.json + CLAUDE.md + docs reframed AI-native.
- [ ] 0 moved-component names presented as theo-ui exports/features in public copy (grep-proof).
- [ ] `pnpm sync:readme` counts = 82; `pnpm quality:structure` exit 0; public-copy lint clean.
- [ ] ADR D1 documents the locked-wedge strategic change (per CLAUDE.md § When this file is wrong).
- [ ] Benchmark recorded (HERO before/after, count delta, moved-refs 0, gates green).
- [ ] Committed locally on develop (NOT released — release policy; the whole pivot ships at the end-of-roadmap release).

## Failure scenarios (when I/O external)

```
(none — docs only; no runtime I/O.)
```

## Final Phase: Integration Validation (MANDATORY)

### Execution
```
pnpm sync:readme            # counts -> 82
pnpm quality:structure      # README↔exports + docs typography drift PASS
pnpm typecheck              # sanity — docs edits don't break code
grep -icE "deployment-row|env-var-editor|domain-config|preview-env-card|project-card|metrics-panel|rollback-ui" README.md  # moved components not presented as theo-ui exports
bash .claude/hooks/public-copy-lint.sh README.md   # advisory — no banned framings
```
### Acceptance Criteria
- [ ] `pnpm quality:structure` exit 0.
- [ ] counts = 82.
- [ ] 0 moved-component names as theo-ui exports in README/package.json.
- [ ] public-copy lint clean.
- [ ] narrative benchmark recorded.
### If Validation Fails
1. Separate M-E-caused from pre-existing.
2. Fix (drift / moved-ref / banned framing) and re-run.
