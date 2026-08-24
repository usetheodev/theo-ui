---
type: Token Reference
title: Color tokens — the four semantic groups
description: Every color token @theokit/ui defines, grouped by intent, in the canonical OKLCH format with the legacy HSL values that preceded it.
tags: [design-system, tokens, color, oklch, semantic]
sources:
  - id: ds-doc
    resource: "archive:94d9b11:docs/design-system.md"
  - id: adr-0005
    resource: "archive:94d9b11:docs/adr/0005-oklch-as-canonical-color-format.md"
  - id: adr-0007
    resource: "archive:94d9b11:docs/adr/0007-status-semantic-tokens.md"
  - id: oklch-migration
    resource: "archive:94d9b11:docs/migration/hsl-to-oklch.md"
  - id: tokens-css
    resource: "src/styles/tokens.css"
generated:
  by: "claude-code/opus-5"
  at: "2026-08-11"
status: stable
---

# The rule that makes tokens matter

Components in `src/components/**` **must** consume semantic tokens. Literal Tailwind color
utility classes (`bg-emerald-500`, `text-red-600/40`, `border-amber-500`) are **banned in
source** and blocked by a build gate.[^adr-0007]

This is a correctness rule, not a style preference: `bg-emerald-500` resolves to a fixed
hex independent of the active theme, so switching from `violet-forge` to `dracula`
silently fails to propagate. See
[`/decisions/adr-0004-no-literal-tailwind-colors.md`](/decisions/adr-0004-no-literal-tailwind-colors.md).

Choose the token that describes **intent**, not appearance. "What is this color *for*?"
never "what hue do I want?"

# Schema — the four groups

## 1. Brand

| Token | Role |
| --- | --- |
| `--primary` | The one dominant CTA per context |
| `--primary-deep` | Pressed state |
| `--primary-glow` | Hover halo |
| `--primary-foreground` | Text on primary |
| `--accent` | Celebration: critical success, milestones, beta tags |
| `--accent-deep` | Deep accent |
| `--accent-foreground` | Text on accent |

`--primary-deep`, `--primary-glow`, and `--accent-deep` are **optional** on `ColorScale`.
When omitted they derive algorithmically in CSS — see
[`/decisions/adr-0006-algorithmic-tonal-derivations.md`](/decisions/adr-0006-algorithmic-tonal-derivations.md).

## 2. Surface

`--background`, `--foreground`, `--card`, `--card-foreground`, `--popover`,
`--popover-foreground`, `--muted`, `--muted-foreground`, `--secondary`,
`--secondary-foreground`, `--border`, `--input`, `--ring`.

## 3. Action result (semantic)

The outcome of a **discrete operation**. "Form saved", "API failed", "Validation warning",
"Tip available".

`--success`, `--destructive`, `--warning`, `--info`, each with a `-foreground` companion.

## 4. Operational state (status)

The **liveness of a long-running system**. "Gateway online", "Gateway degraded".

`--status-online`, `--status-offline`, `--status-degraded`, `--status-info`, each with a
`-foreground` companion.

**Groups 3 and 4 are deliberately distinct.** Built-in themes initially mirror one onto
the other (online ← success, offline ← destructive, degraded ← warning), so behavior is
visually identical pre/post migration. The separation exists so a custom theme can make
"positive action green" differ from "system online green" without forking every component.
Rationale in [`/decisions/adr-0007-status-semantic-tokens.md`](/decisions/adr-0007-status-semantic-tokens.md).

# Canonical format: OKLCH

```css
--primary: oklch(0.542 0.245 293);
--primary-foreground: oklch(1 0 0);
```

`COLOR_VALUE_PATTERN` (`src/themes/color-value-pattern.ts`) accepts OKLCH and oklab
(including relative-color syntax), hex, `rgb`/`rgba`, `hsl`/`hsla`, `lab`, `lch`, `color`,
**legacy HSL split** (`"262 83% 58%"` — backward compat), `var(--token)` references, and
the CSS keywords `transparent` / `currentColor`.

