---
type: Architecture Decision Record
title: "ADR-0005 — OKLCH as the canonical color format"
description: Why the HSL split format was replaced, what still validates, the browser-support numbers, and the precision cost that remains.
tags: [adr, color, oklch, tokens, migration, browser-support]
sources:
  - id: adr
    resource: "archive:94d9b11:docs/adr/0005-oklch-as-canonical-color-format.md"
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
| Related | [ADR-0004](/decisions/adr-0004-no-literal-tailwind-colors.md), [ADR-0006](/decisions/adr-0006-algorithmic-tonal-derivations.md), [ADR-0007](/decisions/adr-0007-status-semantic-tokens.md) |

# Context

Before 2026-06-03, all ten built-in themes used the HSL split format inherited from
shadcn/ui's pre-Tailwind-v4 convention: each `ColorScale` token was a string `"H S% L%"`
with no `hsl()` wrapper, consumed in CSS as `hsl(var(--primary))`.

Three concrete problems:

1. **Not perceptually uniform.** Equal HSL `L` deltas do not produce equal perceived
   brightness. `hsl(60 100% 50%)` (yellow) looks brighter than `hsl(240 100% 50%)` (blue)
   at identical `L`. Authoring a tonal triplet was trial-and-error per theme.
2. **No algorithmic derivation.** `--primary-deep` and `--primary-glow` had to be
   hand-tuned for every theme × mode — 10 × 2 × 2 = **40 values maintained by hand**. CSS
   exposes no HSL relative-color syntax, and `color-mix(in hsl, …)` blends through
   saturation incorrectly.
3. **Copy-paste friction.** Since the September 2024 shadcn v4 cohort, new components ship
   OKLCH-first. Converting back to HSL split at copy time is error-prone and reverses the
   benefit of an OSS foundation.

The community — shadcn, Radix Colors, Tailwind v4, Linear, Vercel — converged on OKLCH in
2024.

# Decision

All built-in themes and the `tokens.css` defaults are expressed in OKLCH.

$$
\text{oklch}(L\ C\ H)\quad\text{e.g.}\quad \texttt{--primary: oklch(0.542\ 0.245\ 293)}
$$

`ColorScale` values remain typed as `string`. `COLOR_VALUE_PATTERN`
(`src/themes/color-value-pattern.ts`) accepts OKLCH and oklab (including relative-color
syntax), hex, `rgb`/`rgba`, `hsl`/`hsla`, `lab`, `lch`, `color`, **legacy HSL split** for
backward compatibility, `var(--token)` references, and CSS keywords.

The Tailwind v4 aliases in `tokens-v4.css` drop the `hsl()` wrapper:

```css
@theme {
  --color-primary: var(--primary);   /* was: hsl(var(--primary)) */
}
```

Shadows, texture utilities, and the `pulse-glow` keyframe compose alpha via
`color-mix(in oklch, var(--primary) 25%, transparent)` instead of
`hsl(var(--primary) / 0.25)`.

Runtime helpers `hex()` and `rgb()` (`src/themes/color.ts`) now return OKLCH. Legacy
`hexToHsl()` and `rgbToHslLegacy()` are kept one minor for backward compatibility.

Theme validation is layered: **valibot** validates shape and types; **`COLOR_VALUE_PATTERN`**
validates each individual value is safe to interpolate into CSS.

# Migration tooling

`scripts/migrate-themes-to-oklch.ts` performs the one-shot conversion: walks
`src/styles/tokens.css` and the ten theme files, converts HSL split to OKLCH (3-decimal
L/C, 1-decimal H), and writes back atomically with `.bak` backups.

EC-4 absorbed: **composed values are explicitly skipped** — a shadow like
`hsl(var(--foreground) / 0.06)` is not a color literal, and blindly converting it would
produce nonsense. Those were migrated by hand to `color-mix(in oklch, …)`.

`scripts/lib/color.ts` (`hslSplitToOklch`, `oklchToHslSplit`, `parseColorScaleValue`)
provides the round-trip helpers shared by the migration script and the WCAG contrast
auditor.

# Browser support

| Feature | Chrome | Safari | Firefox | Edge | Global coverage (2026-06) |
| --- | --- | --- | --- | --- | --- |
| OKLCH | 111+ | 15.4+ | 113+ | 111+ | ~95% |
| `color-mix()` | 111+ | 16.2+ | 113+ | 111+ | ~95% |

The remaining ~5% degrade gracefully: an unparseable color resolves to an unset property,
yielding the cascade default. Visually degraded, not broken.

# Consequences

**Positive.** Tonal derivations become first-class CSS
([ADR-0006](/decisions/adr-0006-algorithmic-tonal-derivations.md)). Theme switching
propagates correctly through `color-mix` shadows and textures. shadcn copy-paste is
zero-friction at the value layer. Bundle delta is minimal — the only runtime addition is
valibot at ~1.5 KB gzipped. The contrast gate kept working through the migration because
`valueToLuminance()` delegates to culori and accepts both formats.

**Negative.** HSL → OKLCH → HSL round-trip is **not lossless** (delta ~0.001 L). Visually
equivalent (< 0.5% pixel diff per theme), but value comparisons must use a tolerance.
Documentation citing HSL examples had to be refreshed. Consumers authoring custom themes
must update their mental model — or keep using HSL split, which still validates.

# Known limitation

The ~5% legacy-browser fallback is **not actively tested**. If a real adoption signal
emerges, revisit to add a PostCSS plugin emitting HSL fallback declarations alongside OKLCH
(similar to `postcss-oklab-function`).

# Rejected alternatives

| Alternative | Why not |
| --- | --- |
| Stay on HSL split | Diverges from the community, blocks ADR-0006, no path to algorithmic tonal scales. |
| OKLCH in `tokens.css` only, themes stay HSL | Themes are the consumer-facing authoring surface — that is where the ergonomic win lives. Mixing formats also blocks the `tokens-v4.css` cleanup. |
| The `light-dark()` CSS function | **Deferred.** Requires `color-scheme` at `:root` and sits at ~88% support. The `data-theme` + `.dark` strategy is more flexible (supports theme switching beyond mode) and works on 100% of supported browsers today. Revisit Q4 2026. |

# Upgrade path

[`/migrations/hsl-to-oklch.md`](/migrations/hsl-to-oklch.md).
