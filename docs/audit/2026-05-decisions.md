# Design System Decisions Audit (2026-05-13)

> **Historical record.** This document preserves the exploration phase that led
> to the current Violet Forge identity. Values in this file are NOT normative —
> they are kept for design rationale and future reference. The normative spec
> lives in [`../design-system.md`](../design-system.md).
>
> **Outcome**: Direction D ("Violet Forge") was chosen on 2026-05-13 with
> typography subsequently migrated from Boska/Switzer to Geist Sans + Geist Mono
> after readability feedback during early integration.

---

## Original four directions (pre-decision)

Each direction is complete: display + body + mono fonts, primary + neutral + semantic palettes, background, motion pattern, emotional tone, and how it differentiates from competitors.

### Direction A — "Editorial Furnace"

> Premium editorial with thermal presence. **Persimmon + cream + ink black**.

**Bet**: a cloud dashboard should be as refined as a magazine. Editorial typography + warm palette nobody occupies.

#### Typography
- **Display**: `PP Editorial New` (Pangram Pangram) — contemporary serif, high contrast, dramatic italic for hero.
- **Body**: `Söhne Buch` or OSS alternative `General Sans` — neutral sans with presence, weights 400/500/600.
- **Mono**: `Berkeley Mono` (paid) or OSS alternative `Departure Mono` — mono with retro-tech personality.

#### Primary palette
| Token | Light | Dark | Use |
|---|---|---|---|
| `--background` | `#FBF7F0` (cream) | `#0D0A08` (ink near-black) | Page floor |
| `--foreground` | `#0D0A08` | `#FBF7F0` | Text |
| `--primary` | `#D94B2B` (persimmon) | `#FF6B47` (persimmon glow) | CTA |
| `--accent` | `#1A1714` (ink) | `#FFD56B` (amber) | Highlight |

#### Tone
**Premium engineering with human warmth**. For consumers who want to escape "cold console" feel.

---

### Direction B — "Industrial Console"

> Mature technical brutalist. **Bone + steel + electric forest**.

**Bet**: Theo is real infrastructure. Looks like a well-designed industrial terminal, not a glossy SaaS.

#### Typography
- **Display**: `Boska` (Indian Type Foundry) — modern geometric serif, high contrast, extreme weights.
- **Body**: `Switzer` (Indian Type Foundry) — variable humanist sans, OSS, weights 400/500/600/700.
- **Mono**: `JetBrains Mono` or `Commit Mono` — technical mono with ligatures.

#### Primary palette
| Token | Light | Dark | Use |
|---|---|---|---|
| `--background` | `#E8E6E1` (bone) | `#10110F` (graphite) | Page floor |
| `--primary` | `#0E5C3F` (forest deep) | `#00E586` (electric mint) | CTA |
| `--accent` | `#FFB627` (industrial amber) | `#FFB627` (same) | Highlight |

#### Tone
**Engineering workshop, not startup**. For consumers who value "this has run in production since 2019".

---

### Direction C — "Aurora Terminal"

> Dark-first technicolor with glass. **Deep oceanic + aurora gradient + sharp accents**.

#### Typography
- **Display**: `Migra` (Pangram Pangram) — sharp display, high-contrast italic, dramatic presence only in hero.
- **Body**: `General Sans` — neutral OSS sans with subtle character.
- **Mono**: `Monaspace Neon` (GitHub) — modern mono with subtle texture.

#### Primary palette (dark-first)
| Token | Dark | Light | Use |
|---|---|---|---|
| `--background` | `#0A0E1A` (deep oceanic) | `#F4F5F8` (mist) | Page floor |
| `--primary` | `#3DD9D6` (cyan-aurora) | `#0BA6A3` (cyan deep) | CTA / aurora |
| `--accent` | `#FF5C8A` (aurora pink) | `#E83B6B` | Highlight |

#### Tone
**Sci-fi developer console with poetry**. For audiences who like "wow moment" products.

---

### Direction D — "Violet Forge" (CHOSEN)

> Theo violet equity preserved + burnt sienna accent + dark-first editorial.

