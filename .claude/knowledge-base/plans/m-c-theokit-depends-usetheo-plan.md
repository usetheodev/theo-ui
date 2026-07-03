# Plan: M-C — `@theokit/ui` depends on `@usetheo/ui` (breaking major + codemod)

> **Version 1.0** — Milestone C: make `@theokit/ui` an AI-exclusive package that DEPENDS on `@usetheo/ui`. Remove the 54 non-AI component dirs (now living in `@usetheo/ui`), re-point the 12 AI components that consumed a moving primitive to import from `@usetheo/ui`, drop the 54 exports from the barrel (breaking), update the classification manifest to the 82 remaining, ship a codemod + a breaking-major CHANGELOG. Because `@usetheo/ui` is unpublished (release policy), theo-ui depends on it via `file:../usetheo-ui` locally; the breaking-major is release-READY but released only at the end-of-roadmap (locked policy).

## Goal

> "Make `@theokit/ui` depend on `@usetheo/ui` and drop the 54 non-AI components, measured by `pnpm typecheck && pnpm test && pnpm build` all exiting 0 with the barrel exporting only the 82 AI components + 0 on-disk non-AI component dirs, and a codemod mapping the 54 moved names."

## Context

Milestone C of the pivot (`knowledge-base/pivot-roadmap.md`). M-A produced the classification manifest (54 non-AI → `@usetheo/ui`); M-B bootstrapped `@usetheo/ui` (54 components + Violet Forge foundation, publishable). M-C completes the split on the theo-ui side. Locked decisions: separate published `@usetheo/ui`; breaking major + codemod; release only at end-of-roadmap. Baseline scan (2026-07-03): only **12 of 82** AI components import a moving primitive (**41 import edges**); `@usetheo/ui` currently exports only `cn` from the foundation (not env/live-region/types).

## Baseline Context

### Files that will be touched (theo-ui)

| File | LoC | Last sha | Why | Invariant |
|---|---|---|---|---|
| `package.json` | 845 | 3234c58-era | add `@usetheo/ui` dep (`file:../usetheo-ui`); bump to breaking major | ESM-only exports preserved |
| `src/components/{primitives,composites}/<54 dirs>/` | — | — | **DELETE** (moved to @usetheo/ui) | none — removed |
| 12 AI components' `.tsx` (41 import edges) | — | — | re-point `../../primitives/<moving>/index.js` → `@usetheo/ui` | behavior identical (same components, new source) |
| `src/index.ts` (barrel, 642) | 642 | — | drop the 54 non-AI exports (BREAKING) | 82 AI exports remain |
| `registry/component-classification.json` | — | 2b46eca-era | reduce to the 82 remaining (all `ai`) OR retire | classify:check green |
| `scripts/classify-components.ts` | 162 | — | gate now expects 82 on-disk (or retired — ADR D3) | gate green |
| `CHANGELOG.md` | — | — | breaking-major entry (Removed: 54 components → @usetheo/ui) | Rule 6 |
| `codemod/` or `docs/migration/` (NEW) | — | — | consumer codemod: `@theokit/ui` X → `@usetheo/ui` X for 54 names | — |

### Current callers / dependents

- **12 AI components** import a moving primitive (41 edges): agent-editor, approval-card, chat-composer, chat-message, choice-prompt, confirm-prompt, multi-select-prompt, permission-modal, rule-editor, skill-editor, text-prompt, usage-meter.
- **Foundation:** 82 AI components use `cn` (143 import sites of `lib/cn`), `env`, `live-region-context`, `types` (moved) + `markdown`, `prompt` (AI-specific, stay). Dedup of `cn` via re-export (1 file changes, not 143).
- **External consumers:** `@theokit/ui` is published v0.19.0. Removing 54 exported components is a BREAKING change → codemod + major bump.

### Domain glossary

- **moving primitive** — one of the 54 non-AI components removed from theo-ui.
- **re-point** — rewrite an AI component's import of a moving primitive from `../../primitives/<x>/index.js` to `@usetheo/ui`.
- **foundation dedup** — replace theo-ui's `lib/cn.ts` body with `export { cn } from "@usetheo/ui"` so the typescale has one source (env/live-region/types stay local — see ADR D2).
- **codemod** — a consumer-facing migration mapping the 54 moved export names from `@theokit/ui` to `@usetheo/ui`.

### Architecture boundaries affected

- `rules/architecture.md § 2` (DIP/acyclic): theo-ui (high-level AI) now depends on @usetheo/ui (low-level primitives) — the intended direction. Never the reverse (verified in M-B: 0 reverse dep).

## Prior Art & Related Work

