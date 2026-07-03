# Plan: M-B — Bootstrap `@usetheo/ui` + seed the 54 non-AI components

> **Version 1.0** — Milestone B of the AI-exclusive pivot. Stands up the separate `@usetheo/ui` package in the (already-created, empty) `theokit-tools/usetheo-ui` repo: mirrors the theo-ui quality toolchain, seeds the 54 non-AI components + the Violet Forge foundation, adapts imports, builds a 54-export barrel, and reaches a publishable (not-yet-published) state with every gate green and 0 AI leakage. Publish itself waits for the end-of-roadmap release (locked release policy). **Cross-repo:** all `#### Files to edit` paths are in `theokit-tools/usetheo-ui/`, NOT theo-ui; execution happens in that repo with equivalent TDD + gate rigor (the theo-ui `/implement` halt-loop is theo-ui-scoped and does not reach usetheo-ui).

## Goal

> "Bootstrap `@usetheo/ui` in the usetheo-ui repo containing the 54 non-AI components + Violet Forge foundation, measured by `pnpm typecheck && pnpm lint && pnpm test && pnpm build` all exiting 0 with a 54-export barrel and 0 imports of `@theokit/ui` / AI components."

## Context

Milestone B of the pivot (`knowledge-base/pivot-roadmap.md`). Grill decisions (`knowledge-base/grills/m-b-usetheo-ui-bootstrap-grill.md`): all 54 non-AI at once (Q1); `@usetheo/ui` carries the Violet Forge design system (Q2); repo created at `theokit-tools/usetheo-ui` (Q3); copy-source + adapt-imports (Q4); mirror the FULL quality toolchain minus AI-engine dogfood gates (Q5); npm `@usetheo/ui` ESM-only Apache-2.0 v0.1.0, registry on gh-pages (Q6). The M-A classification manifest (`registry/component-classification.json`) is the authoritative "who moves" contract: 54 non-AI = 39 primitives + 15 composites. Release policy (locked 2026-07-03): no publish until the whole roadmap ships — M-B ends at "publishable", not "published".

## Baseline Context (deep review of current state)

### Files that will be touched

All NEW, in the `theokit-tools/usetheo-ui/` repo (sibling of theo-ui). Mirrored from theo-ui equivalents.

| File (in usetheo-ui) | Mirror source (theo-ui) | LoC (source) | Why |
|---|---|---|---|
| `package.json` (NEW) | `theo-ui/package.json` | 845 | Deps + scripts (build via tsup+tsc-dts, test vitest, lint biome); strip AI-engine deps/scripts (whiteboard/slide/roughjs/perfect-freehand/streamdown/shiki/katex/xyflow) |
| `tsconfig.json` (NEW) | `theo-ui/tsconfig.json` | 40 | TS strict config |
| `tsconfig.dts.json` (NEW) | `theo-ui/tsconfig.dts.json` | — | dts build config |
| `tsup.config.ts` (NEW) | `theo-ui/tsup.config.ts` | — | bundler config |
| `vitest.config.ts` (NEW) | `theo-ui/vitest.config.ts` | 49 | test runner |
| `biome.json` (NEW) | `theo-ui/biome.json` | 83 | linter/formatter |
| `.nvmrc` (NEW) | `theo-ui/.nvmrc` | 1 | node 22 |
| `src/lib/{cn,env,live-region-context,safe-href,types}.ts` (NEW) | same in theo-ui | — | the 5 foundation modules the 54 need (closure-verified) |
| `src/styles/tailwind-preset.ts` (NEW) | `theo-ui/src/styles/tailwind-preset.ts` | 195 | Violet Forge typescale (cn depends on it) |
| `src/themes/` + `theo-ui-provider.tsx` (NEW) | same | — | Violet Forge theme system (Q2 — carry the design system) |
| `src/components/{primitives,composites}/<54 dirs>/` (NEW) | same 54 dirs in theo-ui | — | the 54 non-AI components (each: `.tsx` + `index.ts` + `.test.tsx` + `.stories.tsx`) |
| `src/index.ts` (NEW) | `theo-ui/src/index.ts` (642) | 642 | barrel — but only the 54 exports + foundation, no AI |
| `registry/` + `scripts/build-registry.ts` (NEW) | same | — | shadcn-compatible registry |
| `LICENSE`, `README.md`, `CHANGELOG.md` (NEW) | — | — | Apache-2.0 + provenance ("seeded from theo-ui @ <sha>") |

