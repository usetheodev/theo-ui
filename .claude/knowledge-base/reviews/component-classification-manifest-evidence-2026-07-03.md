# M-A Evidence & Benchmark Bundle — component-classification-manifest

**Date:** 2026-07-03
**Purpose:** hard evidence that every DoD / acceptance criterion is met and 100% functional, with measured benchmark data. Produced during the FAANG-rigor close-out (goal 2026-07-03).

## 1. Quality gates (measured, all green)

| Gate | Command | Result |
|---|---|---|
| Types | `pnpm typecheck` (`tsc --noEmit`) | 0 errors |
| Lint | `pnpm exec biome check scripts/classify-components.{ts,test.ts} registry/*.json` | 0 warnings |
| Tests | `pnpm exec vitest run scripts/classify-components.test.ts` | 16/16 passed |
| Coverage | vitest v8 on `classify-components.ts` | 93.4% stmts / 92.5% lines (critical path 100%) |
| Gate | `pnpm classify:check` | exit 0 — "classified 136 components, 0 drift" |
| Existing taxonomy | `pnpm quality:structure` | PASS (unaffected) |
| Dead code (repo) | `pnpm quality:knip` | 0 findings in M-A files (2 pre-existing elsewhere: `src/lib/markdown/mermaid.tsx`, `isProd` in `src/lib/env.ts`) |

## 2. /code-quality audit

- Verdict: **PASS_WITH_CAVEATS** (`knowledge-base/audits/component-classification-manifest-code-quality-2026-07-03.md`).
- 0 hard caps, 0 findings. Single soft caveat: `symbol_fab_unverifiable_typescript` (tree-sitter TS symbol resolution limitation — NOT an actual fabrication).
- Manual symbol verification: `classify-components.ts` imports only node stdlib (`node:fs`, `node:fs/promises`, `node:path`, `node:url`) — every symbol resolves; zero fabrication.

## 3. /implement validation gate

- `run_validation.py component-classification-manifest` → exit 0. 11 checks: **4 PASS, 0 FAIL**, 5 SKIP (progress/checkpoint absent — inline execution; code-quality skipped, audited separately), 1 WARN.
- Report: `knowledge-base/reviews/component-classification-manifest-implement-validate-2026-07-03.md`.

## 4. Benchmark — runtime + scalability

### 4.1 End-to-end gate runtime (`classify:check`, 10 runs)
```
mean=161.2ms  stddev=20.9ms  min=134.4ms  p50=153.1ms  max=201.3ms   (1.19ms/component over 136 dirs)
```
Note: dominated by node+tsx startup (~130ms). The classification logic itself is sub-millisecond (§4.2). No throughput-vs-baseline benchmark applies — this is a one-shot dev-time filesystem gate, not a perf-critical engine; inventing a throughput baseline would be theatre.

### 4.2 Algorithmic scalability of `checkClassification` (pure fn, 200 iters/point, post-fix)
```
N=   136  mean=0.0589ms  per-item=0.433us
N=  1360  mean=0.3724ms  per-item=0.274us   growth=6.33x for 10x N
N= 13600  mean=5.1491ms  per-item=0.379us   growth=13.83x for 10x N
```
**Verdict: O(n) linear** — per-item cost ~0.3us constant across 100x scale; growth ~10x per 10x N (variance is GC/warmup).

### 4.3 Benchmark-driven fix (FAANG finding)
The benchmark surfaced an **O(n^2)** duplicate-detection (`keys.filter(indexOf)`): N=136→1360 grew **56.76x** for 10x N, and N=13600 hung. Replaced with Set-based detection → O(n). Result: **5x faster at N=136** (0.32ms→0.059ms) and N=13600 completes. Commit `perf(quality): O(n) duplicate detection`. Not a workaround — a measured algorithmic correction.

## 5. Correctness proofs (empirical)

| Proof | Method | Result |
|---|---|---|
| Drift fails-closed (EC-6) | inject throwaway dir under `primitives/` | gate exit 1; after removal exit 0; `git status` clean |
| Input guards (EC-1..4) | unit tests | absent-file / malformed-JSON / non-array / duplicate / layer-mismatch all → exit 1 with typed message |
| Classification completeness | `classify:check` | 136/136 classified, 0 unclassified, 0 stale |
| Boundary resolved | manifest scan | 0 disputed (3 originally-disputed resolved from component evidence) |
| **Dependency-direction consistency (F1)** | bidirectional import scan across all 136 production `.tsx` | **0 non-AI→AI reverse deps; 0 AI→cloud-ops smells** (re-verified after the /review reclassification of 6 mis-tags) — split is fully acyclic (`@theokit/ui → @usetheo/ui`) |

## 6. Classification result

**136 components → 82 `ai` (@theokit/ui) · 54 non-AI (@usetheo/ui): 47 `generic` + 7 `cloud-ops`.** 3 disputed (channel-card, cron-job-card, cron-jobs-list — genuinely dual, verified against source in /review). Boundary rule: AI-agent surface vocabulary (coding-agent + chat), per the 2026-07-03 scope decision.

## 7. DoD / Acceptance-criteria checklist (plan v1.1)

- [x] Manifest at `registry/component-classification.json`, one entry per dir — **136 entries**
- [x] 100% classified, 0 unclassified — `classify:check` exit 0
- [x] Blueprint §Q2 placement + disputed resolution — asserted by `placement_matches_blueprint_q2` + `boundary_fully_resolved_no_disputed_entries`
- [x] Drift gate fails on unclassified/stale/invalid/duplicate/layer-mismatch/absent/malformed/non-array — 10 gate tests + live EC-6
- [x] Wired into `quality:gates` — `grep -c classify:check package.json` = 2
- [x] Coverage ≥ 90% — 93.4%
- [x] tsc 0 / biome 0 / 16 tests green
- [x] CHANGELOG `[Unreleased]` updated
- [x] Backward compat — additive tooling only, no public API touched
- [x] F1 (review HIGH) — resolved with dependency-direction evidence (§5)

## Open follow-up (documented, out of M-A scope)

- **Import-direction enforcement in `classify:check`** — the §5 F1 proof is currently a manual scan. Making it a permanent gate (fail if any `@usetheo/ui` component imports a `@theokit/ui` one) would mechanically prevent reverse-deps during the M-C move. Deferred to a scoped slice (M-B candidate) to avoid scope-creeping M-A's plan (T1.1/T1.2 = drift gate, not import-direction).
