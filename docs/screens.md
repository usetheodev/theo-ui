# Example Screens

> Ladle screen compositions assembled from `@theokit/ui` primitives + composites.
> These stories are **not exported** from the library barrel — they are illustrative compositions consumers can copy or use as reference.

Browse them in Ladle (`pnpm dev`) under the `Screens / *` group:

| Story | File | Demonstrates |
|---|---|---|
| `Screens / Chat Home / Default` | `src/screens/chat-home.stories.tsx` | Chat mode shell: `Sidebar`, `TopNav`, `ChatThread`, `ChatComposer`, `QuickActionChips`. |
| `Screens / Code Workspace / Default` | `src/screens/code-workspace.stories.tsx` | Code mode shell: `AgentTimeline` + `RunStats` on the left, `PreviewPanel` + `DiffViewer` + `TerminalPanel` + `RunningTasksPanel` on the right. |
| `Screens / Login / Default` | `src/screens/login.stories.tsx` | `LoginSplit` with `SocialAuthRow` + email form. |
| `Screens / Task Starting / Default` | `src/screens/task-starting.stories.tsx` | Bootstrapping state with `AgentStartingState`. |
| `Screens / Task Running / Default` | `src/screens/task-running.stories.tsx` | Live agent run: `AgentTimeline`, `ToolCall`, `ProgressChecklist`, `FolderContextCard`. |
| `Screens / Task Completed / Default` | `src/screens/task-completed.stories.tsx` | Finished task with `ArtifactPreview`, `CreatedFilesCard`. |
| `Screens / Theo Code Shell / Default` | `src/screens/theo-code-shell.stories.tsx` (component in `theo-code-shell.tsx`) | Full shell wireframe with mode switcher in `TopNav`. |

For the historical decomposition document that motivated these screens (with legacy product names and pre-Vercel-migration component list), see [`audit/2026-05-screens-history.md`](./audit/2026-05-screens-history.md).
