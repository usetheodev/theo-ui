# Decisions

Accepted architecture decision records. A decision listed here is in force; changing one
requires a new record, not an edit to the old one.

## Package and distribution

| ADR | Decision | Date |
| --- | --- | --- |
| [0001](/decisions/adr-0001-vite-plugin-subpath-contract.md) | The `/vite-plugin` and `/preset` subpaths are a versioned public contract, guarded by a pre-publish mirror test | 2026-05-28 |
| [0002](/decisions/adr-0002-dist-tag-and-prepublish-validation.md) | `npm dist-tag` is a two-eyes operation; six runtime checks gate every publish | 2026-05-28 |
| [0003](/decisions/adr-0003-esm-only-confirmed-and-gated.md) | ESM-only is intentional; CJS consumers get a loud error and the consumer changes, not the library | 2026-05-28 |
| [Subpath exports per component](/decisions/subpath-exports-per-component.md) | Subpaths point at real per-component dist files, not the barrel | 2026-05-25 |

## Color and theming

| ADR | Decision | Date |
| --- | --- | --- |
| [0004](/decisions/adr-0004-no-literal-tailwind-colors.md) | Literal Tailwind color classes are banned in component source | 2026-06-03 |
| [0005](/decisions/adr-0005-oklch-as-canonical-color-format.md) | OKLCH is the canonical color format | 2026-06-03 |
| [0006](/decisions/adr-0006-algorithmic-tonal-derivations.md) | Tonal variants derive in CSS via `oklch(from …)` with clamps | 2026-06-03 |
| [0007](/decisions/adr-0007-status-semantic-tokens.md) | Operational state gets its own token group, separate from action result | 2026-06-03 |

## Accessibility and platform

| ADR | Decision | Date |
| --- | --- | --- |
| [0008](/decisions/adr-0008-forced-colors-whcm-support.md) | Windows High Contrast Mode is supported via a `forced-colors` token mapping | 2026-06-03 |
| [0009](/decisions/adr-0009-prefers-color-scheme-default.md) | `prefers-color-scheme` is respected by default, until the user overrides | 2026-06-03 |

## Scope and composition

| ADR | Decision | Date |
| --- | --- | --- |
| [PageShell composite](/decisions/page-shell-composite-pattern.md) | PageShell owns the visible header and the state machine, not `document.title` or skeleton shape | 2026-05-25 |
| [Defer Tailwind v4 migration](/decisions/defer-tailwind-v4-migration.md) | The devDep migration is re-scoped to its own cycle rather than rushed | 2026-06-18 |

## How a decision gets made here

An ADR states the problem, the drivers, the options **including the rejected ones with
their reasons**, the outcome, and the consequences — positive and negative both. A record
that lists only benefits is not finished. Several records below explicitly name what the
decision costs and what remains unsolved; that is the expected shape.

Decisions spanning multiple components or changing a shared invariant land as
[RFCs](/rfcs/index.md) instead.
