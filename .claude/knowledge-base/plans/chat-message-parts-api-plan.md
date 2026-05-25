# Plan: ChatMessage parts API + markdown engine (fork of vercel/ai-elements)

> **Version 1.0** — Rewrite `<ChatMessage>` from a single-string-content primitive into a full Vercel AI SDK `UIMessage` consumer with `parts: UIMessagePart[]` (11 discriminated part types). Forks the structural shell from `vercel/ai-elements` (Apache-2.0, attribution preserved). Replaces Vercel's `streamdown` markdown engine with our own, reusing the mdast/hast/shiki/katex/mermaid stack already shipped via the Slide engine. Adds streaming-safe markdown preprocessing, Shiki code highlighting with copy button, KaTeX math, Mermaid diagrams, reasoning panel, tool-call card, file/source/data parts, branching navigation, and copy/regenerate actions. Ships as **0.6.0-next.0** with BREAKING change to the `Message` type (`content: string | ReactNode` → `parts: UIMessagePart[]`).

## Context

**Current state** (`src/components/primitives/chat-message/chat-message.tsx`, 110 LOC):

- Renders `Message.content: string | ReactNode` as raw text/element.
- 3 role variants (user/assistant/system) with visual styling only.
- Avatar + actions slots.
- **No** markdown, **no** code highlight, **no** streaming, **no** tool-call display, **no** reasoning, **no** branching.

**Demand evidence** (user, 2026-05-23):
> "Precisamos melhorar o nosso componente ChatMessage. Ele deve ser capaz de renderizar arquivos markdowns, code style entre outros."
> "Pense bem para um IA Agente é obrigatório ter o markdown sem ele não temos uma experiência UX boa"
> "Faça um clone no repo Vercel AI SDK e copie o componente para nosso sistema, não podemos usar a Vercel SDK pois o Theo compete pelo mesmo marketshare"

**External reference** (cloned to `referencia/ai-elements`, Apache-2.0):
- `packages/elements/src/message.tsx` — 360 LOC, 9 structural sub-components
- `packages/ai/src/ui/ui-messages.ts` — `UIMessage` + 11 part types (canonical shape used by `useChat()`)
- Heavy lifting in `streamdown` package (Vercel-controlled — NOT taking as dep)

