# Design system — Violet Forge

The normative design specification for `@theokit/ui`. Drift between these concepts and
`src/styles/tokens.css`, `src/styles/tailwind-preset.ts`, or `src/themes/*.ts` is a bug in
these concepts — the code is authoritative, and `validateDocsTypography` plus
`validateThemeContrast` enforce parts of the alignment mechanically.

| Concept | What it answers |
| --- | --- |
| [Identity](/design-system/violet-forge-identity.md) | What Violet Forge is and what it deliberately is not. |
| [Color tokens](/design-system/color-tokens.md) | Every semantic token, the four color groups, and the OKLCH format. |
| [Typography](/design-system/typography.md) | Geist Sans / Geist Mono and the Vercel-derived type scale. |
| [Spacing, radii, elevation](/design-system/spacing-radii-elevation.md) | The 4px scale, the seven radii, the shadow tokens. |
| [Motion](/design-system/motion.md) | Easings, durations, the named motion patterns, reduced-motion. |
| [Density](/design-system/density.md) | `compact` / `comfortable` / `spacious` and why explicit `size` always wins. |
| [Themes](/design-system/themes.md) | The ten built-in themes, `ThemeProvider`, `defineTheme`, SSR. |
| [Accessibility](/design-system/accessibility.md) | WCAG targets, contrast gate, forced colors, tap targets. |
| [Anti-glass principle](/design-system/anti-glass.md) | Why no surface uses `backdrop-filter`. |

## The short version

Violet Forge keeps the canonical Theo violet `#7C3AED` as `primary` and pairs it with a
burnt-sienna `#C96442` accent. Surfaces are Vercel-aligned pure neutrals — no hue tint on
background or cards. Color is reserved for primary, accent, and semantic state. Geist Sans
and Geist Mono throughout. Dark-first, but
[`prefers-color-scheme` is respected by default](/decisions/adr-0009-prefers-color-scheme-default.md).

Historical context for how this identity was selected sits in
[`/history/design-directions-2026-05.md`](/history/design-directions-2026-05.md) and
[`/history/competitor-design-audit-2026-05.md`](/history/competitor-design-audit-2026-05.md).
