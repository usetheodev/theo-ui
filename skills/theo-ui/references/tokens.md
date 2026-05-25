# Tokens — Violet Forge

Mirror of [`src/styles/tokens.css`](../../../src/styles/tokens.css) and [`src/themes/violet-forge.ts`](../../../src/themes/violet-forge.ts). When this file disagrees with the source, the source wins — update this file via PR.

---

## How tokens flow

```
src/styles/tokens.css  (HSL triplets in CSS custom props)
        │
        ▼
@usetheo/ui Tailwind preset (registry/tailwind-preset.json + src/styles/tailwind-preset.ts)
        │
        ▼
Consumer's tailwind.config.{ts,js}  →  bg-primary, text-foreground, …
        │
        ▼
Consumer's components consume via className OR via CSS var directly
```

**Never bypass.** The skill writes `bg-primary` (Tailwind preset class) or `hsl(var(--primary))` (CSS var). It never writes `#7C3AED`, never writes `bg-purple-600`, never writes `font-family: "Inter"`.

---

## Color tokens

### Light mode (`:root`)

| Token | HSL | Hex | Role |
|---|---|---|---|
| `--background` | `0 0% 100%` | `#FFFFFF` | Page canvas |
| `--foreground` | `0 0% 4%` | `#0A0A0A` | Body text on canvas |
| `--card` | `0 0% 100%` | `#FFFFFF` | Card surface (same as background — depth comes from elevation) |
| `--card-foreground` | `0 0% 4%` | `#0A0A0A` | Text on card |
| `--popover` | `0 0% 100%` | `#FFFFFF` | Floating layer (dropdowns, tooltips) |
| `--popover-foreground` | `0 0% 4%` | `#0A0A0A` | Text on popover |
| `--primary` | `262 83% 58%` | `#7C3AED` | Theo violet — canonical CTA |
| `--primary-deep` | `263 70% 42%` | `#5B21B6` | Pressed primary |
| `--primary-glow` | `263 90% 76%` | `#A78BFA` | Hover halo for primary |
| `--primary-foreground` | `0 0% 100%` | `#FFFFFF` | Text on primary |
| `--secondary` | `0 0% 96%` | `#F5F5F5` | Muted surface |
| `--secondary-foreground` | `0 0% 4%` | `#0A0A0A` | Text on secondary |
| `--accent` | `15 54% 53%` | `#C96442` | Burnt sienna — celebratory accent |
| `--accent-deep` | `15 55% 40%` | `#9C4A2E` | Pressed accent |
| `--accent-foreground` | `0 0% 100%` | `#FFFFFF` | Text on accent |
| `--muted` | `0 0% 96%` | `#F5F5F5` | Identical to secondary; semantic alias |
| `--muted-foreground` | `0 0% 45%` | `#737373` | Secondary text |
| `--border` | `0 0% 91%` | `#E8E8E8` | Hairline divider |
| `--input` | `0 0% 91%` | `#E8E8E8` | Form input border |
| `--ring` | `262 83% 58%` | `#7C3AED` | Focus ring (matches primary) |
| `--success` | `142 71% 36%` | `#16A34A` | Positive confirmation |
| `--success-foreground` | `0 0% 100%` | `#FFFFFF` | Text on success |
| `--warning` | `33 92% 44%` | `#D97706` | Caution |
| `--warning-foreground` | `0 0% 100%` | `#FFFFFF` | Text on warning |
| `--destructive` | `0 72% 51%` | `#DC2626` | Irreversible action |
| `--destructive-foreground` | `0 0% 100%` | `#FFFFFF` | Text on destructive |
| `--info` | `217 91% 60%` | `#3B82F6` | Informational callout |
| `--info-foreground` | `0 0% 100%` | `#FFFFFF` | Text on info |

### Dark mode (`.dark`)

Brand colors (`primary`, `primary-deep`, `primary-glow`, `accent`, `accent-deep`) keep the same hex across modes — the brand identity is mode-invariant. Surfaces and semantics shift:

