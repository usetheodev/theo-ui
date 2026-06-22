---
slug: m5-agent-tool-renderer
created_at: 2026-06-21
goal: Ship an overridable tool-renderer registry on @theokit/ui that dispatches a ToolUIPart to a rich renderer (diff/terminal/code/created-files/data-table) by classification, falling back to ToolCallPart, measured by src/components/composites/agent-tool-renderer/agent-tool-renderer.test.tsx passing green.
---

# Plan — M5-3 AgentToolRenderer registry (`@theokit/ui`)

## Goal

Ship an overridable tool-renderer **registry** on `@theokit/ui` that dispatches a `ToolUIPart` to a rich renderer (`diff` / `terminal` / `code` / `created-files` / `data-table`) by a classification function, falling back to `ToolCallPart` for anything unmapped, measured by `pnpm exec vitest run src/components/composites/agent-tool-renderer/agent-tool-renderer.test.tsx` reporting all tests passed.

## Context

The chat surface renders tool invocations through a single `<ToolCallPart>` — a generic `<details>` JSON dump of input/output (`src/components/composites/chat-message/parts/tool-call-part.tsx:96-148`). There is no way to render a `git_diff` tool as a real diff, a `shell` tool as a terminal, or a file-writing tool as a created-files card without replacing the *entire* tool rendering via the all-or-nothing `partRenderers.tool` override (`src/components/composites/chat-message/chat-message.tsx:147-155`).

This is the **registry mechanism** half of Theme D's rich-tool-rendering surface (roadmap M5-3). The faithful, sdk-tools-specific `ToolUIPart`→props adapters are the **separate** M5-4 slice (`@theokit/ui/sdk-tools-adapters`); this plan ships the dispatch machinery + a generic best-effort renderer per kind + the fallback, so M5-4 can later register exact adapters without touching the dispatch.

The design mirrors the two override patterns already in the codebase: `partRenderers` (override by part `type`, `chat-message.tsx:147`) and `dataRenderers` (`data-${name}` → renderer, `data-part.tsx:23-36`). The registry is **prop-threaded** like both of those (KISS — no new context required); the existing `partRenderers.tool` remains the highest-priority all-tools escape hatch.

## Baseline Context

### Files that will be touched

| File | LoC today | Last touch (sha) | Why it exists / will change |
|---|---|---|---|
| `src/components/composites/agent-tool-renderer/agent-tool-renderer.tsx` (NEW) | 0 | — | The registry: types, `defaultClassifyTool`, `resolveToolRenderer`, `AgentToolRenderer` component, `defaultToolRegistry`. |
| `src/components/composites/agent-tool-renderer/index.ts` (NEW) | 0 | — | Barrel for the new composite (mirrors every other component dir, e.g. `diff-viewer/index.ts`). |
| `src/components/composites/agent-tool-renderer/agent-tool-renderer.test.tsx` (NEW) | 0 | — | Unit tests (RED first). |
| `src/components/composites/chat-message/chat-message.tsx` | 260 | `ef6f86b` | Wire `toolRenderers?: ToolRendererRegistry` into `RenderPartOptions` + `ChatMessageProps`; dispatch in the `isToolUIPart` branch via the registry, preserving `partRenderers.tool` priority + `ToolCallPart` fallback. |
| `src/index.ts` (public barrel) | — | — | Re-export the new public symbols. |
| `package.json` `exports` | — | — | Add `./agent-tool-renderer` subpath (mirrors the 170+ existing per-component subpaths, e.g. `./diff-viewer`). |
| `CHANGELOG.md` | — | — | `[Unreleased] § Added` entry (Unbreakable Rule 6). |
| `.changeset/m5-agent-tool-renderer.md` (NEW) | 0 | — | `@theokit/ui` minor changeset. |

### Current callers / dependents

- `renderPart(part, opts)` (`chat-message.tsx:158-194`) is the single tool-dispatch site; `isToolUIPart` branch at `:179` currently does `overrides.tool?.(part) ?? <ToolCallPart part={part} />`.
- `ChatMessage` (`chat-message.tsx:218-259`) threads `partRenderers` + `dataRenderers` into `renderPart`; `toolRenderers` joins them the same way.
- Rich primitives consumed by the default renderers (read for their prop contracts):
  - `DiffViewer` — `{ path: string; stats?: {added,removed}; hunks: DiffHunk[] }` (`src/components/primitives/diff-viewer/diff-viewer.tsx:29-34`).
  - `TerminalPanel` — `{ title?; lines: TerminalLine[]; ... }` (`src/components/primitives/terminal-panel/terminal-panel.tsx:16-28`).
  - `CodeBlock` — `{ code: string; language?; terminal?; copyable?; caption? }` (`src/components/composites/code-block/code-block.tsx:20-31`).
  - `CreatedFilesCard` — `{ title?; files: CreatedFile[]; ... }` (`src/components/primitives/created-files-card/created-files-card.tsx:20-26`).
  - `DataTable<T>` — `{ ... }` generic columns+rows (`src/components/composites/data-table/data-table.tsx:55`).
