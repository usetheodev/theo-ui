# RFC 0009 — ChatMessage parts API + markdown engine (fork of vercel/ai-elements)

| Field | Value |
|---|---|
| Author | paulohenriquevn |
| Date | 2026-05-23 |
| Status | **Implemented** (2026-05-23) |
| Plan | `.claude/knowledge-base/plans/chat-message-parts-api-plan.md` |
| Upstream lineage | `vercel/ai-elements` `packages/elements/src/message.tsx` (Apache-2.0) |
| Type lineage | `vercel/ai` `packages/ai/src/ui/ui-messages.ts` (Apache-2.0) |

## 1. Summary

Rewrites `<ChatMessage>` from a single-string content primitive into a full
**Vercel AI SDK `UIMessage`** consumer with `parts: UIMessagePart[]` (11
discriminated part types). Forks the structural shell from
`vercel/ai-elements` (Apache-2.0, attribution preserved in `NOTICE`).
Implements our own markdown engine in `src/lib/markdown/` — reusing the
mdast/hast/shiki/katex/mermaid stack already shipped via the Slide engine,
plus a streaming-safe preprocessor that auto-closes incomplete `**bold`,
fences, inline code, links, and `$math$` — so we never take `streamdown`
(Vercel-controlled) as a runtime dep.

Ships as **0.6.0-next.0** with a **BREAKING** change to the `Message`
type (`content: string | ReactNode` removed; `parts: UIMessagePart[]`
required). `Message` is gone; consumers use `UIMessage`. Both internal
callsites (`agent-stream`, `theo-code-shell.data`) and Ladle stories
migrated in the same commit.

## 2. Motivation

A chat-message component that can't render markdown isn't usable for an
AI agent surface. ChatGPT, Claude, Cursor, and every modern AI chat ship
rich rendering by default — tables, fenced code with syntax highlight +
copy, math, mermaid diagrams, tool-call cards, reasoning panels, source
citations. Our previous `<ChatMessage>` was a 110-LOC bubble that took a
`content: string | ReactNode` and dumped it. Consumers building Theo-Code
or Theo-PaaS dashboards had to reinvent the agent rendering surface per
project.

User direction (chat, 2026-05-23):
> "Pense bem para um IA Agente é obrigatório ter o markdown sem ele não
> temos uma experiência UX boa."
> "Faça um clone no repo Vercel AI SDK e copie o componente para nosso
> sistema, não podemos usar a Vercel SDK pois o Theo compete pelo mesmo
> marketshare."

Therefore: fork the code (Apache-2.0 → Apache-2.0, NOTICE-attributed),
own the surface ourselves.

## 3. Decision

| ID | Decisão | Por quê |
|---|---|---|
| D1 | Fork structural code from `vercel/ai-elements` | Battle-tested shape (Message / Content / Actions / Branch / Toolbar / Response); reimplementing wastes days + risks divergence. Apache-2.0 + Apache-2.0 fork is clean — NOTICE preserves attribution. |
| D2 | Verbatim Vercel `UIMessage` + `UIMessagePart` types | Consumer using `useChat()` from `@ai-sdk/react` flows messages 1:1 into `<ChatMessage>` with zero adapter. Diverging means every consumer writes a mapper. |
| D3 | Roll our own markdown engine (NOT `streamdown`) | Vercel controls `streamdown`; depending on it = ceding the markdown surface to a competitor we want to compete with. Our peer-dep stack via Slide already covers 90% — we just add streaming preprocess on top. |
| D4 | Promote `ChatMessage` from primitive → composite | The new surface depends on `<Button>` (actions), `<Card>`-pattern surfaces (tool-call), native `<details>` (reasoning) — internal `@theokit/ui` deps are a composite-layer trait. Composable form `<ChatMessage.Root>` available for full control. |
| D5 | HARD BREAKING change to `Message` type | Soft-migration keeps two code paths forever. Hard break in 0.6.0-next.0 is honest — we're pre-1.0 and the surface touched is small (2 internal callsites + zero external consumers per `npm view`). |
| D6 | Math + Mermaid via lazy dynamic peer-import | Heavy engines (KaTeX ~50 KB, Mermaid ~200 KB) stay out of the barrel. Consumer opts in by installing the peer-dep. Matches Slide engine's bundle isolation. |
| D7 | Bump 0.5.1-next.0 → 0.6.0-next.0 (minor, BREAKING flag) | Pre-1.0 — semver allows breaking in minor. Convention from RFCs 0005/0006/0007: minor for visible API additions, even when breaking. |

## 4. Implementation

### 4.1 Markdown engine (`src/lib/markdown/`)

