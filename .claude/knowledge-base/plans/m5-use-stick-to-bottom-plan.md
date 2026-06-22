---
slug: m5-use-stick-to-bottom
created_at: 2026-06-21
goal: Ship a useStickToBottom hook on @theokit/ui that auto-scrolls a scroll container to the bottom on new content only while the user is pinned near the bottom (ResizeObserver + threshold guard), encapsulating the Radix viewport selector, measured by src/components/primitives/scroll-area/use-stick-to-bottom.test.tsx passing green.
---

# Plan — M5-5 `useStickToBottom` (`@theokit/ui`)

## Goal

Ship a `useStickToBottom` hook on `@theokit/ui` that auto-scrolls a scroll container to the bottom when content grows **only while the user is pinned near the bottom** (ResizeObserver + a threshold guard), and that encapsulates the leaked `[data-radix-scroll-area-viewport]` selector so consumers stop reaching into Radix internals, measured by `pnpm exec vitest run src/components/primitives/scroll-area/use-stick-to-bottom.test.tsx` reporting all tests passed.

## Context

A streaming agent chat must auto-scroll as tokens arrive — but only when the user hasn't scrolled up to read history (otherwise the view yanks away from where they're reading). theo-ui ships `ScrollArea` (a Radix wrapper, `src/components/primitives/scroll-area/scroll-area.tsx`) but no stick-to-bottom behavior, so a consumer today must (a) write the scroll-position math by hand and (b) reach into Radix's internal `[data-radix-scroll-area-viewport]` element to find the actual scrollable node — a leaked implementation detail. M5-5 ships the hook that owns both: the pinned-near-bottom math (pure, testable) + the viewport resolution (encapsulated).

The hook follows the existing ResizeObserver pattern in `use-slide-fit.ts` (guards `typeof ResizeObserver === "undefined"` for test envs with a one-shot fallback). It co-locates with `ScrollArea` and ships via the existing `@theokit/ui/scroll-area` subpath + the root barrel — no new subpath wiring.

## Baseline Context

### Files that will be touched

| File | LoC today | Last touch (sha) | Why it exists / will change |
|---|---|---|---|
| `src/components/primitives/scroll-area/use-stick-to-bottom.ts` (NEW) | 0 | — | The hook + the pure `isNearBottom` helper + viewport resolution. |
| `src/components/primitives/scroll-area/use-stick-to-bottom.test.tsx` (NEW) | 0 | — | Unit tests (RED). |
| `src/components/primitives/scroll-area/index.ts` | 1 | — | Re-export `useStickToBottom` + types. |
| `src/index.ts` (root barrel) | — | — | Re-export `useStickToBottom` + `isNearBottom` + types. |
| `CHANGELOG.md` | — | — | `[Unreleased] § Added` (Unbreakable Rule 6). |
| `.changeset/m5-use-stick-to-bottom.md` (NEW) | 0 | — | `@theokit/ui` minor changeset. |

### Current callers / dependents

