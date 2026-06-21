# Review — M5-6 `toAgentStreamItems` (`@theokit/ui`)

**Date:** 2026-06-21
**Slug:** m5-to-agent-stream-items
**Commits:** feat → `ed26c76` (review fixes)
**Reviewers:** 2 independent agents (code-correctness + test-quality/cross-validation)
**Verdict:** **READY_TO_MERGE**

## Scope

Pure, order-aware builder merging history `UIMessage`s + live `AgentEvent`s into `AgentStreamItem[]` for `<AgentStream>`.

## Findings & disposition

| ID | Sev | Finding | Disposition |
|---|---|---|---|
| B-discriminant | HIGH | Discriminant-corruption prevention (kind/id/status) was asserted only by the type system; a spread-reorder regression would pass all tests. | **FIXED** `ed26c76` — added an adversarial test passing a `classifyTool` (cast past the types) returning `kind/id/status`; asserts the runtime re-application keeps `kind:"tool-call"`, `id`, `status`. |
| B-purity | HIGH | Input purity untested. | **FIXED** — added a purity test (inputs unchanged by JSON snapshot; returned array is a fresh reference). |
| B-order | MEDIUM | Intra-history order unproven (only single-message history tested). | **FIXED** — added a 2-message history order test. |
| A-footgun | LOW | An explicit `tool: undefined` override would blank the **required** `tool` label. | **FIXED** (code) — `tool: override?.tool ?? base.tool` so an undefined override never nulls the required label; +test. |
| B-undef | LOW | undefined `path`/`detail` → undefined `target`/`output` not explicitly asserted. | **FIXED** — added an assertion. |
| A-icon/B-rootexport | INFO | `icon`/`defaultExpanded`/`timestamp` overridable but untested; `ToolCallOverride` exported from the agent-stream barrel but not root. | **ACCEPTED** — uniform merge (behaviorally covered by the `tool`/`output`/`target` tests); `ToolCallOverride` reachable via the `@theokit/ui/agent-stream` subpath (DX-minor). |

### Clean (both reviewers, INFO)

- **`mapAgentEventStatus`** total + exhaustive (`Record<AgentEventStatus,...>` makes a missing key a compile error); `pending→queued`, rest pass through.
- **Override discriminant safety** holds at BOTH type level (`ToolCallOverride = Partial<Pick<…>>` excludes kind/id/status — TS2353) AND runtime (re-applied after spread) — now proven by the adversarial test.
- **Purity** — `.map` + spread, no input mutation; message held by reference (read-only view, ScrollArea/ChatMessage only read it).
- **undefined optional fields** — `ToolCallCard` guards `target`/`output` with truthiness; no crash.
- **Type safety** — no `any`/`as`/`@ts-ignore` in production; explicit return types.

## Gate evidence

| Gate | Result |
|---|---|
| `vitest run to-agent-stream-items.test.ts` | **12 passed** (was 7 pre-review) |
| `tsc --noEmit` | 0 errors |
| `biome check` (changed) | clean |
| `validate-quality-gates.ts` | PASS |
| full suite | 1994 passed |
| code-quality | PASS_WITH_CAVEATS (only `symbol_fab_unverifiable` fixture SOFT_FLOOR; zero in slice files) |
| CHANGELOG + changeset | present |

## Verdict

**READY_TO_MERGE.** Two HIGH test-coverage gaps (discriminant runtime guard, input purity) + a LOW required-field footgun were fixed in-cycle with code + regression tests (`ed26c76`). The builder is pure, total, type- and runtime-safe on the discriminant. No BLOCKER, zero open HIGH.
