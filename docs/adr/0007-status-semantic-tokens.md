# ADR-0007 — Status Semantic Tokens (Operational State Group)

| Field | Value |
| --- | --- |
| Status | **Accepted** |
| Date | 2026-06-03 |
| Plan | `.claude/knowledge-base/plans/theo-ui-community-best-practices-alignment-plan.md` |
| Related ADRs | ADR-0004 (no literal Tailwind colors), ADR-0005 (OKLCH canonical) |
| Cross-refs | D4, T1.1, T4.1 |

## Context

Pre-T1.1, components representing **operational state** (gateway connected/disconnected/degraded/info) reused the action-result semantic tokens (`--success`, `--destructive`, `--warning`, `--info`). This mixed two unrelated concept families:

- **Action-result semantic**: outcome of a discrete operation. "Form saved" (success), "API failed" (destructive), "Validation warning" (warning), "Tip available" (info).
- **Operational state**: liveness of a long-running component or system. "Gateway online" (alive), "Gateway offline" (dead), "Gateway degraded" (alive but slow), "Status flag" (informational).

The 4 `gateway-status-indicator` color literals (`bg-emerald-500`, `bg-red-500`, `bg-amber-500`, `bg-blue-500`) bypassed the cascade entirely (ADR-0004). The naive sweep candidate would have been `bg-success` / `bg-destructive` / `bg-warning` / `bg-info`, but that conflates two concept families and prevents future per-family theming (e.g., a theme that wants positive-action green to differ from system-online green).

## Decision

Introduce a fourth color group in `ColorScale` (alongside surface, brand, action-result): **status semantic**.

```ts
// src/themes/types.ts
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

8 new keys × 11 themes (10 built-in + violet-forge defaults) = 88 token values. Built-in themes initially mirror the action-result counterparts (online ← success, offline ← destructive, degraded ← warning, info ← info), giving consumers visually-equivalent behavior pre/post-migration. Custom themes override for distinct status surfaces.

`src/components/composites/status-indicator/` is the canonical composite consuming this group:

```tsx
<StatusIndicator status="online" />
<StatusIndicator status="offline" label="Disconnected" />
<StatusIndicator status="degraded" label="Slow" pulse />
```

The pre-existing `status-dot` primitive (`src/components/primitives/status-dot/`) remains as a more generic API (consumes `--success` / `--destructive` directly with `StatusKind = 'live' | 'building' | 'failed' | 'idle' | 'warning'`); the composite layers a status-specific semantic API on top of the primitive idiom.

## Hierarchy invariant

The composite consumes Tailwind tokens (`bg-status-online`, etc.) — it does NOT import the `status-dot` primitive. This preserves the project's mechanically-enforced rule (`validate-quality-gates.ts` taxonomy gate): primitives never depend on `@theokit/ui` components; composites may depend on primitives. The new composite is correctly placed in `composites/` (consumes the runtime CSS tokens, not another component import).

## Consequences

### Positive

- `gateway-status-indicator` (primitive) now uses `bg-status-online` etc. — theme switching propagates correctly (ADR-0004 hidden bug closed).
- Semantic clarity: components clearly express whether they're describing an action result or operational state.
- Custom themes can fork status colors from action-result colors when the UX requires it.

### Negative

- Adds 8 fields to `ColorScale` interface. Themes registered before T1.1 missing these fields will fail valibot validation (`schema.ts` requires them). Migration path: `defineTheme(partial)` auto-fills from violet-forge defaults, but consumers using the raw `Theme` interface must add the keys.
- 88 additional values to maintain across the 11 built-in themes.

### Known limitations

- The 4 status states (`online` / `offline` / `degraded` / `info`) cover the common operational vocabulary but are not exhaustive (e.g., `provisioning`, `archived`, `paused` may emerge from PaaS surfaces). Extension path: add more `--status-*` tokens as needed; the schema is open to extension via the same pattern.

## Alternatives Considered

### A1 — Keep using semantic tokens (success/destructive/etc.) for status

Rejected. Hidden bug from ADR-0004 still happens for any consumer wanting status colors that differ from action-result colors. Conflates concept families.

### A2 — Use `--state-*` instead of `--status-*` as the prefix

Rejected. "State" is overloaded across React vocabulary (`useState`, component state); "status" maps cleanly to the operational meaning used by PaaS, Kubernetes, and monitoring systems.

### A3 — Per-component opt-in (status group only loaded when component imported)

Rejected. The 8 values × 11 themes are constants in JS objects; tree-shaking has nothing to do here. Static CSS payload increment is ~16 lines per theme block — negligible.

## References

- Implementation: `src/themes/types.ts`, `src/themes/schema.ts`, `src/styles/tokens.css`, `src/styles/tokens-v4.css`, `src/themes/*.ts` (all 11 themes), `src/components/composites/status-indicator/`, `src/components/primitives/gateway-status-indicator/`.
- Plan: T1.1 (status tokens), T4.1 (StatusIndicator composite), T6.2 (this ADR).
