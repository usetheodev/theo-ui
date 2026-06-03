# Surface — agent-chat

Conversational AI surfaces: chat threads, tool calls, streaming responses, agent timelines. The surface vocabulary is **dense, monospace-aware, role-coded** — the user needs to scan a long stream and pick out tool calls, errors, and message boundaries quickly.

---

## When this surface applies

The brief mentions any of:

- chat thread / conversation / message history
- tool call / function call / tool result / tool execution
- streaming response / typewriter effect / token-by-token
- agent / assistant / AI / LLM
- code execution / sandbox output / repl

If the brief is *"build a Claude-style chat UI"* / *"build a copilot interface"* / *"build an agent dashboard"* — this surface.

---

## Anchor composites

| Composite | When to use |
|---|---|
| `<ChatThread>` | The scrolling thread of messages. Anchors every chat surface. |
| `<ChatMessage>` | Individual message bubble with `parts[]` API (text / tool-call / tool-result / file / image). |
| `<ChatComposer>` | Bottom composer: textarea + attach + send. |
| `<AgentTimeline>` | Stepped event log (agent run history). |
| `<AgentStream>` | Live streaming event surface. |
| `<AgentComposer>` | Composer for agent runs (different from chat composer — pre-flight options + system prompt). |
| `<PreviewPanel>` | Side-panel preview of generated content (a sibling of the chat). |
| `<AgentEditor>` | Editor for the agent's instructions, behaviour. |

---

## Primitives commonly used

| Primitive | Role |
|---|---|
| `<AgentEvent>` | Compact event row inside a stream (status change, tool call summary). |
| `<ToolCall>` | Collapsible tool invocation block. Title + mono args. |
| `<ToolResult>` | Collapsible tool result block. Status + mono output. |
| `<ToolUseSummary>` | Compact one-line summary of a tool call (used inside `<ChatMessage parts>`). |
| `<CodeBlock>` | Syntax-highlighted code with copy button. |
| `<AgentStreaming>` | Cursor / dot indicator while the assistant is generating. |
| `<AgentStartingState>` | Pre-run placeholder while the agent boots. |
| `<AgentErrorCard>` | Error display for failed agent runs. |
| `<AgentHandoff>` | Inline notice when a conversation transfers (model swap, agent swap). |
| `<AgentProfile>` | Agent identity card (avatar + name + model badge). |
| `<RunStats>` | Cost / tokens / duration footer for an agent run. |
| `<CostMeter>` | Inline cost display. |
| `<ContextWindowBar>` | Visual indicator of context window usage. |
| `<AutoCompactNotice>` | "Conversation was compacted" banner. |
| `<CapabilityIndicator>` | Badge showing the agent's permissions / tools. |
| `<ApprovalCard>` | Approval gate for sensitive tool calls. |
| `<PermissionModal>` | Permission request dialog. |
| `<AttachmentChip>` | Inline file/image attachment. |
| `<ArtifactPreview>` | Inline preview of generated artifacts (code, doc, image). |
| `<CreatedFilesCard>` | Card listing files created during a session. |
| `<DiffViewer>` | Inline diff for code changes. |
| `<AuditLogEntry>` | Compact audit row. |
| `<ContextCard>` | Card showing context attached to a turn (files, URLs). |
| `<Skeleton>` | Loading placeholder for incoming messages. |

---

## Layout

The canonical agent-chat layout is **scrolling thread + sticky composer at the bottom**:

```tsx
<div className="flex flex-col h-screen">
  <ChatThread className="flex-1 overflow-y-auto" /* internal max-width ~768 px */ >
    {messages.map((m) => (
      <ChatMessage key={m.id} role={m.role} parts={m.parts} />
    ))}
    {isStreaming && <AgentStreaming />}
  </ChatThread>

  <ChatComposer
    onSend={handleSend}
    onAttach={handleAttach}
    placeholder="Send a message..."
  />
</div>
```

The thread is single-column with internal `max-w-3xl` (~768 px) for readability. The composer pins to the bottom and grows as content overflows.

### Optional sidebar layout

For dense agent surfaces (Claude.ai-style with history sidebar):

```tsx
<div className="flex h-screen">
  <aside className="w-64 border-r border-border bg-card">
    <CommandPalette ... />  {/* "New chat" + recent history */}
  </aside>
  <main className="flex-1 flex flex-col">
    <ChatThread .../>
    <ChatComposer .../>
  </main>
</div>
```

Below `md` (< 768 px), the sidebar becomes a drawer triggered by a menu button in the composer.

---

## Density

`agent-chat` defaults to `comfortable`. Reasons:

- Mono content (tool calls, code blocks) reads better with the 14 px / 1.43 line-height of `text-body-md`.
- Long sessions benefit from generous tap targets — the user clicks copy buttons, expand chevrons, retry buttons constantly.

Switch to `compact` only when the user has explicitly asked for a denser surface (debugging interfaces, audit-log views). Spacious is rarely right for chat.

---

## Typography

- Message body — `text-body-md` (14 px, 1.43, weight 400). Set on `<ChatMessage>` automatically.
- Code / mono / tool call args — `text-code-md` or `text-code-sm`. Set on `<CodeBlock>` and `<ToolCall>` automatically.
- Agent name / role label — `text-label` (14 px, weight 500).
- Timestamps — `text-body-sm font-mono text-muted-foreground`.
- Run cost footer — `text-body-sm font-mono` (`<RunStats>` applies this).

