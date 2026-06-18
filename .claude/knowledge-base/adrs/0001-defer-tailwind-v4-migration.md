# ADR 0001 — Defer Phase 4 (Tailwind v4 migration) to a dedicated cycle

**Status:** Accepted
**Date:** 2026-06-18
**Context cycle:** community-standard-componentization
**Resolves review finding:** F-xval-1 (BLOCKER, procedural — plan Coverage Matrix rows 5-6 / Global DoD open)

## Context

The `community-standard-componentization` plan declared 6 phases. Phases 1, 2, 3,
5, 6 were delivered and verified (`pnpm quality:gates` green). **Phase 4 (T4.1 —
align the Tailwind devDep to v4 + React 19 matrix + remove v3-legacy) is
toolchain-blocked**, confirmed empirically (the attempt was made and reverted):

1. Bumping `tailwindcss` devDep `^3.4.17 → ^4` breaks the library `pnpm build`
   (exit 1) and `playground/vite.config.ts` — v4 removed the `tailwindcss()`
   PostCSS-plugin form in favour of `@tailwindcss/postcss`.
2. `tailwindcss-animate` is a JS plugin consumed by `src/styles/tailwind-preset.ts`
   (`plugins: [animate]`). Its v4 replacement `tw-animate-css` is a CSS `@import`,
   not a JS plugin — swapping requires re-architecting the preset from JS-config
   to CSS-config.
3. `preset-v3-legacy` + `styles-v3-legacy` are wired into tsup entries,
   `package.json#exports`, `sync-exports.ts`, the bundle baseline, and
   `validateRegistryPresetDep`. Removing them is a multi-file surgical change.
4. The CSS pipeline change would require a visual-regression + bundle re-baseline.

Crucially, the shipped `dist/components.css` is **already built with Tailwind v4**
(`@tailwindcss/cli` v4.3.0), so the consumer-facing CSS is already v4. The gap is
the dev/test version label + the v3-legacy compatibility artifacts — a coordinated
migration, not a tail-end increment.

## Decision

Re-scope **T4.1 out of `community-standard-componentization`** into a dedicated
follow-up cycle `tailwind-v4-migration`. The Coverage Matrix rows 5-6 and the
Global DoD item are satisfied for the 5 delivered phases; T4.1 is an **accepted
deferral**, not a silent gap.

The follow-up cycle MUST: (a) migrate the preset from JS-config to CSS-config,
(b) swap `tailwindcss-animate → tw-animate-css`, (c) bump the devDep + fix
`playground/vite.config.ts` to `@tailwindcss/postcss`, (d) remove the v3-legacy
artifacts + their exports/entries/baselines, (e) re-baseline visual regression
and bundle.

## Alternatives considered

- **Implement T4.1 now inside this cycle.** Rejected: the migration cascades into
  the build + playground + preset + PostCSS config + visual re-baseline — high
  risk of leaving the tree broken, low marginal value (CSS is already v4).
  Violates the 95%-confidence rule for a rushed tail-end change.
- **Leave T4.1 as a silent open task.** Rejected: dishonest; the Coverage Matrix
  must be reconciled explicitly (cycle-review F-xval-1).

## Consequences

- The 5-phase increment is mergeable on its own merits; `pnpm quality:gates` is
  green for the delivered scope.
- A `tailwind-v4-migration` plan should be created via `/to-plan` before the next
  release that touches the CSS pipeline.
- The peer-dep `tailwindcss ^4.0.0` remains the honest forward declaration; the
  devDep stays `^3.4.17` until the follow-up cycle aligns them.
