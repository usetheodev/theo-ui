---
type: RFC
title: "RFC 0006 — FAANG-grade density defaults + useDensity"
description: A 10% tightening calibrated against measured industry values rather than the 25% requested, plus the CSS-variable mechanism that keeps explicit size winning.
tags: [rfc, density, tokens, wcag, recalibration]
sources:
  - id: rfc
    resource: "archive:94d9b11:docs/rfcs/0006-density-faang.md"
    author: "human:paulohenriquevn"
    last_modified: "2026-05-22"
generated:
  by: "claude-code/opus-5"
  at: "2026-08-11"
status: stable
---

| Field | Value |
| --- | --- |
| Author | paulohenriquevn |
| Date | 2026-05-22 |
| Status | **Implemented** (2026-05-22) |

# Summary

Realigns the Violet Forge defaults to the FAANG-modern density baseline measured across
shadcn-ui, Linear, Vercel, Stripe, and Mantine. Form-control `md` shrinks 40px → 36px,
`body-md` goes 15px → 14px, Card `md` padding goes 24px → 20px. A `useDensity()` hook lets
consumers switch globally between three tiers without rewriting `size` props per call site.

Backwards-compatible at the API level — no prop renames — but the **visual default
changes**, so it shipped as a minor bump with a migration note.

# The recalibration

This RFC is the reference case for how a user request gets **honestly recalibrated in
writing** rather than either obeyed literally or quietly ignored.

The request was a 25% tightening (Button 40px → 30px). Two facts made that unshippable:
30px sits below the WCAG 2.5.8 AA comfortable minimum, and no mainstream design system uses
it.

The *intent* of the request — "FAANG-modern, light, professional" — maps to the **measured**
industry delta of about 10%, which is exactly what shipped. The gap between what was asked
and what was delivered is recorded as ADR D1, not buried.

# Decision — five ADRs

| ID | Decision | Why |
| --- | --- | --- |
| D1 | 10% tightening (40 → 36px), not 25% | 25% falls below WCAG 2.5.8 AA and no mainstream DS uses it |
| D2 | `body-md` recalibrated 15px → 14px | shadcn, Vercel, Linear, Stripe, Mantine all use 14px |
| D3 | `useDensity()` + CSS vars on `:root`, **not** class modifiers | The class-modifier approach broke "explicit size wins" via specificity (EC-1) |
| D4 | Card `md` padding 24px → 20px | Linear ~20, Vercel ~20; matches the new control-height ratio |
| D5 | Ship as a minor with a migration note | The visual default changed; a minor bump is honest semver |

# EC-1 — the specificity bug that reshaped the design

The first cut routed density through Tailwind class modifiers like
`data-[density=compact]:h-8`. Edge-case review caught it: Tailwind compiles that to
`[data-density="compact"] .h-8`, specificity `(0,1,1)`, while the CVA variant `.h-9` is
`(0,1,0)`.

Density would have **silently overridden an explicit `<Button size="md">`** even when the
consumer explicitly asked for the default. The full mechanism of the shipped fix — CSS
variables read only by the `md` variant, with `sm` and `lg` hardcoded — is documented in
[`/design-system/density.md`](/design-system/density.md).

# Drawbacks

- **The visual delta is perceptible.** Every consumer sees tighter forms and cards after
  upgrading. Documented in the CHANGELOG migration note.
- **The `text-body-md` change is global.** Fourteen components have it hardcoded and all
  absorbed 15 → 14px automatically. Nothing broke in the playground smoke test, but it
  could still affect an external consumer whose container widths were tuned to 15px.
- Type bundle grew ~500 bytes for the new `Density` and `DensityContextValue` unions.

# Rejected alternatives

| Alternative | Why not |
| --- | --- |
| Documentation only, no visual change | The request was explicitly for a visual change |
| The 25% tightening as literally requested | WCAG 2.5.8 AA fails at 30px |
| Five density tiers | No consumer use case; explodes the variable math. Material 3, Linear, and Vercel all converged on three |
| A per-component density override prop | That is what `size` is for. Density is the global default; `size` is the per-call override |
