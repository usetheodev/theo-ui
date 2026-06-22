---
slug: m5-to-agent-stream-items
created_at: 2026-06-21
goal: Ship a pure toAgentStreamItems({history,live},{classifyTool}) builder on @theokit/ui that merges historical UIMessages with live AgentEvents into an order-aware AgentStreamItem[] for <AgentStream>, measured by src/components/composites/agent-stream/to-agent-stream-items.test.ts passing green.
---

# Plan — M5-6 `toAgentStreamItems` (`@theokit/ui`)

## Goal

Ship a pure `toAgentStreamItems({ history, live }, { classifyTool? })` builder on `@theokit/ui` that merges historical `UIMessage`s with live `AgentEvent`s into an order-aware `AgentStreamItem[]` ready for `<AgentStream>`, measured by `pnpm exec vitest run src/components/composites/agent-stream/to-agent-stream-items.test.ts` reporting all tests passed.

## Context

`<AgentStream>` (`src/components/composites/agent-stream/agent-stream.tsx:88-92`) renders a pre-built `AgentStreamItem[]` — the consumer must hand-assemble that array from their conversation history + the in-flight agent activity. There is no helper, so every app re-implements the merge (today the stories hand-write the array, `agent-stream.stories.tsx:8`). M5-6 ships the order-aware builder: historical `UIMessage`s (the conversation so far) become `message` items, live `AgentEvent`s (the current activity — `command`/`file_read`/`edit`/`lint`/…, `src/types/agent.ts:3-24`) become `tool-call` items, concatenated history-then-live with a customizable `classifyTool` mapping.

The builder is **pure** (no React, no hooks) and depends only on theo-ui's own types (`UIMessage`, `AgentEvent`, `AgentStreamItem`). It complements M5-2 (`foldAgentToolCards`, the theokit/client correlator) on the theo-ui side: M5-2 correlates raw SSE events into tool cards; M5-6 assembles the full ordered stream the `<AgentStream>` composite renders.

## Baseline Context

### Files that will be touched

| File | LoC today | Last touch (sha) | Why it exists / will change |
|---|---|---|---|
| `src/components/composites/agent-stream/to-agent-stream-items.ts` (NEW) | 0 | — | The pure builder + status mapping. |
| `src/components/composites/agent-stream/to-agent-stream-items.test.ts` (NEW) | 0 | — | Unit tests (RED). |
| `src/components/composites/agent-stream/agent-stream.tsx` | ~135 | — | Export the `AgentStreamItem` member interfaces (`MessageStreamItem`/`ToolCallStreamItem`) so the builder + its return type are nameable; they are currently file-private. |
| `src/components/composites/agent-stream/index.ts` | 1 | — | Re-export `toAgentStreamItems` + types. |
| `src/index.ts` (root barrel) | — | — | Re-export `toAgentStreamItems` + types. |
| `CHANGELOG.md` | — | — | `[Unreleased] § Added` (Unbreakable Rule 6). |
| `.changeset/m5-to-agent-stream-items.md` (NEW) | 0 | — | `@theokit/ui` minor changeset. |

### Current callers / dependents

- `AgentStream` (`agent-stream.tsx:88-92`) consumes `AgentStreamItem[]`. The builder produces exactly that. `AgentStreamItem` is exported (`index.ts:1`); the member interfaces (`MessageStreamItem`, `ToolCallStreamItem`, …) are currently NOT exported — T will export the two the builder emits.
- `AgentStreamItem` union members (`agent-stream.tsx:25-86`): `message {kind, id, message: UIMessage}`, `tool-call {kind, id, tool: ReactNode, icon?, target?, status: ToolCallStatus, output?, defaultExpanded?, timestamp?}`, plus approval/error/streaming/custom (not emitted by the default builder).
- `AgentEvent` (`src/types/agent.ts:15-24`): `{ id, type: AgentEventType, label, path?, diff?, status: AgentEventStatus, timestamp?, detail? }` where `AgentEventStatus = "pending" | "running" | "success" | "failed"`.
- `ToolCallStatus` (`src/components/primitives/tool-call-card/tool-call-card.tsx:20`): `"running" | "success" | "failed" | "queued" | "skipped"`.
- `UIMessage` (`src/types/chat.ts:243-247`): `{ id, role, parts, metadata? }`.

### Domain glossary

