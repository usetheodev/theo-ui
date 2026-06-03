# ADR-0008 — Forced Colors (Windows High Contrast Mode) Support

| Field | Value |
| --- | --- |
| Status | **Accepted** |
| Date | 2026-06-03 |
| Plan | `.claude/knowledge-base/plans/theo-ui-community-best-practices-alignment-plan.md` |
| Cross-refs | D7, T5.2, EC-15 |

## Context

Windows High Contrast Mode (WHCM, also known as "forced colors") overrides web page colors with a user-selected system palette. Browsers expose this via `@media (forced-colors: active)` and the CSS `forced-color-adjust` property. WCAG 2.2 SC 1.4.1 (Use of Color) and SC 1.4.3 (Contrast) require that UI remain usable in WHCM — enterprise and government adoption depends on it.

Pre-T5.2, Theo UI components rendered correctly in WHCM by accident (Tailwind/Radix defaults are mostly system-color-aware), but the brand-color surfaces (`--primary`, `--accent`, hover states using `bg-primary/10`, decorative textures) either inverted into solid blocks or disappeared into the system background.

## Decision

`src/styles/tokens.css` declares a `@media (forced-colors: active)` block that maps Theo's semantic tokens to CSS system colors:

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
    /* ... */
  }
  .bg-dotted-violet,
  .bg-dotted-violet-strong,
  .bg-hero-glow,
  .bg-paper-grain {
    forced-color-adjust: none;
  }
}
```

Both light and dark cascades collapse into the system palette — the OS owns color choice in WHCM, so theme switching is intentionally a no-op.

Decorative textures (`.bg-dotted-*`, `.bg-hero-glow`, `.bg-paper-grain`) opt out via `forced-color-adjust: none` — they're visual flourish, not semantic content, and would invert into harsh solid patterns otherwise.

## Consequences

### Positive

- WCAG 2.2 SC 1.4.1 / SC 1.4.3 satisfied for the built-in component surface.
- Enterprise / gov adoption unblocked.
- No JavaScript cost — single CSS media query block.

### Negative

- **EC-15**: WHCM does not define semantic system colors for success / error / warning. We map `--status-online`, `--success`, `--status-info`, etc. all to `Highlight` (via the inherited cascade). This makes "online" indistinguishable from "selected text" in WHCM. WCAG accepts this — WHCM users rely on text + icons for semantic distinction, not color. Documented as a known limitation.

### Known limitations

- Custom themes registered via `registerTheme()` inherit the same WHCM mapping (it lives in `tokens.css :root`, not in theme objects). Consumers cannot override per-theme WHCM behavior. Acceptable: WHCM is OS-driven, not theme-driven.

## Alternatives Considered

### A1 — JS-side detection + per-theme WHCM overrides

Rejected. WHCM is a CSS feature; handling it in JS adds complexity for zero benefit (CSS already gives us the media query).

### A2 — Skip WHCM support entirely

Rejected. Blocks enterprise / gov adoption. WCAG compliance is non-negotiable for the target market.

## References

- Implementation: `src/styles/tokens.css > @media (forced-colors: active)` block.
- MDN: [`@media (forced-colors)`](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/forced-colors), [`forced-color-adjust`](https://developer.mozilla.org/en-US/docs/Web/CSS/forced-color-adjust).
- WCAG 2.2: [SC 1.4.1](https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html), [SC 1.4.3](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html).
- Plan: T5.2 (forced-colors block), T6.3 (this ADR).
