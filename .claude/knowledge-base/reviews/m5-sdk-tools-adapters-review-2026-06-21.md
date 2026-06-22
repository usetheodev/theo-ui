# Review — M5-4 `@theokit/ui/sdk-tools-adapters` (`@theokit/ui`)

**Date:** 2026-06-21
**Slug:** m5-sdk-tools-adapters
**Commits:** impl → `fdb2cd8` (review fixes)
**Reviewers:** 2 independent agents (code-correctness + test-quality/cross-validation)
**Verdict:** **READY_TO_MERGE**

## Scope

Pure converters from `@theokit/sdk-tools` tool results into theo-ui rich-primitive props (`@theokit/ui/sdk-tools-adapters`). 5 adapters + `parseUnifiedDiff`; adapters import nothing from sdk-tools at runtime (dev-only file: link for the contract test, per the user's coupling decision).

## Findings & disposition

| ID | Sev | Finding | Disposition |
|---|---|---|---|
| A-multifile | HIGH | `parseUnifiedDiff` mis-parsed a multi-file diff: the 2nd file's `--- a/`/`+++ b/` preamble was read as removed/added content (current hunk still open), inflating stats + conflating files under one path. | **FIXED** `fdb2cd8` — a `diff --git` header closes the current hunk; since `DiffViewer` is single-file, the parser stops at the 2nd file (first file only); preamble lines hit the `!current` branch (skipped, with `+++ b/` path derivation). +2 regression tests (multi-hunk line numbers; multi-file first-file-only + no preamble pollution + correct stats). |
| B-listdir | HIGH | `adaptListDirResult` derived columns from the first row only → heterogeneous entries dropped later-only keys (`size`). | **FIXED** — union keys across all rows. +1 regression test (heterogeneous rows include `size` column). |
| B/A-preamble | MEDIUM | No test asserted preamble lines never become content. | **FIXED** — the multi-file test asserts no `++ `/`-- ` marker content. |
| B-dotfile | MEDIUM | `adaptReadFileResult` language for dotfile/no-ext path untested. | **FIXED** — +test (`.gitignore`/`Makefile` → `undefined`). |
| A-langthread | MEDIUM | `adaptReadFileResult` derives `language` from the caller-supplied `path`; in the realistic renderer wiring `output` has no path, so language is `undefined`. | **ACCEPTED** — by design (read_file result carries no path; adapter is pure). Zero impact today (CodeBlock v1 ignores `language` — `code-block.tsx:34`). Documented; caller threads path when it has it. |
| A-shellcmd / A-basename / B-listdir-doc | LOW | shell has no command line (result lacks it); basename trailing-slash; plan baseline doc drift (`size` in list_dir, `cwd` vs `projectRoot`). | **ACCEPTED** — code is correct against the real input contracts; the drift is plan-prose only (artifact), the shipped code uses the right shapes (contract test proves it against real handlers). |
| A/B-pathoverride | LOW | `adaptGitDiffResult` path-override arg untested. | **FIXED** — +test. |

### Clean (both reviewers, INFO)

- **Purity / D2** — `sdk-tools-adapters.ts` imports nothing from `@theokit/sdk-tools` at runtime (only JSDoc mentions); built chunk has zero sdk-tools refs. devDep correctly in `devDependencies` (not deps/peer). Consumers gain zero runtime dep.
- **Contract test** — genuinely imports the REAL factories and runs their handlers in isolated tmp dirs (`mkdtempSync`/`rmSync`, `projectRoot` not `cwd` → no parallel collision); read/list/shell/apply_patch run live; git_diff `it.skipIf(!hasGit)` honest. apply_patch uses a real unified diff matching file content → deterministically applies.
- **Type safety** — no `any`/`as`/`@ts-ignore` in the shipped adapter; explicit return types; the test's `as unknown as AnyTool` + one `biome-ignore noExplicitAny` are dev-only at the loosely-typed CustomTool boundary.
- **Subpath wiring** — `./sdk-tools-adapters` durable across `pnpm build` (tsup manual entry + `sync-exports.ts` ISOLATED_SUBPATHS + regen PRESERVE_KEYS); types path `dist/lib/...` matches tsc emit; root barrel re-exports.

## Gate evidence

| Gate | Result |
|---|---|
| `vitest run sdk-tools-adapters.test.ts` | **30 passed** (was 25 pre-review), 0 skipped (git present) |
| `tsc --noEmit` | 0 errors |
| `biome check` (changed) | clean |
| `validate-quality-gates.ts` | PASS |
| full suite | 1963 passed (pre-review baseline; +5 review tests, no regressions) |
| code-quality | PASS_WITH_CAVEATS (only `symbol_fab_unverifiable` SOFT_FLOOR on test-fixture `@/` aliases; zero in slice files) |
| CHANGELOG + changeset | present |

## Verdict

**READY_TO_MERGE.** Two HIGH defects (multi-file diff conflation + list-dir column drop) and three MEDIUM/LOW coverage gaps fixed in-cycle with regression tests (`fdb2cd8`). Accepted items (language threading, plan doc drift) are by-design / artifact-only and have zero shipped-code impact. No BLOCKER, zero open HIGH. The contract test against real factories proves the adapters consume what the tools actually emit.