- `ToolUIPart` type (`src/types/chat.ts`) — discriminated `tool-${name}` | `dynamic-tool` with `state`, `input: unknown`, `output?: unknown`, `errorText?`, `toolName?`. `deriveToolName(part)` precedent at `tool-call-part.tsx:18-23`.

### Domain glossary

- **ToolUIPart** — Vercel-AI-SDK-shaped UI part for a tool invocation (input/output are `unknown`).
- **renderer kind** — one of `diff | terminal | code | created-files | data-table` (the rich surfaces) plus the implicit `fallback`.
- **classify** — pure `(part: ToolUIPart) => ToolRendererKind | undefined`; `undefined` ⇒ fallback to `ToolCallPart`.
- **registry** — `Record<ToolRendererKind, AgentToolRenderer>`; consumer overrides are shallow-merged over the default.

### Architecture boundaries affected

- Primitive vs composite split: primitives import zero theo-ui components; **composites may import primitives**. `AgentToolRenderer` is a **composite** (it composes `DiffViewer`/`TerminalPanel`/`CodeBlock`/`CreatedFilesCard`/`DataTable` + `ToolCallPart`), so it lives under `src/components/composites/` and may import all of them. Verified legal.
- Subpath-export convention: every component has a dedicated `exports` entry; the new one follows the same `types`+`import` shape.

## Prior Art & Related Work

- **Internal:** `partRenderers` (`chat-message.tsx:147-194`) and `dataRenderers` (`data-part.tsx:23-36`) are the two existing override registries; this plan is a third, keyed by classification rather than by `type`/`name`. The M5-2 `foldAgentToolCards` correlator in `theokit/client` (sibling repo, just shipped) is the upstream that produces the tool events these renderers display.
- **External literature:** component-map / renderer-registry is the standard "open/closed dispatch" pattern (block-renderer registries in editors like ProseMirror/Slate). No code copied.

## ADRs

### D1 — Registry keyed by classification kind, not by tool name

**Decision:** the registry is `Record<ToolRendererKind, AgentToolRenderer>` (6 fixed kinds) and a separate `classifyTool(part) → kind` maps a tool to a kind. NOT `Record<toolName, renderer>`.

**Rationale:** there are unboundedly many tool names but a small fixed set of rich surfaces. Keying by kind keeps the default registry tiny and lets M5-4 supply only a `classifyTool` (name→kind) without re-declaring renderers. Mirrors how `dataRenderers` keys by a derived name but renders a fixed shape.

**Alternatives rejected:**
- *Key by exact tool name* — explodes the default registry, forces every consumer to know sdk-tool names, duplicates M5-4's job. Rejected.
- *Single mega-switch inside ToolCallPart* — not overridable, violates OCP. Rejected.

### D2 — Prop-threaded registry, no new React context

**Decision:** `toolRenderers` + `classifyTool` are **props** on `ChatMessage` (and the standalone `AgentToolRenderer` component), threaded through `RenderPartOptions` exactly like `partRenderers`/`dataRenderers`.

**Rationale:** the two existing override mechanisms are prop-based; matching them is KISS + DRY and avoids a second source of truth. App-wide defaults can already be achieved by the consumer passing the same registry down.

**Alternatives rejected:**
- *Context provider via TheoUIProvider* — adds a global mutable surface nobody asked for (YAGNI); inconsistent with the sibling override props. Deferred until a concrete multi-level-override need exists.

### D3 — Default renderers are defensive best-effort; faithful adapters are M5-4

**Decision:** `defaultToolRegistry` ships a renderer per kind that adapts the generic `ToolUIPart` with a **minimal, defensive** transform, and renders the rich primitive only when the shape is satisfiable; otherwise it falls back to `ToolCallPart`. The faithful sdk-tools `ToolUIPart`→props adapters live in M5-4.

