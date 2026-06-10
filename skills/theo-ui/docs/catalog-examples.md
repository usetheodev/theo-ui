# Catalog examples

Three worked examples of the `theo-ui catalog` verb in action.

---

## Example 1 — "I need a copy button with success state"

User query:

> *theo-ui catalog copy button with success state*

Skill response:

```markdown
## Match: `<CopyButton>` (primitive)

Copy-to-clipboard button with built-in success / error state and timed reset.

```tsx
import { CopyButton } from "@theokit/ui/copy-button";

<CopyButton value="dep_abc123" />
```

**Props:**
- `value` (required) — the string to copy
- `label` — text shown in default state (default: "Copy")
- `successLabel` — text shown after copy (default: "Copied!")
- `errorLabel` — text shown if copy fails (default: "Failed")
- `size` — `sm` / `md` / `lg` / `icon` (default: `sm`)
- `variant` — `primary` / `secondary` / `ghost` (default: `ghost`)
- `onCopy` — callback fired on successful copy

**Behavior:**
- Click → copies `value` via `navigator.clipboard.writeText`
- Switches icon: `<Copy>` → `<Check>`
- Switches label: "Copy" → "Copied!"
- Background pulse to `bg-success/10`
- Auto-resets after 2 seconds
- Falls back to legacy `document.execCommand("copy")` on browsers without Clipboard API

**Related:**
- `<CodeBlock>` — already wraps code with a `<CopyButton>` in the top-right corner. If you're showing code, use CodeBlock directly.
- `<Button asChild>` + manual handler — for fully custom copy UI when CopyButton's props don't fit.

**Docs:** https://docs.usetheo.dev/theoui/primitives/copy-button

---

Catalog query: theo-ui v1.0.0 · search: "copy button with success state" · matched: 1
```

---

## Example 2 — "Find me a component for chat tool calls"

User query:

> *Find me a component for displaying agent tool calls in a chat thread*

Skill response:

```markdown
## Match (compositional): `<ToolCall>` + `<ToolResult>` (primitives)

For displaying LLM tool invocations inside a chat thread. These render as collapsible blocks with mono-formatted arguments and output. Used together — the result references the call by ID.

```tsx
import { ToolCall } from "@theokit/ui/tool-call";
import { ToolResult } from "@theokit/ui/tool-result";

<ToolCall
  id="tc-1"
  name="readFile"
  args={{ path: "src/index.ts" }}
  status="running"
/>
<ToolResult
  forCallId="tc-1"
  status="ok"
  output="/* file contents */"
/>
```

**ToolCall props:**
- `id` (required) — unique identifier
- `name` (required) — tool/function name
- `args` — JSON-serializable arguments object
- `status` — `pending` / `running` / `ok` / `failed`
- `defaultExpanded` — initial collapse state (default: collapsed for `ok`, expanded for `failed` and `running`)

**ToolResult props:**
- `forCallId` (required) — matches the originating ToolCall's `id`
- `status` (required) — `ok` / `failed`
- `output` — string or React node
- `defaultExpanded` — initial collapse state

**Recommended pattern:** use through `<ChatMessage parts>`. The `parts[]` API on ChatMessage handles tool-call/tool-result pairing automatically:

```tsx
<ChatMessage
  role="assistant"
  parts={[
    { type: "text", text: "Let me check the file." },
    { type: "tool-call", id: "tc-1", name: "readFile", args: { path: "src/index.ts" } },
    { type: "tool-result", forCallId: "tc-1", status: "ok", output: "..." },
    { type: "text", text: "Found the issue." },
  ]}
/>
```

The parts API renders ToolCall and ToolResult internally, with linked collapse state and proper a11y. **Prefer this over rendering ToolCall directly** — only use the primitives standalone if you're not inside a chat message.

**Related:**
- `<ToolUseSummary>` — compact one-line summary of a tool call (collapsed by default; click to expand to the full ToolCall view).
- `<AgentEvent>` — sibling primitive for non-tool events in an agent stream (status change, message boundary).
- `<CodeBlock>` — for rendering code OUTPUT inside the ToolResult's `output` prop.

**Docs:**
- https://docs.usetheo.dev/theoui/primitives/tool-call
- https://docs.usetheo.dev/theoui/primitives/tool-result

---

Catalog query: theo-ui v1.0.0 · search: "chat tool calls" · matched: 3 (ToolCall + ToolResult + ToolUseSummary)
```

---

## Example 3 — "Does theo-ui have a kanban board?"

User query:

> *Does theo-ui have a kanban board?*

Skill response:

```markdown
## No match

`@theokit/ui` doesn't ship a kanban-board component. The closest building blocks would be:

- `<Card>` — for each kanban tile.
- `<Badge>` — for status / priority labels on tiles.
- `<DropdownMenu>` — for per-tile actions.
- `<Avatar>` — for assignee on each tile.

For the drag-and-drop behavior, you'd add a drag library (theo-ui doesn't include one to keep the bundle lean):

```tsx
// Recommended for kanban-style drag:
pnpm add @dnd-kit/core @dnd-kit/sortable

// Alternative (heavier but feature-rich):
pnpm add react-beautiful-dnd

// For complex board-style drags:
pnpm add @atlaskit/pragmatic-drag-and-drop
```

A minimal kanban skeleton using theo-ui primitives:

```tsx
import { Card } from "@theokit/ui/card";
import { Badge } from "@theokit/ui/badge";
import { Avatar } from "@theokit/ui/avatar";

function KanbanColumn({ title, items }: { title: string; items: any[] }) {
  return (
    <div className="bg-secondary rounded-lg p-3 min-w-[280px]">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-label-caps text-muted-foreground">{title}</h3>
        <Badge variant="secondary">{items.length}</Badge>
      </div>
      <div className="space-y-2">
        {items.map((item) => (
          <Card key={item.id} className="p-3 cursor-grab">
            <p className="text-body-md text-foreground mb-2">{item.title}</p>
            <div className="flex items-center justify-between">
              <Badge variant={item.priority === "high" ? "destructive" : "secondary"}>
                {item.priority}
              </Badge>
              {item.assignee && <Avatar src={item.assignee.avatar} alt={item.assignee.name} size="sm" />}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
```

If you want a `<KanbanBoard>` composite in `@theokit/ui` going forward, the contribution workflow lives in `/CONTRIBUTING.md`. Worth proposing if your team needs it across multiple surfaces.

---

Catalog query: theo-ui v1.0.0 · search: "kanban board" · matched: 0
```
