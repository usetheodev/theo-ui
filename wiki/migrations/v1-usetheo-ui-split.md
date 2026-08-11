---
type: Migration Guide
title: "Migration — @theokit/ui v1 (the @usetheo/ui split)"
description: The 54 components that moved to a separate package, the import rewrite, and the codemod that does it automatically.
tags: [migration, breaking-change, v1, usetheo-ui, codemod]
sources:
  - id: guide
    resource: "git:94d9b11:docs/migration/v1-usetheo-ui-split.md"
  - id: codemod
    resource: "codemod/split-usetheo.mjs"
generated:
  by: "claude-code/opus-5"
  at: "2026-08-11"
status: stable
---

# What changed

**BREAKING.** The 54 non-AI components — generic primitives, cloud/PaaS composites, and the
Violet Forge foundation — moved to the new **`@usetheo/ui`** package. `@theokit/ui` is now
AI-exclusive and **depends on** `@usetheo/ui`.

AI components (`AgentEvent`, `ToolCall`, `ChatMessage`, …) stay in `@theokit/ui`.

The strategic reasoning behind the split is
[`/history/ai-exclusive-pivot.md`](/history/ai-exclusive-pivot.md).

# Who does what

| You | Action |
| --- | --- |
| Import only AI components | **Nothing.** Your imports are unchanged. |
| Import any moved component | Add the dependency and re-point those imports. |
| Copy-paste from the registry | Registry entries now cross-reference `@usetheo/ui` URLs, which resolve automatically. |

# Migrate

```bash
npm i @usetheo/ui
```

```diff
- import { Button, Card, AgentEvent } from "@theokit/ui";
+ import { AgentEvent } from "@theokit/ui";
+ import { Button, Card } from "@usetheo/ui";
```

## Codemod

```bash
node node_modules/@theokit/ui/codemod/split-usetheo.mjs $(git ls-files "*.ts" "*.tsx")
```

The codemod splits mixed import statements automatically. Review the diff — it rewrites
imports, it does not verify that the resulting component usage still typechecks.

# Moved components

Import these from `@usetheo/ui`:

`account-menu`, `action-bar`, `alert`, `avatar`, `badge`, `button`, `card`, `checkbox`,
`code-block`, `command-palette`, `confirm-dialog`, `copy-button`, `danger-zone`,
`data-table`, `deployment-row`, `dialog`, `domain-config`, `dropdown-menu`, `empty-state`,
`env-var-editor`, `form-field`, `input`, `label`, `login-split`, `metric-card`,
`metrics-panel`, `page-shell`, `pagination`, `pin-input`, `plan-badge`, `preview-env-card`,
`progress`, `project-card`, `radio-group`, `rollback-ui`, `scroll-area`, `select`, `sheet`,
`sidebar`, `skeleton`, `social-auth-row`, `stat-tile`, `status-dot`, `status-indicator`,
`switch`, `table`, `tabs`, `task-header`, `textarea`, `timestamp`, `toast`, `tooltip`,
`topnav`, `update-banner`

# One component that did not move

`BuildLogStream` is cloud-ops-shaped but **stayed** in `@theokit/ui`, because it renders
agent and build output — an AI-coworker surface. A PaaS dashboard consumes both packages.

# Why two scopes

`@theokit/*` is the AI-native product. `@usetheo/*` is the neutral, community-facing
generic layer that `@theokit/ui` builds on — Apache-2.0, usable standalone, outside any paid
funnel.

The split is **deliberate**, and folding `@usetheo/ui` into the `@theokit` scope was
explicitly considered and rejected: the two-scope split signals neutrality, and renaming a
published package is costly churn with no consumer benefit at current adoption.

# Foundation

`@usetheo/ui` carries the Violet Forge design system — `lib/cn.ts`,
`styles/tailwind-preset.ts`, `themes/`, `ThemeProvider`, and the shared libraries the
primitives use (`safe-href`, `live-region-context`, `env`). `@theokit/ui` consumes it rather
than duplicating it.

This means the design-system concepts in this bundle — [tokens](/design-system/color-tokens.md), [typography](/design-system/typography.md), [themes](/design-system/themes.md) — describe
tokens that physically live in `@usetheo/ui`. They are documented here because
`@theokit/ui` components consume them and are judged against them by the
[quality gates](/quality-gates/gate-catalog.md).
