# Recipe — Agent chat surface

A worked example of the default verb building a P4 ChatSurface. Skim before tackling your first agent-chat build.

---

## Brief

> "Build a Claude-style chat interface for our coding assistant. It needs to support streaming responses, tool calls with collapsible details, code blocks with copy, and a composer at the bottom. Users should see a cost footer showing tokens + duration."

---

## Step 0 — Pre-flight scan

```
Pre-flight findings:
- @usetheo/ui: 0.11.0-next.0
- Tailwind preset: loaded
- ThemeProvider: violet-forge, density=comfortable
- React: 19
- Existing chat code: src/components/Message.tsx (hand-rolled bubble — will be deprecated by this build)
```

---

## Step 1 — Design-context gate

User says: *"surface=agent-chat, use=interactive code assistant chat, density=comfortable"*

---

## Step 2 — Archetype

> *"Surface: agent-chat. Archetype: P4 ChatSurface. Anchor composite: ChatThread + ChatComposer + AgentTimeline (not used in this build)."*

---

## Step 5 — Preview

```markdown
**theo-ui · v1.0.0**

- **Surface** · agent-chat
- **Archetype** · P4 ChatSurface
- **Anchor composite** · ChatThread + ChatComposer
- **Components used** · ChatThread · ChatMessage · ChatComposer · AgentStreaming · ToolCall · ToolResult · CodeBlock · RunStats · EmptyState
- **Theme** · violet-forge (project default)
- **Density** · comfortable
- **Imports** · subpath
- **Slop test** · 32 / 32 + AC-01/02/03 ✓
```

---

## Step 6 — Build

```tsx
{/* theo-ui · archetype: P4 ChatSurface · surface: agent-chat · density: comfortable
 *  composites: ChatThread · ChatComposer
 *  primitives: ChatMessage · AgentStreaming · ToolCall · ToolResult · CodeBlock · RunStats · EmptyState
 *  theme: violet-forge  ·  a11y: WCAG 2.5.8 AA pass + aria-live log
 *  pre-emit critique: L5 T5 C5 A5 R5 V5
 */}
"use client";

import { useState, useEffect, useRef } from "react";
import { MessageSquare } from "lucide-react";

import { ChatThread } from "@usetheo/ui/chat-thread";
import { ChatMessage } from "@usetheo/ui/chat-message";
import { ChatComposer } from "@usetheo/ui/chat-composer";
import { AgentStreaming } from "@usetheo/ui/agent-streaming";
import { RunStats } from "@usetheo/ui/run-stats";
import { EmptyState } from "@usetheo/ui/empty-state";

import { useChat } from "@/hooks/useChat";

export default function ChatPage() {
  const {
    messages,
    send,
    isStreaming,
    inputTokens,
    outputTokens,
    cost,
    durationMs,
  } = useChat();
  const threadRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (threadRef.current) {
      threadRef.current.scrollTop = threadRef.current.scrollHeight;
    }
  }, [messages, isStreaming]);

  return (
    <div className="flex flex-col h-screen bg-background">
      <ChatThread ref={threadRef} className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          <EmptyState
            icon={MessageSquare}
            title="Start a conversation"
            description="Ask anything about your code. I can read files, run tests, and propose edits."
          />
        ) : (
          messages.map((m) => (
            <ChatMessage
              key={m.id}
              role={m.role}
              parts={m.parts}
            />
          ))
        )}
        {isStreaming && (
          <ChatMessage role="assistant" streaming>
            <AgentStreaming />
          </ChatMessage>
        )}
      </ChatThread>

      {(inputTokens > 0 || cost > 0) && (
        <RunStats
          inputTokens={inputTokens}
          outputTokens={outputTokens}
          cost={cost}
          durationMs={durationMs}
          className="border-t border-border px-4 py-2"
        />
      )}

      <ChatComposer
        onSend={send}
        disabled={isStreaming}
        placeholder="Ask anything about your code…"
      />
    </div>
  );
}
```

The `<ChatMessage parts>` API takes care of rendering tool calls and code blocks. Example parts shape:

```ts
const parts = [
  { type: "text", text: "Let me check the file." },
  { type: "tool-call", id: "tc-1", name: "readFile", args: { path: "src/index.ts" } },
  { type: "tool-result", forCallId: "tc-1", status: "ok", output: "/* file content */" },
  { type: "text", text: "Found the issue. Here's the fix:" },
  { type: "code", language: "typescript", code: "const fixed = ..." },
];
```

`<ChatMessage>` internally:

- Renders `text` parts via the bundled markdown engine.
- Wraps `tool-call` parts in `<ToolCall>` (collapsible, mono args).
- Wraps `tool-result` parts in `<ToolResult>` (linked to their `forCallId`).
- Wraps `code` parts in `<CodeBlock>` (syntax highlight + copy button).

---

## Step 7 — Slop test

| Gate | Result |
|---|---|
| L-01–L-06 | PASS |
| T-01–T-08 | PASS |
| C-01–C-05 | PASS — composites used throughout |
| A-01–A-06 | PASS — ChatThread is `aria-live="polite"`, composer textarea has aria-label |
| R-01–R-04 | PASS — ChatThread internal max-w-3xl, composer is sticky bottom |
| V-01 | PASS — RunStats values wired to real props |
| V-02 | PASS — composer button is "Send" (verb) |
| V-03 | PASS |
| **AC-01** Streaming uses AgentStreaming | PASS |
| **AC-02** Role-based alignment | PASS — ChatMessage handles |
| **AC-03** Tool-call collapsibles via primitive | PASS — parts API |

**32 / 32 + 3 = 35 / 35 ✓**

---

## Handoff

```
Build complete: src/app/chat/page.tsx (62 lines, replaces 184-line hand-rolled version).

Next steps:
- Deprecate src/components/Message.tsx (old bubble component) — replaced by <ChatMessage>.
- Wire the parts array shape from your existing backend to match the @usetheo/ui spec.
- If you need an agent-history sidebar, add <CommandPalette> as a left rail.
- For the agent editor surface, see P5 AgentEditor archetype.
```
