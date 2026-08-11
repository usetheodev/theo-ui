---
type: Historical Record
title: Competitor visual audit (2026-05)
description: Empirical extraction of six PaaS competitors' design tokens from their served CSS, and the occupied-space analysis that shaped what Violet Forge refuses.
tags: [history, design-system, competitive-analysis, empirical, provenance]
sources:
  - id: audit
    resource: "git:94d9b11:docs/design-audit.md"
    last_modified: "2026-05-13"
generated:
  by: "claude-code/opus-5"
  at: "2026-08-11"
status: stable
---

> Collected 2026-05-13 by fetching each competitor's public landing page and extracting
> tokens from the served HTML/CSS.

# Provenance marking

Every claim in the original audit carried one of three markers, and the distinction is the
reason the audit is trustworthy:

**[extracted]**
: The token is literally present in the HTML/CSS served by the public URL.

**[inferred]**
: Not in the HTML, but evident from the whole (e.g. dark mode is the dominant background).

**[knowledge]**
: From prior product knowledge, **not confirmed by this collection**. A `[knowledge]` value
  must not be used as a normative basis without later visual validation.

Marking the epistemic status of each value is what separates an audit from an impression.
The findings below preserve those markers where they matter.

# Findings by competitor

## Vercel

Nearly eliminates color from the identity — extreme black/white with pointed semantic
accents. Extracted: `#FAFAFA` off-white, `#45DEC4` mint, `#00DC82` green, `#0096FF` blue,
`#FF1E56` red-pink, `#E5484D` red. The neutral scale is Geist Gray, not literally exposed
in the HTML **[knowledge]**.

**Geist Sans + Geist Mono [extracted]** — a proprietary Vercel family derived from Inter.
The audit's verdict: *already Vercel's territory — we should not use it.*

Tone: premium engineering, no ornament, terminal vibe.

## Railway

The only competitor publishing its complete palette as CSS variables — all 11 stops, light
and dark pairs, extracted literally. Dark background `hsl(250, 24%, 9%)` ≈ `#13111c`, a
characteristic purple-near-black.

The identity element is a **radial gradient with real glow** on primary CTAs:

```css
--c1:#aa0aaa; --c2:#6d1dbd; --c3:#381dbd;
background-image: radial-gradient(73.46% 138.39% at 50.21% 0%,
  var(--c1) 50%, var(--c2) 75.47%, var(--c3) 100%);
box-shadow: 0px 0px 6px 0px rgba(180,40,180,0.25),
            0px 0px 16px 0px rgba(102,43,223,0.25);
```

Tone: tech premium drama, dark, glow-heavy.

## Render

Next.js + compiled Tailwind — no static tokens exposed. Only layout variables were
recoverable. Corporate SaaS clean; conservative hierarchy. Tone: reliable, professional,
without a marked visual personality.

## Fly.io — the most interesting finding

The most distinctive identity in the set. Extracted: **orange `#FD4F00`**, **electric purple
`#6100FF`**, **magenta `#FF008A`**, plus amber, mint, clean blue, deep navy, warm stone.
That orange + magenta + electric purple combination is rare in this market.

Typography was the strongest hit: **Mackinac** (display — transitional serif with editorial
presence), **Fricolage Grotesque** (body), **Fragment Mono**. Each is rare in the PaaS
space. Mackinac in particular gives editorial presence to a technical product.

Tone: confident, technical-with-personality, anti-corporate.

## Netlify

Teal-centric with a named, exported token system (`--ntl-*`). Canonical teal `#05BDBA`,
mint variants, deep teal-tinted darks `#0C2A2A`, lavender and electric blue accents.

Typography **[extracted]**: `YouTube Noto, Roboto, Arial, Helvetica` — a generic fallback.
No custom font in the marketing surface.

## Coolify

Saturated open-source palette on Tailwind gray neutrals: electric cyan, pure magenta,
electric lime, saturated red-orange. `font-family: ui-monospace` — assumed hacker/terminal
aesthetic, no custom font served.

# Cross-cutting analysis

## Mode

Four of six are dark-first or dark-friendly. Light-first is the minority (Render; Netlify
partially).

## Typographic distinctiveness

| Competitor | Distinctiveness |
| --- | --- |
| Fly.io | Highest — Mackinac + Fricolage Grotesque + Fragment Mono, a rare combination |
| Vercel | High — an owned family |
| Railway | Moderate — IBM Plex Serif is uncommon |
| Render, Netlify, Coolify | Low — hashed unknowns or system fallbacks |

**Only two of six have a strong typographic identity.** The other four are typographically
neutral, which the audit read as a clear differentiation opportunity.

## Occupied color space

| Space | Owned by |
| --- | --- |
| Violet / purple | **Saturated** — Railway, Render |
| Teal / turquoise | Netlify |
| Orange + magenta | Fly.io |
| Near-neutral | Vercel |

Identified as still available in the premium PaaS space: deep amber/gold,
persimmon/coral, sage/forest, electric navy, rose-tinted neutrals.

# What this audit produced

## The anti-pattern list

Saturated territory to avoid: violet gradient on white (Railway, Render); the Geist family
(Vercel's); IBM Plex Sans; Inter / Roboto / Space Grotesk / Helvetica ("default
AI-generated"); Mackinac (Fly's); teal primary (Netlify's); dark slate hacker default
(Coolify's).

Several of these survive verbatim in the current
[identity guardrails](/design-system/violet-forge-identity.md) — the "no violet→magenta
gradients (Railway territory)" rule is a direct descendant.

## Two findings that were overruled

The audit recommended **avoiding violet** (saturated space) and **avoiding Geist** (Vercel's
territory). Violet Forge does both.

Both reversals were deliberate and reasoned. Violet was kept because brand equity in
`#7C3AED` outweighed the crowding, with differentiation carried by the terracotta accent and
Vercel-aligned neutrals rather than by hue alone. Geist was adopted later, after Boska and
Switzer failed on legibility — see
[`/history/design-directions-2026-05.md`](/history/design-directions-2026-05.md).

The audit is kept intact rather than edited to match the outcome. An analysis that gets
retroactively adjusted to agree with the decision it informed stops being evidence.

## What the PaaS space does consistently

Project cards with status badge + metric + timestamp. Build log streams with timestamps and
colored levels. Top nav with workspace switcher left, actions right. Collapsible sidebar
sections. `⌘K` command palette. Tabs for Overview / Deployments / Settings / Logs / Metrics.