**Our existing reusable stack** (already peer-dep'd via Slide engine):
- `mdast-util-from-markdown` + `mdast-util-gfm` + `mdast-util-to-hast` + `hast-util-sanitize` + `hast-util-to-jsx-runtime` — markdown → React pipeline
- `shiki` — syntax highlighting (used by `slide/plugins/shiki`)
- `katex` + `mdast-util-math` + `micromark-extension-math` — math
- `mermaid` — diagrams

## Objective

**Done** = `<ChatMessage message={UIMessage} />` renders all 11 part types correctly. Consumer using `useChat()` from `@ai-sdk/react` can map messages 1:1 with zero adapter. Code blocks ship Shiki SSR highlight + copy button. Markdown is streaming-safe (no broken syntax during token-by-token arrival). Math/Mermaid render when peer-deps present. Existing `agent-stream` + `chat-thread.stories` callsites migrated to `parts`. Quality gates green. Published as `@usetheo/ui@0.6.0-next.0`.

## ADRs

### D1 — Fork structural code from `vercel/ai-elements` (Apache-2.0)
- **Decision**: Copy `<Message>`, `<MessageContent>`, `<MessageActions>`, `<MessageAction>`, `<MessageBranch*>`, `<MessageToolbar>` source from `referencia/ai-elements/packages/elements/src/message.tsx`. Adapt: replace shadcn `Button`/`Tooltip` with TheoUI primitives, replace Vercel tokens with Violet Forge (`hsl(var(--*))`), update class names to use our `size`/`density` props. Add NOTICE file with Apache-2.0 attribution.
- **Rationale**: Code is well-tested, accessibility-correct, and matches the canonical Vercel UIMessage shape. Re-implementing from scratch = days of work + risk of divergence. Apache-2.0 + Apache-2.0 = clean fork.
- **Consequences**: New NOTICE file ships with package. RFC 0009 documents the lineage. Future Vercel changes don't auto-propagate; we maintain our own.

### D2 — Verbatim Vercel `UIMessage` + `UIMessagePart` types
- **Decision**: `src/types/chat.ts` exports `UIMessage`, `UIMessagePart`, and 11 part-type sub-types (`TextUIPart`, `ReasoningUIPart`, `ToolUIPart`, `FileUIPart`, `SourceUrlUIPart`, `SourceDocumentUIPart`, `DynamicToolUIPart`, `StepStartUIPart`, `ReasoningFileUIPart`, `DataUIPart`, `CustomContentUIPart`) with field-for-field parity to `vercel/ai`'s `packages/ai/src/ui/ui-messages.ts`.
- **Rationale**: Consumer with `useChat()` does `messages.map(m => <ChatMessage message={m} />)` — zero adapter. Diverging means every consumer writes a mapper. Pointless friction.
- **Consequences**: Locked to Vercel's shape evolution. If they break their type in v7, we ship a migration. Acceptable cost.

### D3 — Roll our own streaming markdown engine (NOT `streamdown`)
- **Decision**: Implement `src/lib/markdown/` with mdast → hast → React pipeline reusing the Slide engine's peer-deps. Add a streaming-safe preprocessor that auto-closes incomplete `**bold`, ` ``code ``, `[link]`, `$math$`, and unclosed code fences before parsing.
- **Rationale**: `streamdown` is Vercel-controlled; depending on it = ceding the markdown surface to a competitor in a domain we want to own. We already pay the peer-dep cost via Slide.
- **Consequences**: ~600 LOC of markdown engine code we maintain. Recursive: future markdown features (footnotes, definition lists) we implement ourselves. KISS guards apply — match Slide's existing surface, no over-engineering.

### D4 — Promote `ChatMessage` from primitive to composite
- **Decision**: Move `src/components/primitives/chat-message/` → `src/components/composites/chat-message/`. Internal deps allowed: `Card` (tool-call card), `Button` (actions), `Tooltip` (action labels), `<details>` (reasoning — native HTML, zero JS).
- **Rationale**: ChatMessage now renders 11 part types, each with rich UI. Forcing zero internal deps requires render-props at every level — bad DX. Composite is the right layer.
- **Consequences**: `agent-stream.tsx` import path changes (`primitives/chat-message` → `composites/chat-message`). `chat-thread.stories.tsx` import path changes. Registry descriptor moves.

### D5 — HARD BREAKING change to `Message` type
- **Decision**: Remove `Message.content` entirely. Consumers MUST pass `parts: UIMessagePart[]`. Update `agent-stream.tsx` + `chat-thread.stories.tsx` in the same commit.
- **Rationale**: Soft-migration keeps two code paths forever. Hard break in 0.6.0-next.0 is honest — we're in pre-1.0, and the surface area touched is small (2 internal callsites + zero external consumers per `npm view`).
- **Consequences**: CHANGELOG entry under `### Breaking changes` with migration recipe. `Message` type rename hint in TypeScript errors.

### D6 — Math + Mermaid via lazy dynamic peer-import (same pattern as `vite-plugin.ts`)
- **Decision**: `<MathPart>` and `<MermaidPart>` dynamic-import `katex` / `mermaid` at render time. If peer-dep missing, render plain text fallback with `console.warn` once.
- **Rationale**: Heavy engines (KaTeX ~50 KB, Mermaid ~200 KB) shouldn't inflate the barrel. Consumer opts in by installing the peer-dep. Matches Slide engine's bundle isolation.
- **Consequences**: Barrel stays lean. First math/mermaid render has ~50ms async cost. Acceptable.

### D7 — Bump 0.5.1-next.0 → 0.6.0-next.0 (minor, BREAKING flag)
- **Decision**: Minor bump. CHANGELOG marks as BREAKING.
- **Rationale**: Pre-1.0 — semver allows breaking in minor. Convention of the project: minor for features, even when breaking (refer to 0.5.0 ↔ 0.5.1 follow-up for established cadence).
- **Consequences**: Consumers on 0.5.x see migration prompt in CHANGELOG.

## Dependency Graph

```
Phase 0 (clone + understand) ──▶ DONE
       │
       ▼
Phase 1 (types/chat.ts UIMessage)
       │
       ▼
Phase 2 (lib/markdown — engine + parser + streaming preprocess)
       │
       ├──▶ Phase 3 (code-block + copy button)
       ├──▶ Phase 4 (math + mermaid lazy)
       │
       ▼
Phase 5 (composites/chat-message/ shell + 9 structural sub-components)
       │
       ▼
Phase 6 (parts/ renderers — 11 part types)
       │
       ▼
Phase 7 (migration: agent-stream, chat-thread.stories, registry, barrel)
       │
       ▼
Phase 8 (RFC 0009 + CHANGELOG + NOTICE + bump)
       │
       ▼
Phase 9 (quality:gates + publish 0.6.0-next.0)
```

## Phase tasks (abbreviated — full TDD per file during implementation)

### Phase 1 — Types
- `src/types/chat.ts`: replace `Message` interface with `UIMessage` + 11 part types verbatim from Vercel. Soft re-export of `Message = UIMessage` alias for transitional reading.

### Phase 2 — `src/lib/markdown/`
- `parser.ts`: `parseMarkdownToReact(md, opts)` → mdast → hast → React. Sanitize via `hast-util-sanitize`. Components map: `code` → `<CodeBlock>`, `pre` → passthrough, inline `code` → `<InlineCode>`.
- `streaming-preprocess.ts`: `preprocessStreaming(md, isStreaming)` → auto-close trailing `**`, `_`, ` ``code ``, `[link`, `$math`, ` ```fence` so partial tokens render gracefully.
- `parser.test.ts`, `streaming-preprocess.test.ts`

### Phase 3 — Code block + copy
- `code-block.tsx`: Shiki SSR highlight (dynamic import; fallback to plain `<pre>` if shiki missing). Copy button with `Copy` → `Check` 2s. Language label. ARIA.
- `inline-code.tsx`: simple styled span.
- Tests.

### Phase 4 — Math + Mermaid
- `math.tsx`: `<MathInline>` + `<MathBlock>` — dynamic-import katex, render to HTML, fallback plain.
- `mermaid.tsx`: `<MermaidDiagram>` — render button (security: explicit user action), dynamic-import mermaid.

### Phase 5 — ChatMessage shell (port from ai-elements)
- `chat-message.tsx` — root `<Message from={role}>` wrapper. Role-based class.
- `chat-message-content.tsx` — bubble wrapper. Variants: `contained` (default bubble) | `flat` (no bubble).
- `chat-message-response.tsx` — memoized markdown renderer. Wraps `parser.ts`.
- `chat-message-actions.tsx` — toolbar slot.
- `chat-message-action.tsx` — single icon button. Tooltip optional.
- `chat-message-branch.tsx` + 5 sub-components — branching context + nav.
- `chat-message-toolbar.tsx` — outer bottom bar.

### Phase 6 — Part renderers (`parts/`)
- `text-part.tsx` — delegates to `<ChatMessageResponse>`.
- `reasoning-part.tsx` — native `<details>` collapsible.
- `tool-call-part.tsx` — `<Card>` with toolName header + JSON args.
- `file-part.tsx` — image preview / file chip.
- `source-part.tsx` — citation link.
- `data-part.tsx` — custom data renderer (passes data through to consumer-provided renderer).
- `step-start-part.tsx` — separator marker.

### Phase 7 — Migration
- `src/components/composites/chat-message/` — new home.
- Delete `src/components/primitives/chat-message/`.
- Update `src/components/composites/agent-stream/agent-stream.tsx` — `parts` instead of `content`.
- Update `src/components/primitives/chat-thread/chat-thread.stories.tsx` — `parts` shape.
- Update `src/index.ts` barrel — export new sub-components.
- Update `registry/r/chat-message.json` — descriptor moves to composite.
- Update README catalog count (primitives -1, composites +1).

### Phase 8 — Docs + bump
- `docs/rfcs/0009-chat-message-parts-api.md` — Implemented status. ADRs D1-D7.
- `docs/rfcs/README.md` — index entry.
- `CHANGELOG.md` — `[0.6.0-next.0]` with `### Breaking changes` section + migration recipe.
- `NOTICE` — Apache-2.0 attribution to Vercel ai-elements (`vercel/ai-elements`, copyright Vercel Inc., licensed Apache-2.0).
- `package.json` version bump.

### Phase 9 — Validate + publish
- `pnpm quality:gates` exit 0
- npm publish --tag next
- Smoke: `npm install @usetheo/ui@0.6.0-next.0` in a tmp dir, import `ChatMessage`, render a `parts` array, snapshot the output.

## Global Definition of Done

- [ ] `UIMessage` + 11 part types in `src/types/chat.ts` (Vercel verbatim)
- [ ] Streaming-safe markdown parser
- [ ] Shiki code-block with copy button
- [ ] KaTeX math + Mermaid diagram (lazy, peer-dep optional)
- [ ] 9 structural sub-components forked from ai-elements
- [ ] 7 part-type renderers
- [ ] `agent-stream` + `chat-thread.stories` migrated to `parts`
- [ ] Old `primitives/chat-message/` deleted
- [ ] `pnpm quality:gates` exit 0
- [ ] RFC 0009 status Implemented
- [ ] NOTICE file with Apache-2.0 attribution
- [ ] CHANGELOG `[0.6.0-next.0]` with BREAKING + migration recipe
- [ ] `@usetheo/ui@0.6.0-next.0` published to npm
- [ ] Smoke test against published tarball passes

## Final Phase — Dogfood QA

`pnpm dogfood:v4-zero-config` + `pnpm quality:gates` + manual ChatMessage story render in Ladle showing all 11 part types.
