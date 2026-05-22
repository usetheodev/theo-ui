# Theo Design System — Violet Forge

> **Source of truth as of 2026-05-13.** Mirrors `src/styles/tokens.css`, `tailwind.config.ts`, and `src/themes/violet-forge.ts`.
> Drift between this document and any of those source files is enforced by `validate-quality-gates.ts` (`validateDocsTypography`).
>
> Historical exploration (original four directions and the pre-Geist migration draft) lives in [`audit/2026-05-decisions.md`](./audit/2026-05-decisions.md).

---

## Identity

**Violet Forge** keeps the canonical Theo violet `#7C3AED` as `primary` and pairs it with a burnt-sienna `#C96442` accent. Surfaces are Vercel-aligned pure neutrals (no hue tint on background or cards); color is reserved for primary, accent, and semantic states.

Three runtime-swappable themes ship out of the box:

- `violet-forge` *(default)* — Theo identity, Geist throughout.
- `classic-paper` — Inter + warm paper, maximum legibility.
- `aurora-terminal` — Cyan-aurora + Geist Mono body for developer-console feel.

---

## Tokens (normative)

### Palette — light mode

```
--background:          0 0% 100%       /* #FFFFFF — pure white, Vercel-style */
--foreground:          0 0% 4%         /* #0A0A0A */

--card:                0 0% 100%       /* #FFFFFF */
--card-foreground:     0 0% 4%

--popover:             0 0% 100%
--popover-foreground:  0 0% 4%

--primary:             262 83% 58%     /* #7C3AED — Theo violet */
--primary-deep:        263 70% 42%     /* #5B21B6 — pressed */
--primary-glow:        263 90% 76%     /* #A78BFA — hover halo */
--primary-foreground:  0 0% 100%

--secondary:           0 0% 96%        /* #F5F5F5 */
--secondary-foreground:0 0% 4%

--accent:              15 54% 53%      /* #C96442 — burnt sienna */
--accent-deep:         15 55% 40%      /* #9C4A2E */
--accent-foreground:   0 0% 100%

--muted:               0 0% 96%
--muted-foreground:    0 0% 45%        /* #737373 */

--border:              0 0% 91%        /* #E8E8E8 — Vercel-style hairline */
--input:               0 0% 91%
--ring:                262 83% 58%     /* matches primary */

--success:             142 71% 36%     /* #16A34A */
--success-foreground:  0 0% 100%
--warning:             33 92% 44%      /* #D97706 */
--warning-foreground:  0 0% 100%
--destructive:         0 72% 51%       /* #DC2626 */
--destructive-foreground: 0 0% 100%
--info:                217 91% 60%     /* #3B82F6 */
--info-foreground:     0 0% 100%
```

### Palette — dark mode (dominant)

```
--background:          0 0% 4%         /* #0A0A0A */
--foreground:          0 0% 96%        /* #F5F5F5 */

--card:                0 0% 7%         /* #121212 */
--card-foreground:     0 0% 96%

--popover:             0 0% 9%         /* #171717 */
--popover-foreground:  0 0% 96%

--primary:             262 83% 58%     /* same hue across modes */
--primary-deep:        263 70% 42%
--primary-glow:        263 90% 76%
--primary-foreground:  0 0% 100%

--secondary:           0 0% 11%        /* #1C1C1C */
--secondary-foreground:0 0% 96%

--accent:              15 54% 53%
--accent-deep:         15 55% 40%
--accent-foreground:   0 0% 100%

--muted:               0 0% 11%
--muted-foreground:    0 0% 60%        /* #999 — Vercel gray-500 */

--border:              0 0% 16%        /* #292929 */
--input:               0 0% 11%
--ring:                262 83% 58%

--success:             152 79% 52%     /* #22E58C */
--success-foreground:  0 0% 4%
--warning:             38 92% 50%      /* #F59E0B */
--warning-foreground:  0 0% 4%
--destructive:         350 100% 65%    /* #FF4F6D */
--destructive-foreground: 0 0% 4%
--info:                213 100% 70%    /* #5FB3FF */
--info-foreground:     0 0% 4%
```

HSL split `(h s l)` (not hex) — enables alpha via `hsl(var(--x) / 0.5)` or `color-mix()`.

---

## Typography

