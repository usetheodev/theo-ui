# Edge Case Review — component-classification-manifest

Date: 2026-07-03
Tasks analyzed: 2 (T1.1 gate, T1.2 manifest)
Cases found: 6 (EDGE: 1, NEGATIVE: 5 | MUST FIX: 2, SHOULD TEST: 2, DOCUMENT: 2)

The plan touches one real boundary: the gate (T1.1) reads a JSON file + enumerates two directory roots. All findings live at that boundary. Verified facts that calibrate severity: primitives/composites names are **disjoint** (no cross-root collision), there are **no non-component dirs** at the top level of either root, and `slide`/`whiteboard` nest `plugins/`+`themes/` (so enumeration must be top-level only).

## MUST FIX

### EC-1: Missing manifest file is not handled distinctly from malformed JSON
- **Affected task:** T1.1
- **Kind:** NEGATIVE (invalid state / failure)
- **Family:** Input / Format
- **Scenario:** The gate is authored BEFORE the manifest exists (T1.1 precedes T1.2). The very first `pnpm classify:check` run hits a **missing file** (ENOENT), not malformed JSON. The plan's only parse-failure test is `fails_clear_on_malformed_json()`, which reads an existing-but-bad file.
- **Impact:** `read()` throws a raw ENOENT stack trace instead of a clear "manifest not found at `registry/component-classification.json`" — exactly during development, and later if the file is ever deleted/renamed. Violates fail-clear (`rules/error-handling.md`).
- **Suggested fix:** In the gate, check `existsSync(manifestPath)` first and exit 1 with a typed message; add RED test `fails_clear_when_manifest_absent()` asserting the message names the path.

### EC-2: Duplicate manifest entries are silently deduped, hiding a conflicting classification
- **Affected task:** T1.1
- **Kind:** NEGATIVE (invalid input)
- **Family:** Format / State
- **Scenario:** The pseudo-code builds `named = { e.name for e in manifest }` — a Set. Two entries for the same component (e.g. `tool-call` tagged once `ai`, once `generic`, from a bad merge) collapse to one key. The drift check passes; the component silently carries two conflicting tiers.
- **Impact:** Downstream M-B/M-C tooling reads whichever entry it iterates first and may route the component to the wrong package — the exact class of silent mis-routing this manifest exists to prevent.
- **Suggested fix:** Detect duplicates before the Set-dedup: if `manifest.length !== unique(layer+name).size`, exit 1 listing the duplicated keys; add RED test `fails_when_duplicate_entry()`.

## SHOULD TEST

### EC-3: Declared `layer` field is never validated against the directory's actual root
- **Affected task:** T1.1
- **Kind:** NEGATIVE (invalid input)
- **Suggested test:** `fails_when_declared_layer_mismatches_location()` — a manifest entry `{name: "button", layer: "composite"}` while `button/` lives under `primitives/` must exit 1. Cross-check each entry by `(layer, name)` against actual location, not by `name` alone. (Severity is SHOULD-not-MUST because names are disjoint across roots today, so `name`-only keying happens to work — but a wrong `layer` still mis-informs the extraction, which treats primitives and composites differently.)

### EC-4: Manifest is valid JSON but not an array (e.g. `{}` or an object)
- **Affected task:** T1.1
- **Kind:** NEGATIVE (invalid input)
- **Suggested test:** `fails_clear_when_manifest_not_array()` — parsing succeeds but the top level is an object; assert a typed "manifest must be a JSON array of entries" error + exit 1, not a downstream `.map is not a function` crash. Fold into the same guard as EC-1.

## DOCUMENT

### EC-5: Directory enumeration must be top-level only
- **Kind:** EDGE (extreme of valid structure)
- **Accepted risk:** `slide/` and `whiteboard/` nest `plugins/` and `themes/` subdirs. If the gate recursed, it would count those as phantom components (count > 136, spurious "unclassified"). Accepted because the gate mirrors `scripts/validate-quality-gates.ts` `listDirectories` (non-recursive, top-level). Add a one-line note in T1.1 Deep Dives: "enumeration is top-level dirs only, per validate-quality-gates.ts."

### EC-6: Integration-validation drift injection could leave a dirty tree
- **Kind:** NEGATIVE (failure of the validation step itself)
- **Accepted risk:** The Integration phase injects drift (add a throwaway dir / remove an entry) then reverts. If the revert is forgotten, the working tree is dirty and the next gate run misreports. Accepted (manual, low-risk step); mitigate by asserting `git status --porcelain` is empty after the inject-then-revert, or by pointing the gate at a temp manifest via an env/arg instead of mutating the real tree.

## Summary

| Task | EDGE | NEGATIVE | MUST FIX | SHOULD TEST | DOCUMENT |
|------|------|----------|----------|-------------|----------|
| T1.1 | 1 | 5 | 2 | 2 | 1 |
| T1.2 | 0 | 0 | 0 | 0 | 0 |
| Integration | 0 | 1 | 0 | 0 | 1 |

**Coverage check:** T1.1 (the only task with an input boundary) has both lenses covered — EDGE (top-level enumeration limit, EC-5) and multiple NEGATIVE cases (EC-1/2/3/4/6). T1.2 is pure data authoring gated by T1.1; its correctness is proven by the gate, so it has no independent input boundary.

**Verdict:** PLAN NEEDS ADJUSTMENT

Two MUST FIX (EC-1 missing-file fail-clear; EC-2 duplicate-entry detection) should be absorbed into T1.1 as additional RED tests + gate logic before `/plan-confidence`. EC-3/EC-4 fold cleanly into the same input-guard cluster (cheap to add now). EC-5/EC-6 are one-line plan notes. None require new abstractions — all fixes are an `if` + a test.
