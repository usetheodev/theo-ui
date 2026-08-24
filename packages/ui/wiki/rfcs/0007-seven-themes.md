---
type: RFC
title: "RFC 0007 — Seven new built-in themes + the contrast gate"
description: Growing the catalogue from three to ten themes, the trademark-safe naming rule, and the automated WCAG gate that made eighty manual checks unnecessary.
tags: [rfc, themes, wcag, trademark, gate]
sources:
  - id: rfc
    resource: "archive:94d9b11:docs/rfcs/0007-seven-themes.md"
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

Grows the built-in catalogue from **3 → 10** themes with palettes recognizable in the
AI/dev segment: Vercel Mono, GitHub Dark, Dracula, One Dark, Anthropic-style, OpenAI-style,
Linear Glass. Each ships both modes, validated by a new `validateThemeContrast` gate. The
public API gains seven named exports; no visual break for existing consumers, since the
default remains `violet-forge`.

# Decision — four ADRs

| ID | Decision | Why |
| --- | --- | --- |
| D1 | Every theme keeps Geist | Söhne / Mona Sans / Inter Display would cost ~250 KB extra; **color carries more than 80% of the "feels like X" signal** |
| D1.1 | Brand-derived slugs use a descriptive suffix | Avoids trademark dilution and false affiliation (Lanham Act § 43(a)) |
| D2 | `validateThemeContrast` enforces WCAG 2.1 AA | 10 themes × 2 modes × 4 pairs = 80 checks, unsustainable by hand |
| D3 | `builtinThemes` grows to 10; default stays `violet-forge` | Backwards compatibility preserved |
| D4 | Ship as a minor | The API surface grows |

# D1.1 — trademark-safe slugs

| Inspiration | Slug | Label |
| --- | --- | --- |
| Vercel | `vercel-mono` | Vercel Mono |
| OpenAI / ChatGPT | `openai-style` | OpenAI-style |
| Anthropic | `anthropic-style` | Anthropic-style |
| Linear | `linear-glass` | Linear Glass |
| Dracula (MIT) | `dracula` | Dracula |
| One Dark (Atom, MIT) | `one-dark` | One Dark |
| GitHub Dark (Primer, MIT) | `github-dark` | GitHub Dark |

For the four derivative themes, `description` **must** begin with
`"Inspired by, not affiliated with [Company]."` Slugs from genuinely open-source palettes
keep their canonical names, because there is no affiliation to disclaim.

# D2 — the gate

`scripts/lib/wcag-contrast.ts` is 80 lines of pure JS:

- `parseHsl("262 83% 58%")` → `{ h, s, l }`. Robust: strips `%`, clamps hue to `[0, 360)`,
  accepts achromatic saturation 0.
- `hslToLuminance(hsl)` → WCAG 2.1 relative luminance.
- `contrastRatio(a, b)` → a ratio in `[1, 21]`.

$$
\text{contrast} = \frac{L_{\text{lighter}} + 0.05}{L_{\text{darker}} + 0.05}
$$

`validateThemeContrast` iterates 10 themes × 2 modes, requiring **4.5:1** on body pairs and
**3:1** on large pairs (button labels qualify as large text). It runs in under 50ms, so
regressions surface in the dev loop rather than in CI.

Two themes needed adjustment to pass at authoring time: `classic-paper` darkened its
accent, `openai-style` darkened its primary. The measured results for all ten are tabulated
in [`/design-system/themes.md`](/design-system/themes.md).

# Drawbacks

- **CSS payload.** Ten themes ≈ 60 KB injected into the DOM if the consumer passes
  `builtinThemes`. Documented, with the subset alternative (~12 KB for two).
- **Dracula light is a Theo original.** Dracula upstream is dark-only; the light mode
  darkens the canonical pink primary toward purple to pass AA. Stated in JSDoc rather than
  presented as canonical.
- **Derivative themes are not pixel-perfect.** Anthropic, OpenAI, and Linear publish no
  official token reference. The accepted bar is "visually recognizable", not "replicated
  identity".

# Rejected alternatives

| Alternative | Why not |
| --- | --- |
| Only three dev themes (Dracula / One Dark / GitHub Dark), no corporate inspirations | Simple and zero trademark risk, but loses the "AI-modern feel" that was requested |
| Replicate the fonts (Söhne, Inter) | ~250 KB extra for a disproportionate share of the effect |
| Package themes as separate subpaths | Real bundle isolation, worse DX — four imports instead of one |

# Sources

Canonical upstream repositories: [dracula/dracula-theme.github.io](https://github.com/dracula/dracula-theme.github.io) (MIT),
[atom/one-dark-syntax](https://github.com/atom/one-dark-syntax) (MIT),
[primer/primitives](https://github.com/primer/primitives) (MIT),
[vercel/geist](https://github.com/vercel/geist) (MIT).
