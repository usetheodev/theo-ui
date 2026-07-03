# Review: m-b-usetheo-ui-bootstrap (cross-repo, 2-agent independent verification)

**Date:** 2026-07-03
**Target:** `theokit-tools/usetheo-ui` @ develop
**Reviewers:** 2 independent agents (cross-validation + architecture) pointed at usetheo-ui (the theo-ui 5-agent pipeline is theo-ui-scoped and cannot scan the sibling repo).
**Verdict:** READY_TO_MERGE (after the review-fix commit)

## Findings and resolutions

| ID | Sev | Finding | Resolution |
|---|---|---|---|
| XV-HIGH-1 | HIGH | README/CHANGELOG missing; evidence doc **falsely** marked provenance `[x]` | **Fixed** (commit `0784a80`): README + CHANGELOG added with `seeded from theo-ui @ 2b46eca`; evidence §4 corrected to admit the false claim |
| XV-HIGH-2 | HIGH | LICENSE missing despite `license: Apache-2.0` | **Fixed** — Apache-2.0 LICENSE added |
| ARCH-HIGH-1 | HIGH | `jsdom: "latest"` unpinned (+ unused — env is happy-dom) | **Fixed** — jsdom removed from devDeps |
| ARCH-MED-1 | MEDIUM | No `prepublishOnly`; agent observed contaminated `dist/types/{agent,chat}.d.ts` (tsc-dts doesn't clean) — AI-type-leak vector on publish | **Fixed** — `prepublishOnly: npm run build` added; clean rebuild verified `dist/types == task.d.ts` only, 0 AI symbols in dist |
| ARCH-MED-2 | MEDIUM | `tsconfig.json paths` had stale `@theokit/ui` + dangling `@theokit/ui/whiteboard` (removed AI engine) | **Fixed** — rebranded to `@usetheo/ui`, whiteboard alias dropped |
| ARCH-LOW-1 | LOW | `./preset` export missing `types` condition | **Fixed** — types condition added |
| ARCH-LOW-2/3 | LOW | `LiveRegionProvider` unwired; `isProd` dead export | **Accepted** — carried from theo-ui as-is (not M-B-introduced); documented follow-up |
| ARCH-LOW-4 | LOW | Stale AI entries in `ladle-axe` `STORY_SKIPS` | **Accepted** — inert dead config (the stories don't exist, so skips are no-ops); low-risk to leave vs auto-editing |
| XV-LOW-1 | LOW | `you@theokit.dev` example emails in stories/docstrings | **Accepted** — example domains, not imports; rebrand nit |

## What the 2 agents INDEPENDENTLY verified (re-ran, did not trust the evidence doc)

- **Cross-validation:** typecheck 0, lint 0, **664/664 tests**, build (index.js + index.d.ts), 39 primitives / 15 composites, barrel 54 + 0 AI, `grep @theokit/ui` == 0. **Seeded set EXACTLY matches the M-A manifest `@usetheo/ui` set** — MISSING=[], EXTRA=[], 0 layer misplacements.
- **Architecture:** 0 reverse dep (acyclic — usetheo-ui imports nothing from @theokit/ui), package.json sound (ESM-only, Apache-2.0, exports, peerDeps, 0 AI-engine deps), foundation self-contained, fresh-build dist has 0 AI symbols.

## Post-resolution state (evidence)

- Gates (re-verified in usetheo-ui): typecheck 0, biome 0 (236 files), **664 tests**, build (170 KB ESM + dts), `npm pack` 70.9 kB / 125 files.
- 0 AI leakage: 0 AI imports, dist 0 AI symbols (clean rebuild + prepublishOnly guard).
- Provenance: README + CHANGELOG + LICENSE present.
- Benchmark: bundle 170 KB, build ~4.5s (mean of 3), 664 tests / 20.6s, 54 components.
- Evidence bundle: `m-b-usetheo-ui-bootstrap-evidence-2026-07-03.md`.

## Handoff decision

**READY_TO_MERGE** (usetheo-ui develop). No unresolved BLOCKER/HIGH — the 3 HIGH (missing provenance ×2, unpinned jsdom) and 2 MEDIUM (prepublish leak vector, stale tsconfig) are all fixed and re-verified. The 2-agent review caught a genuine self-ticked-box falsehood + a real AI-type-leak vector that the mechanical gates alone missed — exactly the review's value. Package is 100% functional. Committed locally; publish deferred to the end-of-roadmap release (locked policy).
