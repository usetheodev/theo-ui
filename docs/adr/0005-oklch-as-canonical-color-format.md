# ADR-0005 — OKLCH as the Canonical Color Format

| Field | Value |
| --- | --- |
| Status | **Accepted** |
| Date | 2026-06-03 |
| Plan | `.claude/knowledge-base/plans/theo-ui-community-best-practices-alignment-plan.md` |
| Related ADRs | ADR-0004 (no literal Tailwind colors), ADR-0006 (algorithmic tonal derivations), ADR-0007 (status semantic tokens) |
| Cross-refs | D1, D2, D5 (revised — valibot), T2.1–T2.8 |

## Context

Pre-2026-06-03, the 10 built-in themes (`violet-forge`, `classic-paper`, `aurora-terminal`, `dracula`, `github-dark`, `one-dark`, `linear-glass`, `anthropic-style`, `openai-style`, `vercel-mono`) used the HSL split format inherited from shadcn/ui's pre-Tailwind-v4 convention: each `ColorScale` token was a string `"H S% L%"` (no `hsl()` wrapper), consumed in CSS via `hsl(var(--primary))`. The dual layer (`tokens.css` runtime vars + `tokens-v4.css` Tailwind v4 aliases) was the mechanism that bridged this split format to Tailwind's `@theme` namespace.

This format had three concrete problems:

1. **Not perceptually uniform.** Equal HSL `L` deltas do not produce equal perceived brightness changes — `hsl(60 100% 50%)` (yellow) looks brighter than `hsl(240 100% 50%)` (blue) despite identical `L`. This made manual tonal scale authoring (the `primary` / `primary-deep` / `primary-glow` triplet) trial-and-error per theme.

2. **No algorithmic tonal derivation.** With HSL, `--primary-deep` and `--primary-glow` had to be hand-tuned for every theme × mode (`10 themes × 2 modes × 2 variants = 40 values` maintained manually). CSS does not expose HSL relative-color syntax, and `color-mix(in hsl, ...)` blends through saturation incorrectly.

3. **Friction copy-pasting from shadcn upstream.** Since the September 2024 shadcn v4 cohort, new components ship OKLCH-first. Converting them back to HSL split at copy time is error-prone and reverses the benefit of an OSS foundation.

The community (shadcn, Radix Colors, Tailwind v4, Linear, Vercel) converged on OKLCH in 2024.

## Decision

All built-in themes and the `tokens.css` defaults are expressed in OKLCH:

```css
--primary: oklch(0.542 0.245 293);
--primary-foreground: oklch(1 0 0);
```

In `ColorScale` (`src/themes/types.ts`), token values remain typed as `string`, with the `COLOR_VALUE_PATTERN` regex (`src/themes/color-value-pattern.ts`) accepting:

- OKLCH and oklab (`oklch(L C H)`, `oklch(L C H / A)`, `oklch(from var(--x) calc(l - 0.16) c h)`)
- Hex, rgb/rgba, hsl/hsla, lab, lch, color
- Legacy HSL split (`"262 83% 58%"`) — backward compat for themes authored pre-T2.4
- `var(--token)` references, CSS keywords (`transparent`, `currentColor`)

The Tailwind v4 aliases in `tokens-v4.css` drop the `hsl()` wrapper:

```css
@theme {
  --color-primary: var(--primary);
  /* (was: hsl(var(--primary))) */
}
```

Shadows, texture utilities, and the `pulse-glow` keyframe compose alpha via `color-mix(in oklch, var(--primary) 25%, transparent)` instead of `hsl(var(--primary) / 0.25)`.

The runtime helpers `hex()` and `rgb()` (in `src/themes/color.ts`) return OKLCH (e.g., `hex("#7C3AED")` → `"oklch(0.542 0.245 293)"`). Legacy `hexToHsl()` and `rgbToHslLegacy()` are kept one-minor for backward compat.

Theme validation uses a layered defense: valibot (`src/themes/schema.ts`) validates shape and types; `COLOR_VALUE_PATTERN` validates each individual color value is safe to interpolate into CSS.

## Migration Tooling

