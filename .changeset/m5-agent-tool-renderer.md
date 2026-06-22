---
"@theokit/ui": minor
---

Add `AgentToolRenderer` — an overridable tool-renderer registry for the chat surface. Tool invocations dispatch to a rich renderer (diff/terminal/code/created-files/data-table) by classification, falling back to `ToolCallPart` for unmapped tools. `<ChatMessage>` gains `toolRenderers` + `classifyTool` props (alongside `partRenderers`/`dataRenderers`); `partRenderers.tool` keeps priority. Exposed via `@theokit/ui/agent-tool-renderer` and the root barrel.