**Rationale:** M5-3 must ship without depending on the not-yet-existing M5-4 subpath (dependency direction). A defensive renderer proves the dispatch end-to-end (`code` and `terminal` are trivially generic; `diff`/`created-files`/`data-table` render when already-structured, else fall back) and never throws on unexpected input.

**Alternatives rejected:**
- *Block M5-3 on M5-4* — inverts the dependency; M5-4's contract test needs M5-3's registry to exist first. Rejected.
- *Default registry empty (everything falls back)* — would not satisfy the roadmap's "Diff/Terminal/Code/CreatedFiles/DataTable" deliverable. Rejected.

## Dependencies

### Existing — use as-is

| Package | Version | Ecosystem | Why |
|---|---|---|---|
| `react` | `^19` | npm | Component layer (peer). |
| `lucide-react` | existing | npm | Icons (already used by ToolCallPart). |

### New — to be introduced

| Package | Version | Ecosystem | Rule 9 rationale | Why this one |
|---|---|---|---|---|
| (none) | | | The five rich primitives + ToolCallPart already exist in-repo; no new dependency. | — |

### Removed

| Package | Last version | Why removed |
|---|---|---|
| (none) | | |

## Dependency Graph

```
T1 (registry types + classify + resolve, pure)  ─┐
                                                 ├─→ T2 (default renderers per kind) ─→ T3 (wire into ChatMessage) ─→ T4 (barrel + exports + changelog)
T1 ──────────────────────────────────────────────┘
```

T1 blocks T2 and T3. T2 blocks T3 (ChatMessage dispatches through the default registry). T4 is the integration/wiring phase.

## Phase 1 — Registry core (pure)

### T1.1 — Types, `defaultClassifyTool`, `resolveToolRenderer`

#### Why this step

**Action:** define `ToolRendererKind`, `AgentToolRenderer`, `ToolRendererRegistry`, `ClassifyTool`; implement pure `defaultClassifyTool(part)` (name-substring heuristic → kind | undefined) and `resolveToolRenderer(registry, classify, part)` (classify → registry lookup → renderer | undefined).

**Reasoning:** the pure core is independently testable (no DOM) and is what M5-4 will extend. Per ADR D1 the registry is kind-keyed; `resolveToolRenderer` returning `undefined` is the signal for the ChatMessage fallback to `ToolCallPart`. Cited: `tool-call-part.tsx:18-23` (`deriveToolName` reuse).

#### Files to edit
- `src/components/composites/agent-tool-renderer/agent-tool-renderer.tsx` (NEW)
- `src/components/composites/agent-tool-renderer/agent-tool-renderer.test.tsx` (NEW)

#### Deep file dependency analysis
- Imports `ToolUIPart` from `../../../types/chat.js`. No component imports yet (pure). No existing caller — exercised by tests + T3 wiring.

#### TDD
RED — `agent-tool-renderer.test.tsx`:
```tsx
// Given a git-diff-named tool part, defaultClassifyTool returns "diff"
expect(defaultClassifyTool(toolPart("git_diff"))).toBe("diff")
expect(defaultClassifyTool(toolPart("apply_patch"))).toBe("diff")
expect(defaultClassifyTool(toolPart("shell"))).toBe("terminal")
expect(defaultClassifyTool(toolPart("run_vitest"))).toBe("terminal")
expect(defaultClassifyTool(toolPart("read_file"))).toBe("code")
expect(defaultClassifyTool(toolPart("edit_file"))).toBe("created-files")
expect(defaultClassifyTool(toolPart("list_dir"))).toBe("data-table")
expect(defaultClassifyTool(toolPart("totally_unknown_tool"))).toBeUndefined()
// resolveToolRenderer returns a renderer for a classified kind, undefined for unmapped
expect(resolveToolRenderer(defaultToolRegistry, defaultClassifyTool, toolPart("git_diff"))).toBeTypeOf("function")
expect(resolveToolRenderer(defaultToolRegistry, defaultClassifyTool, toolPart("totally_unknown_tool"))).toBeUndefined()
// a custom classify overrides the default
const classify = () => "terminal" as const
expect(resolveToolRenderer(defaultToolRegistry, classify, toolPart("git_diff"))).toBe(defaultToolRegistry.terminal)
// a shallow-merged custom registry overrides one kind
const custom = { ...defaultToolRegistry, diff: () => null }
expect(resolveToolRenderer(custom, defaultClassifyTool, toolPart("git_diff"))).toBe(custom.diff)
```
GREEN — implement the types + the two pure functions + `defaultToolRegistry` skeleton (renderers added in T2).
REFACTOR — extract the name→kind table to a `const` map; keep cognitive complexity low.

