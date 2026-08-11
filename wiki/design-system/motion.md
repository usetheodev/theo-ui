---
type: Token Reference
title: Motion — easings, durations, and the reduced-motion contract
description: The motion tokens, the four named motion patterns, and how prefers-reduced-motion is honored globally without killing semantic animation.
tags: [design-system, tokens, motion, accessibility, reduced-motion]
sources:
  - id: ds-doc
    resource: "git:94d9b11:docs/design-system.md"
  - id: tokens-css
    resource: "src/styles/tokens.css"
generated:
  by: "claude-code/opus-5"
  at: "2026-08-11"
status: stable
---

# Tokens

```
--ease-out-soft: cubic-bezier(0.22, 1, 0.36, 1)
--ease-in-out:   cubic-bezier(0.65, 0, 0.35, 1)
--ease-snap:     cubic-bezier(0.85, 0, 0.15, 1)
--duration-fast: 120ms
--duration-base: 200ms
--duration-slow: 360ms
--stagger:       60ms
```

# Named patterns

Hover on primary
: `box-shadow: var(--shadow-glow)` plus a −1px lift.

Active / pressed
: Glow disappears, color shifts to `--primary-deep`, scale 0.98.

Card entrance
: 60ms stagger between cards. `translateY(8px) → 0`, opacity `0 → 1`, 200ms
  `ease-out-soft`.

Status pulse
: A `running` state triggers a violet halo pulse — scale `1 → 1.02 → 1`, 1.5s
  `ease-in-out`, infinite.

# Reduced motion

`tokens.css` carries a global block that zeroes the duration tokens and neutralizes CSS
animation:

```css
@media (prefers-reduced-motion: reduce) {
  :root {
    --duration-fast: 0ms;
    --duration-base: 0ms;
    --duration-slow: 0ms;
    --stagger: 0ms;
  }
  *, *::before, *::after {
    animation-duration: 0.001ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.001ms !important;
    scroll-behavior: auto !important;
  }
}
```

## The semantic-animation exception

Some animation **is** the information — a spinner on a running step communicates "work is
happening", and removing it removes meaning rather than removing decoration.

Those components prefix with `motion-safe:` so the animation plays only for users who have
not requested reduce, while the surrounding decorative motion is still suppressed by the
global block. The component must therefore also carry a non-motion signal (a label, a
status word), because color and movement are never the only status indicator — see
[`/design-system/accessibility.md`](/design-system/accessibility.md).

`<SlideDeck>` transitions follow the same contract: `none` / `fade` / `slide` all collapse
under `prefers-reduced-motion`, and the deck relies on a 300ms `setTimeout` fallback so
state never sticks when a `transitionend` event is cancelled by rapid navigation
([RFC 0003 D16](/rfcs/0003-slide-deck.md)).