**Original spec** (pre-Geist migration):

- **Display**: Boska (Indian Type Foundry)
- **Body**: Switzer (Indian Type Foundry)
- **Mono**: JetBrains Mono

**Primary palette (original Violet Forge — superseded)**:

| Token | Light | Dark | Use |
|---|---|---|---|
| `--background` | `#FAF9F7` (warm off-white) | `#0E0B14` (charcoal violet-tinted) | Page floor |
| `--foreground` | `#0E0B14` | `#F5F2EE` | Text |
| `--primary` | `#7C3AED` (Theo violet) | `#7C3AED` (same) | CTA |
| `--accent` | `#C96442` (burnt sienna) | `#C96442` (same) | Highlight |

**Original type scale (superseded)**:

```
display-2xl: 72px / 1.0 / -0.04em  Boska Black
display-xl:  56px / 1.05 / -0.03em Boska Bold
display-lg:  44px / 1.1 / -0.025em Boska Bold
display-md:  36px / 1.15 / -0.02em Boska Medium
headline:    28px / 1.2 / -0.015em Boska Medium
title-lg:    22px / 1.3 / -0.01em  Switzer 700
title-md:    18px / 1.35 / -0.005em Switzer 600
body-lg:     17px / 1.55 / 0       Switzer 500
body-md:     15px / 1.55 / 0       Switzer 500
body-sm:     13px / 1.5 / 0        Switzer 500
label:       12px / 1.2 / 0.04em   Switzer 700
label-caps:  11px / 1.2 / 0.12em   Switzer 800 uppercase
code:        14px / 1.6 / 0        JetBrains Mono 500
code-sm:     12px / 1.6 / 0        JetBrains Mono 500
```

---

## Migration to Geist (post-decision)

After early integration into the playground app, users reported Boska was hard to read at body sizes, and Switzer's variable weight didn't render consistently across platforms. The team migrated to:

- **Display**: Geist Sans (Vercel's open-source font, Apache-2.0)
- **Body**: Geist Sans (same family, weights 400/500/600)
- **Mono**: Geist Mono

The palette was also re-balanced toward Vercel-style pure neutrals (`0 0% 100%` white / `0 0% 4%` near-black) to maximize neutral surfaces and let the brand color shine only in primary + accent — see [`../design-system.md`](../design-system.md) for current values.

---

## Comparative table (historical reference)

| Criterion | A — Editorial Furnace | B — Industrial Console | C — Aurora Terminal | D — Violet Forge (chosen) |
|---|---|---|---|---|
| Dominant mode | Light cream / Dark ink | Light bone / Dark graphite | **Dark-first** | **Dark-first** |
| Primary | Persimmon `#D94B2B` | Forest deep `#0E5C3F` | Cyan-aurora `#3DD9D6` | **Theo violet `#7C3AED`** |
| Accent | Amber `#FFD56B` / Ink | Industrial amber `#FFB627` | Aurora pink `#FF5C8A` | **Burnt sienna `#C96442`** |
| Preserves Theo equity | ❌ | ❌ | ❌ | ✅ |
| Risk | "too elegant for infra" | "too cold" | "gimmicky if poorly executed" | "Railway clone if poorly executed" |

---

## Why D was chosen (final rationale)

1. **Preserves the violet `#7C3AED` already established as Theo** — does not throw away prior brand recognition.
2. **Escapes the cliché**: dark-first (not "purple on white"), light is warm off-white (not pure white in the original Violet Forge — later changed to pure white), accent is terracotta `#C96442` (not yellow brutalist).
3. **Burnt sienna appeared 66× in the source references** — accent already validated internally.
4. **Boska + Switzer typography** was rare in the PaaS space — strong typographic differentiation even sharing the violet with Railway/Render. (Subsequently migrated to Geist after readability feedback.)
5. **Manageable risk**: only threat was "Railway clone" — but Railway uses magenta+violet gradient with glow, while Theo uses solid violet + terracotta + Vercel-aligned typography. Clear differentiation if executed with discipline.
