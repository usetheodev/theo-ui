---
type: Reference
title: Example screens
description: The Ladle screen compositions, what each demonstrates, and why they are never exported from the library barrel.
tags: [screens, ladle, examples, composition]
sources:
  - id: screens
    resource: "archive:94d9b11:docs/screens.md"
generated:
  by: "claude-code/opus-5"
  at: "2026-08-11"
status: stable
---

# What they are

Full-page compositions assembled from `@theokit/ui` primitives and composites, plus generic
and auth primitives from `@usetheo/ui` (`Sidebar`, `TopNav`, `LoginSplit`, `SocialAuthRow`)
where a full shell needs them.

**They are not exported from the library barrel.** They are illustrative compositions that
consumers copy or reference. Gate 1's screen criteria apply: a screen story must demonstrate
a real workflow with realistic data, long labels, and empty/error states — not a decorative
layout.

Browse them in Ladle (`pnpm dev`) under the `Screens / *` group.

# Schema

| Story | File | Demonstrates |
| --- | --- | --- |
| `Screens / Chat Home / Default` | `src/screens/chat-home.stories.tsx` | Chat-mode shell: `Sidebar`, `TopNav`, `ChatThread`, `ChatComposer`, `QuickActionChips` |
| `Screens / Code Workspace / Default` | `src/screens/code-workspace.stories.tsx` | Code-mode shell: `AgentTimeline` + `RunStats` left; `PreviewPanel` + `DiffViewer` + `TerminalPanel` + `RunningTasksPanel` right |
| `Screens / Login / Default` | `src/screens/login.stories.tsx` | `LoginSplit` with `SocialAuthRow` and an email form |
| `Screens / Task Starting / Default` | `src/screens/task-starting.stories.tsx` | Bootstrapping state via `AgentStartingState` |
| `Screens / Task Running / Default` | `src/screens/task-running.stories.tsx` | Live agent run: `AgentTimeline`, `ToolCall`, `ProgressChecklist`, `FolderContextCard` |
| `Screens / Task Completed / Default` | `src/screens/task-completed.stories.tsx` | Finished task with `ArtifactPreview` and `CreatedFilesCard` |
| `Screens / Theo Code Shell / Default` | `src/screens/theo-code-shell.stories.tsx` | Full shell wireframe with a mode switcher in `TopNav` |

# Why they are not API

A screen that shipped as an export would be a page-level opinion baked into a component
library — it would need a stable props contract, a deprecation policy, and gate coverage,
all to serve a composition each consumer will restructure anyway.

Keeping them Ladle-only means they can stay honest demonstrations: they use whatever
composition is currently correct, and when a component changes they get updated rather than
version-negotiated.

# Note on the historical version

An earlier decomposition document motivated these screens using legacy product names and a
pre-Geist component list. It was archived rather than updated, after being flagged as stale
in the 2026-05-14 review. That document was one of the sources removed with the `docs/`
tree; the crawl boundary is recorded in the bundle log.