| Family | Font | Use | Weights |
|---|---|---|---|
| Display | **Geist Sans** | Headlines, hero, section titles | 400, 500, 600 |
| Body | **Geist Sans** | Body, UI, navigation | 400, 500, 600 |
| Mono | **Geist Mono** | Code, paths, metrics, timestamps | 400, 500, 600 |

Geist Sans + Geist Mono are Vercel's open-source typefaces, optimized for product UIs and code surfaces. OpenType `liga` is enabled globally; tabular numerals on `<code>` / `<pre>` / `<kbd>` / `<samp>`.

### Type scale (Vercel-inspired)

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

Three strict weights — 400 body, 500 UI, 600 display. Aggressive negative letter-spacing on display tier.

---

## Spacing scale

Base 4px. Tokens in `--space-N` where N is the value in px.

```
--space-1:   4px
--space-2:   8px
--space-3:   12px
--space-4:   16px
--space-5:   20px
--space-6:   24px
--space-8:   32px
--space-10:  40px
--space-12:  48px
--space-16:  64px
--space-20:  80px
--space-24:  96px
--space-32:  128px
```

---

## Density policy

The Violet Forge defaults target FAANG-tier modern dashboards
(Vercel · Linear · Stripe-aligned). Form-control heights at `md` are 36px
("comfortable"), body text is 14px, Card padding is 20px.

### Form-control heights by density

| Density       | Button / Input / Select.Trigger | Textarea min-h | Card `md` padding | Body text |
|---------------|---------------------------------|----------------|-------------------|-----------|
| `compact`     | 32px (`h-8`)                    | 96px (`6rem`)  | 20px (`p-5`)      | 14px      |
| `comfortable` | **36px** (default)              | 96px (`6rem`)  | 20px (`p-5`)      | **14px**  |
| `spacious`    | 44px (`h-11`)                   | 128px (`8rem`) | 24px (`p-6`)      | 14px      |

Override globally via `<ThemeProvider defaultDensity="compact">`:

```tsx
import { ThemeProvider, builtinThemes } from "@usetheo/ui";

<ThemeProvider themes={builtinThemes} defaultDensity="compact">
  {children}
</ThemeProvider>
```

Or runtime via `useDensity()`:

```tsx
const { density, setDensity } = useDensity();
setDensity("compact");
```

**EC-1 fix invariant:** density only affects the `md` tier (the default).
Explicit `size="sm"` / `size="lg"` always overrides density — they use
hardcoded classes (`h-8`, `h-11`), not the `var(--theo-control-h)` lookup
the `md` variant uses.

### Tap target policy

Theo UI targets **WCAG 2.5.8 Level AA** — minimum 24×24 CSS pixels
effective tap area. The 36px default in `comfortable` mode + the 24px+
checkbox/switch tap area comfortably exceed this. We do **not** target
2.5.5 Level AAA (44px) at `comfortable`; consumers requiring AAA can opt
into `spacious` mode globally or `size="lg"` per call site.

The `compact` mode (32px) still meets 2.5.8 AA because the visible
control plus the 2px focus ring on each side expands the focusable area
to ~36×36 effective.

---

## Radii

```
--radius-none: 0px
--radius-sm:   4px      /* dense tables, utility controls */
--radius-md:   6px      /* inputs, small buttons */
--radius-lg:   10px     /* buttons, small cards */
--radius-xl:   14px     /* default cards */
--radius-2xl:  20px     /* hero cards, modals */
--radius-full: 9999px   /* badges, pills */
```

`--radius: 14px` is also exposed for shadcn compat.

---

## Elevation

Shadow tokens derive from `--foreground` (ink) and `--primary` (signature glow), so they recolor when themes swap.

```
--shadow-sm:    0 1px 2px 0 hsl(var(--foreground) / 0.06)
--shadow-md:    0 2px 8px -2px hsl(var(--foreground) / 0.08), 0 1px 3px hsl(var(--foreground) / 0.06)
--shadow-lg:    0 12px 32px -8px hsl(var(--foreground) / 0.12), 0 4px 12px hsl(var(--foreground) / 0.08)
--shadow-glow:        0 0 24px hsl(var(--primary) / 0.25)
--shadow-glow-strong: 0 0 32px hsl(var(--primary) / 0.4)
```

In dark mode, ink shadows are heavier (pure black against the dark surface) and the glow brightens.

---

## Motion

