---
"@theokit/ui": minor
---

Add `toAgentStreamItems({ history, live }, { classifyTool? })` — a pure, order-aware builder that merges completed `UIMessage`s with live `AgentEvent`s into the `AgentStreamItem[]` that `<AgentStream>` renders (history → `message` items, live → `tool-call` items with status mapped from `AgentEventStatus`). `classifyTool` customizes each tool-call item per event. Ships `mapAgentEventStatus` and exports the `MessageStreamItem`/`ToolCallStreamItem` item types.
