# Baseline: Size Variants Audit (2026-05-20)

Snapshot pré-implementação do plano theming-and-sizes. Lista todos os primitives + composites e indica se hoje (antes do plano) usam CVA e expõem prop `size`.

| Component | Layer | uses_cva | has_size | classification |
|---|---|---|---|---|
| agent-error-card | primitives | 0 | 0 | future_candidate |
| agent-event | primitives | 0 | 0 | future_candidate |
| agent-handoff | primitives | 0 | 0 | future_candidate |
| agent-profile | primitives | 0 | 0 | future_candidate |
| agent-starting-state | primitives | 0 | 0 | future_candidate |
| agent-streaming | primitives | 0 | 0 | future_candidate |
| artifact-preview | primitives | 0 | 0 | future_candidate |
| attachment-chip | primitives | 0 | 0 | future_candidate |
| audit-log-entry | primitives | 0 | 0 | future_candidate |
| auto-compact-notice | primitives | 0 | 0 | future_candidate |
| avatar | primitives | 1 | 1 | has_size |
| badge | primitives | 1 | 0 | size_candidate (Phase 1) |
| browser-controls | primitives | 0 | 0 | future_candidate |
| build-log-stream | primitives | 0 | 0 | future_candidate |
| button | primitives | 1 | 1 | has_size |
| capability-indicator | primitives | 0 | 0 | future_candidate |
| card | primitives | 0 | 0 | size_candidate (Phase 1) |
| chat-message | primitives | 0 | 0 | future_candidate |
| chat-thread | primitives | 0 | 0 | future_candidate |
| checkbox | primitives | 0 | 0 | size_candidate (Phase 1) |
| context-card | primitives | 0 | 0 | future_candidate |
| context-window-bar | primitives | 0 | 0 | future_candidate |
| cost-meter | primitives | 0 | 0 | future_candidate |
| created-files-card | primitives | 0 | 0 | future_candidate |
| cron-job-card | primitives | 0 | 0 | future_candidate |
| dialog | primitives | 0 | 0 | future_candidate |
| diff-viewer | primitives | 0 | 0 | future_candidate |
| empty-state | primitives | 0 | 0 | future_candidate |
| folder-context-card | primitives | 0 | 0 | future_candidate |
| folder-selector | primitives | 0 | 0 | future_candidate |
| form-field | primitives | 0 | 0 | size_candidate (Phase 1) |
| hook-config | primitives | 0 | 0 | future_candidate |
| hook-event-log | primitives | 0 | 0 | future_candidate |
| input | primitives | 0 | 0 | size_candidate (Phase 1) |
| intent-selector | primitives | 0 | 0 | future_candidate |
| label | primitives | 0 | 0 | non_candidate |
| lane-board | primitives | 0 | 0 | future_candidate |
| login-split | primitives | 0 | 0 | future_candidate |
| mcp-server-card | primitives | 0 | 0 | future_candidate |
| memory-editor | primitives | 0 | 0 | future_candidate |
| mention-menu | primitives | 0 | 0 | future_candidate |
| metrics-panel | primitives | 0 | 0 | future_candidate |
| model-card | primitives | 0 | 0 | future_candidate |
| model-selector | primitives | 0 | 0 | future_candidate |
| permission-matrix | primitives | 0 | 0 | future_candidate |
| progress-checklist | primitives | 0 | 0 | future_candidate |
| project-switcher | primitives | 0 | 0 | future_candidate |
| quick-action-chips | primitives | 0 | 0 | future_candidate |
| radio-group | primitives | 0 | 0 | future_candidate |
| recent-folders-list | primitives | 0 | 0 | future_candidate |
| rule-card | primitives | 0 | 0 | future_candidate |
| running-tasks-panel | primitives | 0 | 0 | future_candidate |
| run-stats | primitives | 0 | 0 | future_candidate |
| scroll-area | primitives | 0 | 0 | future_candidate |
| select | primitives | 0 | 0 | size_candidate (Phase 1) |
| session-list-item | primitives | 0 | 0 | future_candidate |
| session-timeline | primitives | 0 | 0 | future_candidate |
| sheet | primitives | 1 | 0 | future_candidate |
| sidebar | primitives | 0 | 0 | future_candidate |
| skeleton | primitives | 0 | 0 | non_candidate |
| skill-card | primitives | 0 | 0 | future_candidate |
| slide | primitives | 0 | 0 | future_candidate |
| social-auth-row | primitives | 0 | 0 | future_candidate |
| steps-rail | primitives | 0 | 0 | future_candidate |
| sub-agent-dispatch | primitives | 0 | 0 | non_candidate |
| switch | primitives | 0 | 0 | size_candidate (Phase 1) |
| system-prompt-editor | primitives | 0 | 0 | future_candidate |
| tabs | primitives | 0 | 0 | future_candidate |
| task-plan | primitives | 0 | 0 | future_candidate |
| terminal-panel | primitives | 0 | 0 | future_candidate |
| textarea | primitives | 0 | 0 | size_candidate (Phase 1) |
| toast | primitives | 1 | 0 | size_candidate (Phase 1) |
| token-usage-chart | primitives | 0 | 0 | future_candidate |
| tool-call | primitives | 0 | 0 | future_candidate |
| tool-call-card | primitives | 0 | 0 | future_candidate |
| tool-result | primitives | 0 | 0 | future_candidate |
| tools-list | primitives | 0 | 0 | future_candidate |
| tooltip | primitives | 0 | 0 | future_candidate |
| topnav | primitives | 0 | 0 | future_candidate |
| whiteboard | primitives | 0 | 0 | future_candidate |
| agent-composer | composites | 0 | 0 | future_candidate |
| agent-editor | composites | 0 | 0 | future_candidate |
| agent-stream | composites | 0 | 0 | future_candidate |
| agent-timeline | composites | 0 | 0 | future_candidate |
| approval-card | composites | 1 | 0 | future_candidate |
| chat-composer | composites | 0 | 0 | future_candidate |
| command-palette | composites | 0 | 0 | future_candidate |
| cron-jobs-list | composites | 0 | 0 | future_candidate |
| deployment-row | composites | 0 | 0 | future_candidate |
| domain-config | composites | 0 | 0 | future_candidate |
| env-var-editor | composites | 0 | 0 | future_candidate |
| mcp-server-list | composites | 0 | 0 | future_candidate |
| permission-modal | composites | 0 | 0 | future_candidate |
| preview-env-card | composites | 0 | 0 | future_candidate |
| preview-panel | composites | 0 | 0 | future_candidate |
| project-card | composites | 0 | 0 | future_candidate |
| rollback-ui | composites | 0 | 0 | future_candidate |
| rule-editor | composites | 0 | 0 | future_candidate |
| skill-editor | composites | 0 | 0 | future_candidate |
| skills-list | composites | 0 | 0 | future_candidate |
| slide-deck | composites | 0 | 0 | future_candidate |
| task-header | composites | 0 | 0 | future_candidate |
