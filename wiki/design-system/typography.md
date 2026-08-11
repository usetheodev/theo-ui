---
type: Token Reference
title: Typography — Geist Sans, Geist Mono, and the Vercel-derived type scale
description: The three font roles, the fourteen typescale tiers with their exact line-height and tracking, and the three-weight rule.
tags: [design-system, tokens, typography, geist, gated]
sources:
  - id: ds-doc
    resource: "git:94d9b11:docs/design-system.md"
  - id: gate-source
    resource: "scripts/validate-quality-gates.ts"
  - id: rfc-0006
    resource: "git:94d9b11:docs/rfcs/0006-density-faang.md"
generated:
  by: "claude-code/opus-5"
  at: "2026-08-11"
status: stable
---

# Font roles

| Family | Font | Use | Weights |
| --- | --- | --- | --- |
| Display | **Geist Sans** | Headlines, hero, section titles | 400, 500, 600 |
| Body | **Geist Sans** | Body, UI, navigation | 400, 500, 600 |
| Mono | **Geist Mono** | Code, paths, metrics, timestamps | 400, 500, 600 |

Geist Sans and Geist Mono are Vercel's open-source typefaces (Apache-2.0), optimized for
product UIs and code surfaces. OpenType `liga` is enabled globally; tabular numerals apply
to `<code>`, `<pre>`, `<kbd>`, and `<samp>`.

**This is gated.** `validateDocsTypography` reads this concept and fails the build if it
loses its `Geist` reference, or if it names a superseded font family in the normative
section above `## Histórico`. The gate exists because the superseded families appeared in
stale docs and stale JSDoc for a full release cycle while the code already shipped Geist —
see [`/history/design-directions-2026-05.md`](/history/design-directions-2026-05.md).

# Schema — the type scale

Format: `size / line-height / letter-spacing / weight`.

```
display-2xl:  64px / 1     / -0.0464em / 600
display-xl:   48px / 1.05  / -0.05em   / 600
display-lg:   40px / 1.1   / -0.05em   / 600
display-md:   32px / 1.2   / -0.04em   / 600
headline:     28px / 1.25  / -0.035em  / 600
title-lg:     24px / 1.33  / -0.04em   / 600
title-md:     20px / 1.4   / -0.03em   / 600
body-lg:      18px / 1.56  / -0.01em   / 400
body-md:      14px / 1.43  / 0         / 400
body-sm:      13px / 1.46  / 0         / 400
label:        14px / 1.43  / 0         / 500
label-caps:   12px / 1.33  /  0.04em   / 500  (uppercase)
code-md:      14px / 1.5   / 0         / 400
code-sm:      13px / 1.54  / 0         / 500
```

# The three-weight rule

Exactly three weights carry meaning:

400
: Body text. Every `body-*` tier and `code-md`.

500
: UI chrome. Labels, `code-sm`, interface affordances.

600
: Display. Only at `≥ headline` sizes. Never at body sizes.

Aggressive negative letter-spacing applies across the display tier — it is what makes
large Geist read as a designed headline rather than scaled-up body text.

# `body-md` is 14px, and that was a change

`body-md` was recalibrated **15px → 14px** in
[RFC 0006](/rfcs/0006-density-faang.md), matching the measured industry baseline:

| System | Body size |
| --- | --- |
| shadcn/ui | 14px |
| Vercel (Geist) | 14px |
| Linear | 14px |
| Stripe Dashboard | 14px |
| Mantine `default` | 14px |
| `@theokit/ui` before RFC 0006 | 15px |

Fourteen components had `text-body-md` hardcoded and absorbed the change automatically via
`tailwind-preset.ts`. Consumers who depended on the old 15px should move to `body-lg`
(18px) or declare a custom typescale token.

## Histórico

Nothing below this heading is normative. It records the superseded direction so the gate
above has something to point at, and so a reader encountering the old names in git history
knows they were deliberately abandoned.

The original Violet Forge specification paired **Boska** (Indian Type Foundry) for display
with **Switzer** for body and **JetBrains Mono** for code. After early integration into
the playground app, readers reported Boska was hard to read at body sizes and Switzer's
variable weight rendered inconsistently across platforms. The team migrated to Geist Sans
and Geist Mono, and re-balanced the palette toward Vercel-style pure neutrals at the same
time.

The superseded type scale, for reference:

```
display-2xl: 72px / 1.0  / -0.04em   Boska Black
display-xl:  56px / 1.05 / -0.03em   Boska Bold
display-lg:  44px / 1.1  / -0.025em  Boska Bold
display-md:  36px / 1.15 / -0.02em   Boska Medium
headline:    28px / 1.2  / -0.015em  Boska Medium
title-lg:    22px / 1.3  / -0.01em   Switzer 700
title-md:    18px / 1.35 / -0.005em  Switzer 600
body-lg:     17px / 1.55 / 0         Switzer 500
body-md:     15px / 1.55 / 0         Switzer 500
body-sm:     13px / 1.5  / 0         Switzer 500
label:       12px / 1.2  / 0.04em    Switzer 700
label-caps:  11px / 1.2  / 0.12em    Switzer 800 uppercase
code:        14px / 1.6  / 0         JetBrains Mono 500
code-sm:     12px / 1.6  / 0         JetBrains Mono 500
```

Full selection rationale: [`/history/design-directions-2026-05.md`](/history/design-directions-2026-05.md).
