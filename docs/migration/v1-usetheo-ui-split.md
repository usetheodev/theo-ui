# Migration — `@theokit/ui` v1 (the `@usetheo/ui` split)

**BREAKING.** The 54 non-AI components (generic primitives + cloud/PaaS composites + the
Violet Forge foundation) moved to the new `@usetheo/ui` package. `@theokit/ui` is now
AI-exclusive and depends on `@usetheo/ui`. AI components (AgentEvent, ToolCall,
ChatMessage, …) stay in `@theokit/ui`.

## Migrate

1. `npm i @usetheo/ui`
2. Re-point moved-component imports:

```diff
- import { Button, Card, AgentEvent } from "@theokit/ui";
+ import { AgentEvent } from "@theokit/ui";
+ import { Button, Card } from "@usetheo/ui";
```

## Codemod (automatic)

```bash
node node_modules/@theokit/ui/codemod/split-usetheo.mjs $(git ls-files "*.ts" "*.tsx")
```

## Moved components (import from `@usetheo/ui`)

`account-menu`, `action-bar`, `alert`, `avatar`, `badge`, `button`, `card`, `checkbox`, `code-block`, `command-palette`, `confirm-dialog`, `copy-button`, `danger-zone`, `data-table`, `deployment-row`, `dialog`, `domain-config`, `dropdown-menu`, `empty-state`, `env-var-editor`, `form-field`, `input`, `label`, `login-split`, `metric-card`, `metrics-panel`, `page-shell`, `pagination`, `pin-input`, `plan-badge`, `preview-env-card`, `progress`, `project-card`, `radio-group`, `rollback-ui`, `scroll-area`, `select`, `sheet`, `sidebar`, `skeleton`, `social-auth-row`, `stat-tile`, `status-dot`, `status-indicator`, `switch`, `table`, `tabs`, `task-header`, `textarea`, `timestamp`, `toast`, `tooltip`, `topnav`, `update-banner`\n