```ts
// parser.ts — pipeline: preprocess → mdast → hast → sanitize → React
export async function parseMarkdownToReact(md, opts) {
  const preprocessed = preprocessStreaming(md, opts.isStreaming);
  const mdast = await parseBody(preprocessed);
  const hast = await mdastToHast(mdast);
  const safe = await sanitizeHast(hast);
  return hastToReact(safe, opts.components);
}

// streaming-preprocess.ts — auto-close incomplete tokens
//   - fences (highest priority — they swallow the rest)
//   - block math `$$ … $$`
//   - inline code `` ` … ` ``
//   - inline math `$ … $`
//   - emphasis (`**`, `__`, `*`, `_`)
//   - links `[text](url`

// code-block.tsx — Shiki SSR highlight + Copy → Check 2s
// inline-code.tsx — styled <code>
// math.tsx — KaTeX renderToString (lazy)
// mermaid.tsx — Mermaid.render with securityLevel="strict" (lazy)
```

### 4.2 ChatMessage composite (`src/components/composites/chat-message/`)

```ts
<ChatMessage message={uiMessage} />              // convenience
<ChatMessage.Root from="assistant">              // composable
  <ChatMessage.Content variant="contained">
    <ChatMessageResponse text={text} isStreaming />
  </ChatMessage.Content>
  <ChatMessageToolbar>
    <ChatMessageActions>
      <ChatMessageAction tooltip="Copy"><CopyIcon /></ChatMessageAction>
    </ChatMessageActions>
  </ChatMessageToolbar>
</ChatMessage.Root>
```

11 part renderers (`parts/`):
  - `TextPart` → `<ChatMessageResponse>` (markdown + memo)
  - `ReasoningPart` → native `<details>` collapsible
  - `ToolCallPart` → card with state badge + input/output details
  - `FilePart` → image preview or file chip (URL sanitized via `safeHref`)
  - `SourceUrlPart` / `SourceDocumentPart` → citation chip
  - `DataPart` → consumer-defined renderer per `data-${name}` or JSON
    fallback in `<details>`
  - `StepStartUIPart` → `<hr>` separator
  - `ReasoningFileUIPart`, `CustomContentUIPart` → render-nothing
    (consumer overrides via `partRenderers` prop)

Branch navigation (`<ChatMessageBranch*>`):
  - 6 sub-components forked verbatim from `vercel/ai-elements` (context,
    content, selector, previous, next, page)

### 4.3 Types (`src/types/chat.ts`)

```ts
export interface UIMessage {
  id: string;
  role: "system" | "user" | "assistant";
  parts: UIMessagePart[];
  metadata?: unknown;
}

export type UIMessagePart =
  | TextUIPart           // { type: "text", text, state? }
  | ReasoningUIPart      // { type: "reasoning", text, state? }
  | FileUIPart           // { type: "file", mediaType, url, filename? }
  | ReasoningFileUIPart
  | SourceUrlUIPart
  | SourceDocumentUIPart
  | StepStartUIPart
  | CustomContentUIPart
  | ToolUIPart           // { type: `tool-${name}` | "dynamic-tool", … }
  | DataUIPart;          // { type: `data-${name}`, data }
```

10 type guards exported (`isTextUIPart`, `isReasoningUIPart`, …).

### 4.4 Migration

- `src/components/primitives/chat-message/` — **deleted**.
- `src/components/composites/agent-stream/agent-stream.tsx` —
  `import { ChatMessage } from "../chat-message/index.js"`,
  `message: UIMessage`.
- `src/components/primitives/chat-thread/chat-thread.stories.tsx` —
  rewritten with `parts: [{ type: "text", text }]`.
- `src/screens/theo-code-shell.data.tsx` — `Message[]` → `UIMessage[]`,
  inline `content` → `parts: [{ type: "text", text }]`.
- `src/screens/task-running.stories.tsx`,
  `src/screens/task-starting.stories.tsx`,
  `src/screens/task-completed.stories.tsx` — JSX content uses composable
  `<ChatMessage.Root>` + `<ChatMessage.Content>` form.
- `src/index.ts` — barrel re-exports 32 new symbols (11 components + 10
  type guards + 11 type aliases).

## 5. Consequences

- **Consumer DX**: `useChat()` from `@ai-sdk/react` is the canonical
  agent-runtime in React; our shape interops zero-friction.
- **Bundle**: barrel grows by ~12 KB (composite + parts + markdown
  dispatcher). Markdown stack (mdast/hast/shiki/katex/mermaid) stays
  external as optional peer-deps — no inflation.
- **Breaking**: every prior `Message` import breaks at compile time
  with a clear `Did you mean 'UIMessage'?` from TS. Migration is
  mechanical: `content: "X"` → `parts: [{ type: "text", text: "X" }]`.
- **Streaming UX**: incomplete markdown during token-by-token streaming
  no longer flashes as raw `**` / `` ` `` — preprocessed to render as
  closed syntax until the model actually closes it.
- **Security**: hast-util-sanitize keeps the render safe even on
  hostile model output. SVG (Mermaid) renders under `securityLevel:
  "strict"`. File / source URLs sanitized via `safeHref`.

## 6. References

- Upstream component: `vercel/ai-elements` `packages/elements/src/message.tsx`
- Upstream types: `vercel/ai` `packages/ai/src/ui/ui-messages.ts`
- Local plan: `.claude/knowledge-base/plans/chat-message-parts-api-plan.md`
- Cloned for reference (read-only): `referencia/ai-elements/`,
  `referencia/ai-sdk-core/`