Alpha composition uses `color-mix(in oklch, var(--primary) 25%, transparent)`, **not**
`hsl(var(--primary) / 0.25)` — the latter breaks once `--primary` is OKLCH. Full rationale
and browser-support numbers in
[`/decisions/adr-0005-oklch-as-canonical-color-format.md`](/decisions/adr-0005-oklch-as-canonical-color-format.md);
the upgrade path is [`/migrations/hsl-to-oklch.md`](/migrations/hsl-to-oklch.md).

# Reference values — Violet Forge (pre-OKLCH HSL split)

These were the normative values before the OKLCH migration. They remain useful as the
perceptual reference for what the OKLCH triplets encode, and they still validate.

## Light mode

```
--background:          0 0% 100%       /* #FFFFFF — pure white, Vercel-style */
--foreground:          0 0% 4%         /* #0A0A0A */
--card:                0 0% 100%       /* #FFFFFF */
--popover:             0 0% 100%
--primary:             262 83% 58%     /* #7C3AED — Theo violet */
--primary-deep:        263 70% 42%     /* #5B21B6 — pressed */
--primary-glow:        263 90% 76%     /* #A78BFA — hover halo */
--secondary:           0 0% 96%        /* #F5F5F5 */
--accent:              15 54% 53%      /* #C96442 — burnt sienna */
--accent-deep:         15 55% 40%      /* #9C4A2E */
--muted:               0 0% 96%
--muted-foreground:    0 0% 45%        /* #737373 */
--border:              0 0% 91%        /* #E8E8E8 — Vercel-style hairline */
--input:               0 0% 91%
--ring:                262 83% 58%
--success:             142 71% 36%     /* #16A34A */
--warning:             33 92% 44%      /* #D97706 */
--destructive:         0 72% 51%       /* #DC2626 */
--info:                217 91% 60%     /* #3B82F6 */
```

## Dark mode (dominant)

```
--background:          0 0% 4%         /* #0A0A0A */
--foreground:          0 0% 96%        /* #F5F5F5 */
--card:                0 0% 7%         /* #121212 */
--popover:             0 0% 9%         /* #171717 */
--primary:             262 83% 58%     /* same hue across modes */
--secondary:           0 0% 11%        /* #1C1C1C */
--accent:              15 54% 53%
--muted:               0 0% 11%
--muted-foreground:    0 0% 60%        /* #999 — Vercel gray-500 */
--border:              0 0% 16%        /* #292929 */
--ring:                262 83% 58%
--success:             152 79% 52%     /* #22E58C */
--warning:             38 92% 50%      /* #F59E0B */
--destructive:         350 100% 65%    /* #FF4F6D */
--info:                213 100% 70%    /* #5FB3FF */
```

Note the hue-holding invariant: `--primary` and `--accent` are identical across modes.
Only surfaces and semantic states re-tune.

# Migration cheat sheet

Replacing a literal Tailwind class means picking a group first.

| Literal | Action result | Operational state |
| --- | --- | --- |
| `bg-emerald-500`, `bg-green-500` | `bg-success` | `bg-status-online` |
| `bg-red-500`, `bg-rose-500` | `bg-destructive` | `bg-status-offline` |
| `bg-amber-500`, `bg-yellow-500` | `bg-warning` | `bg-status-degraded` |
| `bg-blue-500`, `bg-sky-500` | `bg-info` | `bg-status-info` |
| `bg-blue-500`, `bg-indigo-500` | `bg-primary` (brand surface) | — |
| `bg-gray-100`, `bg-slate-100` | `bg-muted` (neutral background) | — |
| `bg-gray-200`, `bg-zinc-200` | `bg-secondary` (neutral button) | — |

# Tailwind v4 indirection

`tokens.css` declares the runtime variables that `<ThemeProvider>` mutates at the
`[data-theme]` cascade. `tokens-v4.css` layers Tailwind v4 `@theme` aliases on top:

```css
@theme {
  --color-primary: var(--primary);
}
```

The v3 variable layer is deliberately preserved rather than renamed, because six component
files read `hsl(var(--primary))` directly and `<ThemeProvider>` injects the v3 vars at
runtime. The indirection costs one token resolution step. See
[RFC 0008 § follow-up D9](/rfcs/0008-vite-plugin-and-preset.md).
