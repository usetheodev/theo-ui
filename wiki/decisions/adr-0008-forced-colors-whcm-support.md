---
type: Architecture Decision Record
title: "ADR-0008 — Forced colors (Windows High Contrast Mode) support"
description: Mapping semantic tokens to CSS system colors under forced-colors, opting decorative textures out, and the semantic collapse that WCAG accepts.
tags: [adr, accessibility, wcag, forced-colors, whcm, enterprise]
sources:
  - id: adr
    resource: "git:94d9b11:docs/adr/0008-forced-colors-whcm-support.md"
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

# Context

Windows High Contrast Mode (WHCM, "forced colors") overrides page colors with a
user-selected system palette. Browsers expose it via `@media (forced-colors: active)` and
the `forced-color-adjust` property. WCAG 2.2 SC 1.4.1 (Use of Color) and SC 1.4.3
(Contrast) require the UI to remain usable — enterprise and government adoption depends on
it.

Before this change, `@theokit/ui` rendered correctly in WHCM **by accident** (Tailwind and
Radix defaults are mostly system-color-aware), but the brand surfaces — `--primary`,
`--accent`, hover states like `bg-primary/10`, decorative textures — either inverted into
solid blocks or disappeared into the system background.

# Decision

`src/styles/tokens.css` declares a `@media (forced-colors: active)` block mapping the
semantic tokens to CSS system colors:

```css
@media (forced-colors: active) {
  :root, .dark {
    --background: Canvas;
    --foreground: CanvasText;
    --primary: Highlight;
    --primary-foreground: HighlightText;
    --secondary: ButtonFace;
    --secondary-foreground: ButtonText;
    --border: ButtonBorder;
    --ring: Highlight;
    /* … */
  }
  .bg-dotted-violet,
  .bg-dotted-violet-strong,
  .bg-hero-glow,
  .bg-paper-grain {
    forced-color-adjust: none;
  }
}
```

Both cascades — light and dark — collapse into the system palette. **In WHCM the OS owns
color choice, so theme switching is intentionally a no-op.**

Decorative textures opt out via `forced-color-adjust: none`: they are visual flourish, not
semantic content, and would otherwise invert into harsh solid patterns.

# Consequences

**Positive.** WCAG 2.2 SC 1.4.1 and SC 1.4.3 satisfied for the built-in component surface.
Enterprise and government adoption unblocked. Zero JavaScript cost — one CSS media query
block.

**Negative (EC-15, documented not hidden).** WHCM defines no semantic system color for
success / error / warning. Through the inherited cascade, `--status-online`, `--success`,
`--status-info` all resolve to `Highlight`. **"Online" becomes indistinguishable from
"selected text."**

WCAG accepts this, because WHCM users rely on text and icons for semantic distinction
rather than color. It is also precisely why "color is never the only status indicator" is a
hard rule in [`/design-system/accessibility.md`](/design-system/accessibility.md) — a
component that leans on color alone becomes unusable here, and the rule is what prevents
that.

# Known limitation

Custom themes registered via `registerTheme()` inherit the same WHCM mapping — it lives in
`tokens.css :root`, not in theme objects. Consumers cannot override WHCM behavior
per-theme. Acceptable: WHCM is OS-driven, not theme-driven.

# Rejected alternatives

| Alternative | Why not |
| --- | --- |
| JS-side detection plus per-theme WHCM overrides | WHCM is a CSS feature. Handling it in JS adds complexity for zero benefit. |
| Skip WHCM entirely | Blocks enterprise and government adoption. WCAG compliance is non-negotiable for the target market. |

# References

- [`@media (forced-colors)`](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/forced-colors)
- [`forced-color-adjust`](https://developer.mozilla.org/en-US/docs/Web/CSS/forced-color-adjust)
- [WCAG 2.2 SC 1.4.1](https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html)
- [WCAG 2.2 SC 1.4.3](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html)