#### Acceptance criteria
- [ ] `pnpm exec vitest run src/components/composites/agent-tool-renderer/agent-tool-renderer.test.tsx` exits 0 with the classify + resolve cases green.
- [ ] `defaultClassifyTool` returns `undefined` for an unmapped tool name (asserted), so the ChatMessage fallback path is reachable.
- [ ] `resolveToolRenderer` honors a custom `classifyTool` and a shallow-merged registry override (both asserted).

#### DoD
- [ ] `pnpm exec tsc --noEmit` exits 0.
- [ ] `pnpm exec biome check src/components/composites/agent-tool-renderer/` reports no errors.

## Phase 2 — Default renderers per kind

### T2.1 — `code` + `terminal` renderers (generic) and `diff`/`created-files`/`data-table` renderers (defensive)

#### Why this step

**Action:** implement the five `defaultToolRegistry` renderers. `code` → `<CodeBlock code={stringify(output)} />`; `terminal` → `<TerminalPanel lines={toTerminalLines(output)} />`; `diff`/`created-files`/`data-table` → render the rich primitive when `part.output` already matches the structured shape (type-guard), else return `<ToolCallPart part={part} />`.

**Reasoning:** per ADR D3 the defaults are defensive best-effort — they must never throw on `unknown` output and must degrade to the fallback when they can't faithfully render. `code`/`terminal` are generic (any string output renders); the three structured ones guard then degrade. The faithful sdk-tools adapters are M5-4.

#### Files to edit
- `src/components/composites/agent-tool-renderer/agent-tool-renderer.tsx`
- `src/components/composites/agent-tool-renderer/agent-tool-renderer.test.tsx`

#### Deep file dependency analysis
- Imports `CodeBlock` (`../code-block/index.js`), `DiffViewer`/`TerminalPanel`/`CreatedFilesCard` (`../../primitives/.../index.js`), `DataTable` (`../data-table/index.js`), `ToolCallPart` (`../chat-message/parts/tool-call-part.js`). All composite→primitive/composite imports are legal per `architecture.md`. These are the first real callers of those components from this module.

#### TDD
RED — render assertions (happy-dom + `@testing-library/react`):
```tsx
// code renderer renders a CodeBlock with the stringified output
render(defaultToolRegistry.code(toolPartWithOutput("read_file", "const x = 1")))
expect(screen.getByText(/const x = 1/)).toBeInTheDocument()
// terminal renderer renders stdout lines
render(defaultToolRegistry.terminal(toolPartWithOutput("shell", "hello\nworld")))
expect(screen.getByText("hello")).toBeInTheDocument()
// diff renderer with a NON-structured output degrades to ToolCallPart (no throw)
const { container } = render(defaultToolRegistry.diff(toolPartWithOutput("git_diff", "not a diff shape")))
expect(container.querySelector('[data-slot="tool-call-part"]')).toBeInTheDocument()
// diff renderer with a structured {path,hunks} output renders DiffViewer
render(defaultToolRegistry.diff(toolPartWithStructured("git_diff", { path: "a.ts", hunks: [] })))
expect(screen.getByText("a.ts")).toBeInTheDocument()
// created-files defensive fallback + data-table defensive fallback (no throw on unknown)
expect(() => render(defaultToolRegistry["created-files"](toolPartWithOutput("edit_file", 42)))).not.toThrow()
expect(() => render(defaultToolRegistry["data-table"](toolPartWithOutput("list_dir", null)))).not.toThrow()
```
GREEN — implement the five renderers + small type-guards (`isStructuredDiff`, `isStructuredFiles`, `isStructuredTable`) + `toTerminalLines`.
REFACTOR — share `stringify` with the existing `safeStringify` pattern; keep each renderer ≤ 40 LoC.

#### Acceptance criteria
- [ ] `pnpm exec vitest run src/components/composites/agent-tool-renderer/agent-tool-renderer.test.tsx` exits 0 with all five renderer cases green.
- [ ] The `diff`/`created-files`/`data-table` renderers render `[data-slot="tool-call-part"]` (the fallback) when output is unstructured, asserted by querying the DOM (no throw on `unknown`).
- [ ] The `code` and `terminal` renderers render their primitive for any string output (asserted by visible text).

#### DoD
- [ ] `pnpm exec tsc --noEmit` exits 0.
- [ ] `pnpm exec biome check src/components/composites/agent-tool-renderer/` reports no errors.

