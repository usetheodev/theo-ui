# Plan: Component Classification Manifest (AI-exclusive pivot — Milestone A)

> **Version 1.2** — Revised 2026-07-03 after `/review` (5-agent pipeline). Added ADR D4 (boundary scope resolution + disputed policy) resolving cross-validation F-xval-1 and domain F-dom-1/2/3/6/7: 6 components reclassified `cloud-ops`→`ai` from source evidence, final split 82 ai / 54 non-AI, 3 disputed. F-arch-1 (identity-key) fixed in the gate; +3 tests (empty manifest, layer-homonym, top-level enumeration). Review report: `knowledge-base/reviews/component-classification-manifest-review-2026-07-03.md`.
>
> **Version 1.1** — Revised 2026-07-03 after `/edge-case-plan` (report: `knowledge-base/reviews/component-classification-manifest-edge-cases-2026-07-03.md`). Absorbed the T1.1 input-guard cluster: EC-1 (missing-file fail-clear), EC-2 (duplicate-entry detection), EC-3 (declared-layer vs actual-location), EC-4 (manifest-not-an-array), EC-5 (top-level enumeration note), EC-6 (integration drift injection reverts cleanly).
>
> **Version 1.0** — First milestone of the `@theokit/ui` AI-exclusive pivot. Produces the authoritative, machine-readable manifest that tags every component directory as `ai` / `generic` / `cloud-ops` (→ target package `@theokit/ui` or `@usetheo/ui`), plus a quality gate that fails on any unclassified or drifted component. This manifest is the contract the downstream extraction milestones (create `@usetheo/ui`, re-point imports, split registry) consume — nothing physically moves in this plan. Lives entirely in `theo-ui`; has zero dependency on the not-yet-created `@usetheo/ui` repo.

## Goal

> "Enable the AI-exclusive pivot to proceed on an authoritative component boundary, so that every one of the 136 component directories is tagged `ai`/`generic`/`cloud-ops` with a target package, measured by `pnpm classify:check` exiting 0 with 0 unclassified and 0 drifted components."

## Context

Strategic decision (2026-07-02/03): narrow `@theokit/ui` to AI-exclusive; extract the non-AI surface (generic shadcn-like primitives + cloud/PaaS components) into a **separate published repo** `@usetheo/ui`; `@theokit/ui` depends on it as a normal npm dependency; migration is a **breaking major + codemod** (locked decisions, see `knowledge-base/discoveries/blueprints/theokit-ui-ai-exclusive-pivot-blueprint.md` and memory `theokit-ui-ai-exclusive-pivot`).

The blueprint (SHIPPABLE, 98.7) established the boundary RULE — "AI-agent surface vocabulary," not "carries agent data" — and a placement table for the 10 ambiguous cloud/PaaS components (Blueprint §"Q2"). But the rule currently lives only in blueprint prose. Every downstream milestone (M-B seed the new repo, M-C re-point imports + codemod, M-D split registry) needs a single machine-readable answer to "which of the 136 component dirs moves where." Without it, each milestone re-litigates the boundary and drifts. This plan mechanizes the blueprint's placement decision so the extraction is driven by data, not by re-reading prose.

## Baseline Context (deep review of current state)

### Files that will be touched

| File | LoC today | Last commit (sha + date) | Why it exists today | Invariants to preserve |
|---|---|---|---|---|
| `scripts/classify-components.ts` (NEW) | 0 | — | (gate script to be created) | — |
| `scripts/classify-components.test.ts` (NEW) | 0 | — | (TDD tests to be created) | — |
| `registry/component-classification.json` (NEW) | 0 | — | (manifest data to be created) | Not bundled into the npm lib (registry/ is metadata, not `src/`) |
| `package.json` | (script block) | `ef6f86b`-era | npm scripts incl. `quality:*` chain | `quality:gates` chain MUST stay green; new `classify:check` appended, not reordering existing gates |
| `CHANGELOG.md` | (exists) | — | public contract (Unbreakable Rule 6) | Append under `[Unreleased]`, never edit released sections |
| `docs/architecture.md` | 220 | `3bcd83e` (2026-06-21) | source of the primitive/composite taxonomy rule | Read-only reference; the new `ai/generic/cloud-ops` axis is ORTHOGONAL and must not contradict it |