### Current callers / dependents

- **Cross-repo consumer:** `@theokit/ui` (theo-ui) will depend on `@usetheo/ui` in M-C (not M-B). No import exists yet — M-B does not touch theo-ui.
- **The 54 components' internal deps (closure-verified, 2026-07-03):** foundation = `lib/cn`, `lib/env`, `lib/live-region-context`, `lib/safe-href`, `lib/types` (+ `styles/tailwind-preset` via cn). **0 AI leakage** — no non-AI production component imports an AI component (verified by import-closure scan over all 54).
- **Component dir shape (theo-ui convention):** `<name>.tsx` (impl), `index.ts` (re-export), `<name>.test.tsx` (vitest), `<name>.stories.tsx` (ladle). Some have extra tests (e.g. `button-data-slot.test.tsx`).

### Domain glossary

- **foundation** — the non-component internal modules the primitives need: `cn` (tailwind-merge taught the Violet Forge typescale), `env`, `live-region-context` (a11y), `safe-href` (URL sanitization), `types`, + `tailwind-preset`.
- **barrel** — `src/index.ts`, the single public entry re-exporting every component.
- **seed** — copy a component dir + adapt its relative imports to the new repo layout.
- **publishable** — `pnpm build` produces a valid ESM package with types; `npm publish` would succeed IF the scope/registry were configured. M-B stops here (no actual publish).
- **AI leakage** — any import of an `@theokit/ui`-tiered (ai) component or `@theokit/ui` itself in usetheo-ui. Must be 0.

### Architecture boundaries affected

- `rules/architecture.md § 2` (DIP/acyclic): M-B creates the LOW-level package (`@usetheo/ui`) that the high-level `@theokit/ui` will depend on in M-C. usetheo-ui MUST NOT depend on theo-ui (acyclic).
- The primitive/composite taxonomy carries over: usetheo-ui keeps `src/components/{primitives,composites}` with the same mechanical rule.

## Prior Art & Related Work

- **Internal blueprint:** `knowledge-base/discoveries/blueprints/theokit-ui-ai-exclusive-pivot-blueprint.md` (SHIPPABLE 98.7) — §Q1 (Vercel AI Elements depends on a separate `@repo/shadcn-ui` via `workspace:*`; elements imports `cn`+primitives one-directionally), §Q3 (deps split: generic UI toolkit → primitives package). This IS the pattern M-B implements.
- **Reference project:** `.claude/knowledge-base/references/ai-elements/packages/shadcn-ui/` — the primitives-package shape (`components/ui/`, `lib/utils.ts`=cn) that `@usetheo/ui` mirrors. `packages/shadcn-ui/package.json` — the generic-UI dep set (radix/cmdk/cva/tailwind-merge…).
- **M-A grill + manifest:** the 54-component contract + closure analysis.
- **Patterns skills:** none in `skills/*-patterns/`.

## Dependencies

This plan sets up a NEW package that mirrors theo-ui's already-vetted dep set (minus AI-engine deps). No NEW third-party dependency is introduced beyond what theo-ui already ships and M-A's `/deps-audit` covered. The `@usetheo/ui` dep set = the generic-UI subset of theo-ui's deps.

### Existing — copied as-is (subset of theo-ui deps, all already CVE-audited in M-A)

| Package | Ecosystem | Why |
|---|---|---|
| `@radix-ui/*` (react-slot, react-dialog, react-select, …) | npm | primitives' headless base |
| `class-variance-authority`, `clsx`, `tailwind-merge` | npm | variants + cn |
| `lucide-react` | npm | icons |
| `tsup`, `typescript`, `vitest`, `@biomejs/biome`, `vite`, `@vitejs/plugin-react`, `tailwindcss` (dev) | npm | toolchain |

### New — to be introduced

