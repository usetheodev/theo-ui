---
type: Architecture Rule
title: Primitive vs composite — the mechanical taxonomy rule
description: A component is a primitive if and only if it imports no other @theokit/ui component; the import graph decides, not domain feeling.
tags: [architecture, taxonomy, invariant, gated]
sources:
  - id: arch-doc
    resource: "git:94d9b11:docs/architecture.md"
    author: "human:paulohenriquevn"
  - id: gate-source
    resource: "scripts/validate-quality-gates.ts"
  - id: import-graph
    resource: "scripts/lib/import-graph.ts"
generated:
  by: "claude-code/opus-5"
  at: "2026-08-11"
status: stable
---

# The rule

> **A component is a primitive if and only if it does NOT import any other
> `@theokit/ui` component. Otherwise it is a composite.**

The split between `src/components/primitives/` and `src/components/composites/` is
decided by the **import graph**, not by domain feeling.[^arch-doc] A cross-import over the
boundary fails [`validateComponentStructure`](/quality-gates/structural-validator.md) —
this is a gate, not a convention.[^gate-source]

# Schema

## Allowed imports for a primitive

| Import | Allowed | Note |
| --- | --- | --- |
| `react` and hooks | Yes | |
| `@radix-ui/react-*` | Yes | Radix is the foundation; never copy a Radix primitive inline to customize it |
| `lucide-react` | Yes | |
| `class-variance-authority`, `clsx`, `tailwind-merge` | Yes | |
| `../../../lib/cn.js`, `../../../types/*.js` | Yes | Shared utilities and structural types |
| Subparts inside the same component folder | Yes | e.g. `ChatMessage`'s `parts/` |
| Another `@theokit/ui` component | **No** | This is exactly what makes it a composite |

## Rules for a composite

- Composes primitives **through their public APIs** (via the barrel `index.js`, not a raw
  `*.js` file — `validateCompositeBarrel` enforces this).
- May import other composites.
- Must not import its own consumers. No cycles.
- Must not import screens or app-specific code.

## Two tolerated exceptions

1. **Flat subpart exports.** A composite family like `ChatMessage` exports its subparts
   (`ChatMessageRoot`, `ChatMessageContent`, `ChatMessageToolbar`, …) as flat named
   exports from a single source file. They live together, so they are not cross-component
   imports.
2. **Type-only imports across the boundary.** A shared structural type (an event shape, a
   status union) adds no runtime code, so it creates no component dependency.

A third exception — [global provider primitives](/architecture/global-provider-primitives.md)
— is a named allowlist, not a general rule.

# Why the rule exists

1. **Predictable bundle sizes.** A consumer installing only `AgentEvent` from the registry
   gets `cn` + Radix + `AgentEvent` — no surprise transitive dependencies.
2. **Registry hygiene.** The shadcn registry declares `registryDependencies`. If
   `ChatThread` depended on `ChatMessage` depended on `ChatThread`, that graph would cycle
   and the copy-paste install would break. See [`/registry/shadcn-registry.md`](/registry/shadcn-registry.md).
3. **Refactor safety.** Moving a primitive's internals never breaks a composite; only its
   public API matters. Composites are explicitly where coupling is allowed to live.
4. **Discoverability.** Two folders: the LEGO bricks and the assembled models. No
   domain-folded bucket that is secretly atomic.

# Examples

A primitive that grows to need another primitive has exactly two legal moves:

```
inline what it needs          →  stays a primitive
move to composites/ + rename  →  becomes a composite (PR with rationale)
```

Nothing else passes the gate. A worked case: `ChatMessage` was promoted primitive →
composite in [RFC 0009](/rfcs/0009-chat-message-parts-api.md) precisely because the new
parts API depends on `<Button>` and card-shaped surfaces.

The inverse case is [ADR-0007](/decisions/adr-0007-status-semantic-tokens.md): the
`StatusIndicator` composite consumes the `--status-*` CSS tokens rather than importing the
`status-dot` primitive, so the rule holds even though the two are visually related.
Consuming a **runtime CSS token** is not a component import.

# Anti-patterns

- **Domain-folded buckets.** Grouping atomic components under `composites/agent/` because
  they belong to the agent domain. Let the import graph decide.
- **Inline Radix copies.** Re-export Radix and add Theo styling on top.
- **Implicit coupling via context.** A primitive must not require a parent to mount a
  context provider. If context is needed, the consumer is a composite — or the component
  is one of the named [global provider primitives](/architecture/global-provider-primitives.md).
- **Side effects on import.** Primitives are pure ES modules: no top-level state, no
  network calls, no DOM mutation.
