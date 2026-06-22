# Review — M5-3 AgentToolRenderer registry (`@theokit/ui`)

**Date:** 2026-06-21
**Slug:** m5-agent-tool-renderer
**Commits:** `3bcd83e` (impl) → `978d1b2` (review fixes)
**Reviewers:** 2 independent agents (code-correctness + test-quality/cross-validation)
**Verdict:** **READY_TO_MERGE**

## Scope

Overridable tool-renderer registry on `@theokit/ui`: dispatches a `ToolUIPart` to a rich renderer (diff/terminal/code/created-files/data-table) by classification, falling back to `ToolCallPart` for unmapped tools. Mirrors the existing `partRenderers`/`dataRenderers` prop pattern (no new context). Faithful sdk-tools adapters are the separate M5-4 slice.

## Findings & disposition

| ID | Sev | Finding | Disposition |
|---|---|---|---|
| B-err | MEDIUM | A classified-but-errored tool (e.g. `shell` fail) rendered an empty rich surface and **dropped `errorText`**; streaming/approval states rendered empty too. | **FIXED** `978d1b2` — rich renderers now apply only to `state==='output-available'`; all other states route to `ToolCallPart` (badge+input+error). +2 regression tests (output-error surfaces error; input-streaming → ToolCallPart). |
| B-cf/dt | HIGH | created-files + data-table **structured-success** paths untested (only no-throw degradation). | **FIXED** — added 2 tests rendering structured fixtures + asserting visible cell/file text. |
| B-classify | HIGH | `classifyTool` prop never tested **through ChatMessage** (only via resolve directly). | **FIXED** — added a ChatMessage test passing `classifyTool` and asserting the forced surface. |
| B-dyn | MEDIUM | `dynamic-tool` classify-by-`toolName` path untested. | **FIXED** — added a dynamic-tool classify test. |
| B-order | MEDIUM | First-match-wins ordering precedence unasserted. | **FIXED** — added `read_diff → diff` precedence test. |
| A-files | LOW | `isStructuredFiles` only checked `Array.isArray(files)` (malformed empty card possible). | **FIXED** — guard now requires `id`+`name` string per file. |
| A-classify | MEDIUM | `defaultClassifyTool` substring heuristic mis-classifies some names (`code_search`→data-table, `exec_sql`→terminal). | **ACCEPTED** — documented risk (plan Drawbacks, ADR D1/D2); `classifyTool` is fully overridable per-call, the default only affects unconfigured consumers, and a wrong kind degrades safely. |
| A-rowkey | LOW | `renderDataTable` `rowKey={stringify(row)}` collides for identical rows. | **ACCEPTED** — `DataTableProps.rowKey` signature has no index arg; best-effort default superseded by M5-4 faithful adapters; React key collision only warns. Documented. |
| B-subpath | LOW | Barrel wiring test imports the local subpath barrel, not the root barrel. | **ACCEPTED** — intentional: importing the 154-export root barrel under full-suite concurrency was flaky (circular-init timing); the local `@theokit/ui/agent-tool-renderer` subpath IS the new public entry. Root re-export is covered by typecheck + the validator census. |
| A/B-plan | INFO | Plan assumed `ToolCallPart` stays in `chat-message/parts/`; impl moved it. | **ACCEPTED** — the move breaks the chat-message↔agent-tool-renderer import cycle the validator rejects; `ToolCallPart`/`ToolCallPartProps` re-exported unchanged from both barrels (verified). Justified divergence. |

### Clean (both reviewers, INFO)

- **No cycle** — `chat-message → agent-tool-renderer` one-directional; `tool-call-part.tsx` imports only `lucide-react`/`cn`/types. Validator: structure PASS.
- **Type safety** — no `any`/`as`/`@ts-ignore`; explicit return types on all public functions.
- **Purity** — `defaultClassifyTool`/`resolveToolRenderer`/guards are pure & deterministic.
- **`display:contents` wrapper** — carries the `data-slot` convention without a layout box; preserves (not alters) flex/grid child semantics; no a11y regression (non-semantic wrapper).
- **Priority** — `partRenderers.tool` > registry > `ToolCallPart`; unmapped tools byte-identical to pre-change.

## Gate evidence

| Gate | Result |
|---|---|
| `vitest run agent-tool-renderer + chat-message` | **43 passed** (was 36 pre-review) |
| `tsc --noEmit` | 0 errors |
| `biome check` (changed files) | clean |
| `validate-quality-gates.ts` | **PASS** (acyclic boundary, data-slot, census, subpath-exists) |
| full suite `vitest run` | 1931 passed (pre-review baseline; review fixes add 7 tests, no regressions) |
| code-quality | PASS_WITH_CAVEATS (only `symbol_fab_unverifiable` SOFT_FLOOR on test-fixture `@/` aliases; zero findings in slice files) |
| CHANGELOG `[Unreleased]` + `.changeset/*` | present (behavior-change noted) |

## Verdict

**READY_TO_MERGE.** One MEDIUM UX defect (errored/streaming tools rendering empty + dropping the error) and two HIGH + three MEDIUM coverage gaps were all fixed in-cycle with regression tests (`978d1b2`). Accepted items (heuristic mis-classification, rowKey collision, plan divergence) are consistent with the documented design (overridable classify, M5-4 supersession) and repo constraints. No BLOCKER, zero open HIGH.