```
--ease-out-soft: cubic-bezier(0.22, 1, 0.36, 1)
--ease-in-out:   cubic-bezier(0.65, 0, 0.35, 1)
--ease-snap:     cubic-bezier(0.85, 0, 0.15, 1)
--duration-fast: 120ms
--duration-base: 200ms
--duration-slow: 360ms
--stagger:       60ms
```

### Motion patterns

- **Hover on primary**: `box-shadow: var(--shadow-glow)` + lift -1px.
- **Active/pressed**: glow disappears, color shifts to `--primary-deep`, scale 0.98.
- **Card entrance**: 60ms stagger between cards, `translateY(8px) → 0`, opacity `0 → 1`, 200ms ease-out-soft.
- **Status pulse**: `running` triggers violet halo pulse (1 → 1.02 → 1, 1.5s ease-in-out infinite).

### Reduced motion

`tokens.css` includes a global `@media (prefers-reduced-motion: reduce)` block that zeros all `--duration-*` tokens and neutralizes CSS animations. Components that use animation as semantic state (e.g., spinner on a running step) prefix with `motion-safe:` so the animation only plays for users who haven't requested reduce.

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

---

## Background utilities

Signature dot grid + radial glow, plus paper grain for warm-light themes.

```css
.bg-dotted-violet         /* subtle dot grid, 8% primary opacity */
.bg-dotted-violet-strong  /* dot grid, 16% primary opacity */
.bg-hero-glow             /* radial primary halo, top-right anchor */
.bg-paper-grain           /* SVG noise filter, ~18% opacity */
.text-balance             /* text-wrap: balance */
```

---

## Principles

**Do**:
- Use `primary` as dominant CTA on the screen — one per context.
- Use `accent` (burnt sienna) for celebration (critical success, milestones, beta tags) — not for errors.
- In dark mode, leave the dot grid visible between cards.
- Keep Geist weight 600 only at `≥ headline` sizes — body sizes use 400.
- In light mode, prefer pure white surfaces; if you need warmth, use `paper-grain` background utility.

**Don't**:
- Violet→magenta gradients (Railway territory).
- Yellow brutalist `#FFC700` (cliché of the old DS).
- Heavy 2px black borders everywhere (brutalist throwback).
- Pull in third-party fonts that compete with Geist (Inter, Roboto, Space Grotesk, Geist already covers).
- Material-style heavy blur shadows — use pointed `--shadow-glow` violet on CTAs only.

### Anti-glass guideline (named principle)

**Surfaces never use `backdrop-filter: blur(...)`.** Dialog overlays, dropdowns,
popovers, sheets, and tooltips render against opaque tokens (`--background/80`,
`--card`, `--popover`). The "frosted glass" / liquid-glass aesthetic is a
recurring trend in DS exploration but conflicts with the Violet Forge identity
(Vercel-aligned neutrals + content-led density) and creates layered blur
performance cost on low-end GPUs (CSS `backdrop-filter` triggers a paint
isolation layer that compounds with each nested blurred element).

If a brief argues for blur, escalate via RFC. Until then, all surfaces stay
opaque.

---

## Theme system

Themes are frozen bundles of CSS-var values applied via `data-theme="<name>"` on `<html>`. The structure is type-checked in `src/themes/types.ts`. Theme registry + runtime switch lives in `<ThemeProvider>` / `<ThemeSwitcher>`.

**SSR (Next.js / Astro / Remix)**: wrap the app in `<ThemeProvider>` AND inject `<ThemeScript>` in `<head>` to prevent FOUC and hydration mismatch. Example:

```tsx
import { ThemeProvider, ThemeScript, ThemeSwitcher } from "@usetheo/ui";

<html lang="en" suppressHydrationWarning>
  <head>
    <ThemeScript defaultTheme="violet-forge" defaultMode="dark" />
  </head>
  <body>
    <ThemeProvider defaultTheme="violet-forge" defaultMode="dark">
      {children}
    </ThemeProvider>
  </body>
</html>
```

Custom themes: define an object satisfying the `Theme` type and pass it via `themes={[violetForge, myCustomTheme]}` to `<ThemeProvider>`, or call `registerTheme(theme)` at runtime.

---

## See also

- [`audit/2026-05-decisions.md`](./audit/2026-05-decisions.md) — original four directions and rationale.
- [`quality-gates.md`](./quality-gates.md) — Definition of Ready, taxonomy gate, accessibility gate, registry gate.
- [`architecture.md`](./architecture.md) — primitive vs composite taxonomy rule.