---

## Message rendering — the `parts[]` API

`<ChatMessage>` renders an array of `parts`. Each part has a `type` discriminator:

```tsx
<ChatMessage
  role="assistant"
  parts={[
    { type: "text", text: "I'll check the deployment status." },
    { type: "tool-call", id: "tc-1", name: "checkDeployment", args: { id: "dep_abc" } },
    { type: "tool-result", forCallId: "tc-1", status: "ok", output: "Status: building" },
    { type: "text", text: "The deployment is still building. I'll wait." },
    { type: "code", language: "typescript", code: "const x = 1;" },
    { type: "file", name: "report.pdf", url: "..." },
    { type: "image", url: "...", alt: "screenshot" },
  ]}
/>
```

The renderer maps:

- `text` → markdown via the bundled engine
- `tool-call` → `<ToolCall>` (collapsible)
- `tool-result` → `<ToolResult>` (collapsible, linked to its `forCallId`)
- `code` → `<CodeBlock>` with syntax highlight + copy button
- `file` → `<AttachmentChip>` (downloadable)
- `image` → `<img>` with theme-aware border

**Always use parts** instead of hand-rendering markdown inside `<ChatMessage>`. The parts API is what makes tool calls collapsible and copy-able.

---

## State coverage

### Streaming

```tsx
<ChatThread>
  {messages.map((m) => <ChatMessage key={m.id} {...m} />)}
  {isStreaming && (
    <ChatMessage role="assistant" streaming>
      <AgentStreaming />
    </ChatMessage>
  )}
</ChatThread>
```

`<AgentStreaming>` shows a typewriter cursor / pulsing dot. The active message bubble can also pass `streaming` to apply the streaming visual cue (slight halo on the bubble).

### Error

```tsx
<ChatThread>
  {messages.map((m) => <ChatMessage key={m.id} {...m} />)}
  {error && (
    <AgentErrorCard
      error={error}
      onRetry={handleRetry}
    />
  )}
</ChatThread>
```

### Empty

```tsx
<ChatThread>
  {messages.length === 0 ? (
    <EmptyState
      icon={MessageSquare}
      title="Start a conversation"
      description="Ask anything. I'll help with deployments, env vars, and more."
    />
  ) : (
    messages.map((m) => <ChatMessage key={m.id} {...m} />)
  )}
</ChatThread>
```

### Composer states

`<ChatComposer>` handles: idle, focused, typing, sending (loading state on send button), error (composer disabled + inline alert), success (composer clears on successful send).

---

## A11y essentials

- `<ChatThread>` is `role="log"` `aria-live="polite"` so screen readers announce new messages.
- Streaming bubbles set `aria-busy="true"` until complete.
- Tool calls inside messages have `aria-expanded` toggled by the chevron.
- Composer textarea has implicit label via `placeholder` and an `aria-label="Message composer"`.
- Send button has `aria-label="Send message"` (icon-only).

---

## Composition examples

### Minimal chat surface

```tsx
import { ChatThread } from "@theokit/ui/chat-thread";
import { ChatMessage } from "@theokit/ui/chat-message";
import { ChatComposer } from "@theokit/ui/chat-composer";
import { AgentStreaming } from "@theokit/ui/agent-streaming";

export function Chat() {
  const { messages, send, isStreaming } = useChat();

  return (
    <div className="flex flex-col h-screen">
      <ChatThread className="flex-1">
        {messages.map((m) => (
          <ChatMessage key={m.id} role={m.role} parts={m.parts} />
        ))}
        {isStreaming && <AgentStreaming />}
      </ChatThread>
      <ChatComposer onSend={send} disabled={isStreaming} />
    </div>
  );
}
```

### Chat with tool-call collapsibles

The `<ToolCall>` / `<ToolResult>` primitives are wired automatically by `<ChatMessage parts>`. No extra code needed — pass the parts.

### Chat with cost footer

```tsx
<ChatThread>
  {messages.map((m) => (
    <ChatMessage key={m.id} {...m} />
  ))}
</ChatThread>
<RunStats
  inputTokens={1240}
  outputTokens={580}
  cost={0.012}
  duration={3400}
  className="border-t border-border px-4 py-2"
/>
<ChatComposer .../>
```

---

## Anti-patterns specific to agent-chat

- **Hand-rolling tool-call collapsibles** → use `<ToolCall>` + `<ToolResult>`. The parts API gives you the collapse / copy / expand for free.
- **Hardcoded role colors** — don't paint the user bubble `bg-blue-100` and the assistant `bg-purple-100`. `<ChatMessage role>` applies the right theme-aware tokens.
- **Streaming via custom `<div>` with `dangerouslySetInnerHTML`** — use `<AgentStreaming>` and let `<ChatMessage streaming>` handle the rendering. The bundled markdown engine supports streaming.
- **Stretching the thread to full viewport width** — internal `max-w-3xl` exists for readability. Wide threads on 1920px displays are unreadable. The composite handles this; don't override it.
- **Marketing voice in error messages** — `<AgentErrorCard>` should say what failed and how to retry. Not "Oops! Something went wrong on our end!"
