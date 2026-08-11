---
type: Architecture Decision Record
title: "ADR-0006 — Algorithmic tonal derivations via oklch(from ...)"
description: Deriving primary-deep, primary-glow and accent-deep in CSS with clamps, so a custom theme only has to declare its base color.
tags: [adr, color, oklch, tokens, css, theming]
sources:
  - id: adr
    resource: "git:94d9b11:docs/adr/0006-algorithmic-tonal-derivations.md"
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
| Related | [ADR-0005](/decisions/adr-0005-oklch-as-canonical-color-format.md) |

# Context

`--primary-deep` and `--primary-glow` were maintained as explicit values for every theme ×
mode combination — 10 × 2 × 2 = 40 values, plus 20 more for `--accent-deep`. Each was
hand-tuned to feel like the "pressed" or "hover halo" of the base color, but the underlying
relationship was effectively identical per theme: **darken the lightness, hold chroma and
hue**.

OKLCH relative-color syntax (CSS Color Module 5) expresses exactly that.

# Decision

`src/styles/tokens.css` declares the three derived tokens via relative-color syntax with
`max()` / `min()` clamps:

```css
--primary: oklch(0.542 0.245 293);
--primary-deep: oklch(from var(--primary) max(0.05, calc(l - 0.16)) c h);
--primary-glow: oklch(from var(--primary) min(0.95, calc(l + 0.18)) c h);

--accent: oklch(0.621 0.132 39);
--accent-deep: oklch(from var(--accent) max(0.05, calc(l - 0.13)) c h);
```

## Why the clamps

The `max(0.05, …)` floor prevents a theme with a very dark primary (`aurora-terminal` could
push derived `L` below zero) from clipping to pure black and losing semantic distinction.
The `min(0.95, …)` ceiling prevents the glow clipping to white in light themes. This was
EC-7, absorbed into the shipped design rather than left as a known bug.

## Type changes

In `ColorScale` the three derived tokens became **optional**, and in the valibot schema
they are wrapped in `v.optional()`. A consumer writing
`defineTheme({ light: { primary: hex("#0EA5E9") } })` and omitting the tonal variants gets
them auto-derived in CSS with no manual tuning.

# The built-in themes keep their explicit values

The ten built-ins still declare `primary-deep`, `primary-glow`, and `accent-deep`
explicitly. The cascade resolves theme-specific (`[data-theme="<name>"]`) over the `:root`
derivation.

Stripping them was **considered and deliberately not done**:

1. The current values were tuned for visual identity — each theme has a slightly different
   relationship between base and deep. Stripping would force every theme into one formula
   and lose that differentiation.
2. The cost of keeping them is small: inline values in the theme files; consumer bundle
   unchanged.
3. The benefit of derivation — zero-tuning custom themes — is fully preserved via the
   cascade default.

If a future revisit decides the differentiation is not worth the maintenance, the strip is
mechanical.

# Browser support

`oklch(from …)`: Chrome 119+ (Oct 2023), Safari 16.4+ (Mar 2023), Firefox 128+ (Jul 2024).
Roughly 92% globally as of 2026-06.

# Consequences

**Positive.** Custom themes need only declare `primary` — "primary is the only required
tonal, the rest derive" is the documented consumer story. Adding a future tonal variant
(`primary-soft`, `primary-mute`) becomes a `tokens.css` change rather than a ten-theme
chore. Composable with the `color-mix(in oklch, …)` shadows from ADR-0005, in the same
color space.

**Negative.** The ~8% of browsers predating `oklch(from …)` degrade: variants resolve to
`unset` and the cascade picks up the parent foreground. Noticeable on pre-2024
Firefox/Safari, not broken. Tests asserting specific `primary-deep` computed values must
use tolerance bands, because the clamp boundary shifts the value sub-perceptibly.

# Known limitation

Derivation covers **only** `primary` and `accent`. The status group
([ADR-0007](/decisions/adr-0007-status-semantic-tokens.md)) and the action-result group
still use explicit per-theme values. Extending derivation there is plausible but premature
without a real consumer ask.

# Rejected alternatives

| Alternative | Why not |
| --- | --- |
| `color-mix(in oklch, var(--primary), black 16%)` | Slightly broader support (~93% vs ~92%), but mixing with a neutral does not preserve perceived hue cleanly — output is less saturated. Visual A/B showed `oklch(from …)` matched the hand-tuned values more closely. |
| Build-time codegen of all tonal variants | Zero runtime CSS-feature dependency, but removes the consumer-side win: custom themes would still need to declare tonal scales or run a build step. |
| Pre-compute at runtime in `<ThemeProvider>` | Adds JS weight, runs on every theme switch, defeats the static-CSS approach. A browser-native CSS feature is the right layer. |
