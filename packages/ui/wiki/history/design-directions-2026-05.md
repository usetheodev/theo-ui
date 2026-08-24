---
type: Historical Record
title: Design direction selection (2026-05)
description: The four competing design directions, why Violet Forge was chosen, and the later typography migration to Geist after readability feedback.
tags: [history, design-system, typography, selection, superseded]
sources:
  - id: audit
    resource: "archive:94d9b11:docs/audit/2026-05-decisions.md"
generated:
  by: "claude-code/opus-5"
  at: "2026-08-11"
status: stable
---

> **Historical record. Values here are NOT normative.** The current specification is
> the [design-system concepts](/design-system/violet-forge-identity.md). This concept preserves the
> exploration that produced it.

# The four directions

Each was complete: display, body, and mono fonts; primary, neutral, and semantic palettes;
background; motion pattern; emotional tone; and how it differentiates from competitors.

## A — Editorial Furnace

Persimmon + cream + ink black. Premium editorial with thermal presence.

**The bet:** a cloud dashboard should be as refined as a magazine — editorial typography
plus a warm palette nobody occupies.

PP Editorial New (display) · Söhne Buch or General Sans (body) · Berkeley Mono or Departure
Mono. `--primary: #D94B2B` (persimmon), `--accent: #1A1714` / `#FFD56B`.

## B — Industrial Console

Bone + steel + electric forest. Mature technical brutalist.

**The bet:** Theo is real infrastructure. It should look like a well-designed industrial
terminal, not a glossy SaaS.

Boska (display) · Switzer (body) · JetBrains Mono. `--primary: #0E5C3F` / `#00E586`,
`--accent: #FFB627`.

## C — Aurora Terminal

Deep oceanic + aurora gradient. Dark-first technicolor with glass.

Migra (display) · General Sans (body) · Monaspace Neon.
`--primary: #3DD9D6` (cyan-aurora), `--accent: #FF5C8A`.

## D — Violet Forge — **chosen**

Theo violet equity preserved + burnt sienna accent + dark-first editorial.

Original specification: Boska (display) · Switzer (body) · JetBrains Mono.
`--background: #FAF9F7` / `#0E0B14`, `--primary: #7C3AED`, `--accent: #C96442`.

# Comparison

| Criterion | A | B | C | **D (chosen)** |
| --- | --- | --- | --- | --- |
| Dominant mode | Light cream / dark ink | Light bone / dark graphite | **Dark-first** | **Dark-first** |
| Primary | Persimmon `#D94B2B` | Forest deep `#0E5C3F` | Cyan-aurora `#3DD9D6` | **Theo violet `#7C3AED`** |
| Accent | Amber `#FFD56B` | Industrial amber `#FFB627` | Aurora pink `#FF5C8A` | **Burnt sienna `#C96442`** |
| Preserves Theo brand equity | no | no | no | **yes** |
| Named risk | "too elegant for infra" | "too cold" | "gimmicky if poorly executed" | "Railway clone if poorly executed" |

# Why D

1. **Preserves the violet `#7C3AED` already established as Theo.** Prior brand recognition
   is not thrown away.
2. **Escapes the cliché.** Dark-first rather than "purple on white"; accent is terracotta
   rather than yellow brutalist.
3. **Burnt sienna appeared 66 times in the source references** — the accent was already
   validated internally, not invented for the proposal.
4. **Strong typographic differentiation** — Boska + Switzer were rare in the PaaS space
   ([competitor audit](/history/competitor-design-audit-2026-05.md)), which offset sharing
   violet with Railway and Render.
5. **Manageable risk.** The only real threat was reading as a Railway clone, and Railway
   uses a magenta-violet gradient with glow while Theo uses solid violet plus terracotta and
   Vercel-aligned typography. Clear differentiation, conditional on disciplined execution.

# The typography migration that followed

Point 4 above did not survive contact with users.

After early integration into the playground app, readers reported that **Boska was hard to
read at body sizes**, and **Switzer's variable weight rendered inconsistently across
platforms**. The team migrated to:

- **Display:** Geist Sans (Vercel, Apache-2.0)
- **Body:** Geist Sans, weights 400/500/600
- **Mono:** Geist Mono

The palette was re-balanced at the same time toward Vercel-style pure neutrals
(`0 0% 100%` white, `0 0% 4%` near-black), maximizing neutral surface so brand color shows
only in primary and accent.

That is a notable reversal: the competitor audit had explicitly listed the Geist family as
**Vercel's territory, to be avoided**. Legibility beat differentiation, and the record keeps
both the original reasoning and the reversal rather than retconning one of them.

# The drift this record exists to prevent

For a full release cycle after the migration, `docs/design-system.md` still described the
Boska/Switzer direction, and `src/themes/violet-forge.ts` JSDoc still cited those fonts —
while the code shipped Geist. Both were flagged as blockers in a 2026-05-13 review.

The fix was not only to correct the text. `validateDocsTypography` now **fails the build**
if the normative typography concept loses its `Geist` reference or names a superseded family
outside a `## Histórico` section. See
[`/design-system/typography.md`](/design-system/typography.md).