## Phase 3 — Wire into ChatMessage

### T3.1 — `toolRenderers` + `classifyTool` props dispatch through the registry

#### Why this step

**Action:** add `toolRenderers?: ToolRendererRegistry` + `classifyTool?: ClassifyTool` to `RenderPartOptions` and `ChatMessageProps`; in `renderPart`'s `isToolUIPart` branch, dispatch: `overrides.tool?.(part) ?? resolveToolRenderer(registry ?? defaultToolRegistry, classify ?? defaultClassifyTool, part)?.(part) ?? <ToolCallPart part={part} />`.

**Reasoning:** preserves the existing all-tools `partRenderers.tool` as highest priority, then the kind registry, then the unchanged `ToolCallPart` fallback — strictly additive (existing behavior with no `toolRenderers` is byte-identical because `defaultClassifyTool` returns `undefined` for unmapped tools and the mapped defaults render rich surfaces). Cited: `chat-message.tsx:179` (current branch), `:218-259` (prop threading).

#### Files to edit
- `src/components/composites/chat-message/chat-message.tsx`
- `src/components/composites/agent-tool-renderer/agent-tool-renderer.test.tsx` (integration cases)

#### Deep file dependency analysis
- `ChatMessage` is consumed by `AgentStream` (`agent-stream.tsx`) and by consumer apps. Adding two OPTIONAL props is backward compatible — no existing caller breaks. `chat-message.test.tsx` (existing) must stay green.

#### TDD
RED — integration:
```tsx
// ChatMessage with a git_diff tool part renders DiffViewer (structured) via the default registry
render(<ChatMessage message={msgWithTool("git_diff", { path: "a.ts", hunks: [] })} />)
expect(screen.getByText("a.ts")).toBeInTheDocument()
// ChatMessage with an unmapped tool falls back to ToolCallPart
const { container } = render(<ChatMessage message={msgWithTool("totally_unknown", "x")} />)
expect(container.querySelector('[data-slot="tool-call-part"]')).toBeInTheDocument()
// a custom toolRenderers override wins over the default
render(<ChatMessage message={msgWithTool("git_diff", {})} toolRenderers={{ ...defaultToolRegistry, diff: () => <span>CUSTOM</span> }} />)
expect(screen.getByText("CUSTOM")).toBeInTheDocument()
// partRenderers.tool still wins over the registry (highest priority preserved)
render(<ChatMessage message={msgWithTool("git_diff", {})} partRenderers={{ tool: () => <span>ALLTOOLS</span> }} />)
expect(screen.getByText("ALLTOOLS")).toBeInTheDocument()
```
GREEN — thread the two props through `renderPart` + `ChatMessage`.
REFACTOR — keep the `isToolUIPart` branch readable (one resolve call).

#### Acceptance criteria
- [ ] `pnpm exec vitest run src/components/composites/agent-tool-renderer/agent-tool-renderer.test.tsx` exits 0 with the four integration cases green.
- [ ] The existing `pnpm exec vitest run src/components/composites/chat-message/chat-message.test.tsx` stays green (no regression; props are optional).
- [ ] Priority order asserted: `partRenderers.tool` > `toolRenderers[kind]` > `ToolCallPart` fallback.

#### DoD
- [ ] `pnpm exec tsc --noEmit` exits 0.
- [ ] `pnpm exec biome check src/components/composites/chat-message/ src/components/composites/agent-tool-renderer/` reports no errors.

## Phase 4 — Integration Validation

### T4.1 — Barrel + subpath export + changelog + changeset

#### Why this step

**Action:** create `agent-tool-renderer/index.ts`; re-export the public symbols (`AgentToolRenderer`, `defaultToolRegistry`, `defaultClassifyTool`, `resolveToolRenderer`, types `ToolRendererKind`/`AgentToolRenderer`/`ToolRendererRegistry`/`ClassifyTool`) from `src/index.ts`; add `./agent-tool-renderer` to `package.json` `exports`; add CHANGELOG `[Unreleased] § Added` + `.changeset/m5-agent-tool-renderer.md` (`@theokit/ui` minor).

**Reasoning:** G7 — every public export needs a consumer/test; the barrel + ChatMessage wiring + tests satisfy it. Subpath export follows the repo's per-component convention (`package.json` `./diff-viewer` shape). Unbreakable Rule 6 — CHANGELOG is the contract.

