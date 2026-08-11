---
type: Design Policy
title: Accessibility contract
description: The WCAG targets @theokit/ui commits to, the automated contrast and axe gates, forced-colors support, and the known limitations that are documented rather than hidden.
tags: [design-system, accessibility, wcag, a11y, gated, forced-colors]
sources:
  - id: gates-doc
    resource: "git:94d9b11:docs/quality-gates.md"
  - id: ds-doc
    resource: "git:94d9b11:docs/design-system.md"
  - id: adr-0008
    resource: "git:94d9b11:docs/adr/0008-forced-colors-whcm-support.md"
  - id: rfc-0007
    resource: "git:94d9b11:docs/rfcs/0007-seven-themes.md"
generated:
  by: "claude-code/opus-5"
  at: "2026-08-11"
status: stable
---

# What a component must satisfy

Gate 4 of the [gate catalog](/quality-gates/gate-catalog.md). A component passes only if:

- [ ] Interactive elements are reachable by keyboard.
- [ ] Focus states are visible and tokenized.
- [ ] Icon-only buttons have accessible names.
- [ ] Dialogs trap focus, restore focus, and expose title and description correctly.
- [ ] Menus, tabs, command palettes, and segmented controls support the expected keyboard
      behavior.
- [ ] Loading and running states are announced or semantically represented when needed.
- [ ] Disabled states are real `disabled` or `aria-disabled` with matching event handling.
- [ ] **Color is never the only status indicator.**

For a command surface such as `MentionMenu`, substring filtering plus click selection is
**not enough**. Expected behavior includes an active item, arrow keys, Enter selection,
Escape close, and useful ranking.

# Automated gates

## `validateThemeContrast` — WCAG 2.x AA

Audits all 10 themes × 2 modes × 8 critical pairs.

| Pair class | Ratio required | Pairs |
| --- | --- | --- |
| Body | **4.5:1** | background↔foreground, card↔card-foreground, popover↔popover-foreground |
| Large | **3:1** | primary↔primary-foreground, secondary↔secondary-foreground, accent↔accent-foreground, destructive↔destructive-foreground, muted↔muted-foreground |

Runs in under 50ms, so regressions surface in the dev loop rather than in CI. Standalone
runner: `pnpm quality:contrast` (`--update` rebaselines). Baseline lives at
`tests/contrast/contrast-baseline.json`. `scripts/lib/wcag-contrast.ts` delegates to
culori, so it accepts both HSL split and OKLCH and kept working across the migration.

Two themes needed adjustment to pass at authoring time: `classic-paper` darkened its
accent, `openai-style` darkened its primary.

## `validateAxeCoverage`

vitest-axe assertions are required on **at least 30 interactive primitives**. Run via
`pnpm quality:a11y`. Engines are excluded — they are not barrel exports.

## `quality:visual`

Playwright snapshot diff: 5 surfaces × 10 themes × 2 modes = 100 committed PNGs, plus 4
tonal-derivation clamp tests and 1 smoke spec. Threshold 0.001 pixel diff, animations
disabled, font load awaited. CI runs under
`mcr.microsoft.com/playwright:v1.49.0-jammy` to keep font rendering deterministic.

# Tap targets

Target is **WCAG 2.5.8 Level AA** (24×24 effective). AAA (2.5.5, 44×44) is deliberately
not targeted at the default density. Full table in
[`/design-system/density.md`](/design-system/density.md).

# Reduced motion

Global `@media (prefers-reduced-motion: reduce)` block in `tokens.css` zeroes duration
tokens and neutralizes animation. Components whose animation carries meaning prefix with
`motion-safe:`. See [`/design-system/motion.md`](/design-system/motion.md).

# Forced colors (Windows High Contrast Mode)

`tokens.css` maps semantic tokens to CSS system colors under
`@media (forced-colors: active)`. Both light and dark cascades collapse into the system
palette — in WHCM the OS owns color, so theme switching is intentionally a no-op.
Decorative textures opt out with `forced-color-adjust: none`.

Satisfies WCAG 2.2 SC 1.4.1 and SC 1.4.3 automatically for any app inheriting
`@theokit/ui/tokens.css`. Details in
[`/decisions/adr-0008-forced-colors-whcm-support.md`](/decisions/adr-0008-forced-colors-whcm-support.md).

# Known limitations (documented, not hidden)

| Limitation | Status |
| --- | --- |
| WHCM has no semantic system color for success / error / warning — all status tokens collapse to `Highlight`, so "online" is indistinguishable from "selected text". | Accepted. WCAG permits it: WHCM users rely on text and icons, not color. This is exactly why "color is never the only status indicator" is a hard rule. |
| Custom themes cannot override WHCM behavior — the mapping lives in `tokens.css :root`, not in theme objects. | Accepted. WHCM is OS-driven, not theme-driven. |
| Tonal derivations degrade on ~8% of browsers predating `oklch(from …)`. Variants resolve to `unset` and the cascade picks up the parent. | Visually noticeable, not broken. Tracked in [ADR-0006](/decisions/adr-0006-algorithmic-tonal-derivations.md). |
| `quality:visual` matrix expansion beyond the committed surfaces is incomplete. | Tracked in `tests/visual/README.md`. |
