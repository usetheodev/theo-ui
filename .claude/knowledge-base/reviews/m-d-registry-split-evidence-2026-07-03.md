# M-D Evidence & Benchmark — registry split (@usetheo/ui registry + cross-reference)

**Date:** 2026-07-03
**Repos:** usetheo-ui @ develop (commits 66e600d + 150f459), theo-ui (unchanged — M-C did that side)
**Purpose:** hard evidence that the shadcn-compatible registry split is complete: @usetheo/ui has its own registry, every theo-ui cross-reference resolves, drift is mechanically guarded.

## 1. Gates (measured, all green)

| Gate | Command | Result |
|---|---|---|
| Registry build | `pnpm registry:build` (usetheo-ui) | **60 items** (53 components + 7 foundation) |
| Registry validate | `pnpm registry:validate` (usetheo-ui) | **PASS (60 items)** |
| Cross-registry consistency | theo-ui refs ⊆ usetheo-ui items | **15/15 resolve, 0 missing** |
| Regression (usetheo-ui) | typecheck / test / build | **0 errors / 664 passed / build ok** |
| theo-ui side | `pnpm registry:validate` (theo-ui) | **PASS (96 items)** — unchanged |
| Drift-guard (new) | inject-test: remove skeleton's dep | **gate FAILS** with "imports @/.../live-region-context but registryDependencies is missing" |

## 2. The split (verified)

- **theo-ui side (M-C):** 15 `registryDependencies` point to `usetheodev.github.io/usetheo-ui/r/<name>.json` URLs; `validate-registry` accepts external URLs.
- **@usetheo/ui side (M-D):** built its own registry — 53 component descriptors + 7 foundation (cn, tailwind-preset, env, safe-href, types, task-types, live-region-context), all recovered from theo-ui pre-M-C git (`0a2a0ad~1`) + `build-registry`/`validate-registry` scripts mirrored (with the M-C fixes) + host set to usetheo-ui.
- **Cross-consistency:** every one of the 15 URLs theo-ui references resolves to a built @usetheo/ui item.
- **Drift-guard:** `validate-registry` now fails on any `@/lib|@/components` import not declared as a registryDependency — proven by an inject-test.

## 3. Benchmark

```
@usetheo/ui registry items: 60 (53 components + 7 foundation)
registry:build time (3 runs): 471 / 489 / 615 ms  →  mean 525ms
usetheo-ui regression: typecheck 0, 664 tests, build 223ms
theo-ui registry: 96 items (unchanged)
```

## 4. DoD checklist (plan m-d v1.0, plan-confidence SHIPPABLE_WITH_CAVEATS 70)

- [x] 53 component descriptors (update-banner had none in theo-ui either) + 7 foundation in @usetheo/ui
- [x] registry:build + registry:validate scripts (mirrored + adapted host)
- [x] `pnpm registry:build` → 60 items; `pnpm registry:validate` exit 0
- [x] all 15 theo-ui-referenced URLs resolve (consistency empty diff)
- [x] theo-ui side stays green (96 items)
- [x] benchmark recorded (§3)
- [x] usetheo-ui regression green (no break from the registry)
- [x] committed locally on usetheo-ui develop (NOT published — gh-pages serving = release, deferred)

## 5. Review findings + resolution (1 independent agent)

- **HIGH — skeleton dangling registryDependency:** the agent found skeleton imports `@/lib/live-region-context` but declared only `[cn, tailwind-preset]` → `shadcn add skeleton` would break for consumers. **Fixed** (added live-region-context) AND **extended the validator** to catch the class mechanically (drift-guard, inject-test-proven). Only occurrence across all 60 items.
- Everything else PASS: 60 items build+validate, 15 cross-refs resolve, 0 regression, theo-ui green, spot-checked button.json valid.

## 6. Honesty notes

- **gh-pages serving deferred** — the registry FILES exist + validate; serving them at `usetheodev.github.io/usetheo-ui/r/` is a deploy step at release (same class as the M-C `file:` dep). M-D's scope is the files, which exist.
- **update-banner** has no registry item (it had none in theo-ui either — not all 154 were registry items). Not a gap.

## 7. Verdict

**READY_TO_MERGE.** @usetheo/ui's registry is built + validated (60 items); all 15 theo-ui cross-references resolve; the review's 1 HIGH (skeleton) is fixed AND its class is now gate-guarded; zero regression. gh-pages serving is the documented deploy-time deferral.