#### Files to edit
- `src/components/composites/agent-tool-renderer/index.ts` (NEW)
- `src/index.ts`
- `package.json`
- `CHANGELOG.md`
- `.changeset/m5-agent-tool-renderer.md` (NEW)

#### Deep file dependency analysis
- Adding a subpath to `exports` is additive; tsup builds the new entry. The barrel wiring test (below) confirms the public path resolves.

#### TDD
RED — barrel wiring test (in the same test file):
```tsx
const mod = await import("../../../index.js")
expect(typeof mod.AgentToolRenderer).toBe("function")
expect(typeof mod.defaultClassifyTool).toBe("function")
expect(typeof mod.resolveToolRenderer).toBe("function")
expect(mod.defaultToolRegistry).toBeTypeOf("object")
```
GREEN — add the re-exports + the export map entry.
REFACTOR — none.

#### Acceptance criteria
- [ ] `pnpm exec vitest run src/components/composites/agent-tool-renderer/agent-tool-renderer.test.tsx` exits 0 including the barrel wiring case.
- [ ] `pnpm build` exits 0 (tsup emits the new `dist/.../agent-tool-renderer` entry).
- [ ] `CHANGELOG.md` `[Unreleased] § Added` has an entry and `.changeset/m5-agent-tool-renderer.md` exists.

#### DoD
- [ ] `pnpm exec tsc --noEmit` exits 0.
- [ ] `pnpm exec biome check .` reports no errors on changed files.
- [ ] Full suite: `pnpm exec vitest run` shows no NEW failures vs the pre-change baseline.

## Coverage Matrix

| Requirement (from Goal + roadmap M5-3) | Task(s) |
|---|---|
| Registry type keyed by renderer kind | T1.1 |
| `classifyTool` (default + overridable) | T1.1, T3.1 |
| `resolveToolRenderer` (registry + classify → renderer/undefined) | T1.1 |
| Diff renderer | T2.1 |
| Terminal renderer | T2.1 |
| Code renderer | T2.1 |
| CreatedFiles renderer | T2.1 |
| DataTable renderer | T2.1 |
| Fallback to `ToolCallPart` for unmapped tools | T1.1 (undefined signal), T2.1 (defensive), T3.1 (wiring) |
| Overridable registry (consumer merge) | T1.1, T3.1 |
| Wired into the chat surface (`ChatMessage`) | T3.1 |
| Public export + subpath + changelog | T4.1 |

## Global DoD

- [ ] All four phases' acceptance criteria met.
- [ ] `pnpm exec tsc --noEmit` exits 0 (no `any`, explicit return types on public API).
- [ ] `pnpm exec biome check .` clean on changed files (code-quality gate).
- [ ] `pnpm exec vitest run` shows no NEW failures vs baseline.
- [ ] File-size budget respected (each new file ≤ ~300 LoC; `architecture.md`).
- [ ] CHANGELOG `[Unreleased]` updated + changeset present (Unbreakable Rule 6).
- [ ] Architecture: `AgentToolRenderer` is a composite importing primitives/composites only — no primitive imports a composite (`architecture.md` primitive/composite split).

## Drawbacks & Risks

| Risk | Severity | Mitigation | Owner |
|---|---|---|---|
| The defensive default renderers for `diff`/`created-files`/`data-table` render the fallback for real sdk-tool outputs until M5-4's adapters land, so the "rich" surfaces look generic in the interim. | Medium | Documented as the explicit M5-3/M5-4 split (ADR D3); `code`+`terminal` are rich immediately; M5-4 is the very next slice. | plan owner |
| `defaultClassifyTool` name-substring heuristic could mis-classify a consumer's oddly-named tool (e.g. a `diff_report` analytics tool → `diff`). | Low | `classifyTool` is fully overridable per-call (ADR D1/D2); the heuristic only affects the default and degrades to a defensive fallback, never throws. | plan owner |
| Adding two optional props to the widely-consumed `ChatMessage` risks accidental behavior change. | Medium | Props are optional; with none passed, mapped tools now render rich surfaces (intended) and unmapped tools are byte-identical to today (fallback). Existing `chat-message.test.tsx` must stay green (T3.1 AC). | plan owner |

## Unresolved Questions

- Whether to later promote the registry to a `TheoUIProvider` context for app-wide defaults — deferred (ADR D2) until a concrete multi-level override need exists; not in this slice.
- Exact faithful `ToolUIPart`→props mapping for each sdk-tool — **out of scope**, owned by M5-4 (`@theokit/ui/sdk-tools-adapters`).
