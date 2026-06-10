# ADR-0006 — Algorithmic Tonal Derivations via `oklch(from ...)`

| Field | Value |
| --- | --- |
| Status | **Accepted** |
| Date | 2026-06-03 |
| Plan | `.claude/knowledge-base/plans/theo-ui-community-best-practices-alignment-plan.md` |
| Related ADRs | ADR-0005 (OKLCH canonical), ADR-0004 (no literal Tailwind colors) |
| Cross-refs | D2, T3.1, T3.2, EC-7 |

## Context

Pre-T3.1, `--primary-deep` and `--primary-glow` were maintained as explicit OKLCH values for every theme × mode combination (`10 themes × 2 modes × 2 tonal variants = 40 values`). Same for `--accent-deep` (`20 values`). These values were hand-tuned to feel like "pressed" / "hover halo" / "deep accent" of the base color, but the relationship between `primary` and `primary-deep` was effectively the same per theme: darken the lightness, hold chroma and hue.

OKLCH relative-color syntax (CSS Color Module 5) expresses exactly that relationship:

```css
--primary-deep: oklch(from var(--primary) calc(l - 0.16) c h);
```

Browser support: Chrome 119+ (oct/2023), Safari 16.4+ (mar/2023), Firefox 128+ (jul/2024). Coverage approximately 92% globally as of 2026-06 (caniuse). The remaining ~8% legacy browsers fall back gracefully (the property becomes unset, cascade resolves to the parent value or the foundational neutral).

## Decision

`src/styles/tokens.css` declares `--primary-deep`, `--primary-glow`, and `--accent-deep` via OKLCH relative-color syntax with `max()`/`min()` clamps (EC-7 absorbed):

```css
--primary: oklch(0.542 0.245 293);
--primary-deep: oklch(from var(--primary) max(0.05, calc(l - 0.16)) c h);
--primary-glow: oklch(from var(--primary) min(0.95, calc(l + 0.18)) c h);

--accent: oklch(0.621 0.132 39);
--accent-deep: oklch(from var(--accent) max(0.05, calc(l - 0.13)) c h);
```

The `max(0.05, ...)` floor prevents themes with very-dark primaries (e.g., `aurora-terminal` could push the derived L below 0) from clipping to pure black and losing semantic distinction. The `min(0.95, ...)` ceiling prevents glow clipping to white in light themes.

In `ColorScale` (`src/themes/types.ts`), the three derived tokens are now `optional`. In valibot's `themeSchema` (`src/themes/schema.ts`), they are wrapped in `v.optional()`. When a consumer authors a custom theme via `defineTheme({ light: { primary: hex("#0EA5E9") } })` and omits the tonal variants, CSS auto-derives them — no manual tuning required.

### Per-theme override path

The 10 built-in themes continue to declare explicit values for `primary-deep`, `primary-glow`, and `accent-deep`. The cascade resolves theme-specific (`[data-theme="<name>"]`) → `:root` default. Themes that want a distinct aesthetic relationship (e.g., a more saturated glow) keep their explicit values. Themes that want algorithmic derivation simply omit them.

We chose **not to strip the explicit values from the 10 built-in themes** (T3.3 in the plan) because:

1. The current values were tuned for visual identity (each theme has a slightly different relationship between base and deep). Stripping would force every theme into the same derivation formula and lose subtle differentiation.
2. The cost of keeping them is small: the values are inline in the theme `.ts` files; consumer bundle is unchanged.
3. The benefit of derivation (zero-tuning custom themes) is preserved via the cascade default.

If a future revisit decides the differentiation is not worth the maintenance, the strip can happen mechanically (`scripts/migrate-themes-to-oklch.ts` extension or a follow-up codemod).

## Consequences

### Positive

- Custom themes via `defineTheme()` don't need to declare tonal scales — sensible defaults derived in CSS.
- Adding new tonal variants in the future (`primary-soft`, `primary-mute`, ...) is a tokens.css change, not a 10-themes-edit chore.
- Composable with `color-mix(in oklch, ...)` shadows (ADR-0005) — same color space, consistent visual.
- Consumer documentation simplifies: "primary is the only required tonal — the rest derive."

### Negative

- ~8% legacy browser fallback is degraded: tonal variants resolve to `unset` and the cascade picks up the parent foreground. Visually noticeable for users on pre-2024 Firefox/Safari but not broken.
- Tests that assert specific `primary-deep` computed values must use tolerance bands (the CSS computed value may differ from a static OKLCH triplet by sub-perceptible amounts due to the `max()`/`min()` clamp boundary).

### Known limitations

- Tonal derivation only covers `primary` and `accent`. Status group (ADR-0007) and semantic group (`success`, `destructive`, `warning`, `info`) still use explicit values per theme. Extending derivation to those is plausible but premature without a real consumer ask.

## Alternatives Considered

### A1 — `color-mix(in oklch, var(--primary), black 16%)`

Pros: broader browser support (`color-mix` is at ~93%, vs `oklch(from ...)` at ~92%). Cons: `color-mix` blends in a path that does not preserve the perceived hue cleanly when mixed with neutrals — output is slightly less saturated than the OKLCH relative-syntax counterpart. Visual A/B showed `oklch(from ...)` matched the hand-tuned values more closely.

### A2 — Build-time codegen of all tonal variants

Pros: zero runtime CSS feature dependency. Cons: removes the consumer-side ergonomic win (custom themes still need to declare tonal scales or run a build step). Adds tooling complexity for marginal benefit since browser support is already ~92%.

### A3 — Pre-compute tonal scales via JS at runtime in `<ThemeProvider>`

Rejected. Adds JS bundle weight, runs on every theme switch, defeats the static-CSS approach that makes Theo UI snappy. Browser-native CSS feature is the right layer.

## References

- Implementation: `src/styles/tokens.css` (`--primary-deep`, `--primary-glow`, `--accent-deep` declarations).
- Type changes: `src/themes/types.ts` (optional fields), `src/themes/schema.ts` (`v.optional(colorValueSchema)`).
- Plan: T3.1 (declare derivations), T3.2 (mark optional), T3.3 (skipped — see "Per-theme override path"), T3.4 (this ADR).