`scripts/validate-quality-gates.ts` (`ef6f86b`, 2026-06-18, 1048 LoC) is READ as reference (it already enumerates `src/components/primitives/*/` and `composites/*/`) but is NOT edited — see D1.

### Current callers / dependents

- **Symbol:** none modified. This plan ADDS a script + data file + npm script; it changes no existing public symbol or component.
- **`package.json` `quality:gates` script:** consumed by CI and `pnpm quality:gates`. Callers: CI workflow + humans. The change is additive (append `pnpm classify:check` to the chain). External (public API consumed by other repos): no — build tooling only.
- **Component directory listing** (the manifest's domain): `src/components/primitives/` (99 dirs) + `src/components/composites/` (37 dirs) = 136 dirs. Enumerated via `ls src/components/{primitives,composites}`.

### Domain glossary

- **component directory** — one folder under `src/components/primitives/<name>/` or `composites/<name>/`; the unit the manifest classifies (136 total). Distinct from README's "154 components" which counts exported sub-symbols (e.g. the `ChatMessage*` family).
- **tier** — the new classification axis: `ai` (AI-agent surface vocabulary → stays in `@theokit/ui`), `generic` (shadcn-like primitive → `@usetheo/ui`), `cloud-ops` (PaaS/cloud dashboard → `@usetheo/ui`).
- **target package** — derived from tier: `ai` → `@theokit/ui`; `generic`/`cloud-ops` → `@usetheo/ui`.
- **AI-agent surface vocabulary** — the boundary rule from Blueprint §"Q2": a component is `ai` if it belongs to the visual vocabulary of an AI-agent surface (terminal, tool-call, reasoning, message…), even when structurally a thin wrapper.
- **drift** — a component directory that exists on disk but has no manifest entry, or a manifest entry that references a nonexistent directory.

### Architecture boundaries affected

- `docs/architecture.md` taxonomy (primitive vs composite) — NOT crossed; the `ai/generic/cloud-ops` axis is orthogonal and additive.
- `rules/architecture.md § 2` (DIP / acyclic) — this plan produces the DATA that the future `@theokit/ui → @usetheo/ui` acyclic dependency will honor; it does not yet create that dependency.

## Prior Art & Related Work

- **Internal blueprint:** `knowledge-base/discoveries/blueprints/theokit-ui-ai-exclusive-pivot-blueprint.md` §"Q2" (boundary rule + placement table for the 10 ambiguous components) and §"Recommendations" (boundary = surface vocabulary). SHIPPABLE (98.7).
- **Reference project:** `.claude/knowledge-base/references/ai-elements/packages/elements/src/` — Vercel keeps `terminal.tsx`, `environment-variables.tsx`, `sandbox.tsx`, `web-preview.tsx` in the AI package (evidence for the surface-vocabulary rule; `terminal.tsx:31`, `environment-variables.tsx:34`).
- **Patterns skills:** none match (`ls skills/*-patterns/` — none present).
- **Existing tooling:** `scripts/validate-quality-gates.ts` (`ef6f86b`) — the pattern for a filesystem-scanning quality gate over `src/components/`; the new gate mirrors its directory-enumeration approach.

## Dependencies

This plan introduces **no new dependency** — it walks the parsimony ladder to rung 4 (reuse what is installed): the gate is a `tsx` script tested by `vitest`, linted by `biome`, all already devDeps. Audited 2026-07-03 via `osv-scanner 1.9.2` on `pnpm-lock.yaml` (report: `knowledge-base/audits/component-classification-manifest-deps-audit-2026-07-03.md`).

### Existing — use as-is

| Package | Version | Ecosystem | Why | CVE status |
|---|---|---|---|---|
| `tsx` | installed devDep | npm | runs the gate script (`quality:*` scripts already use `tsx`) | clean (no osv finding) |
| `vitest` | installed devDep | npm | runs `classify-components.test.ts` (project test runner) | clean (no osv finding) |
| `@biomejs/biome` | installed devDep | npm | lints the new script (`pnpm lint`) | clean (no osv finding) |

### New — to be introduced

(none — the plan reuses installed tooling; parsimony ladder rung 4)

### Removed

(none)

> **Out-of-scope note:** the project-wide `osv-scanner` pass surfaced 15 pre-existing transitive CVEs (dompurify ×8, vite ×3, esbuild ×2, @babel/core ×1, ws ×1) that this plan neither introduces nor touches. They are recorded in the audit report and belong to a separate standalone `/deps-audit` remediation, not to this plan's verdict.

## Objective

- [ ] A machine-readable manifest at `registry/component-classification.json` with one entry per component directory: `{ name, layer (primitive|composite), tier (ai|generic|cloud-ops), target (@theokit/ui|@usetheo/ui), rationale }`.
- [ ] 100% of the 136 component directories classified (0 unclassified).
- [ ] The 10 ambiguous cloud/PaaS components from Blueprint §"Q2" placed per its table; `EnvVarEditor` explicitly flagged `disputed` (see Unresolved Questions).
- [ ] A gate script `scripts/classify-components.ts` that fails (non-zero exit) on drift: any on-disk component dir missing from the manifest, or any manifest entry pointing at a nonexistent dir, or any invalid tier/target.
- [ ] `pnpm classify:check` wired into the `quality:gates` chain.
- [ ] `pnpm classify:check` exits 0 on the current tree.

## ADRs

### D1 — New standalone gate script, not an extension of `validate-quality-gates.ts`
- **Decision:** implement the classification gate as a new `scripts/classify-components.ts` with its own `classify:check` npm script.
- **Rationale:** SRP + file-size budget (`rules/architecture.md` ~500 LoC). `validate-quality-gates.ts` is already 1048 LoC; growing it further worsens a god-module. The classification concern (a new orthogonal axis) is independently testable.
- **Alternatives considered:** extend `validate-quality-gates.ts` (rejected — adds to a 1048-LoC file, couples two orthogonal concerns); a Biome/lint rule (rejected — this is a manifest-completeness check, not a code-style rule).
- **Consequences:** one more entry in the `quality:gates` chain; the manifest gains a dedicated owner script.

### D2 — Machine-readable JSON manifest as the single source of truth
- **Decision:** the classification lives in `registry/component-classification.json`, gate-enforced.
- **Rationale:** the boundary must be drift-proof and consumable by downstream milestones (M-B/M-C scripts, codemod). Prose in a blueprint cannot be enforced or diffed mechanically.
- **Alternatives considered:** keep classification only in blueprint prose (rejected — drifts, unenforceable); a README table (rejected — human-readable only, no gate); TS module in `src/` (rejected — would risk bundling classification data into the shipped lib).
- **Consequences:** a new metadata file under `registry/`; downstream tooling reads one canonical JSON.

### D3 — Classify by AI-agent surface vocabulary, not by structure
- **Decision:** tier assignment follows Blueprint §"Q2" (surface vocabulary), independent of the primitive/composite axis.
- **Rationale:** the pivot question is "AI vs non-AI," which the primitive/composite taxonomy does not answer. Vercel's precedent places structurally-generic wrappers (terminal/env/sandbox) in the AI package by surface vocabulary.
- **Alternatives considered:** map primitive→generic, composite→ai (rejected — false; many primitives are AI-shaped like `AgentEvent`, `ToolCall`; some composites are generic like `DataTable`).
- **Consequences:** each entry needs a human-authored `rationale`; the manifest cannot be fully auto-derived (accepted — it is a judgment encoded once).

### D4 — Boundary scope resolution + disputed policy (amendment 2026-07-03, plan v1.2)
- **Decision:** the AI-agent surface scope covers BOTH coding-agent surfaces (terminal, files, browser, sandbox, build-log, agent env/logs) AND chat/agent surfaces. Every entry is verified against its component source; the `disputed` flag is retained ONLY for components that remain genuinely dual after source verification (currently `channel-card`, `cron-job-card`, `cron-jobs-list`), carried forward to M-C. Supersedes the plan v1.1 requirement that `EnvVarEditor` be `disputed`.
- **Rationale:** `/review` (cross-validation F-xval-1, domain F-dom-1/2/3) found the plan's original `disputed`-on-3 requirement and several `cloud-ops` tags contradicted the component source (e.g. `audit-log-entry` = "agent audit log", `project-switcher` = "code agent app sidebar"). Source evidence resolves each objectively; forcing a stale `disputed` requirement would be dishonest. 6 components reclassified from `cloud-ops`→`ai` (`preview-panel`, `audit-log-entry`, `project-switcher`, `channel-card`, `cron-job-card`, `cron-jobs-list`) with source-cited rationales. Final split: **82 `ai` / 54 non-AI** (47 `generic` + 7 `cloud-ops`), 3 `disputed`.
- **Alternatives considered:** keep `EnvVarEditor` `disputed` per plan v1.1 (rejected — source shows it is a deployment env editor, `EnvScope` prod/staging/preview + `THEO_DEPLOY_ID`, not an agent sandbox — not dual); ship 0 disputed (rejected — removes the mechanism to carry genuinely-dual components to M-C, per F-dom-7).
- **Consequences:** the plan's Objective/Acceptance references to "EnvVarEditor flagged disputed" are superseded by this ADR; the manifest is now source-verified end-to-end.

## Drawbacks & Risks

| Drawback / Risk | Severity | Mitigation | Owner |
|---|---|---|---|
| The classification is interpretive (Blueprint EC-4); a wrong tag mis-routes a component in M-B/M-C | Medium | Each entry cites a rationale; borderline entries (`BuildLogStream`, `MetricsPanel`) flagged `disputed`; reviewed in `/review` | maintainer |
| `EnvVarEditor` is a genuine both-sides component; forcing one tier now may be wrong | Medium | Flag `disputed: true` + list in Unresolved Questions; do not let this block the manifest (default it to `@usetheo/ui`, revisit at M-C) | maintainer |
| A new component added later without a manifest entry silently escapes classification | Low | The gate fails on drift (on-disk dir with no entry) — that IS the mitigation | gate |
| Manifest count (136 dirs) diverges from README's 154 symbols, causing confusion | Low | Glossary documents the dir-vs-symbol distinction; the gate operates on dirs only | plan |

## Unresolved Questions

- Q1 — `EnvVarEditor`: agent-sandbox env (→ `@theokit/ui`) or deployment env (→ `@usetheo/ui`), or ship in both? Defaulted to `@usetheo/ui` + `disputed: true` for now; must be resolved before M-C (import re-point).
- Q2 — `BuildLogStream` and `MetricsPanel` are borderline `ai` vs `cloud-ops`/`generic` (Blueprint placement table flagged them). Tagged per blueprint with `disputed: true`; confirm in `/review`.
- Q3 — should sub-component families (e.g. `ChatMessage*`) that live under one dir but export many symbols carry per-symbol tags, or is the directory-level tag sufficient for the extraction? Assumed dir-level is sufficient (the extraction moves dirs).

## Dependency Graph

```
Phase 1 (manifest + gate) ──▶ Phase 2 (Integration Validation)
```

Single implementation phase; no parallelism. Phase 2 is the mandatory validation gate.

---

## Phase 1: Classification manifest + drift gate

**Objective:** create the manifest and the gate that enforces its completeness, with 0 unclassified components on the current tree.

### T1.1 — Drift gate over the classification manifest

#### Objective
Create `scripts/classify-components.ts` that reads `registry/component-classification.json`, enumerates the on-disk component directories, and exits non-zero on any drift or invalid entry.

#### Why this step (action + reasoning — ReAct discipline)

1. **What this step does** — writes a filesystem-scanning gate script + its tests, and adds the `classify:check` npm script; the gate reads the manifest and the two component roots and cross-checks them.
2. **Why it is necessary now** — the manifest is only trustworthy if it is enforced; an unenforced JSON drifts the moment a component is added (Drawback row 3). The gate is authored BEFORE the manifest data (TDD RED) so the manifest is written against a green gate. This is the mechanical backbone every downstream milestone relies on (D2).

#### Evidence
`scripts/validate-quality-gates.ts:68-72` (`ef6f86b`) already enumerates `join(ROOT, "src/components/primitives")` and `composites` via `listDirectories` — the exact enumeration this gate mirrors. Co-located script tests are the project convention: `scripts/sync-exports.test.ts`, `scripts/__tests__/`.

#### Files to edit
```
scripts/classify-components.ts (NEW) — gate: read manifest + enumerate dirs + assert no drift/invalid
scripts/classify-components.test.ts (NEW) — RED tests first (TDD)
package.json — add "classify:check": "tsx scripts/classify-components.ts"; append to "quality:gates" chain
```

#### Deep file dependency analysis
- `scripts/classify-components.ts` (NEW): reads `registry/component-classification.json` and lists `src/components/{primitives,composites}/*`; no downstream code imports it (invoked as a script). Mirrors the enumeration in `validate-quality-gates.ts` (Baseline row) but does not import it.
- `package.json`: adds one script and appends `pnpm classify:check` to `quality:gates`; CI + humans call `quality:gates` (Baseline callers). Additive — existing gate order preserved.

#### Deep Dives
- Data structure — manifest entry: `{ name: string, layer: "primitive"|"composite", tier: "ai"|"generic"|"cloud-ops", target: "@theokit/ui"|"@usetheo/ui", rationale: string, disputed?: boolean }`.
- Algorithm: **(0) input guard (EC-1/EC-4)** — if the manifest file is absent (`existsSync` false) → typed error naming the path, exit 1; parse JSON, on error → typed "malformed manifest JSON" (not a raw stack); if the parsed value is not an array → typed "manifest must be a JSON array of entries", exit 1. **(1) duplicate guard (EC-2)** — if `manifest.length !== unique(`${layer}\0${name}`).size` → exit 1 listing duplicated keys (a component with two conflicting tiers must never silently dedupe). (2) build `Set` of on-disk dirs from both **top-level** roots (EC-5 — non-recursive, mirroring `validate-quality-gates.ts` `listDirectories`, so `slide/plugins` and `whiteboard/themes` are not phantom components); (3) build lookup of manifest entries keyed by `(layer, name)`; (4) fail if any on-disk dir ∉ manifest (unclassified), any manifest name ∉ on-disk (stale), **any entry whose declared `layer` ≠ the root the dir actually lives in (EC-3)**, any invalid tier/target, or any target inconsistent with tier (`ai`→`@theokit/ui`, else `@usetheo/ui`); (5) exit 1 with the offending list, else exit 0 with a summary count.
- Invariants: exit 0 ⟺ the manifest exists, is a JSON array, has no duplicate `(layer,name)`, and every on-disk component dir has exactly one valid, tier-consistent, layer-correct entry with no stale entries. Fail-fast + clear (typed error message listing offenders) per `rules/error-handling.md`.
- Edge cases: empty manifest `[]` (fail — all dirs unclassified); manifest absent (fail clear, EC-1); manifest not an array (fail clear, EC-4); duplicate entry (fail, EC-2); wrong `layer` field (fail, EC-3); manifest with a typo dir name (fail — stale entry); a component dir added after the manifest (fail — unclassified); malformed JSON (fail clear, not a stack trace).

#### Pseudo-code / Signatures
```pseudocode
function checkClassification(path): number  -- returns exit code
  if not existsSync(path): die(`manifest not found at ${path}`)          -- EC-1
  try manifest = parseJson(read(path)) catch: die("malformed manifest JSON")  -- fail clear
  if not isArray(manifest): die("manifest must be a JSON array of entries") -- EC-4
  keys = manifest.map(e => `${e.layer}\0${e.name}`)
  if keys.length != new Set(keys).size: die(`duplicate entries: ${dups(keys)}`)  -- EC-2
  byRoot = { primitive: listDirs("src/components/primitives"),            -- top-level only, EC-5
             composite: listDirs("src/components/composites") }
  onDisk = byRoot.primitive ∪ byRoot.composite
  named  = { e.name for e in manifest }
  unclassified = onDisk \ named
  stale        = named \ onDisk
  invalid = [ e for e in manifest if e.tier ∉ TIERS
              or e.target != (e.tier=="ai" ? "@theokit/ui" : "@usetheo/ui")
              or e.name ∉ byRoot[e.layer] ]                               -- layer must match location, EC-3
  if unclassified ∪ stale ∪ invalid nonempty: printOffenders(); return 1
  print(`classified ${onDisk.size} components, 0 drift`); return 0

# Examples
manifest missing "tool-call"                  ->  stderr "unclassified: tool-call"            ->  exit 1
two entries for "tool-call" (ai + generic)    ->  stderr "duplicate entries: composite\0tool-call" ->  exit 1
entry {name:"button", layer:"composite"}      ->  stderr "layer mismatch: button"             ->  exit 1
file absent                                    ->  stderr "manifest not found at registry/..." ->  exit 1
all 136 present & consistent                   ->  stdout "classified 136 components, 0 drift"  ->  exit 0
```

#### Tasks
1. Write RED tests in `scripts/classify-components.test.ts` (see TDD) against a small fixture manifest + fixture dirs (temp) or against the real roots with an injected manifest path.
2. Implement `scripts/classify-components.ts` to pass them (enumerate, cross-check, typed-error on drift).
3. Add `"classify:check"` to `package.json` scripts; append `&& pnpm classify:check` to the `quality:gates` chain.

#### TDD
```
RED:  fails_when_ondisk_dir_missing_from_manifest() — asserts exit 1 + names the dir
RED:  fails_when_manifest_entry_references_nonexistent_dir() — asserts exit 1 + names the stale entry
RED:  fails_when_tier_invalid() — tier="foo" → exit 1
RED:  fails_when_target_inconsistent_with_tier() — tier="ai", target="@usetheo/ui" → exit 1
RED:  fails_clear_on_malformed_json() — typed error, not a raw parse stack trace
RED:  fails_clear_when_manifest_absent() — ENOENT → typed error naming the path, exit 1 (EC-1)
RED:  fails_clear_when_manifest_not_array() — top-level object → typed error, exit 1 (EC-4)
RED:  fails_when_duplicate_entry() — two entries same (layer,name) → exit 1 listing dupes (EC-2)
RED:  fails_when_declared_layer_mismatches_location() — {name:"button",layer:"composite"} while button/ is a primitive → exit 1 (EC-3)
RED:  passes_when_every_dir_classified_and_consistent() — exit 0 + summary count
GREEN: implement scripts/classify-components.ts minimally to pass all RED (input-guard cluster first, then drift/consistency checks)
REFACTOR: extract listDirs helper if it clarifies; None otherwise
VERIFY: pnpm test scripts/classify-components.test.ts
```

#### Concurrency tests (only when applicable)

(none — single-threaded)

#### Acceptance Criteria
- [ ] All 10 RED tests pass after GREEN — `pnpm test scripts/classify-components.test.ts` reports `10 passed`.
- [ ] `pnpm classify:check` runs standalone (`exit 0`) and appears in the `quality:gates` chain — `grep -c 'classify:check' package.json` returns `2`.
- [ ] Gate exits `1` with the offending dir name on stderr when a dir is unclassified — asserted by `fails_when_ondisk_dir_missing_from_manifest`.
- [ ] Gate exits `1` on each malformed input — asserted by `fails_clear_when_manifest_absent` / `fails_clear_when_manifest_not_array` / `fails_when_duplicate_entry` / `fails_when_declared_layer_mismatches_location`.
- [ ] Pass: complexity — `scripts/classify-components.ts` cyclomatic complexity ≤ 10.
- [ ] Pass: coverage — `pnpm test` ≥ 90% on `scripts/classify-components.ts` (critical path: the drift check 100%).
- [ ] Pass: lint — `pnpm lint` (biome) zero warnings on changed files.
- [ ] Pass: size — `scripts/classify-components.ts` ≤ 500 lines.

#### DoD (Definition of Done)
- [ ] Tasks complete and validated.
- [ ] `pnpm test` green.
- [ ] `pnpm typecheck` zero errors.
- [ ] `pnpm lint` zero warnings.
- [ ] File-size budget respected.

### T1.2 — Author the classification manifest for all 136 component directories

#### Objective
Create `registry/component-classification.json` with a tier-consistent entry for every component directory, so `pnpm classify:check` exits 0.

#### Why this step (action + reasoning — ReAct discipline)

1. **What this step does** — writes the manifest data: one entry per dir, tier assigned per the blueprint's surface-vocabulary rule, target derived from tier, rationale per entry, `disputed` on the borderline ones.
2. **Why it is necessary now** — the gate from T1.1 is RED against an empty/absent manifest; this task turns it GREEN by supplying the authoritative data. This manifest is the deliverable the whole pivot consumes (D2, D3); doing it now, gate-checked, prevents the boundary from living in un-diffable prose.

#### Evidence
Blueprint §"Q2" placement table (10 ambiguous components) + §"Recommendations" boundary rule. On-disk dirs enumerated: 99 primitives + 37 composites (Baseline). Ambiguous set confirmed present in README catalog: `BuildLogStream`, `CronJobCard`, `CronJobsList`, `DeploymentRow`, `DomainConfig`, `EnvVarEditor`, `MetricsPanel`, `PreviewEnvCard`, `ProjectCard`, `RollbackUI`, `TerminalPanel`.

#### Files to edit
```
registry/component-classification.json (NEW) — 136 entries, one per component dir
CHANGELOG.md — [Unreleased] § Added: component classification manifest for the AI-exclusive pivot
```

#### Deep file dependency analysis
- `registry/component-classification.json` (NEW): consumed only by `scripts/classify-components.ts` (T1.1) now; by M-B/M-C tooling later. No runtime code imports it.
- `CHANGELOG.md`: append one `[Unreleased] § Added` line (Unbreakable Rule 6). Never edit released sections.

#### Deep Dives
- Tagging rules applied: AI-agent surface vocabulary → `ai` (e.g. `AgentEvent`, `ToolCall`, `ChatMessage*`, `ReasoningPart`, `ModelSelector`, `ContextWindowBar`, `TerminalPanel`); generic shadcn-like → `generic` (`Button`, `Card`, `Dialog`, `Input`, `Table`, `Tabs`, `DataTable`…); PaaS/cloud dashboard → `cloud-ops` (`DeploymentRow`, `DomainConfig`, `RollbackUI`, `CronJobCard`, `CronJobsList`, `PreviewEnvCard`, `ProjectCard`, `MetricsPanel`).
- Blueprint placement applied: `TerminalPanel`→`ai`; `BuildLogStream`→`ai` (`disputed`); `MetricsPanel`→`cloud-ops`; `EnvVarEditor`→`@usetheo/ui` via `cloud-ops` (`disputed`, Q1); the remaining PaaS set→`cloud-ops`.
- Invariant: exactly one entry per on-disk dir; target consistent with tier (enforced by T1.1 gate).
- Edge cases: sub-component families under one dir get a single dir-level tag (Q3).

#### Tasks
1. Enumerate the 136 dirs (`ls src/components/{primitives,composites}`).
2. For each, assign `tier` per the surface-vocabulary rule; derive `target`; write a one-line `rationale`; set `disputed: true` on `EnvVarEditor`, `BuildLogStream`, `MetricsPanel`.
3. Run `pnpm classify:check` until it exits 0.
4. Add the CHANGELOG entry.

#### TDD
```
RED:  (covered by T1.1) passes_when_every_dir_classified_and_consistent() flips GREEN only once this manifest is complete
RED:  manifest_has_136_entries() — assert entry count == on-disk dir count
RED:  placement_matches_blueprint_q2() — asserts the 11 named ambiguous components' `target` matches Blueprint §"Q2"
RED:  disputed_flag_present_on_envvareditor() — asserts EnvVarEditor.disputed === true
GREEN: author registry/component-classification.json until pnpm classify:check exits 0
REFACTOR: None expected (data file)
VERIFY: pnpm classify:check && pnpm test scripts/classify-components.test.ts
```

#### Concurrency tests (only when applicable)

(none — single-threaded)

#### Acceptance Criteria
- [ ] `pnpm classify:check` exits `0` (0 unclassified, 0 stale, 0 invalid).
- [ ] Entry count equals on-disk dir count — `jq 'length' registry/component-classification.json` returns `136`.
- [ ] The 11 named ambiguous components have `target` matching Blueprint §"Q2" — asserted by `placement_matches_blueprint_q2`; `EnvVarEditor` entry has `disputed: true`.
- [ ] Pass: lint — `pnpm lint` reports zero warnings on the JSON.
- [ ] Pass: size — manifest is data (no LoC budget); script unchanged.

#### DoD (Definition of Done)
- [ ] `pnpm classify:check` green.
- [ ] `pnpm test` green.
- [ ] CHANGELOG updated under `[Unreleased]`.

---

## Coverage Matrix

| # | Gap / Requirement | Task(s) | Resolution |
|---|---|---|---|
| 1 | Machine-readable boundary for the pivot | T1.2 | `registry/component-classification.json` with 136 entries |
| 2 | 100% of components classified | T1.2 | Gate asserts 0 unclassified |
| 3 | Anti-regression on new components | T1.1 | Drift gate fails on unclassified/stale dirs |
| 4 | Blueprint §"Q2" placement encoded | T1.2 | 11 ambiguous components tagged per table |
| 5 | `EnvVarEditor` dispute surfaced, not silently forced | T1.2 + Unresolved Q1 | `disputed: true` flag |
| 6 | Gate wired into quality chain | T1.1 | `classify:check` appended to `quality:gates` |
| 7 | Gate fails clear on malformed/absent/non-array/duplicate/mislayered input (EC-1..4) | T1.1 | Input-guard cluster + 4 RED tests |

**Coverage: 7/7 gaps covered (100%)**

## Global Definition of Done

- [ ] All phases completed.
- [ ] All tests passing — `pnpm test` green.
- [ ] Zero type errors — `pnpm typecheck`.
- [ ] Zero lint warnings — `pnpm lint`.
- [ ] File-size budget respected (`scripts/classify-components.ts` ≤ 500 lines).
- [ ] CHANGELOG.md updated under `[Unreleased]`.
- [ ] Backward compatibility preserved — no existing component, export, or public API changed (additive tooling only).
- [ ] `pnpm classify:check` exits 0 on the current tree AND fails on injected drift (both proven by tests).
- [ ] `pnpm quality:gates` chain still green with the new gate appended.
- [ ] Plan archived after `/review` READY_TO_MERGE + PR merge.

## Failure scenarios (when I/O external)

```
(none — no external I/O touched)
```

## Final Phase: Integration Validation (MANDATORY)

**Objective:** validate the gate + manifest work together in the real quality chain.

### Execution
```
pnpm test                 # unit tests incl. classify-components.test.ts
pnpm typecheck            # tsc --noEmit — zero errors
pnpm lint                 # biome check src — zero warnings
pnpm classify:check       # exits 0 on current tree
pnpm quality:structure    # existing taxonomy gate still green (unaffected)
```

### Acceptance Criteria
- [ ] All test suites green.
- [ ] Coverage ≥ 90% on `scripts/classify-components.ts` (drift check 100%).
- [ ] Zero type errors, zero lint warnings.
- [ ] `pnpm classify:check` exits 0; a temporary injected drift (add a throwaway dir OR remove an entry) makes it exit 1 — observed, then reverted. **After revert, `git status --porcelain` MUST be empty (EC-6)** — the injection left no residue. Prefer pointing the gate at a temp manifest path over mutating the real tree.
- [ ] Failure scenarios — n/a (`none — no external I/O touched`).

### If Validation Fails
1. Separate plan-caused failures from pre-existing.
2. Fix all plan-caused failures.
3. Re-run the chain.
4. Log pre-existing issues in the PR without blocking.
