---
type: Design Reference
title: Themes — the ten built-ins, ThemeProvider, and defineTheme
description: The theme catalogue with measured contrast, the runtime API, SSR wiring, custom-theme authoring, and the CSS payload trade-off.
tags: [design-system, themes, api, ssr, wcag, trademark]
sources:
  - id: ds-doc
    resource: "git:94d9b11:docs/design-system.md"
  - id: rfc-0007
    resource: "git:94d9b11:docs/rfcs/0007-seven-themes.md"
  - id: rfc-0005
    resource: "git:94d9b11:docs/rfcs/0005-theming-and-sizes.md"
  - id: themes-baseline
    resource: "git:94d9b11:.claude/knowledge-base/architecture/usetheo-ui/baseline-2026-05-22-themes.md"
generated:
  by: "claude-code/opus-5"
  at: "2026-08-11"
status: stable
---

# What a theme is

A frozen bundle of CSS-variable values applied via `data-theme="<name>"` on `<html>`. The
structure is type-checked by `Theme` / `ColorScale` in `src/themes/types.ts` and validated
at runtime by a valibot schema (`src/themes/schema.ts`). Registry and runtime switching
live in `<ThemeProvider>` / `<ThemeSwitcher>`.

Ten themes ship built in. The default is and remains `violet-forge` — growing the
catalogue was additive and broke nothing.

# Schema — the catalogue

Contrast columns are the measured `foreground`/`background` ratio from
`validateThemeContrast` at the time the themes landed.

| Slug | Label | Character | Light body | Dark body |
| --- | --- | --- | --- | --- |
| `violet-forge` | Violet Forge | **Default.** Theo identity | 19.6:1 | 16.1:1 |
| `classic-paper` | Classic Paper | Inter + warm paper, max legibility | 15.0:1 | 14.7:1 |
| `aurora-terminal` | Aurora Terminal | Cyan-aurora, Geist Mono body | 17.2:1 | 13.4:1 |
| `vercel-mono` | Vercel Mono | Pure neutral, blue `#0070F3` | 21.0:1 | 17.5:1 |
| `github-dark` | GitHub Dark | Primer primitives | 14.7:1 | 17.0:1 |
| `dracula` | Dracula | Canonical dark; light is a Theo-original adaptation | 13.2:1 | 13.2:1 |
| `one-dark` | One Dark | Atom One Dark / One Light | 11.0:1 | 7.3:1 |
| `anthropic-style` | Anthropic-style | Warm neutrals, `#C96442` primary | 16.4:1 | 15.0:1 |
| `openai-style` | OpenAI-style | Green `#10A37F` primary | 16.1:1 | 14.0:1 |
| `linear-glass` | Linear Glass | Indigo `#5E6AD2` | 16.3:1 | 16.3:1 |

## Trademark-safe naming

Themes derived from a company's visual language carry a **descriptive suffix**
(`-style`, `-mono`, `-glass`) rather than the bare brand name, and their `description`
must begin with `"Inspired by, not affiliated with [Company]."` This avoids trademark
dilution and false-affiliation exposure (Lanham Act § 43(a)). Slugs from genuinely
open-source palettes (`dracula`, `one-dark`, `github-dark` — all MIT) keep their canonical
names.

## Honest caveats

- **Dracula light is a Theo original.** Dracula upstream is dark-only. The light mode
  darkens the canonical pink primary toward purple to clear WCAG AA. Stated in JSDoc.
- **Derivative themes are not pixel-perfect.** Anthropic, OpenAI, and Linear publish no
  official token reference. The bar is "visually recognizable", not "replicated identity".
- **All themes use Geist.** Replicating Söhne / Mona Sans / Inter Display would cost
  roughly 250 KB extra. Color carries more than 80% of the "feels like X" signal.

# Runtime API

## Basic

```tsx
import { ThemeProvider, builtinThemes } from "@theokit/ui";

<ThemeProvider themes={builtinThemes} defaultTheme="dracula">
  {children}
</ThemeProvider>
```

## SSR (Next.js / Astro / Remix)

