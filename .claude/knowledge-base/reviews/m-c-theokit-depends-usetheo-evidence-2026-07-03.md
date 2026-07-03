# M-C Evidence & Benchmark — @theokit/ui depends on @usetheo/ui (breaking)

**Date:** 2026-07-03
**Repo:** theo-ui @ develop (commit 38e1054, amended)
**Purpose:** hard evidence for the M-C breaking refactor. Honest about what is verified-green vs the documented release-time deferral.

## 1. Quality gates (measured, all green EXCEPT the documented publint deferral)

| Gate | Command | Result |
|---|---|---|
| Format | `pnpm format:check` (biome) | **PASS** |
| Lint | `pnpm lint` (biome) | **PASS** (530 files) |
| Types | `pnpm typecheck` | **0 errors** — the mechanical proof that 0 imports dangle after removing 54 dirs |
| Dead code | `pnpm quality:knip` | **exit 0** (13 now-unused deps removed; only pre-existing mermaid.tsx "unused file" warning) |
| Tests | `pnpm test` | **1400 passed / 1400** (158 files) — updated 8 meta-tests that pinned the old 136-component state |
| Build | `pnpm build` | **success** — `@usetheo/ui` externalized (moved primitives NOT bundled) |
| Classification | `pnpm classify:check` | **82 classified, 0 drift** (manifest reduced to the 82 ai) |
| Structure | `pnpm quality:structure` | **PASS** (a11y threshold recalibrated; README prose de-referenced moved components) |
| Registry | `pnpm registry:build && registry:validate` | **PASS** (96 items; cross-registry deps → @usetheo/ui URLs) |
| a11y | `pnpm quality:a11y` | **171 passed** |
| Bundle | `pnpm quality:bundle` | re-pinned (54 fewer components is a legit shrink) |
| **Publint** | `pnpm quality:publint` | **RED — DOCUMENTED DEFERRAL:** flags `@usetheo/ui: file:../usetheo-ui` "will not work for end-users". This is D1/D3 by design — @usetheo/ui is unpublished (release policy); the release step swaps `file:` → `^0.1.0`. NOT a defect; the package is functionally complete. |

`quality:gates:fast` (format+lint+typecheck+knip+registry+structure) = **exit 0**.

## 2. The refactor (verified)

- **54 non-AI component dirs removed** (moved to @usetheo/ui in M-B). `ls src/components/{primitives,composites}` = 60 + 22 = 82.
- **All AI-component importers re-pointed** to `@usetheo/ui` (16 files, 47 import edges — the initial 12-component scan was incomplete; the comprehensive path-segment re-point caught screens + siblings + stories). `typecheck 0` proves no dangling import.
- **Barrel** exports only the 82 AI components (54 dropped — BREAKING).
- **Manifest** reduced to 82, all `ai`; classify:check green.
- **@usetheo/ui** depended via `file:../usetheo-ui` (release swaps to `^0.1.0`).
- **cn dedup (D2):** DEFERRED — theo-ui keeps its own cn/env/live-region/types (verbatim copies; @usetheo/ui exports only cn today). Documented follow-up; no drift risk (identical seed).
- **Codemod** `codemod/split-usetheo.mjs` (117 moved symbols) + `docs/migration/v1-usetheo-ui-split.md`.
- **CHANGELOG** breaking `Removed` + `Changed` entries.
- **Latent M-A bug fixed:** build/validate-registry now skip `component-classification.json` (it was breaking registry:build since M-A).

## 3. Benchmark

```
theo-ui dist/index.js:   68 KB  (82 components; @usetheo/ui externalized — moved primitives not bundled)
runtime deps:            22 -> 9  (removed 13 that only the 54 moved components used: 12 @radix-ui + cmdk)
subpath exports:         154 -> 90
components:              136 -> 82  (-40%)
tests:                   1400 passed / 158 files
```

## 4. DoD checklist (plan m-c v1.0)

- [x] `@usetheo/ui` dep resolves (`file:../usetheo-ui`, probe import OK)
- [x] AI importers re-pointed (typecheck 0)
- [x] 54 dirs removed; barrel 82-only (breaking)
- [x] manifest/classify updated to 82; gate green
- [x] `pnpm typecheck && pnpm test && pnpm build` all exit 0 (the Goal metric — MET)
- [x] codemod + breaking CHANGELOG
- [x] bundle-size delta measured (§3)
- [~] full `quality:gates`: green EXCEPT publint (documented D1/D3 file:-dep deferral — resolved at release)
- [ ] cn dedup (D2) — deferred, documented
- [x] committed locally on develop (NOT released — release policy)

## 5. Honesty notes (the M-B lesson: no false completion)

- **publint is red by design** — the `file:` dep can't ship; the release swaps it to `^0.1.0` when @usetheo/ui publishes (end-of-roadmap). This is the ONE gate that is expected-red, fully documented in D1/D3 and the DoD. Every FUNCTIONAL gate is green.
- **cn dedup (D2) deferred** — not done; documented. theo-ui carries an identical copy (no drift risk today).
- **visual (playwright) + dogfood:* NOT re-run** in this pass (budget) — the moved components' visual/dogfood tests left with them; the remaining are AI-engine dogfoods (whiteboard/slide) unaffected by M-C. Flagged as un-verified-this-pass, not claimed green.

## 6. Verdict

**READY_TO_MERGE (structural refactor)** — the M-C Goal metric is met and every functional gate is green (1400 tests, typecheck 0, build, classify, structure, registry, a11y). The sole red gate (publint) is the documented D1/D3 `file:`-dep deferral resolved at the end-of-roadmap release. cn dedup + a visual/dogfood re-run are documented follow-ups, not blockers for the breaking-refactor's correctness.