| Token | HSL | Hex | Role |
|---|---|---|---|
| `--background` | `0 0% 4%` | `#0A0A0A` | Page canvas |
| `--foreground` | `0 0% 96%` | `#F5F5F5` | Body text |
| `--card` | `0 0% 7%` | `#121212` | Card — one step lighter than background |
| `--popover` | `0 0% 9%` | `#171717` | Popover — one step lighter than card |
| `--secondary` | `0 0% 11%` | `#1C1C1C` | Muted surface |
| `--muted` | `0 0% 11%` | `#1C1C1C` | Alias |
| `--muted-foreground` | `0 0% 60%` | `#999999` | Vercel gray-500 |
| `--border` | `0 0% 16%` | `#292929` | Hairline |
| `--input` | `0 0% 11%` | `#1C1C1C` | Form input border |
| `--success` | `152 79% 52%` | `#22E58C` | Brighter for dark surfaces |
| `--warning` | `38 92% 50%` | `#F59E0B` | |
| `--destructive` | `350 100% 65%` | `#FF4F6D` | |
| `--info` | `213 100% 70%` | `#5FB3FF` | |

### Tailwind preset class shortcuts

When writing JSX, prefer these over raw CSS var references:

```
bg-background       text-foreground
bg-card             text-card-foreground
bg-popover          text-popover-foreground
bg-primary          text-primary-foreground
bg-primary-deep     bg-primary-glow
bg-secondary        text-secondary-foreground
bg-accent           text-accent-foreground   bg-accent-deep
bg-muted            text-muted-foreground
bg-success          text-success-foreground
bg-warning          text-warning-foreground
bg-destructive      text-destructive-foreground
bg-info             text-info-foreground
border-border       border-input            ring-ring
```

### Alpha via slash-syntax

Tokens are HSL triplets, so alpha is `hsl(var(--primary) / 0.4)` in CSS or `bg-primary/40` in Tailwind. **Always use slash-syntax**, never `rgba(124, 58, 237, 0.4)` (bypasses the token).

---

## Radius tokens

```
--radius-none: 0px
--radius-sm:   4px      /* dense tables, utility controls */
--radius-md:   6px      /* inputs, small buttons */
--radius-lg:   10px     /* buttons, small cards */
--radius-xl:   14px     /* default cards */
--radius-2xl:  20px     /* hero cards, modals */
--radius-full: 9999px   /* badges, pills */
```

Tailwind classes: `rounded-none` `rounded-sm` `rounded-md` `rounded-lg` `rounded-xl` `rounded-2xl` `rounded-full`. **Default cards use `rounded-xl` (14 px), default buttons use `rounded-lg` (10 px).**

---

## Spacing scale

4-px base. Token names match value in px (no abstract `sm`/`md`/`lg` — explicit numbers reduce mental load).

| Token | Value | Tailwind | Common use |
|---|---|---|---|
| `--space-1` | 4 px | `p-1` `gap-1` | Inline gap between icon + label |
| `--space-2` | 8 px | `p-2` `gap-2` | Default inline gap (button row, badge row) |
| `--space-3` | 12 px | `p-3` `gap-3` | Form-control padding, default row gap |
| `--space-4` | 16 px | `p-4` `gap-4` | Card content gap, section gutter |
| `--space-5` | 20 px | `p-5` | Card padding (default density `md`) |
| `--space-6` | 24 px | `p-6` `gap-6` | Card padding (spacious density) |
| `--space-8` | 32 px | `p-8` `gap-8` | Section-to-section spacing |
| `--space-10` | 40 px | `p-10` | PageShell header gap below title |
| `--space-12` | 48 px | `p-12` | Major section break in long pages |
| `--space-16` | 64 px | `p-16` | Hero band vertical padding |
| `--space-20` | 80 px | `p-20` | Landing-page section padding |
| `--space-24` | 96 px | `p-24` | Hero section vertical rhythm |
| `--space-32` | 128 px | `p-32` | Top-of-page hero stretch |

---

## Density tri-state

Set via `<ThemeProvider defaultDensity="compact|comfortable|spacious">` or runtime `useDensity()`.

