---
type: Design Principle
title: The anti-glass principle
description: No surface in @theokit/ui uses backdrop-filter; overlays, dropdowns, popovers, sheets and tooltips render against opaque tokens.
tags: [design-system, principle, performance, identity]
sources:
  - id: ds-doc
    resource: "git:94d9b11:docs/design-system.md"
generated:
  by: "claude-code/opus-5"
  at: "2026-08-11"
status: stable
---

# The principle

**Surfaces never use `backdrop-filter: blur(...)`.**

Dialog overlays, dropdowns, popovers, sheets, and tooltips render against opaque tokens —
`--background/80`, `--card`, `--popover`.

# Why it is a named principle

The "frosted glass" / liquid-glass aesthetic is a **recurring** proposal in design-system
exploration. Naming the refusal is what keeps it from being re-litigated in every brief.

Two independent reasons:

1. **Identity conflict.** Violet Forge is Vercel-aligned neutrals plus content-led
   density. Frosted glass pulls toward a different visual family entirely — see
   [`/design-system/violet-forge-identity.md`](/design-system/violet-forge-identity.md).
2. **Layered blur has a real performance cost.** CSS `backdrop-filter` triggers a paint
   isolation layer, and the cost **compounds with each nested blurred element**. A dropdown
   inside a sheet inside a dialog is three isolation layers on a low-end GPU.

# Escalation path

If a brief argues for blur, it goes through an RFC. Until an RFC is
accepted, all surfaces stay opaque.

Note that `linear-glass` is a theme *name*, not an exception — it is a color palette
inspired by Linear's product, not a mandate for actual glass surfaces.
