---
type: Token Reference
title: Spacing, radii, and elevation tokens
description: The 4px spacing scale, the seven radius steps with their intended surfaces, and the theme-reactive shadow tokens.
tags: [design-system, tokens, spacing, radius, shadow]
sources:
  - id: ds-doc
    resource: "archive:94d9b11:docs/design-system.md"
  - id: tokens-css
    resource: "src/styles/tokens.css"
generated:
  by: "claude-code/opus-5"
  at: "2026-08-11"
status: stable
---

# Spacing

Base 4px. Tokens are `--space-N` where `N` is the value in pixels.

```
--space-1:   4px      --space-8:   32px
--space-2:   8px      --space-10:  40px
--space-3:  12px      --space-12:  48px
--space-4:  16px      --space-16:  64px
--space-5:  20px      --space-20:  80px
--space-6:  24px      --space-24:  96px
                      --space-32: 128px
```

Card padding at the default `md` density is `--space-5` (20px). See
[`/design-system/density.md`](/design-system/density.md).

# Radii

Each step has an intended surface. Picking by feel rather than by role is how a design
system drifts.

| Token | Value | Intended for |
| --- | --- | --- |
| `--radius-none` | 0px | — |
| `--radius-sm` | 4px | Dense tables, utility controls |
| `--radius-md` | 6px | Inputs, small buttons |
| `--radius-lg` | 10px | Buttons, small cards |
| `--radius-xl` | 14px | Default cards |
| `--radius-2xl` | 20px | Hero cards, modals |
| `--radius-full` | 9999px | Badges, pills |

`--radius: 14px` is also exposed bare, for shadcn compatibility.

# Elevation

Shadow tokens derive from `--foreground` (ink) and `--primary` (the signature glow), so
they **recolor automatically when the theme swaps**. A hardcoded `rgba(0,0,0,0.1)` would
not.

```
--shadow-sm:    0 1px 2px 0 hsl(var(--foreground) / 0.06)
--shadow-md:    0 2px 8px -2px hsl(var(--foreground) / 0.08),
                0 1px 3px hsl(var(--foreground) / 0.06)
--shadow-lg:    0 12px 32px -8px hsl(var(--foreground) / 0.12),
                0 4px 12px hsl(var(--foreground) / 0.08)
--shadow-glow:        0 0 24px hsl(var(--primary) / 0.25)
--shadow-glow-strong: 0 0 32px hsl(var(--primary) / 0.4)
```

In dark mode ink shadows are heavier (pure black against a dark surface reads as almost
nothing otherwise) and the glow brightens.

**Post-OKLCH note:** composed alpha in shadows migrated to
`color-mix(in oklch, var(--foreground) 6%, transparent)`. The `hsl(var(--x) / a)` form
above is the pre-migration shape, preserved here because the v3 runtime variable layer is
deliberately retained — see [`/design-system/color-tokens.md`](/design-system/color-tokens.md)
§ Tailwind v4 indirection.

`--shadow-glow` is reserved for CTAs. Material-style heavy blur shadows are a refused
aesthetic; so is `backdrop-filter` on any surface
([`/design-system/anti-glass.md`](/design-system/anti-glass.md)).
