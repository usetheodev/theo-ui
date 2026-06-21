---
"@theokit/ui": minor
---

Add `@theokit/ui/sdk-tools-adapters` — pure converters from `@theokit/sdk-tools` tool results into theo-ui rich-primitive props (`adaptGitDiffResult`/`adaptReadFileResult`/`adaptShellResult`/`adaptListDirResult`/`adaptApplyPatchResult` + `parseUnifiedDiff`). Each returns `null` on an error result so a tool card keeps its `ToolCallPart` fallback. The adapters import nothing from `@theokit/sdk-tools` at runtime (consumers gain zero new runtime dep); a dev-only contract test imports the real factories.