| Density | Control height (md tier) | Textarea min-h | Card `md` padding | Body text |
|---|---|---|---|---|
| `compact` | 32 px (`h-8`) | 96 px | 20 px | 14 px |
| `comfortable` *(default)* | **36 px** (`h-[var(--theo-control-h,2.25rem)]`) | 96 px | 20 px | **14 px** |
| `spacious` | 44 px (`h-11`) | 128 px | 24 px | 14 px |

**Density only affects the `md` size tier** — `size="sm"` / `size="lg"` always override. The `md` tier reads `var(--theo-control-h)` from `:root`; the variable resolves per density.

When in doubt: use the default `size` and let density take over. Hardcoding `size="sm"` defeats the runtime tri-state.

---

## Shadow / elevation tokens

```
--shadow-sm:           0 1px 2px 0 hsl(var(--foreground) / 0.06)
--shadow-md:           0 2px 8px -2px hsl(var(--foreground) / 0.08), 0 1px 3px hsl(var(--foreground) / 0.06)
--shadow-lg:           0 12px 32px -8px hsl(var(--foreground) / 0.12), 0 4px 12px hsl(var(--foreground) / 0.08)
--shadow-glow:         0 0 24px hsl(var(--primary) / 0.25)
--shadow-glow-strong:  0 0 32px hsl(var(--primary) / 0.4)
```

**Theme-aware.** Shadows derive from `--foreground` (ink) and `--primary` (glow) — they recolor automatically when the theme swaps. Never write `box-shadow: 0 4px 12px rgba(0,0,0,0.1)` — that hardcodes black and breaks dark mode.

Tailwind: `shadow-sm` `shadow-md` `shadow-lg` `shadow-glow` `shadow-glow-strong`.

### When to use which

- `shadow-sm` — slightly elevated cards in a list (deployment rows, table rows on hover).
- `shadow-md` — floating cards, popovers, dropdowns.
- `shadow-lg` — modals, command palettes, drawers.
- `shadow-glow` — primary button hover ONLY. Never on secondary, never on cards.
- `shadow-glow-strong` — primary button focus + hover combined.

---

## Motion tokens

```
--ease-out-soft: cubic-bezier(0.22, 1, 0.36, 1)
--ease-in-out:   cubic-bezier(0.65, 0, 0.35, 1)
--ease-snap:     cubic-bezier(0.85, 0, 0.15, 1)
--duration-fast: 120ms
--duration-base: 200ms
--duration-slow: 360ms
--stagger:       60ms
```

Tailwind: `duration-fast`/`base`/`slow` and `ease-out-soft`/`ease-snap`. **Never use the browser default `ease`** — it's flat and reads as un-designed.

Reduced motion: all `transition-*` durations neutralize to 0 ms when `prefers-reduced-motion: reduce` fires. Spatial motion collapses to opacity crossfade.

---

## Typography tokens (Geist)

Three faces, three strict weights (400 / 500 / 600), Vercel-inspired scale. Full details in [`typography.md`](typography.md).

```
--font-display: "Geist", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif
--font-body:    "Geist", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif
--font-mono:    "Geist Mono", ui-monospace, SFMono-Regular, Menlo, monospace
```

Tailwind: `font-display` `font-sans` `font-mono`. Body and display share Geist — body is `font-sans` because Tailwind aliases it; display is `font-display` when emphasis on the display weight (600) is wanted.

---

## Anti-pattern: token bypass

The most common LLM failure when generating UI for theo-ui is bypassing the token system. Examples:

```tsx
// WRONG — inline hex
<button style={{ background: '#7C3AED' }}>

// WRONG — raw Tailwind color
<button className="bg-purple-600 hover:bg-purple-700">

// WRONG — raw font-family
<h1 style={{ fontFamily: 'Inter' }}>

// WRONG — raw font size
<h1 className="text-4xl font-bold">

// WRONG — hardcoded shadow
<div style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>

// RIGHT
<Button variant="primary">

// RIGHT — composing primitives
<div className="bg-primary text-primary-foreground rounded-lg shadow-md">

// RIGHT — display headline
<h1 className="text-display-md text-foreground">

// RIGHT — body
<p className="text-body-md text-muted-foreground">
```

The slop test in [`slop-test.md`](slop-test.md) catches each of these as gates **T-01** through **T-08**.
