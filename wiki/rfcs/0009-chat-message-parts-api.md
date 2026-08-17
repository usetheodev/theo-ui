---
type: RFC
title: "RFC 0009 — ChatMessage parts API + owned markdown engine"
description: Rewriting ChatMessage as a Vercel AI SDK UIMessage consumer forked from ai-elements, with a streaming-safe markdown engine owned in-tree rather than taken as a competitor's dependency.
tags: [rfc, chat, markdown, streaming, fork, breaking-change, apache-2.0]
sources:
  - id: rfc
    resource: "archive:94d9b11:docs/rfcs/0009-chat-message-parts-api.md"
    author: "human:paulohenriquevn"
    last_modified: "2026-05-23"
  - id: upstream-elements
    resource: "https://github.com/vercel/ai-elements"
  - id: upstream-types
    resource: "https://github.com/vercel/ai"
generated:
  by: "claude-code/opus-5"
  at: "2026-08-11"
status: stable
---

| Field | Value |
| --- | --- |
| Author | paulohenriquevn |
| Date | 2026-05-23 |
| Status | **Implemented** (2026-05-23) |
| Upstream lineage | `vercel/ai-elements` `packages/elements/src/message.tsx` (Apache-2.0) |
| Type lineage | `vercel/ai` `packages/ai/src/ui/ui-messages.ts` (Apache-2.0) |

# Motivation

A chat-message component that cannot render markdown is not usable for an AI agent
surface. ChatGPT, Claude, Cursor — every modern AI chat ships rich rendering by default:
tables, fenced code with highlighting and copy, math, mermaid, tool-call cards, reasoning
panels, source citations.

The prior `<ChatMessage>` was a 110-LOC bubble taking `content: string | ReactNode` and
dumping it. Consumers building on top had to reinvent the agent rendering surface per
project.

Two constraints came from the same direction: markdown is **mandatory** for a usable agent
UX, and the code should be **forked rather than depended upon**, because Theo competes for
the same market as the upstream vendor.

# Decision — seven ADRs

| ID | Decision | Why |
| --- | --- | --- |
| D1 | Fork the structural code from `vercel/ai-elements` | Battle-tested shape (Message / Content / Actions / Branch / Toolbar / Response). Apache-2.0 → Apache-2.0 is a clean fork; `NOTICE` preserves attribution. |
| D2 | Use the Vercel `UIMessage` / `UIMessagePart` types **verbatim** | A consumer using `useChat()` from `@ai-sdk/react` flows messages 1:1 with zero adapter. Diverging means every consumer writes a mapper. |
| D3 | Roll our own markdown engine — **not** `streamdown` | Vercel controls `streamdown`. Depending on it cedes the markdown surface to a direct competitor. The peer-dep stack from the Slide engine already covers ~90%; only streaming preprocess is new. |
| D4 | Promote `ChatMessage` primitive → composite | The new surface depends on `<Button>`, card-shaped surfaces, and native `<details>`. Internal deps are a composite trait. |
| D5 | **Hard** breaking change to the `Message` type | Soft migration keeps two code paths forever. Pre-1.0 with two internal callsites and zero external consumers per `npm view`. |
| D6 | Math and Mermaid via lazy dynamic peer-import | KaTeX ~50 KB, Mermaid ~200 KB stay out of the barrel |
| D7 | Minor bump with a BREAKING flag | Pre-1.0 semver allows it; consistent with RFCs 0005–0007 |

D2 and D3 together are the interesting position: **adopt the competitor's type contract,
refuse the competitor's runtime dependency.** Interop is a consumer benefit; a runtime
dependency on a competitor's package is a strategic liability. They are separable, and this
RFC separates them.

# The markdown engine

```ts
// pipeline: preprocess → mdast → hast → sanitize → React
export async function parseMarkdownToReact(md, opts) {
  const preprocessed = preprocessStreaming(md, opts.isStreaming);
  const mdast = await parseBody(preprocessed);
  const hast  = await mdastToHast(mdast);
  const safe  = await sanitizeHast(hast);
  return hastToReact(safe, opts.components);
}
```

The streaming preprocessor auto-closes incomplete tokens, in priority order:

1. **Fences** — highest priority, because an unclosed fence swallows everything after it.
2. Block math `$$ … $$`
3. Inline code
4. Inline math `$ … $`
5. Emphasis (`**`, `__`, `*`, `_`)
6. Links `[text](url`

Without this, token-by-token streaming flashes raw `**` and backticks at the user on every
frame until the model happens to close the syntax.

# The parts API

```tsx
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

Eleven part renderers: `TextPart` (markdown + memo), `ReasoningPart` (native `<details>`),
`ToolCallPart` (card with state badge plus input/output), `FilePart` (image preview or
chip, URL sanitized via `safeHref`), `SourceUrlPart` / `SourceDocumentPart` (citation
chip), `DataPart` (consumer renderer per `data-${name}`, JSON fallback), `StepStartUIPart`
(`<hr>`), and two render-nothing parts overridable via `partRenderers`.

```ts
export type UIMessagePart =
  | TextUIPart | ReasoningUIPart | FileUIPart | ReasoningFileUIPart
  | SourceUrlUIPart | SourceDocumentUIPart | StepStartUIPart
  | CustomContentUIPart | ToolUIPart | DataUIPart;
```

Ten type guards are exported (`isTextUIPart`, `isReasoningUIPart`, …).

# The breaking change

`Message` is gone. `content: string | ReactNode` is removed; `parts: UIMessagePart[]` is
required.

The break is defensible because it fails **loudly at compile time** — TypeScript emits
`Did you mean 'UIMessage'?` — and the migration is mechanical:
`content: "X"` → `parts: [{ type: "text", text: "X" }]`. Both internal callsites and every
Ladle story migrated in the same commit. See
[`/architecture/component-lifecycle.md`](/architecture/component-lifecycle.md) for the
general rule this instantiates.

# Consequences

- **Consumer DX:** `useChat()` from `@ai-sdk/react` is the canonical React agent runtime;
  this shape interops with zero friction.
- **Bundle:** the barrel grows ~12 KB. The markdown stack stays external as optional
  peer-deps.
- **Security:** `hast-util-sanitize` keeps rendering safe even on hostile model output.
  Mermaid renders under `securityLevel: "strict"`. File and source URLs pass through
  `safeHref`.