- `ScrollArea` (`scroll-area.tsx:44-67`) renders a Radix `Root` (`data-slot="scroll-area"`) wrapping `ScrollAreaPrimitive.Viewport`. Radix puts `data-radix-scroll-area-viewport` on the actual scrollable element inside the Viewport — the node the hook must observe + scroll. The hook resolves it from the attached root, so the consumer never queries it.
- Precedent: `use-slide-fit.ts:35-58` — ResizeObserver with a `typeof ResizeObserver === "undefined"` one-shot fallback for happy-dom (the test env has no ResizeObserver). `renderHook` from `@testing-library/react` is available (`use-deck-keyboard.test.ts:1`).
- The hook ships via the existing `@theokit/ui/scroll-area` subpath (auto-globbed) + root barrel — no `sync-exports`/`tsup` change (it's inside an existing component dir).

### Domain glossary

- **pinned** — the scroll position is within `threshold` px of the bottom; auto-scroll is active.
- **viewport** — the actual scrollable element; for a `ScrollArea` it is the `[data-radix-scroll-area-viewport]` node, else the attached element itself.
- **threshold** — px distance from the bottom under which the view is considered pinned (default 32).

### Architecture boundaries affected

- The hook lives in `src/components/primitives/scroll-area/` — a primitive. Primitives import zero other `@theokit/ui` components; this hook imports only `react` (no component import), so the primitive boundary holds.
- No new subpath: ships via the existing `scroll-area` auto-globbed subpath + root barrel.

## Prior Art & Related Work

- **Internal:** `use-slide-fit.ts` (ResizeObserver + test guard), the slide-deck `use-*` hooks (hook + renderHook test pattern). `ScrollArea` is the host.
- **External:** the "stick to bottom" pattern is standard in chat UIs (e.g. `use-stick-to-bottom` npm lib by stackblitz). We implement the minimal pinned-threshold variant for the bespoke Radix-viewport resolution rather than adding a dep (Rule 9: the algorithm is ~30 lines + we need the Radix-specific viewport resolution a generic lib does not provide).

## ADRs

### D1 — Pinned-threshold guard: auto-scroll only when near the bottom

**Decision:** track `isPinned = isNearBottom(metrics, threshold)`; on a content-size increase (ResizeObserver) auto-scroll to the bottom ONLY when `isPinned` was true before the growth.

**Rationale:** yanking the viewport to the bottom while the user reads history is the exact anti-pattern this hook exists to prevent. The threshold (default 32px) tolerates sub-pixel rounding + a small "close enough" band.

**Alternatives rejected:**
- *Always scroll to bottom on new content* — breaks reading history. Rejected.
- *Only scroll when exactly at bottom (`scrollTop+clientHeight===scrollHeight`)* — sub-pixel rounding makes "exactly" flaky; a threshold is robust. Rejected.

### D2 — Encapsulate the Radix viewport selector inside the hook

**Decision:** the hook's `scrollRef` attaches to the `ScrollArea` root (or any element); the hook resolves the scrollable node by querying `[data-radix-scroll-area-viewport]` and falling back to the element itself.

**Rationale:** the M5-5 mandate is to stop the leaked selector. Consumers attach the ref to the ScrollArea and get stick-to-bottom without knowing Radix internals.

**Alternatives rejected:**
- *Require the consumer to pass the viewport node* — re-leaks the selector (the consumer must query it). Rejected.

### D3 — ResizeObserver with a test-env one-shot fallback

**Decision:** mirror `use-slide-fit.ts` — when `ResizeObserver` is undefined (happy-dom), do a one-shot measurement; otherwise observe.

**Rationale:** keeps the hook testable in happy-dom (no ResizeObserver) and consistent with the existing codebase pattern (DRY).

**Alternatives rejected:**
- *Add a ResizeObserver polyfill to the test setup* — heavier + diverges from the established `use-slide-fit` pattern. Rejected.

## Dependencies

### Existing — use as-is

| Package | Version | Ecosystem | Why |
|---|---|---|---|
| `react` | `^19` | npm | hook primitives (`useRef`/`useCallback`/`useState`/`useEffect`). |

### New — to be introduced

| Package | Version | Ecosystem | Rule 9 rationale | Why this one |
|---|---|---|---|---|
| (none) | | | The pinned-threshold algorithm is ~30 lines and needs Radix-viewport resolution a generic `use-stick-to-bottom` lib does not provide; adding a dep to the standalone lib is not justified. | — |

### Removed

| Package | Last version | Why removed |
|---|---|---|
| (none) | | |

## Dependency Graph

```
T1 (isNearBottom pure helper) ─→ T2 (useStickToBottom hook) ─→ T3 (barrel + root export + changelog)
```

## Phase 1 — Pure helper

### T1.1 — `isNearBottom`

#### Why this step

**Action:** implement pure `isNearBottom(metrics: { scrollTop: number; scrollHeight: number; clientHeight: number }, threshold: number): boolean` returning `scrollHeight - clientHeight - scrollTop <= threshold`.

**Reasoning:** the pinned math is the testable core (no DOM); the hook composes it (ADR D1). Cited: precedent of extracting pure logic from hooks (`use-deck-state.ts`).

#### Files to edit
- `src/components/primitives/scroll-area/use-stick-to-bottom.ts` (NEW)
- `src/components/primitives/scroll-area/use-stick-to-bottom.test.tsx` (NEW)

#### Deep file dependency analysis
- Pure function, no imports. Exercised by tests + the hook.

#### TDD
RED:
```ts
expect(isNearBottom({ scrollTop: 100, scrollHeight: 200, clientHeight: 100 }, 32)).toBe(true) // exactly at bottom
expect(isNearBottom({ scrollTop: 80, scrollHeight: 200, clientHeight: 100 }, 32)).toBe(true)  // 20px from bottom < 32
expect(isNearBottom({ scrollTop: 50, scrollHeight: 200, clientHeight: 100 }, 32)).toBe(false) // 50px > 32
expect(isNearBottom({ scrollTop: 0, scrollHeight: 0, clientHeight: 0 }, 32)).toBe(true)        // empty/zero-height
```
GREEN — one-line implementation.
REFACTOR — none.

#### Acceptance criteria
- [ ] `pnpm exec vitest run src/components/primitives/scroll-area/use-stick-to-bottom.test.tsx` exits 0 with the at-bottom / within-threshold / beyond-threshold / zero-height cases green.
- [ ] `isNearBottom` returns true at exact bottom and within threshold, false beyond (asserted).

#### DoD
- [ ] `pnpm exec tsc --noEmit` exits 0.
- [ ] `pnpm exec biome check src/components/primitives/scroll-area/` clean.

## Phase 2 — The hook

### T2.1 — `useStickToBottom`

#### Why this step

**Action:** implement `useStickToBottom<T extends HTMLElement = HTMLElement>(options?: { threshold?: number }): { scrollRef: (node: T | null) => void; isPinned: boolean; scrollToBottom: () => void }`. `scrollRef` resolves the viewport (`[data-radix-scroll-area-viewport]` child or the node itself), attaches a scroll listener (updates `isPinned`) + a ResizeObserver (one-shot fallback when undefined) that, on content growth, scrolls to bottom iff `isPinned`. `scrollToBottom` sets `viewport.scrollTop = viewport.scrollHeight` and pins.

**Reasoning:** composes the pure helper (D1), encapsulates the Radix selector (D2), and uses the established ResizeObserver guard (D3). The ref-callback form lets the hook (re)resolve the viewport when the node mounts/changes.

#### Files to edit
- `src/components/primitives/scroll-area/use-stick-to-bottom.ts`
- `src/components/primitives/scroll-area/use-stick-to-bottom.test.tsx`

#### Deep file dependency analysis
- Imports only `react`. No component import (primitive boundary holds). New caller: tests + consumer apps.

#### TDD
RED (renderHook + happy-dom):
```tsx
// resolves the Radix viewport child as the scroll target
const root = document.createElement("div")
const vp = document.createElement("div")
vp.setAttribute("data-radix-scroll-area-viewport", "")
root.appendChild(vp)
const { result } = renderHook(() => useStickToBottom())
act(() => result.current.scrollRef(root))
// scrollToBottom writes to the viewport, not the root
act(() => result.current.scrollToBottom())
expect(typeof result.current.isPinned).toBe("boolean")
// falls back to the element itself when no radix viewport child
const plain = document.createElement("div")
act(() => result.current.scrollRef(plain))
expect(() => result.current.scrollToBottom()).not.toThrow()
// no throw without ResizeObserver (happy-dom)
```
GREEN — implement with the ResizeObserver guard + scroll listener + viewport resolution.
REFACTOR — extract `resolveViewport(node)`; keep the hook ≤ ~60 LoC.

#### Acceptance criteria
- [ ] `pnpm exec vitest run src/components/primitives/scroll-area/use-stick-to-bottom.test.tsx` exits 0 with the viewport-resolution + scrollToBottom + no-ResizeObserver cases green.
- [ ] `scrollRef` resolves `[data-radix-scroll-area-viewport]` when present, else the element itself (asserted by `scrollToBottom` targeting the viewport).
- [ ] The hook does not throw in an env without `ResizeObserver` (asserted).

#### DoD
- [ ] `pnpm exec tsc --noEmit` exits 0.
- [ ] `pnpm exec biome check src/components/primitives/scroll-area/` clean.

## Phase 3 — Integration Validation

### T3.1 — barrel + root export + changelog + changeset

#### Why this step

**Action:** re-export `useStickToBottom` + `isNearBottom` + types from `scroll-area/index.ts` and `src/index.ts`; add CHANGELOG `[Unreleased] § Added` + `.changeset/m5-use-stick-to-bottom.md` (`@theokit/ui` minor).

**Reasoning:** G7 — every export gets a consumer/test; ships via the existing scroll-area subpath + root barrel (no new subpath). Unbreakable Rule 6.

#### Files to edit
- `src/components/primitives/scroll-area/index.ts`
- `src/index.ts`
- `CHANGELOG.md`
- `.changeset/m5-use-stick-to-bottom.md` (NEW)

#### Deep file dependency analysis
- Additive re-exports. `scroll-area` already an auto-globbed subpath; the hook ships under it + the root barrel.

#### TDD
RED — barrel wiring test:
```tsx
const mod = await import("./index.js")
expect(typeof mod.useStickToBottom).toBe("function")
expect(typeof mod.isNearBottom).toBe("function")
```
GREEN — add re-exports.
REFACTOR — none.

#### Acceptance criteria
- [ ] `pnpm exec vitest run src/components/primitives/scroll-area/use-stick-to-bottom.test.tsx` exits 0 including the barrel wiring case.
- [ ] `pnpm build` exits 0; `pnpm exec tsx scripts/validate-quality-gates.ts` PASS.
- [ ] CHANGELOG `[Unreleased] § Added` has an entry and `.changeset/m5-use-stick-to-bottom.md` exists.

#### DoD
- [ ] `pnpm exec tsc --noEmit` exits 0; `pnpm exec biome check .` clean on changed files.
- [ ] `pnpm exec vitest run` shows no NEW failures vs baseline.

## Coverage Matrix

| Requirement (Goal + roadmap M5-5) | Task(s) |
|---|---|
| `useStickToBottom` hook | T2.1 |
| ResizeObserver-driven auto-scroll | T2.1 |
| threshold guard (pinned-near-bottom only) | T1.1, T2.1 |
| auto-scroll only while pinned (don't yank during history read) | T2.1 |
| encapsulate the Radix viewport selector | T2.1 (resolveViewport) |
| test-env (no ResizeObserver) safe | T2.1 |
| public export | T3.1 |

## Global DoD

- [ ] All three phases' acceptance criteria met.
- [ ] `pnpm exec tsc --noEmit` exits 0 (no `any`, explicit return types on public API).
- [ ] `pnpm exec biome check .` clean on changed files.
- [ ] `pnpm exec vitest run` shows no NEW failures vs baseline.
- [ ] `pnpm exec tsx scripts/validate-quality-gates.ts` PASS (primitive boundary held).
- [ ] File-size budget respected (hook file ≤ ~120 LoC).
- [ ] CHANGELOG `[Unreleased]` updated + changeset present (Unbreakable Rule 6).

## Drawbacks & Risks

| Risk | Severity | Mitigation | Owner |
|---|---|---|---|
| happy-dom reports zero scroll metrics, so the hook's auto-scroll branch can't be exercised with real layout in tests. | Medium | The pinned math is extracted to the pure `isNearBottom` (fully unit-tested with real numbers); the hook test verifies wiring (viewport resolution, scrollToBottom target, no-throw without ResizeObserver) rather than layout-dependent scrolling. | plan owner |
| Coupling to Radix's `[data-radix-scroll-area-viewport]` attribute — a Radix internal that could change. | Low | The hook falls back to the element itself when the attribute is absent, so a Radix rename degrades to "observe the root" rather than breaking; the selector lives in ONE place (the hook), easy to update. | plan owner |

## Unresolved Questions

- Whether `ScrollArea` should grow a built-in `stickToBottom` prop wrapping the hook — deferred (YAGNI; the hook is the composable primitive; a prop can wrap it later if a consumer asks). Not in this slice.