Wrap in `<ThemeProvider>` **and** inject `<ThemeScript>` in `<head>`. Without the script
you get a flash of unstyled theme and a hydration mismatch, because the script is what
reads `matchMedia` plus `localStorage` before React hydrates.

```tsx
import { ThemeProvider, ThemeScript } from "@theokit/ui";

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

## Custom themes — `defineTheme`

`ColorScale` requires 29+ keys per mode. `defineTheme(partial)` merges against
`violetForge` so a consumer declares only what changes — the design rationale is
[RFC 0005](/rfcs/0005-theming-and-sizes.md):

```tsx
import { defineTheme, hex, ThemeProvider, builtinThemes } from "@theokit/ui";

const corp = defineTheme({
  name: "corp",
  label: "Corp Dark",
  light: { primary: hex("#0EA5E9"), accent: hex("#F59E0B") },
  dark:  { primary: hex("#38BDF8"), accent: hex("#FBBF24") },
});

<ThemeProvider themes={[...builtinThemes, corp]} defaultTheme="corp">
```

```ts
interface DefineThemeInput {
  name: string;                  // required, matches /^[a-z][a-z0-9-]*$/i
  label?: string;                // defaults to capitalize(name)
  description?: string;
  light?: Partial<ColorScale>;
  dark?: Partial<ColorScale>;
  fonts?: Partial<ThemeFonts>;
  fontUrls?: string[];           // defaults to violetForge.fontUrls
}
```

Three behaviors worth knowing:

- **The base is always `violetForge`**, never the currently active theme. `defineTheme` is
  a pure deterministic function that ignores call-site context. Choosing a different base
  means spreading it manually; a `defineTheme(partial, base)` overload is a 3-line change
  waiting on a real request.
- **Overriding one mode does not touch the other.** `light.primary` without
  `dark.primary` leaves dark on the violet-forge value. Intentional — pass both for
  parity.
- **Last writer wins.** `defineTheme({ name: 'violet-forge', … })` overrides the built-in;
  `<ThemeProvider>` deduplicates by name and keeps the last entry. This is the documented
  mechanism for monkey-patching a built-in palette in tests or sandboxes.

`hex()` and `rgb()` return the canonical color format and throw — naming the offending
value — on malformed input rather than returning garbage. Post-OKLCH migration they emit
OKLCH; `hexToHsl()` / `rgbToHslLegacy()` remain for one minor as deprecated escapes. See
[`/migrations/hsl-to-oklch.md`](/migrations/hsl-to-oklch.md).

# CSS payload trade-off

Each registered theme adds roughly **6 KB** of CSS variables to the runtime
`<style id="theo-ui-theme-vars">` block that `<ThemeProvider>` injects. Passing all ten
built-ins therefore injects ~60 KB into the DOM — a cold-parse cost around 25–35 ms on a
mid-tier laptop.

That is acceptable for an app that genuinely exposes a ten-theme switcher. It is **not
free**. For one or two themes, pass an explicit subset:

```tsx
<ThemeProvider themes={[violetForge, dracula]} defaultTheme="violet-forge">
```

Tree-shaking removes unimported theme source files from the **JS** bundle automatically.
The payload concern is exclusively the runtime `<style>` block, not the barrel import.

Packaging themes as separate subpaths (`@theokit/ui/themes/dracula`) was considered and
rejected: real bundle isolation, but four imports instead of one, for a payload that is
already opt-in.

# Validation

Two layers, deliberately redundant:

1. **valibot** (`src/themes/schema.ts`) validates shape and types. ~1.5 KB gzipped, chosen
   over Zod's ~12 KB.
2. **`COLOR_VALUE_PATTERN`** validates each individual color value is safe to interpolate
   into CSS — the defense against injection through a theme object.

In development, a schema failure throws with a field-path-keyed message. In production it
logs `console.warn`, skips the theme, and the per-value fallback (`transparent`) keeps the
app rendering.

Contrast is enforced separately by the `validateThemeContrast` gate — see
[`/design-system/accessibility.md`](/design-system/accessibility.md).