- **history** — completed conversation turns as `UIMessage[]`.
- **live** — the in-flight agent activity as `AgentEvent[]` (theo-ui's activity-centric event model).
- **AgentStreamItem** — the discriminated item `<AgentStream>` renders (`message`/`tool-call`/…).
- **classifyTool** — optional `(event: AgentEvent) => Partial<ToolCallStreamItem fields>` override merged onto the default mapping per event.

### Architecture boundaries affected

- The builder is a pure `.ts` module in the existing `agent-stream` composite dir; it imports only types (no component, no hooks) → no `"use client"` needed; the primitive/composite split is unaffected (it adds no cross-module import).
- Ships via the existing `@theokit/ui/agent-stream` subpath + root barrel — no new subpath wiring.

## Prior Art & Related Work

- **Internal:** M5-2 `foldAgentToolCards` (theokit/client, sibling repo) — the SSE-event correlator; M5-6 is the theo-ui assembly step over theo-ui's own `AgentEvent`. The `agent-stream.stories.tsx` hand-built array is the prior art this first-classes. `agent-timeline.tsx` already maps `AgentEvent[]` → rendered events (a related, narrower mapping).
- **External:** none — bespoke to theo-ui's `AgentStreamItem`/`AgentEvent` shapes.

## ADRs

### D1 — Order-aware merge: history items first, then live items

**Decision:** `toAgentStreamItems` returns `[...history.map(toMessageItem), ...live.map(toToolCallItem)]` — conversation history first (in input order), then the current live activity (in input order).

**Rationale:** the chat reads top-to-bottom: past turns, then what the agent is doing now. Stable input order is preserved within each segment (no sorting — the caller owns chronology).

**Alternatives rejected:**
- *Interleave by timestamp* — `AgentEvent.timestamp` is an optional display string (not a sortable instant) and `UIMessage` has no timestamp; sorting would be unreliable + lossy. The caller already provides chronological arrays. Rejected.

### D2 — Live `AgentEvent` → `tool-call` item; `classifyTool` overrides per event

**Decision:** each live `AgentEvent` maps to a `ToolCallStreamItem` (`id`, `tool: label`, `target: path`, `output: detail`, `status` via `mapStatus`), then `classifyTool?.(event)` is shallow-merged on top to customize `tool`/`icon`/`target`/`output`.

**Rationale:** theo-ui's `AgentEvent` is activity-centric (command/edit/lint with a status) — the `ToolCallCard` (status badge + target + output) is its natural surface. `classifyTool` is the documented override hook the roadmap requires, giving real per-event customization without forking the builder.

**Alternatives rejected:**
- *Map failed events to `error` items* — loses the activity context the `ToolCallCard` shows (the failed step + its output); a `tool-call` with `status:"failed"` is more faithful. Rejected.
- *No override hook* — the roadmap mandates `{classifyTool}`; a fixed mapping can't cover app-specific icons/labels. Rejected.

### D3 — Status mapping `AgentEventStatus → ToolCallStatus`

**Decision:** `pending→queued`, `running→running`, `success→success`, `failed→failed` (a total mapping).

**Rationale:** the two enums differ (`AgentEventStatus` has no `queued`/`skipped`; `ToolCallStatus` has no `pending`). `pending` is semantically `queued` (not yet started); the rest are 1:1. Total → no `default`/throw.

**Alternatives rejected:**
- *Pass status through unchanged* — type error (`pending` is not a `ToolCallStatus`). Rejected.

## Dependencies

### Existing — use as-is

| Package | Version | Ecosystem | Why |
|---|---|---|---|
| `react` | `^19` | npm | type-only (`ReactNode` in item fields). |

### New — to be introduced

| Package | Version | Ecosystem | Rule 9 rationale | Why this one |
|---|---|---|---|---|
| (none) | | | Pure mapping over in-repo types; no library applies. | — |

### Removed

| Package | Last version | Why removed |
|---|---|---|
| (none) | | |

## Dependency Graph

```
T1 (export item interfaces + mapStatus, pure) ─→ T2 (toAgentStreamItems builder) ─→ T3 (barrel + root export + changelog)
```

## Phase 1 — Status mapping + exported item types

### T1.1 — export `MessageStreamItem`/`ToolCallStreamItem` + `mapAgentEventStatus`

#### Why this step

**Action:** add `export` to the `MessageStreamItem` + `ToolCallStreamItem` interfaces in `agent-stream.tsx` (so the builder's return + override types are nameable); implement pure `mapAgentEventStatus(status: AgentEventStatus): ToolCallStatus` in the new module.

**Reasoning:** the builder needs to name the item types it emits + the override field set; the status map is the pure, independently-testable kernel (ADR D3). Cited: `agent-stream.tsx:25-71`, `src/types/agent.ts:13`.

#### Files to edit
- `src/components/composites/agent-stream/agent-stream.tsx`
- `src/components/composites/agent-stream/to-agent-stream-items.ts` (NEW)
- `src/components/composites/agent-stream/to-agent-stream-items.test.ts` (NEW)

#### Deep file dependency analysis
- Exporting the interfaces is additive (no behavior change; `AgentStream` unchanged). The builder imports `AgentEvent` (`../../../types/agent.js`), `UIMessage` (`../../../types/chat.js`), `ToolCallStatus` (`../../primitives/tool-call-card/index.js`), and the item types (`./agent-stream.js`).

#### TDD
RED — `to-agent-stream-items.test.ts`:
```ts
expect(mapAgentEventStatus("pending")).toBe("queued")
expect(mapAgentEventStatus("running")).toBe("running")
expect(mapAgentEventStatus("success")).toBe("success")
expect(mapAgentEventStatus("failed")).toBe("failed")
```
GREEN — `export` the two interfaces; implement `mapAgentEventStatus` (a `Record` lookup).
REFACTOR — none.

#### Acceptance criteria
- [ ] `pnpm exec vitest run src/components/composites/agent-stream/to-agent-stream-items.test.ts` exits 0 with the four status mappings green.
- [ ] `MessageStreamItem` + `ToolCallStreamItem` are exported from `agent-stream.tsx` (importable by the builder).

#### DoD
- [ ] `pnpm exec tsc --noEmit` exits 0.
- [ ] `pnpm exec biome check src/components/composites/agent-stream/` clean.

## Phase 2 — The builder

### T2.1 — `toAgentStreamItems`

#### Why this step

**Action:** implement `toAgentStreamItems(input: { history?: UIMessage[]; live?: AgentEvent[] }, options?: ToAgentStreamItemsOptions): AgentStreamItem[]` = `[...history.map(toMessageItem), ...live.map((e) => toToolCallItem(e, options?.classifyTool))]`. `toMessageItem(m)` → `{ kind: "message", id: m.id, message: m }`. `toToolCallItem(e, classify)` → `{ kind: "tool-call", id: e.id, tool: e.label, target: e.path, output: e.detail, status: mapAgentEventStatus(e.status), ...classify?.(e) }`.

**Reasoning:** the order-aware merge (D1) + per-event mapping with the `classifyTool` override (D2). Pure, total, never throws. Cited: item shapes `agent-stream.tsx:25-71`.

#### Files to edit
- `src/components/composites/agent-stream/to-agent-stream-items.ts`
- `src/components/composites/agent-stream/to-agent-stream-items.test.ts`

#### Deep file dependency analysis
- Pure function over in-repo types. New caller: tests + consumer apps + (optionally) the AgentStream stories.

#### TDD
RED:
```ts
const history: UIMessage[] = [{ id: "m1", role: "user", parts: [{ type: "text", text: "hi" }] }]
const live: AgentEvent[] = [
  { id: "e1", type: "command", label: "npm test", status: "running" },
  { id: "e2", type: "edit", label: "edit a.ts", path: "a.ts", status: "success", detail: "ok" },
]
const items = toAgentStreamItems({ history, live })
// order-aware: history first, then live
expect(items.map((i) => i.kind)).toEqual(["message", "tool-call", "tool-call"])
expect(items[0]).toMatchObject({ kind: "message", id: "m1" })
expect(items[1]).toMatchObject({ kind: "tool-call", id: "e1", tool: "npm test", status: "running" })
expect(items[2]).toMatchObject({ kind: "tool-call", id: "e2", target: "a.ts", output: "ok", status: "success" })
// empty inputs → []
expect(toAgentStreamItems({})).toEqual([])
// classifyTool override is shallow-merged on top
const out = toAgentStreamItems({ live }, { classifyTool: (e) => ({ tool: `T:${e.label}` }) })
expect(out[0]).toMatchObject({ tool: "T:npm test" })
// classifyTool can override status/target too
const out2 = toAgentStreamItems({ live: [live[0]] }, { classifyTool: () => ({ output: "custom" }) })
expect(out2[0]).toMatchObject({ output: "custom" })
```
GREEN — implement the two mappers + the merge.
REFACTOR — keep each mapper ≤ ~12 LoC.

#### Acceptance criteria
- [ ] `pnpm exec vitest run src/components/composites/agent-stream/to-agent-stream-items.test.ts` exits 0 with order, mapping, empty, and override cases green.
- [ ] Order is history-then-live, preserving input order within each (asserted).
- [ ] `classifyTool` shallow-merges over the default tool-call fields (asserted).
- [ ] Empty/omitted `history`/`live` yield `[]` / the other segment (asserted).

#### DoD
- [ ] `pnpm exec tsc --noEmit` exits 0.
- [ ] `pnpm exec biome check src/components/composites/agent-stream/` clean.

## Phase 3 — Integration Validation

### T3.1 — barrel + root export + changelog + changeset

#### Why this step

**Action:** re-export `toAgentStreamItems` + `mapAgentEventStatus` + `ToAgentStreamItemsOptions` + `ToAgentStreamItemsInput` from `agent-stream/index.ts` and `src/index.ts`; add CHANGELOG `[Unreleased] § Added` + `.changeset/m5-to-agent-stream-items.md` (`@theokit/ui` minor).

**Reasoning:** G7 — every export consumed/tested; ships via the existing agent-stream subpath + root barrel (no new subpath). Unbreakable Rule 6.

#### Files to edit
- `src/components/composites/agent-stream/index.ts`
- `src/index.ts`
- `CHANGELOG.md`
- `.changeset/m5-to-agent-stream-items.md` (NEW)

#### Deep file dependency analysis
- Additive re-exports; `agent-stream` already an auto-globbed subpath.

#### TDD
RED — barrel wiring test:
```ts
const mod = await import("./index.js")
expect(typeof mod.toAgentStreamItems).toBe("function")
expect(typeof mod.mapAgentEventStatus).toBe("function")
```
GREEN — add re-exports.
REFACTOR — none.

#### Acceptance criteria
- [ ] `pnpm exec vitest run src/components/composites/agent-stream/to-agent-stream-items.test.ts` exits 0 including the barrel wiring case.
- [ ] `pnpm build` exits 0; `pnpm exec tsx scripts/validate-quality-gates.ts` PASS.
- [ ] CHANGELOG `[Unreleased] § Added` has an entry and `.changeset/m5-to-agent-stream-items.md` exists.

#### DoD
- [ ] `pnpm exec tsc --noEmit` exits 0; `pnpm exec biome check .` clean on changed files.
- [ ] `pnpm exec vitest run` shows no NEW failures vs baseline.

## Coverage Matrix

| Requirement (Goal + roadmap M5-6) | Task(s) |
|---|---|
| `toAgentStreamItems({history,live})` builder | T2.1 |
| order-aware (history then live, stable order) | T2.1 (D1) |
| history `UIMessage` → message item | T2.1 |
| live `AgentEvent` → tool-call item | T2.1 |
| `classifyTool` override option | T2.1 (D2) |
| status mapping `AgentEventStatus → ToolCallStatus` | T1.1 (D3) |
| empty/omitted inputs safe | T2.1 |
| public export | T3.1 |

## Global DoD

- [ ] All three phases' acceptance criteria met.
- [ ] `pnpm exec tsc --noEmit` exits 0 (no `any`, explicit return types on public API).
- [ ] `pnpm exec biome check .` clean on changed files.
- [ ] `pnpm exec vitest run` shows no NEW failures vs baseline.
- [ ] `pnpm exec tsx scripts/validate-quality-gates.ts` PASS.
- [ ] File-size budget respected (builder ≤ ~90 LoC).
- [ ] CHANGELOG `[Unreleased]` updated + changeset present (Unbreakable Rule 6).

## Drawbacks & Risks

| Risk | Severity | Mitigation | Owner |
|---|---|---|---|
| Exporting the previously-private `MessageStreamItem`/`ToolCallStreamItem` interfaces widens the public API surface. | Low | They are the shapes consumers already construct by hand for `<AgentStream items>`; naming them is a DX win, and they are derived from the already-public `AgentStreamItem` union. | plan owner |
| `classifyTool` shallow-merge could let a caller override `kind`/`id` and break the item. | Low | The override type is `Partial<Pick<ToolCallStreamItem, "tool"\|"icon"\|"target"\|"output">>` — `kind`/`id`/`status` are NOT in the overridable set, so a caller cannot corrupt the discriminant. | plan owner |

## Unresolved Questions

- Whether to also expand a live `UIMessage` (a partial assistant message being streamed) into a `streaming` item — deferred: the current `<AgentStream>` consumers drive live activity via `AgentEvent[]`; a streaming-partial helper can compose on top later if a consumer needs it. Not in this slice.
