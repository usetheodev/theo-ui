---
type: Architecture Rule
title: Global provider primitives (named exception to context coupling)
description: The closed allowlist of primitives permitted to require a root-level provider mount, and the rules they must satisfy.
tags: [architecture, exception, providers, allowlist]
sources:
  - id: arch-doc
    resource: "git:94d9b11:docs/architecture.md"
  - id: import-graph
    resource: "scripts/lib/import-graph.ts"
generated:
  by: "claude-code/opus-5"
  at: "2026-08-11"
status: stable
---

# What this exception is

The "no implicit coupling via context" anti-pattern in
[`/architecture/taxonomy-rule.md`](/architecture/taxonomy-rule.md) admits a tightly-scoped
exception for app-wide context providers. These ship as primitives across every
shadcn-aligned design system; moving them to `composites/` would break the mental model
consumers already have. Semantically they belong to neither layer — they are root
infrastructure.

# Schema — the closed set

Editing this table requires an RFC.

| Name | Location | Why it is here |
| --- | --- | --- |
| `Toaster` | imported from `@usetheo/ui` | Toast viewport + provider, composed by `TheoUIProvider`. Moved to `@usetheo/ui` in the [pivot](/history/ai-exclusive-pivot.md); still mounted once at the app root, descendants call `useToast()`. Same pattern as shadcn, Sonner, react-hot-toast. |
| `ThemeProvider` | `src/themes/theme-provider.tsx` | Theme registry + runtime switcher + density. Mounted once; descendants call `useTheme()` / `useDensity()`. |

# Rules a global provider primitive must satisfy

- Document the "mount at app root" requirement **loudly** in JSDoc.
- Expose the matching hook (`useToast`, `useTheme`) from the same barrel.
- **Fail fast**: throw a clear, named error when the hook runs without the provider
  mounted. Never silently return stale state.
- Appear in `GLOBAL_PROVIDER_PRIMITIVES` in `scripts/lib/import-graph.ts` — the gate
  ignores cross-imports to and from these names when computing taxonomy offenses.

# Adding a new one

1. Write an RFC justifying why the provider cannot live in `composites/`. Typical accepted
   reasons: idiomatic shadcn placement, root-level mount semantics, hook-first API.
2. Add the name to `GLOBAL_PROVIDER_PRIMITIVES`.
3. Update the table above.

An RFC that argues only "it is more convenient" does not clear this bar. The exception
exists because the alternative breaks an ecosystem-wide convention, not because the rule
is inconvenient.
