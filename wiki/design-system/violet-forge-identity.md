---
type: Design Principle
title: Violet Forge — the identity and its guardrails
description: What the Violet Forge design system commits to visually, and the explicit list of aesthetics it refuses.
tags: [design-system, identity, principles, brand]
sources:
  - id: ds-doc
    resource: "archive:94d9b11:docs/design-system.md"
  - id: decisions-audit
    resource: "archive:94d9b11:docs/audit/2026-05-decisions.md"
generated:
  by: "claude-code/opus-5"
  at: "2026-08-11"
status: stable
---

# Identity

**Violet Forge** keeps the canonical Theo violet `#7C3AED` as `primary` and pairs it with
a burnt-sienna `#C96442` accent. Surfaces are Vercel-aligned pure neutrals — no hue tint
on background or cards. Color is reserved for `primary`, `accent`, and semantic state.

Three themes shipped originally; the catalogue is now ten. See
[`/design-system/themes.md`](/design-system/themes.md).

- `violet-forge` *(default)* — Theo identity, Geist throughout.
- `classic-paper` — Inter + warm paper, maximum legibility.
- `aurora-terminal` — cyan-aurora + Geist Mono body, developer-console feel.

The selection process that produced this identity — four competing directions, and the
later migration from Boska/Switzer to Geist after readability feedback — is recorded in
[`/history/design-directions-2026-05.md`](/history/design-directions-2026-05.md).

# Do

- Use `primary` as the dominant CTA on screen — **one per context**.
- Use `accent` (burnt sienna) for celebration: critical success, milestones, beta tags.
  **Not for errors.**
- In dark mode, leave the dot grid visible between cards.
- Keep Geist weight 600 only at `≥ headline` sizes. Body sizes use 400.
- In light mode, prefer pure white surfaces. If warmth is needed, use the `paper-grain`
  background utility.

# Don't

| Refused | Why |
| --- | --- |
| Violet → magenta gradients | Railway territory. See [the competitor audit](/history/competitor-design-audit-2026-05.md). |
| Yellow brutalist `#FFC700` | Cliché of the superseded design system. |
| Heavy 2px black borders everywhere | Brutalist throwback. |
| Third-party fonts competing with Geist (Inter, Roboto, Space Grotesk) | Geist already covers display, body and mono. |
| Material-style heavy blur shadows | Use the pointed `--shadow-glow` violet on CTAs only. |
| `backdrop-filter: blur(...)` on any surface | A named principle with its own concept — see [`/design-system/anti-glass.md`](/design-system/anti-glass.md). |

# Background utilities

Signature dot grid plus radial glow, plus paper grain for warm-light themes.

```css
.bg-dotted-violet         /* subtle dot grid, 8% primary opacity */
.bg-dotted-violet-strong  /* dot grid, 16% primary opacity */
.bg-hero-glow             /* radial primary halo, top-right anchor */
.bg-paper-grain           /* SVG noise filter, ~18% opacity */
.text-balance             /* text-wrap: balance */
```

All four decorative utilities opt out of Windows High Contrast Mode via
`forced-color-adjust: none` — they are visual flourish, not semantic content. See
[`/decisions/adr-0008-forced-colors-whcm-support.md`](/decisions/adr-0008-forced-colors-whcm-support.md).
