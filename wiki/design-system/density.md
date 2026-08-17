---
type: Design Policy
title: Density — compact, comfortable, spacious
description: The three-tier density system, the exact control heights, and the specificity invariant that keeps an explicit size prop winning over the global density.
tags: [design-system, density, api, invariant, wcag]
sources:
  - id: ds-doc
    resource: "archive:94d9b11:docs/design-system.md"
  - id: rfc-0006
    resource: "archive:94d9b11:docs/rfcs/0006-density-faang.md"
  - id: density-baseline
    resource: "archive:94d9b11:.claude/knowledge-base/architecture/usetheo-ui/baseline-2026-05-22-density.md"
generated:
  by: "claude-code/opus-5"
  at: "2026-08-11"
status: stable
---

# The three tiers

Violet Forge defaults target FAANG-modern dashboards (Vercel · Linear · Stripe-aligned).

| Density | Button / Input / Select.Trigger | Textarea min-h | Card `md` padding | Body text |
| --- | --- | --- | --- | --- |
| `compact` | 32px (`h-8`) | 96px (`6rem`) | 20px (`p-5`) | 14px |
| `comfortable` | **36px** (default) | 96px (`6rem`) | 20px (`p-5`) | **14px** |
| `spacious` | 44px (`h-11`) | 128px (`8rem`) | 24px (`p-6`) | 14px |

# API

```tsx
import { ThemeProvider, builtinThemes, useDensity } from "@theokit/ui";

<ThemeProvider themes={builtinThemes} defaultDensity="compact">
  {children}
</ThemeProvider>
```

```tsx
const { density, setDensity } = useDensity();
setDensity("compact");
```

```ts
interface DensityContextValue {
  density: "compact" | "comfortable" | "spacious";
  setDensity: (next: Density) => void;
}
```

# The invariant: explicit `size` always wins

**Density only affects the `md` tier.** An explicit `size="sm"` or `size="lg"` overrides
density unconditionally, because those variants use hardcoded classes (`h-8`, `h-11`)
rather than the CSS-variable lookup the `md` variant uses.

This is not a stylistic choice — it is a specificity fix. The first design routed density
through Tailwind class modifiers like `data-[density=compact]:h-8`, which Tailwind
compiles to `[data-density="compact"] .h-8`, specificity `(0,1,1)`. The CVA variant `.h-9`
is `(0,1,0)`. Density would have silently overridden an explicit `<Button size="md">`.

The shipped design instead injects CSS variables and reads them only from `md`:

```css
[data-density="compact"]     { --theo-control-h: 2rem;    --theo-control-px: 0.75rem; }
[data-density="comfortable"] { --theo-control-h: 2.25rem; --theo-control-px: 0.875rem; }
[data-density="spacious"]    { --theo-control-h: 2.75rem; --theo-control-px: 1rem; }
```

```ts
md: "h-[var(--theo-control-h,2.25rem)] px-[var(--theo-control-px,0.875rem)] text-body-sm"
```

Result: `<Button size="sm">` inside `data-density="spacious"` still renders 32px.

# Why 36px and not 30px

The original request was a 25% tightening (40px → 30px). That was **not** shipped, and the
recalibration is documented rather than silently applied.

30px sits below the WCAG 2.5.8 AA comfortable minimum and outside the range of every
mainstream design system. The measured industry delta is ~10%:

| Control | `@theokit/ui` before | shadcn | Mantine `md` | Linear | Vercel | Shipped |
| --- | --- | --- | --- | --- | --- | --- |
| Button `md` | 40px | 36px | 36px | ~36px | ~36px | **36px** |
| Input `md` | 40px | 36px | 36px | ~36px | ~36px | **36px** |
| Select.Trigger `md` | 40px | 36px | 36px | ~36px | ~36px | **36px** |
| Card padding `md` | 24px | — | — | ~20px | ~20px | **20px** |

Controls already aligned with industry and left unchanged: Checkbox `md` 16px, Switch
track 20×36 (already tighter than shadcn's 24×44), Avatar `md` 36px, Badge `md`
`px-2.5 py-0.5`, Toast padding `md` 16px.

# Tap targets

`@theokit/ui` targets **WCAG 2.5.8 Level AA** — 24×24 CSS pixels of effective tap area.

| Standard | Requirement | `compact` (32px) | `comfortable` (36px) | `spacious` (44px) |
| --- | --- | --- | --- | --- |
| 2.5.8 AA | 24×24 effective | pass | pass | pass |
| 2.5.5 AAA | 44×44 | fail | fail | pass |

AAA is **not** targeted at `comfortable`. Consumers requiring it opt into `spacious`
globally or `size="lg"` per call site. `compact` still clears AA because the visible
control plus the 2px focus ring on each side expands the focusable area to roughly 36×36.

Five density tiers were rejected: Material 3, Linear, and Vercel all converged on three,
and a five-tier variable cascade explodes without a consumer use case.