`scripts/migrate-themes-to-oklch.ts` performs the one-shot conversion: walks `src/styles/tokens.css` and the 10 theme `.ts` files, converts HSL split values to OKLCH (3-decimal L/C, 1-decimal H), and writes back atomically with `.bak` backups. EC-4 absorbed: composed values (shadows: `hsl(var(--foreground) / 0.06)`) are explicitly skipped — they're migrated manually in T2.5 to `color-mix(in oklch, ...)`.

`scripts/lib/color.ts` (`hslSplitToOklch`, `oklchToHslSplit`, `parseColorScaleValue`) provides the round-trip helpers used by both the migration script and the WCAG contrast auditor.

## Browser Support

OKLCH: Chrome 111+, Safari 15.4+, Firefox 113+, Edge 111+ (since 2023). Coverage at the time of this decision is approximately 95% of installed browsers globally (caniuse, 2026-06).

`color-mix()`: Chrome 111+, Safari 16.2+, Firefox 113+. Same approximate coverage as OKLCH.

The remaining ~5% legacy browsers fall back gracefully: an unparseable color value resolves to an unset property, yielding the cascade default (typically `inherit`). The visual fallback is degraded but not broken.

## Consequences

### Positive

- Tonal derivations become first-class CSS (ADR-0006).
- Theme-switching propagates correctly through `color-mix(in oklch, ...)` shadows and textures (alpha composition is perceptually uniform now).
- Copy-paste of new shadcn components is zero-friction at the value layer.
- Bundle delta is minimal: `tokens.css` and `tokens-v4.css` are nearly the same size; the only runtime addition is valibot for theme validation (~1.5KB gzipped, T2.7).
- WCAG contrast gate (`validateThemeContrast` in `scripts/validate-quality-gates.ts`) accepts both HSL split and OKLCH via culori delegation in `valueToLuminance()`, so the gate continues working through and after migration.

### Negative

- Float precision: HSL → OKLCH → HSL round-trip is not lossless (delta ~0.001 L). Visually equivalent (< 0.5% pixel diff per theme), but value comparisons must use tolerance.
- Documentation refresh: `docs/design-system.md`, `docs/architecture.md`, and the live theme builder docs cite HSL examples that must be updated to OKLCH.
- Consumers authoring custom themes must update mental model from HSL to OKLCH (or continue using HSL split, which still validates).

### Known limitations

- The ~5% legacy browser fallback is not actively tested. If a real adoption signal emerges, ADR revisit to add a PostCSS plugin that emits HSL fallback declarations alongside OKLCH (similar to `postcss-oklab-function`).

## Alternatives Considered

### A1 — Stay with HSL split

Rejected. Diverges from the community, blocks ADR-0006, no path to algorithmic tonal scales.

### A2 — Use OKLCH only in `tokens.css`, keep themes in HSL split

Rejected. Themes are the consumer-facing authoring surface — adopting OKLCH there is the actual ergonomic win. Mixing formats would also break the cleanup of the `tokens-v4.css` aliases.

### A3 — Use the `light-dark()` CSS function

Deferred. `light-dark()` requires `color-scheme` declared at `:root`; browser support is ~88% (Safari 17.5+, Firefox 120+). Our `data-theme="<name>"` + `.dark` class strategy is more flexible (supports theme switch beyond mode) and works in 100% of supported browsers today. Revisit Q4 2026.

## References

- Implementation: `src/styles/tokens.css`, `src/styles/tokens-v4.css`, `src/themes/*.ts`, `src/themes/color.ts`, `src/themes/color-value-pattern.ts`, `src/themes/schema.ts`.
- Migration tooling: `scripts/migrate-themes-to-oklch.ts`, `scripts/lib/color.ts`.
- Gate: `scripts/lib/wcag-contrast.ts` (extended to accept any color format via culori delegation), `scripts/validate-quality-gates.ts > validateThemeContrast`.
- Plan: T2.1 (culori dep), T2.2 (migration script), T2.3 (tokens.css convert), T2.4 (themes convert), T2.5 (regex + tokens-v4), T2.6 (color.ts), T2.7 (valibot schema), T2.8 (this ADR).
