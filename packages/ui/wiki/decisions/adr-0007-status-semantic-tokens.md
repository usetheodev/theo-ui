---
type: Architecture Decision Record
title: "ADR-0007 — Status semantic tokens (the operational-state group)"
description: Separating operational state from action result as distinct token families, and the hierarchy invariant that keeps the new composite legal under the taxonomy rule.
tags: [adr, tokens, color, semantics, taxonomy]
sources:
  - id: adr
    resource: "archive:94d9b11:docs/adr/0007-status-semantic-tokens.md"
    last_modified: "2026-06-03"
generated:
  by: "claude-code/opus-5"
  at: "2026-08-11"
status: stable
---

| Field | Value |
| --- | --- |
| Status | **Accepted** |
| Date | 2026-06-03 |
| Related | [ADR-0004](/decisions/adr-0004-no-literal-tailwind-colors.md), [ADR-0005](/decisions/adr-0005-oklch-as-canonical-color-format.md) |

# Context

Components representing **operational state** (gateway connected / disconnected / degraded)
reused the action-result tokens (`--success`, `--destructive`, `--warning`, `--info`). That
conflates two unrelated concept families:

Action result
: The outcome of a discrete operation. "Form saved" (success), "API failed" (destructive),
  "Validation warning" (warning), "Tip available" (info).

Operational state
: The liveness of a long-running component or system. "Gateway online" (alive), "Gateway
  offline" (dead), "Gateway degraded" (alive but slow), "Status flag" (informational).

The four `gateway-status-indicator` literals (`bg-emerald-500`, `bg-red-500`,
`bg-amber-500`, `bg-blue-500`) bypassed the cascade entirely
([ADR-0004](/decisions/adr-0004-no-literal-tailwind-colors.md)). The naive sweep would have
mapped them onto `bg-success` / `bg-destructive` / `bg-warning` / `bg-info` — closing the
literal-color bug while **permanently welding the two families together**, so no theme
could ever make system-online green differ from positive-action green.

# Decision

Introduce a fourth color group in `ColorScale`: **status semantic**.

```ts
export interface ColorScale {
  /* … existing 29 keys … */
  "status-online": string;
  "status-online-foreground": string;
  "status-offline": string;
  "status-offline-foreground": string;
  "status-degraded": string;
  "status-degraded-foreground": string;
  "status-info": string;
  "status-info-foreground": string;
}
```

8 new keys × 11 themes = **88 token values**. Built-in themes initially mirror the
action-result counterparts (online ← success, offline ← destructive, degraded ← warning,
info ← info), so consumers see visually identical behavior across the migration. Custom
themes override when the UX requires distinct status surfaces.

`src/components/composites/status-indicator/` is the canonical consumer:

```tsx
<StatusIndicator status="online" />
<StatusIndicator status="offline" label="Disconnected" />
<StatusIndicator status="degraded" label="Slow" pulse />
```

The pre-existing `status-dot` primitive remains as the more generic API (consuming
`--success` / `--destructive` directly with
`StatusKind = 'live' | 'building' | 'failed' | 'idle' | 'warning'`).

# The hierarchy invariant

The `StatusIndicator` composite consumes **Tailwind tokens** (`bg-status-online`) — it does
**not** import the `status-dot` primitive.

This matters because it is exactly the case where the
[taxonomy rule](/architecture/taxonomy-rule.md) could have been violated by accident. The
composite is correctly placed in `composites/` and consumes runtime CSS tokens, not another
component import. Consuming a token is not a dependency.

# Consequences

**Positive.** `gateway-status-indicator` now uses `bg-status-online` and friends — the
ADR-0004 hidden theme-switching bug is closed. Components express clearly whether they
describe an action result or an operational state. Custom themes can fork status colors
from action-result colors.

**Negative.** Eight fields added to `ColorScale`. Themes registered before this change and
missing the keys fail valibot validation — the migration path is `defineTheme(partial)`,
which auto-fills from violet-forge defaults, but a consumer using the raw `Theme` interface
must add them. 88 additional values to maintain across the built-ins.

# Known limitation

The four states (`online` / `offline` / `degraded` / `info`) cover common operational
vocabulary but are **not exhaustive** — `provisioning`, `archived`, `paused` may emerge
from PaaS surfaces. The extension path is to add more `--status-*` tokens using the same
pattern; the schema is open.

# Rejected alternatives

| Alternative | Why not |
| --- | --- |
| Keep using semantic tokens for status | The ADR-0004 hidden bug returns for any consumer wanting status colors distinct from action-result colors. Conflates the families permanently. |
| Prefix `--state-*` instead of `--status-*` | "State" is overloaded across React vocabulary (`useState`, component state). "Status" maps cleanly to the operational meaning used by PaaS, Kubernetes, and monitoring systems. |
| Per-component opt-in loading | The 8 values × 11 themes are constants in JS objects — tree-shaking has nothing to do. The static CSS increment is ~16 lines per theme block. |
