# Plan: M-D — Registry split (`@usetheo/ui` registry + cross-reference)

> **Version 1.0** — Milestone D completes the shadcn-compatible registry split. The theo-ui side is done (M-C: 15 `registryDependencies` rewritten to `@usetheo/ui` URLs; `validate-registry` accepts external URLs). This plan builds the MISSING half: `@usetheo/ui`'s own registry — descriptors for its 54 components + a `registry:build`/`validate` toolchain producing `registry/r/*.json` — so the URLs theo-ui references have backing files. Cross-repo: descriptors are recovered from theo-ui git (pre-M-C) and adapted; execution is IN usetheo-ui with equivalent rigor. gh-pages hosting = deploy/release (deferred, like the M-C `file:` dep).

## Goal

> "Build `@usetheo/ui`'s shadcn-compatible registry for its 54 components, measured by `pnpm registry:build && pnpm registry:validate` exiting 0 in usetheo-ui with 54 `registry/r/*.json` items and every one of the 15 URLs theo-ui references resolving to a real item."

## Context

Milestone D of the pivot. Blueprint §Q4: "@theokit/ui registry entries reference @usetheo/ui primitives via `registryDependencies` URLs — a host/URL change; two registries cross-referenced." M-C did the theo-ui side (15 URL rewrites, validator accepts URLs, registry:build+validate green). Baseline (2026-07-03): `@usetheo/ui` has 0 registry descriptors + no `registry:build` script (deferred in M-B); theo-ui references 15 `usetheodev.github.io/usetheo-ui/r/*.json` URLs, all matching real @usetheo/ui component dirs.

## Baseline Context

### Files that will be touched (usetheo-ui)

