# Verb — `theo-ui catalog`

The user described a need ("I need a copy button with success state", "find me a component for chat tool calls"). The verb searches the 121 components, names matches, and emits an import + usage example.

The verb does NOT build a page. It answers the catalog question. After the answer, the user can follow up with *"now build me a page with that"* to hand off to the default verb.

---

## When to invoke

Triggers:

- `theo-ui catalog copy button`
- `theo-ui catalog confirm destructive action`
- `theo-ui catalog otp input`
- `theo-ui catalog chat tool call`
- *"Does theo-ui have a copy button?"*
- *"What's the component for displaying agent tool calls?"*
- *"How do I show usage quota?"*
- *"Find me a component for X"*
- *"Is there a primitive for Y?"*

If the user asks a yes/no question about whether a component exists, route to catalog (without the verb prefix).

---

## Pipeline

### 1. Parse the need

The need is a natural-language description of what the user wants. Examples:

- `"copy button with success state"` → looking for a clipboard-copy primitive with built-in feedback
- `"otp input"` → looking for an OTP / verification code input
- `"chat tool call"` → looking for a primitive that renders LLM tool invocations
- `"confirm destructive action"` → looking for a dialog primitive for confirmations
- `"usage quota visualization"` → looking for a meter / progress / usage display

Strip noise words ("a", "the", "with", "for", "i need", "is there"). Extract the core concept.

### 2. Search the catalog

The catalog has 121 components — 92 primitives in `src/components/primitives/` and 29 composites in `src/components/composites/`. Search by:

1. **Exact name match** — if the need contains a component name (`button`, `card`, `dropdown`), prioritize that.
2. **Synonym match** — `OTP` ↔ `PinInput`, `modal` ↔ `Dialog`, `popup` ↔ `Popover`, `tooltip` ↔ `Tooltip`, `accordion` ↔ (not in catalog yet), `chip` ↔ `Badge`, `pill` ↔ `Badge`, `tag` ↔ `Badge`.
3. **Concept match** — `confirm action` → `<ConfirmDialog>`, `tool call` → `<ToolCall>`, `usage meter` → `<UsageMeter>`, `live cost` → `<CostMeter>`, `streaming` → `<AgentStreaming>`.

### 3. Rank matches

Order matches by relevance:

1. **Exact name** (single component)
2. **Synonym** (close phrase match)
3. **Concept** (semantic match)
4. **Compositional answer** (multiple components combined)

If no match, say so explicitly. Don't invent a component.

### 4. Emit the answer

For each match, emit:

- **Component name** + kind (primitive / composite)
- **One-line description** — what it does
- **Import statement** (subpath preferred post-0.10)
- **Usage example** — minimal, copy-pasteable
- **Related components** (when applicable)
- **Link to the docs page** at `docs.usetheo.dev`

---

## Output format

### Single match

```markdown
## Match: `<CopyButton>` (primitive)

Copy-to-clipboard button with built-in success / error state and timed reset.

```tsx
import { CopyButton } from "@theokit/ui/copy-button";

<CopyButton value="dep_abc123" />
```

**Props:** `value` (required), `label`, `successLabel`, `errorLabel`, `size`, `variant`, `onCopy`.

**Behavior:** clicking the button copies `value` to clipboard via `navigator.clipboard.writeText`, switches to the success state (icon + label change), and auto-resets after 2 seconds. Falls back to a hidden input + `document.execCommand("copy")` on browsers without Clipboard API.

**Related:**
- `<CodeBlock>` — wraps code blocks with a `<CopyButton>` in the top-right.
- `<Button asChild>` + manual clipboard handler — if you need a fully custom copy UI.

**Docs:** https://docs.usetheo.dev/theoui/primitives/copy-button
```

### Multiple matches (ranked)

```markdown
## Top match: `<PinInput>` (primitive — post-0.11)

Multi-slot OTP / verification code input with auto-advance, paste handling, and mask.

```tsx
import { PinInput } from "@theokit/ui/pin-input";

const [code, setCode] = useState("");

<PinInput
  length={6}
  value={code}
  onChange={setCode}
  onComplete={(v) => verify(v)}
  inputMode="numeric"
  aria-label="Verification code"
/>
```

**Props:** `length` (default 6), `value`, `onChange`, `onComplete`, `inputMode` (`numeric`/`alphanumeric`), `mask`, `error`, `disabled`, `aria-label`.

**Behavior:** N separate slot inputs. Type a character → slot fills, focus advances. Backspace clears + retreats. Arrow keys nav between slots. Paste fills all slots (whitespace + non-matching chars stripped per `inputMode`). `onComplete` fires once when the value reaches `length`.

**Docs:** https://docs.usetheo.dev/theoui/primitives/pin-input

---

## Alternative: 6 × `<Input>` with manual focus management

If you can't upgrade to 0.11 yet, the legacy pattern is 6 controlled `<Input>` elements with `onKeyDown` / `useRef` focus management. NOT recommended — `<PinInput>` handles paste, masking, error state, and a11y correctly out of the box.
```

### Compositional answer

```markdown
## Concept match: "Confirm a destructive action"

This needs two components composed together — `<ConfirmDialog>` for the confirmation flow + a destructive trigger button.

```tsx
import { ConfirmDialog } from "@theokit/ui/confirm-dialog";
import { Button } from "@theokit/ui/button";

<ConfirmDialog
  title="Delete project?"
  description="This will permanently remove the project and all deployments. This cannot be undone."
  confirmLabel="Delete project"
  variant="destructive"
  requireTextMatch={projectName}  // optional — type the project name to confirm
  onConfirm={handleDelete}
>
  <Button variant="destructive">Delete project</Button>
