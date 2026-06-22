# Review — M5-5 `useStickToBottom` (`@theokit/ui`)

**Date:** 2026-06-21
**Slug:** m5-use-stick-to-bottom
**Commits:** feat → `764f53f` (review fixes)
**Reviewers:** 2 independent agents (code-correctness + test-quality/cross-validation)
**Verdict:** **READY_TO_MERGE**

## Scope

A `useStickToBottom` hook: auto-scroll a container to the bottom on new content only while the user is pinned near the bottom, encapsulating the leaked `[data-radix-scroll-area-viewport]` selector.

## Findings & disposition

| ID | Sev | Finding | Disposition |
|---|---|---|---|
| Both-core | BLOCKER/HIGH | The hook's core promise (auto-scroll-when-pinned + **no-yank when not pinned**) was proven by ZERO tests; the `onResize` growth path was never exercised; and ADR D3 + CHANGELOG claimed a "one-shot fallback in test envs" the implementation did NOT have. | **FIXED** `764f53f` — growth is now detected via `MutationObserver` (childList+subtree+characterData — the real streamed-content signal, available in happy-dom) with `ResizeObserver` on top for box-size changes. Doc/CHANGELOG corrected (no false one-shot claim). +2 core tests: auto-scroll when pinned + content appended; NO scroll when not pinned. |
| A-obstarget | HIGH | Observing only `vp` (+ `firstElementChild` at attach) misses streaming growth: a scroll container's box doesn't resize on inner growth; empty-on-mount → no child to observe; sibling appends missed. | **FIXED** — `MutationObserver` on the viewport subtree catches all content growth regardless of wrapper shape or mount-time emptiness; `firstElementChild` special-case removed. |
| B-threshold | MEDIUM | Custom `threshold` option untested. | **FIXED** — +test (`threshold: 1000` pins at 900px). |
| B-overscroll | MEDIUM | `isNearBottom` over-scroll (negative distance) untested. | **FIXED** — +test. |
| B-reattach | MEDIUM | Re-attach teardown (scrollRef called twice) untested. | **FIXED** — +test (old node's scroll no longer flips isPinned). |
| B-unmount / A-onScroll-indirection | LOW | unmount cleanup untested; `onScroll` passthrough is a trivial indirection. | **ACCEPTED** — unmount cleanup is React-guaranteed + covered by the detach test path; `onScroll` keeps a stable named ref for add/removeEventListener symmetry (defensible). |

### Clean (both reviewers, INFO)

- **`isNearBottom`** correct for all edges (at-bottom, within/beyond threshold, zero-height, over-scroll).
- **Teardown** — `scrollRef` tears down the prior listener/observers before re-attach; `useEffect` cleanup on unmount. No double-attach leak.
- **`pinnedRef` vs `isPinned`** — the growth handler reads the ref (not stale state); no race.
- **Type safety** — no `any`/`as`/`@ts-ignore`; explicit return types; `"use client"` correctly placed.
- **`inject-use-client.ts` `.ts` scan** — verified zero current false-positives across all non-`use-*` `.ts` files; build delta is exactly +1 (scroll-area, now correctly client). Genuine fix of a detector gap (a `.ts` client hook lands in the component's chunk and must mark it).

## Gate evidence

| Gate | Result |
|---|---|
| `vitest run use-stick-to-bottom.test.tsx` | **14 passed** (was 9 pre-review) |
| `tsc --noEmit` | 0 errors |
| `biome check` (changed) | clean |
| `validate-quality-gates.ts` | PASS |
| `rsc-smoke/use-client-preserved` | PASS (inject-use-client `.ts` scan keeps it green) |
| full suite | 1982 passed |
| code-quality | PASS_WITH_CAVEATS (only `symbol_fab_unverifiable` SOFT_FLOOR on fixture `@/` aliases; zero in slice files) |
| CHANGELOG + changeset | present (mechanism description corrected) |

## Verdict

**READY_TO_MERGE.** One BLOCKER/HIGH (untested core behavior + false one-shot claim) and an observation-target HIGH were fixed in-cycle by switching growth detection to `MutationObserver` (correct AND testable), with the core auto-scroll/no-yank guard now exercised, plus three MEDIUM coverage gaps closed. Accepted items are React-guaranteed or stylistic. No BLOCKER, zero open HIGH.