| File | Source | Why |
|---|---|---|
| `registry/<54 names>.json` (NEW) | recovered from theo-ui git pre-M-C (`0a2a0ad~1:registry/<name>.json`) + adapted | per-component shadcn descriptors (files + deps + registryDependencies) |
| `scripts/build-registry.ts` (NEW) | theo-ui `scripts/build-registry.ts` (adapted: REGISTRY_BASE_URL → usetheo-ui host) | builds registry/r/*.json |
| `scripts/validate-registry.ts` (NEW) | theo-ui (with the M-C external-URL + component-classification skip fixes) | validates the registry |
| `package.json` | add `registry:build` + `registry:validate` scripts | wire the registry toolchain |
| `registry/r/<54>.json` (generated) | build output | the served registry items |

### Current callers / dependents

- **theo-ui → @usetheo/ui (cross-registry):** 15 `registryDependencies` URLs in theo-ui descriptors point to `usetheodev.github.io/usetheo-ui/r/<name>.json`. Those files must exist in @usetheo/ui's registry. Verified: all 15 map to real @usetheo/ui component dirs.
- **Consumer:** `npx shadcn add https://usetheodev.github.io/usetheo-ui/r/button.json` (post gh-pages deploy).

### Domain glossary

- **descriptor** — `registry/<name>.json`: a shadcn item spec (name, type, files, dependencies, registryDependencies).
- **built item** — `registry/r/<name>.json`: the descriptor with inlined file contents, served to the shadcn CLI.
- **cross-registry reference** — a `registryDependencies` entry that is a full URL to another registry's item (theo-ui → @usetheo/ui).

### Architecture boundaries affected

- Two independent registries (theo-ui, @usetheo/ui), cross-referenced by URL. No new code coupling (URLs are data). `rules/architecture.md § 2` acyclic preserved (theo-ui → @usetheo/ui only).

## Prior Art & Related Work

- **Blueprint §Q4** — the cross-registry `registryDependencies` URL pattern; theo-ui's own `registry/r/*.json` already used full URLs (`registry/r/agent-composer.json`).
- **Reference:** `.claude/knowledge-base/references/ai-elements/packages/cli/` — the shadcn-registry distribution model (remote registry + CLI).
- **theo-ui `scripts/build-registry.ts`** — the exact registry builder mirrored (with the M-C fixes: external-URL acceptance + component-classification skip).

## Dependencies

### Existing — used as-is
| Package | Ecosystem | Why |
|---|---|---|
| (usetheo-ui's toolchain: tsx, typescript) | npm | run the registry build script |

### New — to be introduced
(none — the registry scripts use tsx + node stdlib, already present)

### Removed
(none)

## Objective

- [ ] `@usetheo/ui` has a `registry/<name>.json` descriptor for each of its 54 components.
- [ ] `@usetheo/ui` has `registry:build` + `registry:validate` scripts (mirrored + adapted).
- [ ] `pnpm registry:build` produces 54 `registry/r/*.json` items in usetheo-ui.
- [ ] `pnpm registry:validate` exits 0.
- [ ] Every one of the 15 URLs theo-ui references resolves to a built `@usetheo/ui` item (cross-registry consistency).
- [ ] theo-ui's registry gates stay green (unchanged — M-C did that side).
- [ ] Benchmark: registry item count + build time recorded.

## ADRs

### D1 — Recover descriptors from theo-ui git, adapt the host URL
- **Decision:** recover the 54 moved components' `registry/<name>.json` descriptors from theo-ui's pre-M-C git state (`0a2a0ad~1`), copy them into usetheo-ui, and rewrite any `registryDependencies` from the theo-ui host to bare names (@usetheo/ui's build rewrites them to its own host).
- **Rationale:** the descriptors were hand-authored in theo-ui and are the authoritative spec; regenerating from scratch risks divergence (DRY — don't re-derive known data). The only per-descriptor change is the registry host. Alternatives: hand-author 54 new descriptors (rejected — error-prone re-derivation); auto-generate from component dirs (rejected — theo-ui's descriptors carry hand-curated deps/registryDependencies a generator would miss).
- **Consequences:** the descriptors' `registryDependencies` that pointed to theo-ui-hosted primitives now resolve within @usetheo/ui (same host) — a self-consistent registry.

### D2 — Mirror theo-ui's registry scripts with the M-C fixes baked in
- **Decision:** copy theo-ui's `build-registry.ts` + `validate-registry.ts` into usetheo-ui, keeping the M-C fixes (skip `component-classification.json`, accept `http` registryDependencies) and setting `REGISTRY_BASE_URL` to `https://usetheodev.github.io/usetheo-ui/r`.
- **Rationale:** the scripts are vetted + carry the M-C bug fixes; re-writing them re-introduces solved bugs (KISS). Alternative: minimal hand-rolled registry emitter (rejected — re-derives solved logic).
- **Consequences:** usetheo-ui's registry build behaves identically to theo-ui's, one host apart.

## Drawbacks & Risks

| Risk | Severity | Mitigation | Owner |
|---|---|---|---|
| A recovered descriptor references a source file path that differs in usetheo-ui | Medium | `registry:build` fails on a missing file — the mechanical proof; adapt the path | impl |
| gh-pages not deployed → the URLs 404 at runtime until release | Low (deferred) | Like the M-C `file:` dep — the FILES exist; serving is a release/deploy step, documented | release |
| A theo-ui-referenced URL has no matching @usetheo/ui item | High | Explicit consistency check: every one of the 15 referenced URLs must map to a built item | impl |

## Unresolved Questions

- Q1 — Do @usetheo/ui's descriptors need `registryDependencies` to `cn`/foundation, and does @usetheo/ui's registry include a `cn` item? Assumed: mirror theo-ui's (it had a `cn` registry item). Resolve in Phase 1 — if a descriptor references `cn`, ensure @usetheo/ui builds a `cn` item.

## Dependency Graph

```
Phase 0 (recover descriptors + scripts) ─▶ Phase 1 (build + validate + consistency) ─▶ Final (integration validation)
```

---

## Phase 0: Recover the 54 descriptors + registry scripts into usetheo-ui

### T0.1 — Recover descriptors from theo-ui git + copy/adapt the registry scripts
**Objective:** usetheo-ui has the 54 component descriptors + `build-registry.ts` + `validate-registry.ts` + the npm scripts.
**Why:** the registry needs descriptors (the spec) + a builder before it can emit items (D1, D2).
**Evidence:** theo-ui pre-M-C had `registry/<name>.json` for these 54 (deleted in commit `0a2a0ad`). theo-ui's `scripts/build-registry.ts` is the vetted builder (with M-C fixes).
**Files to edit:**
```
usetheo-ui/registry/<54>.json (NEW, recovered from theo-ui git)
usetheo-ui/scripts/build-registry.ts (NEW, adapted host)
usetheo-ui/scripts/validate-registry.ts (NEW, adapted)
usetheo-ui/package.json (add registry:build + registry:validate)
```
**Deep file dependency analysis:** the build script reads `registry/*.json` descriptors + their referenced source files (which exist in usetheo-ui — the 54 components). The host URL constant changes to usetheo-ui.
**TDD:**
```
RED:   pnpm registry:build fails (no descriptors/script) before recovery.
GREEN: recover + adapt -> pnpm registry:build runs.
VERIFY: cd usetheo-ui && pnpm registry:build
```
**Concurrency tests:** (none — single-threaded)
**Acceptance:** [ ] 54 descriptors present; [ ] `registry:build`/`validate` scripts in package.json; [ ] `pnpm registry:build` runs (may need path adaptation).
**DoD:** [ ] scripts + descriptors present, build runs.

## Phase 1: Build + validate + cross-registry consistency

### T1.1 — Build the registry, validate, verify the 15 cross-references resolve
**Objective:** `pnpm registry:build && pnpm registry:validate` exit 0 with 54 items; all 15 theo-ui-referenced URLs map to a built item.
**Why:** the built items are what the URLs resolve to; consistency is the whole point of the split.
**Evidence:** 15 theo-ui URLs (badge, button, checkbox, code-block, data-table, dialog, form-field, input, label, progress, …) all map to real @usetheo/ui component dirs (baseline).
**Files to edit:**
```
usetheo-ui/registry/r/<54>.json (generated)
```
**TDD:**
```
RED:   consistency check FAILS if a referenced URL has no built item.
GREEN: build + validate green; every referenced item exists.
VERIFY: cd usetheo-ui && pnpm registry:build && pnpm registry:validate; then the consistency check (theo-ui refs ⊆ usetheo-ui items)
```
**Concurrency tests:** (none — single-threaded)
**Acceptance:** [ ] `pnpm registry:build` → 54 items; [ ] `pnpm registry:validate` exit 0; [ ] all 15 theo-ui-referenced names ∈ usetheo-ui registry items (`comm -23` empty); [ ] benchmark (item count + build time) recorded.
**DoD:** [ ] registry built + validated + cross-consistent.

---

## Coverage Matrix

| # | Requirement | Task | Resolution |
|---|---|---|---|
| 1 | 54 descriptors in @usetheo/ui | T0.1 | recovered from git |
| 2 | registry:build/validate scripts | T0.1 | mirrored + adapted |
| 3 | 54 registry/r items built | T1.1 | registry:build |
| 4 | registry:validate green | T1.1 | validate exit 0 |
| 5 | 15 cross-refs resolve | T1.1 | consistency check |
| 6 | theo-ui side stays green | (M-C, unchanged) | registry:validate PASS |
| 7 | benchmark | T1.1 | item count + build time |

**Coverage: 7/7 (100%)**

## Global Definition of Done

- [ ] `cd usetheo-ui && pnpm registry:build && pnpm registry:validate` exit 0 (54 items).
- [ ] Every one of the 15 theo-ui-referenced `@usetheo/ui` URLs maps to a built item (consistency check empty diff).
- [ ] theo-ui's `registry:build && registry:validate` stay green (regression check).
- [ ] Benchmark recorded (item count, build time).
- [ ] usetheo-ui gates stay green (typecheck/lint/test/build unaffected).
- [ ] Committed locally on usetheo-ui `develop` (NOT published — gh-pages deploy = release, deferred).

## Failure scenarios (when I/O external)

```
(none — no runtime external I/O; registry build/validate are local file ops. gh-pages serving is a deploy step deferred to release.)
```

## Final Phase: Integration Validation (MANDATORY)

### Execution
```
cd usetheo-ui
pnpm registry:build      # 54 items
pnpm registry:validate   # exit 0
pnpm typecheck && pnpm test && pnpm build   # regression: registry setup didn't break the package
# consistency: every theo-ui-referenced @usetheo/ui URL has a built item
cd ../theo-ui && pnpm registry:validate     # theo-ui side still green
```
### Acceptance Criteria
- [ ] usetheo-ui registry:build 54 items + validate exit 0.
- [ ] 15 cross-refs resolve (consistency empty diff).
- [ ] usetheo-ui typecheck/test/build still green (no regression).
- [ ] theo-ui registry:validate still green.
- [ ] Benchmark recorded.
### If Validation Fails
1. Separate M-D-caused from pre-existing.
2. Fix (missing descriptor / path / cross-ref) and re-run.
