---
type: Architecture Decision Record
title: "ADR — Defer the Tailwind v4 devDep migration to a dedicated cycle"
description: Why a tail-end phase was re-scoped out of its cycle rather than rushed, and the five things the follow-up cycle must do.
tags: [adr, tailwind, deferral, scope, honesty]
sources:
  - id: adr
    resource: "archive:94d9b11:.claude/knowledge-base/adrs/0001-defer-tailwind-v4-migration.md"
    last_modified: "2026-06-18"
generated:
  by: "claude-code/opus-5"
  at: "2026-08-11"
status: stable
---

| Field | Value |
| --- | --- |
| Status | **Accepted** |
| Date | 2026-06-18 |
| Context cycle | community-standard-componentization |

# Context

The `community-standard-componentization` plan declared six phases. Five were delivered and
verified with `pnpm quality:gates` green. **Phase 4 — align the `tailwindcss` devDep to v4
and remove the v3-legacy artifacts — is toolchain-blocked.** This was confirmed
empirically: the attempt was made and reverted.

Four concrete blockers:

1. Bumping `tailwindcss` from `^3.4.17` to `^4` breaks the library `pnpm build` (exit 1)
   and `playground/vite.config.ts` — v4 removed the `tailwindcss()` PostCSS-plugin form in
   favor of `@tailwindcss/postcss`.
2. `tailwindcss-animate` is a **JS plugin** consumed by `src/styles/tailwind-preset.ts`
   (`plugins: [animate]`). Its v4 replacement `tw-animate-css` is a CSS `@import`, not a JS
   plugin. Swapping requires re-architecting the preset from JS-config to CSS-config.
3. `preset-v3-legacy` and `styles-v3-legacy` are wired into tsup entries,
   `package.json#exports`, `sync-exports.ts`, the bundle baseline, and
   `validateRegistryPresetDep`. Removing them is a multi-file surgical change.
4. The CSS pipeline change requires a visual-regression and bundle re-baseline.

**Crucially, the shipped `dist/components.css` is already built with Tailwind v4**
(`@tailwindcss/cli` v4.3.0), so the consumer-facing CSS is already v4. The gap is the
dev/test version label plus the v3-legacy compatibility artifacts — a coordinated
migration, not a tail-end increment.

# Decision

Re-scope the phase **out** of its cycle and into a dedicated `tailwind-v4-migration` cycle.
The delivered five phases are complete on their own merits; the remaining phase is an
**accepted deferral, not a silent gap**.

The follow-up cycle must:

- [ ] Migrate the preset from JS-config to CSS-config.
- [ ] Swap `tailwindcss-animate` → `tw-animate-css`.
- [ ] Bump the devDep and move the PostCSS config (`postcss.config.mjs`) to `@tailwindcss/postcss`. The `playground/` app named in blocker 1 was removed in 2026-08, so it is no longer part of this task.
- [ ] Remove the v3-legacy artifacts plus their exports, tsup entries, and baselines.
- [ ] Re-baseline visual regression and bundle size.

# Rejected alternatives

| Alternative | Why not |
| --- | --- |
| Implement it now, inside this cycle | The migration cascades into build, playground, preset, PostCSS config, and a visual re-baseline. High risk of leaving the tree broken, low marginal value since the shipped CSS is already v4. A rushed tail-end change violates the 95%-confidence rule. |
| Leave it as a silent open task | Dishonest. The coverage matrix has to be reconciled explicitly. |

The second rejection is the point of this record. Deferring work is legitimate; **deferring
it without writing down that you deferred it** is what turns a scope decision into a
hidden gap.

# Consequences

- The five-phase increment is mergeable on its own merits, gates green.
- A `tailwind-v4-migration` plan should exist before the next release that touches the CSS
  pipeline.
- The peer-dep `tailwindcss ^4.0.0` remains the honest forward declaration; the devDep
  stays `^3.4.17` until the follow-up cycle aligns them.

# Current status

**Still open as of 2026-08-11.** The declared peer-dep and the devDep remain out of
alignment, by design.