</ConfirmDialog>
```

**Behavior:** the destructive button trigger wraps in `<ConfirmDialog>`. Clicking the trigger opens a modal with title + description + confirm/cancel buttons. The confirm button uses `variant="destructive"`. Optional `requireTextMatch` requires the user to type the exact string (e.g., the project name) before the confirm button enables — used for high-stakes actions like deleting an account or dropping a database.

**Related:**
- `<DangerZone>` — group multiple destructive actions at the bottom of a settings page. Each `<DangerZone.Action>` wraps its trigger in `<ConfirmDialog>`.
- `<Dialog>` — raw dialog primitive if you need a non-confirmation modal.

**Docs:** https://docs.usetheo.dev/theoui/composites/confirm-dialog
```

### No match

```markdown
## No match

`@theokit/ui` doesn't currently ship a component for "draggable kanban board". The closest building blocks would be:

- `<Card>` — render each kanban card.
- Manual drag handling via `@dnd-kit` or `react-beautiful-dnd` (you'd add this dep).

If you want to propose a `<KanbanBoard>` composite for the library, the request workflow is in [`../../CONTRIBUTING.md`](../../CONTRIBUTING.md).

For a one-off kanban implementation, use `<Card>` for tiles + your drag lib of choice.
```

---

## Catalog rules

### Be exhaustive in the search

The catalog has 121 components. Don't bail out after checking the first 10. Check primitives AND composites. Check synonyms.

### Be honest about limits

If the requested component genuinely doesn't exist in the catalog, say so. Don't invent a name (`<KanbanBoard>` doesn't exist — don't pretend it does).

If a component is on the roadmap (mentioned in CLAUDE.md, e.g., `<Diagram>`), note it as roadmap but don't pretend it's available.

### Show subpath imports post-0.10

Always emit subpath imports (`import { Button } from "@theokit/ui/button"`) unless the user's project is pre-0.10. The pre-flight scan (when available) determines this — for catalog without pre-flight context, default to subpath and add a note: *"If your `@theokit/ui` is pre-0.10, use the barrel import `from \"@theokit/ui\"` instead."*

### Show the minimal usage

The usage example must be minimal — only the props the user needs to see the component work. Don't dump every prop. Link to the docs for the full API.

### Provide the docs link

Every component has a docs page at `docs.usetheo.dev/theoui/{kind}/{slug}` where `kind` is `primitives` or `composites`. Provide it.

### Suggest related components

After the primary match, suggest 1–2 related components. This is the "you might also like" pattern — useful when the user's mental model doesn't quite match the catalog's vocabulary.

### Don't build the page

The catalog verb's output is the catalog answer + usage example. Stop there. If the user wants a page built around it, they invoke the default verb next.

---

## Synonyms map (partial)

| User says | Theo-ui component |
|---|---|
| modal / popup | `<Dialog>` |
| tooltip | `<Tooltip>` |
| popover | `<Popover>` |
| dropdown / menu | `<DropdownMenu>` |
| select / combobox | `<Select>` (composite for combobox is roadmap) |
| toggle / boolean switch | `<Switch>` |
| chip / tag / pill | `<Badge>` |
| spinner / loading indicator | `<Loader2>` (from lucide-react) — typically used inside `<Button loading>` |
| skeleton / shimmer / placeholder | `<Skeleton>` |
| toast / notification | `<Toast>` |
| progress bar | `<Progress>` |
| usage meter / quota | `<UsageMeter>` |
| OTP / 2FA / verification code | `<PinInput>` (0.11+) |
| confirm / are you sure | `<ConfirmDialog>` |
| destructive section | `<DangerZone>` |
| empty state / no data | `<EmptyState>` |
| code block / syntax highlight | `<CodeBlock>` |
| copy button / copy to clipboard | `<CopyButton>` |
| timestamp / relative time | `<Timestamp>` |
| status dot / status indicator | `<StatusDot>` |
| stat tile / kpi card | `<StatTile>` |
| plan badge / tier badge | `<PlanBadge>` |
| command palette / cmd+k | `<CommandPalette>` |
| chat bubble / message | `<ChatMessage>` |
| chat thread / conversation | `<ChatThread>` |
| chat composer / message composer | `<ChatComposer>` |
| agent timeline / agent history | `<AgentTimeline>` |
| agent stream / live agent | `<AgentStream>` |
| tool call / function call | `<ToolCall>` |
| tool result / function result | `<ToolResult>` |
| data table / sortable table | `<DataTable>` |
| sign in split / two-column auth | `<LoginSplit>` |
| oauth row / social auth | `<SocialAuthRow>` |
| build logs / log stream | `<BuildLogStream>` |
| deployment row | `<DeploymentRow>` |
| project card | `<ProjectCard>` |
| env var editor | `<EnvVarEditor>` |
| domain config | `<DomainConfig>` |
| rollback ui | `<RollbackUI>` |
| metrics panel | `<MetricsPanel>` |
| account menu / user menu | `<AccountMenu>` |
| cron jobs | `<CronJobsList>` |
| mcp servers | `<MCPServerList>` |
| skills list | `<SkillsList>` |
| agent editor | `<AgentEditor>` |
| skill editor | `<SkillEditor>` |
| rule editor | `<RuleEditor>` |
| preview panel | `<PreviewPanel>` |
| approval card | `<ApprovalCard>` |
| permission modal | `<PermissionModal>` |
| task header | `<TaskHeader>` |
| page wrapper / scaffold | `<PageShell>` |
| action bar / page actions | `<ActionBar>` |

For anything not in this list, search by concept then fall back to "no match" if genuinely absent.

---

## Stamp format for catalog output

The catalog output is markdown answer (no code emit), so no JSX stamp. Stamp at the bottom of the response:

```
---
Catalog query: theo-ui v1.0.0 · search: "<original need>" · matched: <component count>
```