(none — usetheo-ui reuses theo-ui's vetted dep set; parsimony ladder rung 4)

### Removed (relative to theo-ui — NOT carried into usetheo-ui)

| Package | Why removed |
|---|---|
| `roughjs`, `perfect-freehand` | Whiteboard engine (AI) — not in usetheo-ui |
| `streamdown`, `shiki`, `katex`, `@xyflow/react`, `mdast-*`, `hast-*` | Slide/markdown/agent engines (AI) |

> **Out-of-scope note:** the exact dep pruning is verified in Phase 0 by `pnpm build` succeeding with only the deps the 54 components actually import (closure-driven, not guessed).

## Objective

- [ ] usetheo-ui has a mirrored toolchain (package.json, tsconfig, tsup, vitest, biome, .nvmrc) that runs `typecheck`/`lint`/`test`/`build`.
- [ ] The Violet Forge foundation (5 lib modules + tailwind-preset + themes + ThemeProvider) is present and builds.
- [ ] All 54 non-AI component dirs seeded with imports adapted to the new layout.
- [ ] `src/index.ts` barrel exports exactly the 54 components + foundation, 0 AI.
- [ ] `pnpm typecheck && pnpm lint && pnpm test && pnpm build` all exit 0.
- [ ] 0 imports of `@theokit/ui` or any AI component (mechanical grep proof).
- [ ] Registry builds; package is publishable (dry-run `npm pack` succeeds).
- [ ] Benchmark: bundle size + build time + test count recorded.

## ADRs

### D1 — Mirror theo-ui's toolchain, prune AI-engine deps by import-closure
- **Decision:** copy theo-ui's build/test/lint config; keep only the deps the 54 components + foundation actually import (computed by closure), dropping AI-engine deps.
- **Rationale:** the 54 were authored against theo-ui's exact toolchain (`cn`+preset, biome, tsup); mirroring is the lowest-friction path (grill Q5, "não adiar nada" = full quality bar). Pruning by closure (not by guess) is evidence-driven — `pnpm build` fails if a needed dep is missing (KISS: the build IS the proof). Alternatives: minimal hand-rolled toolchain (rejected — re-deriving configs re-introduces bugs the theo-ui configs already solved); keep ALL theo-ui deps (rejected — ships AI-engine deps into a non-AI package, YAGNI).
- **Consequences:** usetheo-ui's config drifts from theo-ui only in the AI-engine subset; a future config change must be mirrored (accepted — documented in README provenance).

### D2 — Copy-adapt, not git-filter (grill Q4)
- **Decision:** copy source + adapt imports; record provenance "seeded from theo-ui @ <sha>".
- **Rationale:** the components need import adaptation regardless; history preservation adds git-surgery complexity with low archaeological value on a young lib. Per `rules/parsimony-ladder.md` (KISS). Alternative: `git filter-repo` (rejected — complex, fragile, doesn't save the adaptation work).
- **Consequences:** no cross-repo `git blame`; provenance recorded in README/CHANGELOG.

### D3 — Publishable, not published (release policy)
- **Decision:** M-B ends at a package that `npm pack` accepts; actual `npm publish` waits for the end-of-roadmap release.
- **Rationale:** locked release policy (2026-07-03) — no per-milestone release; and `@usetheo` npm scope access is unconfirmed (grill Q6). Building/testing green proves functionality without publishing. Alternative: publish v0.1.0 now (rejected — violates the release policy + unconfirmed scope).
- **Consequences:** M-C (theo-ui depends on `@usetheo/ui`) will consume a local `workspace`/`file:` link or a pre-release tag until the final publish; noted for M-C.

## Drawbacks & Risks

| Drawback / Risk | Severity | Mitigation | Owner |
|---|---|---|---|
| Import adaptation across 54 dirs is error-prone; a missed relative path breaks the build | High | The build (`tsc`+`tsup`) is the mechanical proof — it fails on any unresolved import; adapt until green | impl |
| A component transitively needs a foundation module not in the 5 closure-verified ones | Medium | Phase 0 re-runs the closure after seeding; `tsc` catches any missing module | impl |
| Cross-repo: theo-ui gates/loops can't validate usetheo-ui | Medium | Run tsc/biome/vitest/build IN usetheo-ui with the same thresholds; evidence captured from that repo | impl |
| Toolchain config subtly differs (tsup entry, biome ignore) causing false failures | Medium | Copy configs verbatim first, adjust only paths; diff against theo-ui | impl |
| npm `@usetheo` scope not owned → publish would fail | Low (deferred) | D3 stops at publishable; `npm pack` (not publish) is the gate; scope resolved at release | human |

## Unresolved Questions

- Q1 — Does usetheo-ui need the full themes/CSS build (precompiled CSS, tokens.css) or just the preset + cn for the components to render? Assumed: carry the theme system (Q2) but the minimal CSS build that makes the 54 render; the precompiled-CSS dogfood gates are deferred (grill Q5). Resolve when `pnpm build` + a render smoke confirms.
- Q2 — Do any of the 54 components' `.stories.tsx` import AI components (stories, not production)? Production is 0-leakage (verified); stories may reference AI for demos. Resolve in Phase 1 — if a story leaks AI, drop/adapt that story (stories are not shipped).

## Dependency Graph

```
Phase 0 (scaffold toolchain + foundation) ──▶ Phase 1 (seed 54 components + adapt) ──▶ Phase 2 (barrel + registry + build) ──▶ Phase 3 (gates green + benchmark) ──▶ Final (integration validation)
```

Sequential — each phase's output is the next phase's input. Phase 1 component seeding could parallelize per-component but the build gate is a barrier.

---

## Phase 0: Scaffold the usetheo-ui toolchain + Violet Forge foundation

**Objective:** usetheo-ui has a working toolchain + the 5 foundation modules + tailwind-preset + theme system; an empty barrel typechecks + lints.

### T0.1 — Toolchain configs + package.json (deps pruned by closure)

#### Objective
Create `package.json`, `tsconfig*.json`, `tsup.config.ts`, `vitest.config.ts`, `biome.json`, `.nvmrc` in usetheo-ui, mirrored from theo-ui with AI-engine deps/scripts removed.

#### Why this step
1. **Action:** copy the 6 config files from theo-ui, edit `package.json` name→`@usetheo/ui`, version→0.1.0, prune AI-engine deps + AI-engine scripts (dogfood:whiteboard/slide/*), keep build/test/lint/typecheck/registry.
2. **Reasoning:** the toolchain must exist before any component compiles (D1); mirroring theo-ui's vetted configs avoids re-deriving them (grill Q5). The build gate downstream proves the dep set is correct.

#### Evidence
theo-ui `package.json:build` = `tsup && tsc -p tsconfig.dts.json && tsx scripts/inject-use-client.ts && …`; devDeps include tsup/vite/vitest/biome/typescript/@vitejs/plugin-react/tailwindcss (confirmed). AI-engine deps to prune: roughjs, perfect-freehand, streamdown, shiki, katex, @xyflow/react, mdast-*, hast-* (from the Roadmap engines list in CLAUDE.md).

#### Files to edit
```
usetheo-ui/package.json (NEW)
usetheo-ui/tsconfig.json (NEW)
usetheo-ui/tsconfig.dts.json (NEW)
usetheo-ui/tsup.config.ts (NEW)
usetheo-ui/vitest.config.ts (NEW)
usetheo-ui/biome.json (NEW)
usetheo-ui/.nvmrc (NEW)
usetheo-ui/.gitignore (NEW)
```

#### Deep file dependency analysis
- `package.json`: consumed by pnpm/tsup/vitest/biome. No component imports it. The `exports` map + `build` script define the package surface.
- `tsup.config.ts` / `tsconfig.dts.json`: define the build; must point at `src/index.ts` (the barrel, created in Phase 2).

#### Deep Dives
- Dep pruning is CLOSURE-DRIVEN: start from theo-ui's devDeps + the runtime deps the 54 components import (radix subset, cva, clsx, tailwind-merge, lucide-react). Drop the AI-engine runtime deps. The build in Phase 2 fails if a needed dep was dropped — that is the mechanical check.
- Invariant: `pnpm install` succeeds; `pnpm typecheck` on an empty `src/index.ts` exits 0.

#### Tasks
1. `cd usetheo-ui`; copy the 6 config files from theo-ui.
2. Edit package.json: name, version 0.1.0, license Apache-2.0, prune AI deps + scripts, ESM-only exports skeleton.
3. `pnpm install`.
4. Create an empty `src/index.ts`; `pnpm typecheck` + `pnpm lint` exit 0.

#### TDD
```
RED:    `pnpm typecheck` fails before configs exist (no tsconfig).
GREEN:  configs + empty src/index.ts -> `pnpm typecheck` exit 0, `pnpm lint` exit 0.
REFACTOR: none.
VERIFY: cd usetheo-ui && pnpm typecheck && pnpm lint
```

#### Concurrency tests (only when applicable)

(none — single-threaded)

#### Acceptance Criteria
- [ ] `pnpm install` in usetheo-ui exits 0.
- [ ] `pnpm typecheck` on empty barrel exits 0.
- [ ] `pnpm lint` exits 0.
- [ ] package.json name is `@usetheo/ui`, ESM-only, Apache-2.0, no AI-engine deps (`grep -E 'roughjs|perfect-freehand|streamdown|shiki|@xyflow' package.json` empty).

#### DoD
- [ ] `cd usetheo-ui && pnpm typecheck && pnpm lint` both exit `0` on the empty barrel.

### T0.2 — Violet Forge foundation (5 lib modules + preset + themes)

#### Objective
Seed `src/lib/{cn,env,live-region-context,safe-href,types}.ts`, `src/styles/tailwind-preset.ts`, `src/themes/`, `theo-ui-provider.tsx` + their tests, adapting imports; they typecheck + tests pass.

#### Why this step
1. **Action:** copy the 5 foundation lib modules + tailwind-preset + theme system from theo-ui; adapt any internal relative imports.
2. **Reasoning:** the 54 components import `cn` (which imports the preset); nothing compiles without the foundation (closure-verified). Carrying the theme system realizes the Q2 decision (usetheo-ui carries Violet Forge).

#### Evidence
Closure scan (2026-07-03): the 54 non-AI components import exactly `lib/{cn,env,live-region-context,safe-href,types}`; `cn.ts` imports `styles/tailwind-preset` typescale.

#### Files to edit
```
usetheo-ui/src/lib/cn.ts (NEW) + cn.test.ts
usetheo-ui/src/lib/env.ts (NEW)
usetheo-ui/src/lib/live-region-context.tsx (NEW) + .test.tsx
usetheo-ui/src/lib/safe-href.ts (NEW) + .test.ts
usetheo-ui/src/lib/types.ts (NEW)
usetheo-ui/src/styles/tailwind-preset.ts (NEW)
usetheo-ui/src/themes/** (NEW)
usetheo-ui/src/theo-ui-provider.tsx (NEW) + tests
```

#### Deep file dependency analysis
- `cn.ts` → `tailwind-preset.ts` (typescale classGroups). Both must move together.
- `live-region-context`, `safe-href` are self-contained a11y/security utils (have their own tests in theo-ui — carry them).

#### Deep Dives
- Adapt: the foundation modules' internal imports are within `lib/`/`styles/` — mostly self-referential, minimal path changes.
- Invariant: `pnpm test src/lib` green; `cn()` merges the Violet Forge typescale correctly (the theo-ui `cn.test.ts` proves it — carry it verbatim).

#### Tasks
1. Copy the 5 lib modules + their tests + tailwind-preset + themes + provider.
2. Adapt imports; `pnpm typecheck`.
3. `pnpm test src/lib` green.

#### TDD
```
RED:    pnpm test src/lib fails before the modules exist.
GREEN:  seed foundation -> pnpm test src/lib green (cn typescale test, safe-href, live-region).
REFACTOR: none (verbatim carry).
VERIFY: cd usetheo-ui && pnpm test src/lib && pnpm typecheck
```

#### Concurrency tests (only when applicable)

(none — single-threaded)

#### Acceptance Criteria
- [ ] `pnpm test src/lib` green (cn/safe-href/live-region tests carried verbatim, passing).
- [ ] `pnpm typecheck` exit 0.
- [ ] `cn` + `tailwind-preset` present; no import references theo-ui.

#### DoD
- [ ] `cd usetheo-ui && pnpm test src/lib && pnpm typecheck` exit `0` (cn typescale test passes).

---

## Phase 1: Seed the 54 non-AI components + adapt imports

**Objective:** all 54 component dirs present in usetheo-ui with imports adapted; each component typechecks.

### T1.1 — Seed 39 primitives + 15 composites (copy + adapt imports)

#### Objective
Copy the 54 non-AI component dirs (each: `.tsx`+`index.ts`+`.test.tsx`+`.stories.tsx`) from theo-ui into usetheo-ui; adapt every relative import to the new layout; drop/adapt any `.stories.tsx` that references an AI component.

#### Why this step
1. **Action:** copy the 54 dirs listed in the M-A manifest (`target == @usetheo/ui`); rewrite relative imports so `lib`/`styles` resolve, and composite→primitive imports resolve within usetheo-ui.
2. **Reasoning:** these 54 are the non-AI surface (M-A contract), closure-verified as 0-AI-leakage in production — so they form a self-contained package once the foundation (Phase 0) is present.

#### Evidence
M-A manifest: 39 primitives + 15 composites tagged `@usetheo/ui`. Closure: 0 AI leakage in production `.tsx`. Composite→primitive imports are relative (`../../primitives/<x>/index.js`) — resolve within usetheo-ui since all their primitive deps are also non-AI (verified: e.g. data-table→dropdown-menu/empty-state/pagination/skeleton/table, all generic).

#### Files to edit
```
usetheo-ui/src/components/primitives/<39 dirs>/ (NEW)
usetheo-ui/src/components/composites/<15 dirs>/ (NEW)
```

#### Deep file dependency analysis
- Composite deps stay within the 54 (verified: deployment-row→badge, data-table→dropdown-menu/empty-state/pagination/skeleton/table, command-palette→dialog — all in the non-AI set).
- Each dir's `index.ts` re-exports its `.tsx`; relative `../../../lib/cn.js` paths are preserved (same depth in usetheo-ui).

#### Deep Dives
- Adaptation is mostly a no-op for relative paths (same `src/components/<layer>/<name>/` depth → `../../../lib/cn.js` still resolves). The risk is a composite importing an AI primitive — but closure proved 0. Stories may reference AI → Phase 1 drops those stories (not shipped).
- Invariant: `pnpm typecheck` exit 0 over all 54; `grep -rE "@theokit/ui|/(primitives|composites)/<ai-name>" src/components` returns 0.

#### Tasks
1. For each of the 54 dirs: copy from theo-ui; verify relative imports resolve.
2. Grep for AI leakage in production files (must be 0); adapt/drop AI-referencing stories.
3. `pnpm typecheck` over all 54.

#### TDD
```
RED:    pnpm typecheck fails while some of the 54 are missing / mis-imported.
GREEN:  all 54 seeded + imports adapted -> pnpm typecheck exit 0.
REFACTOR: remove any AI-referencing story import.
VERIFY: cd usetheo-ui && pnpm typecheck && grep -rlE "@theokit/ui" src/components | wc -l  # == 0
```

#### Concurrency tests (only when applicable)

(none — single-threaded)

#### Acceptance Criteria
- [ ] 54 component dirs present (`ls src/components/primitives | wc -l` == 39; composites == 15).
- [ ] `pnpm typecheck` exit 0.
- [ ] 0 AI leakage — `grep -rlE "@theokit/ui|/primitives/(agent-event|tool-call|…)" src/components/**/*.tsx` (production) == 0.
- [ ] Pass: size — no seeded file exceeds its theo-ui original (copy, not growth).

#### DoD
- [ ] `ls src/components/primitives | wc -l` == `39`, composites == `15`; `pnpm typecheck` exit `0`; `grep -rlE '@theokit/ui' src/components | wc -l` == `0`.

---

## Phase 2: Barrel + registry + build

**Objective:** a 54-export barrel; `pnpm build` produces a valid ESM package; registry builds.

### T2.1 — Barrel (`src/index.ts`) with the 54 exports + foundation

#### Objective
Author `src/index.ts` re-exporting the 54 components + the public foundation (cn, ThemeProvider, types), and nothing AI.

#### Why this step
1. **Action:** derive the barrel from theo-ui's `src/index.ts` (642 lines), keeping only the 54 non-AI exports + foundation.
2. **Reasoning:** the barrel is the package's public API (`exports.` → `src/index.ts`); it defines what `@usetheo/ui` exposes.

#### Evidence
theo-ui `src/index.ts` is 642 lines exporting all 154; usetheo-ui exports the 54 subset.

#### Files to edit
```
usetheo-ui/src/index.ts (NEW)
usetheo-ui/src/index.test.ts (NEW) — assert 54 component exports present, 0 AI
```

#### Deep file dependency analysis
- The barrel imports every component's `index.ts`. A typo → tsc fails. The barrel test asserts the export surface.

#### Deep Dives
- Test: import `* as ui from "./index.js"`; assert the 54 named exports exist and no AI name (e.g. `AgentEvent`, `ToolCall`) is present.
- Invariant: barrel export count == 54 components + foundation exports.

#### Tasks
1. Author `src/index.ts` from theo-ui's, filtered to the 54 + foundation.
2. Write `src/index.test.ts` asserting the surface.
3. `pnpm typecheck && pnpm test src/index`.

#### TDD
```
RED:    src/index.test.ts asserts 54 exports + 0 AI — fails before the barrel is complete.
GREEN:  author barrel -> test green.
REFACTOR: none.
VERIFY: cd usetheo-ui && pnpm test src/index.test.ts
```

#### Concurrency tests (only when applicable)

(none — single-threaded)

#### Acceptance Criteria
- [ ] `src/index.test.ts` asserts the 54 component exports present + 0 AI names — green.
- [ ] `pnpm typecheck` exit 0.

#### DoD
- [ ] `pnpm test src/index.test.ts` green (asserts 54 exports, 0 AI names); `pnpm typecheck` exit `0`.

### T2.2 — Build + registry + publishable

#### Objective
`pnpm build` (tsup + tsc-dts) produces `dist/` with ESM + types; `pnpm registry:build` produces registry JSON; `npm pack` succeeds.

#### Why this step
1. **Action:** run the mirrored build; adapt the registry build script to usetheo-ui; verify `npm pack` (dry-run) succeeds.
2. **Reasoning:** "publishable" is the M-B DoD (D3) — the build + pack prove the package is well-formed without publishing.

#### Evidence
theo-ui build = `tsup && tsc -p tsconfig.dts.json && …`; `registry:build` = `tsx scripts/build-registry.ts`.

#### Files to edit
```
usetheo-ui/scripts/build-registry.ts (NEW, adapted)
usetheo-ui/tsup.config.ts (finalize entry = src/index.ts)
```

#### Deep file dependency analysis
- The build reads `src/index.ts`; a missing dep surfaces here (D1's mechanical check).

#### Deep Dives
- Invariant: `dist/index.js` (ESM) + `dist/index.d.ts` exist; `npm pack --dry-run` lists them; no AI code in dist.
- Edge: if `pnpm build` fails on a missing dep, add exactly that dep (closure correction) — documented.

#### Tasks
1. `pnpm build`; fix any missing dep (closure correction).
2. Adapt + run `pnpm registry:build`.
3. `npm pack --dry-run`.

#### TDD
```
RED:    pnpm build fails before deps/barrel complete.
GREEN:  pnpm build exit 0 -> dist/ has ESM + dts; npm pack --dry-run succeeds.
REFACTOR: none.
VERIFY: cd usetheo-ui && pnpm build && npm pack --dry-run
```

#### Concurrency tests (only when applicable)

(none — single-threaded)

#### Acceptance Criteria
- [ ] `pnpm build` exit 0; `dist/index.js` + `dist/index.d.ts` present.
- [ ] `npm pack --dry-run` succeeds; tarball has no AI code (`tar tzf` grep for agent/tool == 0).
- [ ] `pnpm registry:build` produces registry JSON.

#### DoD
- [ ] `pnpm build` exit `0` (dist/index.js + dist/index.d.ts present); `npm pack --dry-run` exit `0`; `pnpm registry:build` exit `0`.

---

## Phase 3: Gates green + benchmark

### T3.1 — Full gate sweep + benchmark evidence

#### Objective
Run the full mirrored gate chain green in usetheo-ui and record benchmark data (bundle size, build time, test count, component count).

#### Why this step
1. **Action:** run `pnpm typecheck && pnpm lint && pnpm test && pnpm build`; measure bundle size (dist), build time (≥3 runs mean±stddev), test count.
2. **Reasoning:** the goal mandates benchmark data + 100%-green gates as evidence of a functional package.

#### Evidence
Grill Q5: full quality toolchain mirror. Goal: benchmark data required.

#### Files to edit
```
usetheo-ui/  (no new files — measurement)
theo-ui/.claude/knowledge-base/reviews/m-b-usetheo-ui-bootstrap-evidence-<date>.md (NEW — evidence bundle)
```

#### Deep Dives
- Benchmark: `du -sh dist`, `hyperfine`/`time` the build ≥3× (mean±stddev), `vitest run` count + duration.
- Invariant: all gates exit 0.

#### Tasks
1. Run all gates; capture output.
2. Measure bundle size + build time (≥3 runs) + test/component counts.
3. Write the evidence bundle in theo-ui knowledge-base.

#### TDD
```
RED:    (n/a — measurement task; gates already green from Phases 0-2)
GREEN:  all gates exit 0; benchmark numbers recorded.
VERIFY: cd usetheo-ui && pnpm typecheck && pnpm lint && pnpm test && pnpm build
```

#### Concurrency tests (only when applicable)

(none — single-threaded)

#### Acceptance Criteria
- [ ] `pnpm typecheck && pnpm lint && pnpm test && pnpm build` all exit 0.
- [ ] Benchmark recorded: bundle size, build time (mean±stddev ≥3 runs), test count, component count (54).
- [ ] Coverage ≥ 90% on any NEW usetheo-ui-specific code (the barrel test, foundation); carried component tests pass as-is.

#### DoD
- [ ] `pnpm typecheck && pnpm lint && pnpm test && pnpm build` all exit `0`; evidence bundle with bundle-size + build-time (mean±stddev, ≥3 runs) written.

---

## Coverage Matrix

| # | Requirement | Task(s) | Resolution |
|---|---|---|---|
| 1 | Mirrored toolchain runs | T0.1 | configs copied, typecheck/lint green |
| 2 | Violet Forge foundation present | T0.2 | 5 lib + preset + themes seeded, tests green |
| 3 | 54 components seeded, imports adapted | T1.1 | 39+15 dirs, typecheck green |
| 4 | 0 AI leakage | T1.1, T2.1 | grep proof == 0 |
| 5 | 54-export barrel | T2.1 | index.test.ts asserts surface |
| 6 | Publishable build | T2.2 | pnpm build + npm pack dry-run |
| 7 | Registry builds | T2.2 | registry:build |
| 8 | Full gates green | T3.1 | typecheck+lint+test+build exit 0 |
| 9 | Benchmark data | T3.1 | bundle size + build time + counts |

**Coverage: 9/9 (100%)**

## Global Definition of Done

- [ ] All phases completed.
- [ ] `pnpm typecheck && pnpm lint && pnpm test && pnpm build` green IN usetheo-ui.
- [ ] 54-export barrel; 0 AI leakage (grep proof).
- [ ] `npm pack --dry-run` succeeds (publishable; NOT published — D3 + release policy).
- [ ] Benchmark evidence recorded (bundle size, build time, counts).
- [ ] File-size budget respected (copies, no growth).
- [ ] usetheo-ui CHANGELOG + README record provenance ("seeded from theo-ui @ <sha>").
- [ ] Committed locally on usetheo-ui's develop branch (no publish — release policy).
- [ ] Plan archived after /review READY_TO_MERGE.

## Failure scenarios (when I/O external)

```
(none — no external I/O touched; build/test are local. npm publish is deferred to the end-of-roadmap release, out of M-B scope.)
```

## Final Phase: Integration Validation (MANDATORY)

**Objective:** validate the whole package works as one — builds, tests, packs, 0 AI leakage.

### Execution
```
cd usetheo-ui
pnpm typecheck        # 0 errors
pnpm lint             # 0 warnings
pnpm test             # all green (carried component tests + barrel + foundation)
pnpm build            # ESM + dts in dist/
npm pack --dry-run    # publishable
grep -rlE "@theokit/ui" src/ | wc -l   # == 0 (no reverse/AI dep)
```

### Acceptance Criteria
- [ ] All gates green.
- [ ] 0 AI leakage.
- [ ] `npm pack --dry-run` succeeds; dist has no AI code.
- [ ] Benchmark numbers recorded.

### If Validation Fails
1. Separate M-B-caused failures from carried-test flakiness.
2. Fix all M-B-caused failures (missing dep → add; bad import → adapt).
3. Re-run the chain.