- **Blueprint** §Q1 (AI Elements imports primitives from the separate package one-directionally) — the exact end-state M-C realizes.
- **Reference:** `.claude/knowledge-base/references/ai-elements/packages/elements/src/message.tsx:3` — an AI component importing `Button` from `@repo/shadcn-ui` (the pattern our 12 re-points mirror).
- **M-A manifest + M-B evidence** — the 54/82 split contract.

## Dependencies

### Existing — used as-is
| Package | Ecosystem | Why |
|---|---|---|
| (theo-ui's AI-engine deps) | npm | unchanged — the AI components keep their deps |

### New — to be introduced
| Package | Version | Ecosystem | Rule 9 rationale | Why this one |
|---|---|---|---|---|
| `@usetheo/ui` (NEW) | `file:../usetheo-ui` (local until published) | npm | n/a — our own package from M-B | the extracted non-AI foundation theo-ui now depends on |

### Removed
| Package | Why removed |
|---|---|
| (none — deps unchanged; only components move) | |

## Objective

- [ ] `@usetheo/ui` added as a dependency (`file:../usetheo-ui`), resolvable in theo-ui.
- [ ] 12 AI components re-pointed (41 edges): moving-primitive imports now from `@usetheo/ui`.
- [ ] 54 non-AI component dirs deleted from theo-ui.
- [ ] Barrel exports only the 82 AI components (54 dropped — breaking).
- [ ] `cn` deduped via re-export from `@usetheo/ui`.
- [ ] Classification manifest reduced to 82 (all `ai`); `classify:check` green.
- [ ] `pnpm typecheck && pnpm test && pnpm build` exit 0.
- [ ] Codemod written (54-name map); CHANGELOG breaking-major entry.
- [ ] Bundle-size delta measured (should shrink — 54 fewer components).

## ADRs

### D1 — `file:../usetheo-ui` local dependency until published
- **Decision:** theo-ui depends on `@usetheo/ui` via `file:../usetheo-ui` locally; the actual published dep (`^0.1.0`) is swapped in at the end-of-roadmap release when `@usetheo/ui` publishes.
- **Rationale:** `@usetheo/ui` is unpublished (release policy); a `file:` link lets theo-ui build/test against the real package now. Alternatives: `workspace:*` (rejected — separate git repos, no pnpm workspace); publish now (rejected — violates release policy + unconfirmed npm scope).
- **Consequences:** theo-ui's published tarball must NOT ship with `file:`; the release step swaps `file:` → `^0.1.0`. Documented for the release.

### D2 — Dedup only `cn`; keep env/live-region/types local
- **Decision:** replace theo-ui's `lib/cn.ts` body with a re-export from `@usetheo/ui`; keep `env`, `live-region-context`, `types` as local copies.
- **Rationale:** `cn` carries the Violet Forge typescale — the one piece where drift is dangerous (DRY on knowledge). `env`/`live-region`/`types` are tiny stable utils NOT exported by `@usetheo/ui` today; re-exporting them would require extending @usetheo/ui's API (re-trabalho on M-B). KISS: dedup the one that matters. Alternatives: full dedup (rejected — needs new @usetheo/ui exports, larger blast radius); no dedup (rejected — typescale drift risk).
- **Consequences:** minor duplication of 3 small utils (accepted, documented); a follow-up may fully dedup once @usetheo/ui exports them.

### D3 — Reduce the manifest to 82; keep `classify:check` as an AI-purity gate
- **Decision:** remove the 54 non-AI entries from `component-classification.json` (now 82, all `ai`); `classify:check` continues as a gate that the remaining on-disk components are all `ai` (drift guard against re-introducing a non-AI component).
- **Rationale:** post-split, theo-ui is all-AI; the gate's new job is "no non-AI component sneaks back in." Alternatives: delete classify:check (rejected — loses the drift guard); keep 136 entries (rejected — 54 stale → gate fails).
- **Consequences:** the gate's semantics shift from "everything classified" to "everything is ai"; documented in the gate + CHANGELOG.

## Drawbacks & Risks

| Risk | Severity | Mitigation | Owner |
|---|---|---|---|
| Breaking change to a published package | High | Codemod + major bump + CHANGELOG Removed section; release deferred to end-of-roadmap | maintainer |
| A re-pointed import resolves wrong / a removed component still referenced | High | `tsc` is the mechanical proof — fails on any dangling import; the 12/41 scope is bounded and gated | impl |
| `file:` dep leaks into the published tarball | Medium | D1 — release swaps `file:` → `^0.1.0`; documented | release |
| Foundation `cn` re-export changes behavior (different preset) | Medium | @usetheo/ui's cn is a verbatim seed of theo-ui's (same typescale); `cn.test` proves merge behavior | impl |
| Bundle/a11y/structure gates fail with 54 fewer components | Medium | Re-run full `quality:gates`; update `quality:bundle` baseline (54 fewer is a legit shrink) | impl |

## Unresolved Questions

- Q1 — Do any of the 82 AI components import a moving primitive via the BARREL (`@theokit/ui`) rather than a relative path? (17 files reference `@theokit/ui` — mostly self/comment). Resolve in Phase 1 by grep; re-point those too.
- Q2 — Does `quality:bundle`'s ±5% baseline need re-pinning after removing 54 components? Assumed yes (legit shrink); re-pin in Phase 3.

## Dependency Graph

```
Phase 0 (file: dep + verify resolve) ─▶ Phase 1 (re-point 12 + dedup cn) ─▶ Phase 2 (remove 54 + barrel + manifest) ─▶ Phase 3 (gates + codemod + benchmark) ─▶ Final (integration validation)
```

---

## Phase 0: Add `@usetheo/ui` dependency, verify it resolves

### T0.1 — Add `file:../usetheo-ui` dep + build @usetheo/ui + verify import resolves
**Objective:** `@usetheo/ui` is installed in theo-ui and `import { Button } from "@usetheo/ui"` typechecks.
**Why:** the dependency must resolve before any re-point (D1). @usetheo/ui must be built (dist present) for `file:` to expose the package.
**Evidence:** no pnpm-workspace (verified) → `file:` link. @usetheo/ui builds (M-B evidence).
**Files to edit:** `package.json` (add dep).
**TDD:**
```
RED:   a throwaway `import { Button } from "@usetheo/ui"` fails to typecheck before the dep exists.
GREEN: add dep + pnpm install + @usetheo/ui built -> the import typechecks.
VERIFY: pnpm install && echo 'import {Button} from "@usetheo/ui"; void Button;' > /tmp/t.ts && ...
```
**Concurrency tests:** (none — single-threaded)
**Acceptance:** [ ] `@usetheo/ui` in package.json deps; [ ] `pnpm install` exit 0; [ ] a probe import of `Button` from `@usetheo/ui` typechecks.
**DoD:** [ ] dependency resolves.

## Phase 1: Re-point the 12 AI components + dedup `cn`

### T1.1 — Re-point 41 moving-primitive imports across 12 components
**Objective:** the 12 AI components import moving primitives from `@usetheo/ui`, not relative paths.
**Why:** the moving primitives leave theo-ui; their AI consumers must source them from the new package (mirrors ai-elements message.tsx importing Button from @repo/shadcn-ui).
**Evidence:** 12 components / 41 edges (baseline scan).
**Files to edit:** the 12 components' `.tsx` (agent-editor, approval-card, chat-composer, chat-message, choice-prompt, confirm-prompt, multi-select-prompt, permission-modal, rule-editor, skill-editor, text-prompt, usage-meter).
**TDD:**
```
RED:   after removing the 54 (Phase 2), tsc fails on the 12 with unresolved relative imports IF not re-pointed.
GREEN: rewrite `../../primitives/<moving>/index.js` -> named import from `@usetheo/ui`; tsc 0.
VERIFY: pnpm typecheck (0 errors on the 12)
```
**Concurrency tests:** (none — single-threaded)
**Acceptance:** [ ] `grep -rE "primitives/(button|card|...moving...)" <12 dirs>` == 0 (all re-pointed); [ ] `pnpm typecheck` exit 0.
**DoD:** [ ] 12 re-pointed, typecheck green.

### T1.2 — Dedup `cn` via re-export from `@usetheo/ui`
**Objective:** `theo-ui/src/lib/cn.ts` re-exports `@usetheo/ui`'s cn; the 143 `lib/cn` import sites keep working unchanged.
**Why:** single source for the Violet Forge typescale (D2); avoids touching 143 files.
**Evidence:** @usetheo/ui exports `cn`; 143 theo-ui files import `lib/cn`.
**Files to edit:** `src/lib/cn.ts` (body → re-export).
**TDD:**
```
RED:   a test asserting theo-ui cn === usetheo cn behavior (or cn.test still passes) before change.
GREEN: lib/cn.ts -> `export { cn } from "@usetheo/ui";`; cn.test passes; typecheck 0.
VERIFY: pnpm test src/lib/cn && pnpm typecheck
```
**Concurrency tests:** (none — single-threaded)
**Acceptance:** [ ] `src/lib/cn.ts` re-exports from `@usetheo/ui`; [ ] `pnpm test src/lib/cn.test.ts` green; [ ] typecheck 0.
**DoD:** [ ] cn deduped, tests green.

## Phase 2: Remove the 54 + barrel + manifest

### T2.1 — Delete the 54 non-AI dirs + drop from barrel + update manifest
**Objective:** the 54 dirs are gone; the barrel exports only 82; the manifest has 82 entries; `classify:check` green.
**Why:** completes the split — theo-ui is AI-exclusive.
**Evidence:** M-A manifest defines the 54; barrel exports them; classify:check validates.
**Files to edit:** delete 54 dirs; `src/index.ts` (drop 54 exports); `registry/component-classification.json` (→82); `scripts/classify-components.ts` (expect all-ai).
**TDD:**
```
RED:   classify:check FAILS (54 stale) + tsc fails (barrel exports deleted dirs) before cleanup.
GREEN: delete dirs + drop barrel exports + reduce manifest -> tsc 0, classify:check 0.
VERIFY: pnpm typecheck && pnpm classify:check
```
**Concurrency tests:** (none — single-threaded)
**Acceptance:** [ ] 54 dirs deleted (`ls src/components/**/ | wc -l` reflects 82); [ ] barrel has 0 of the 54 names; [ ] manifest 82 entries all `ai`; [ ] `pnpm typecheck && pnpm classify:check` exit 0.
**DoD:** [ ] 54 removed, gates green.

## Phase 3: Full gates + codemod + benchmark

### T3.1 — Full quality:gates + codemod + CHANGELOG breaking-major + benchmark
**Objective:** the whole theo-ui quality chain green; a consumer codemod; a breaking-major CHANGELOG; bundle-size delta measured.
**Why:** the goal mandates 100%-green gates + benchmark; breaking change needs codemod + major bump (Rule 6).
**Evidence:** goal requirements; Rule 6.
**Files to edit:** `docs/migration/` codemod (NEW); `CHANGELOG.md`; re-pin `quality:bundle` baseline.
**TDD:**
```
RED:   (measurement) quality:bundle may fail on the shrink before re-pin.
GREEN: full `pnpm quality:gates` green (after bundle re-pin); codemod + CHANGELOG written.
VERIFY: pnpm test && pnpm typecheck && pnpm build && pnpm classify:check && pnpm quality:structure
```
**Concurrency tests:** (none — single-threaded)
**Acceptance:** [ ] `pnpm typecheck && pnpm test && pnpm build && pnpm classify:check && pnpm quality:structure` exit 0; [ ] codemod maps all 54 names; [ ] CHANGELOG has a Removed (breaking) entry; [ ] bundle-size delta recorded (before/after).
**DoD:** [ ] gates green, codemod + CHANGELOG + benchmark done.

## Coverage Matrix

| # | Requirement | Task | Resolution |
|---|---|---|---|
| 1 | @usetheo/ui dep resolves | T0.1 | file: link, probe import |
| 2 | 12 components re-pointed | T1.1 | 41 edges → @usetheo/ui |
| 3 | cn deduped | T1.2 | re-export |
| 4 | 54 removed | T2.1 | dirs deleted |
| 5 | barrel 82-only (breaking) | T2.1 | 54 exports dropped |
| 6 | manifest/classify updated | T2.1 | 82 entries, gate green |
| 7 | full gates green | T3.1 | quality chain |
| 8 | codemod + breaking CHANGELOG | T3.1 | 54-name map + Removed entry |
| 9 | benchmark (bundle delta) | T3.1 | before/after size |

**Coverage: 9/9 (100%)**

## Global Definition of Done

- [ ] `pnpm typecheck && pnpm test && pnpm build && pnpm classify:check && pnpm quality:structure` all exit 0.
- [ ] 54 non-AI dirs removed; barrel exports only 82 AI; 0 dangling imports (tsc proof).
- [ ] `@usetheo/ui` depended via `file:../usetheo-ui` (release swaps to `^0.1.0`).
- [ ] `cn` deduped; env/live-region/types kept local (D2, documented).
- [ ] Codemod maps the 54 moved names; CHANGELOG breaking-major (Removed) entry (Rule 6).
- [ ] Bundle-size delta measured (before/after removing 54).
- [ ] Committed locally on `develop` (NOT released — release policy; the swap `file:`→`^0.1.0` + publish happen at the end-of-roadmap release).

## Failure scenarios (when I/O external)

```
(none — no runtime external I/O; build/test are local. npm publish deferred to release, out of M-C scope.)
```

## Final Phase: Integration Validation (MANDATORY)

### Execution
```
cd theo-ui
pnpm install                # @usetheo/ui file: link resolves
pnpm typecheck              # 0 — no dangling imports after removing 54
pnpm test                   # AI component tests green (moving-primitive deps from @usetheo/ui)
pnpm build                  # barrel builds with 82
pnpm classify:check         # 82 on-disk, all ai
pnpm quality:structure      # taxonomy gate green
grep -rlE "components/(primitives|composites)/(button|card|...54...)" src/components | wc -l  # == 0 (no dangling ref)
```
### Acceptance Criteria
- [ ] All gates green.
- [ ] 0 dangling references to removed components.
- [ ] Bundle-size delta recorded.
### If Validation Fails
1. Separate M-C-caused from pre-existing.
2. Fix all M-C-caused (dangling import → re-point or the component shouldn't have been removed).
3. Re-run.
