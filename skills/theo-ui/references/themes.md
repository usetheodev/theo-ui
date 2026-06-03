# Themes

`@theokit/ui` ships 10 built-in themes plus a `defineTheme()` API for custom themes. The skill respects the project's theme; it does NOT rotate themes per build.

---

## Built-in themes

| Slug | Label | Vibe | Display style | Accent hue |
|---|---|---|---|---|
| `violet-forge` *(default)* | Violet Forge | Theo identity. Vercel-style neutrals + Theo violet. | Geometric sans (Geist) | Warm violet `#7C3AED` |
| `classic-paper` | Classic Paper | Warm paper + Inter — maximum legibility. | Geometric sans (Inter) | Warm violet |
| `aurora-terminal` | Aurora Terminal | Cyan-aurora + Geist Mono body — developer-console feel. | Monospace (Geist Mono body) | Cool cyan |
| `vercel-mono` | Vercel Mono (Inspired by, not affiliated with Vercel) | Pure neutral + black primary CTA. | Geometric sans (Geist) | Neutral (no chromatic accent) |
| `github-dark` | GitHub Dark | GitHub's dark editor palette. | Geometric sans | Cool blue |
| `dracula` | Dracula | Dracula spec — purple + pink + cyan on dark. | Geometric sans | Warm purple |
| `one-dark` | One Dark (Atom) | Atom's One Dark scheme. | Geometric sans | Cool blue-purple |
| `anthropic-style` | Anthropic-style (Inspired by, not affiliated with Anthropic) | Warm cream + coral. | Editorial sans + serif | Warm coral |
| `openai-style` | OpenAI-style (Inspired by, not affiliated with OpenAI) | Black + white minimal. | Geometric sans | Neutral |
| `linear-glass` | Linear Glass (Inspired by, not affiliated with Linear) | Soft purple-blue + frosted accents (legal frosting only, no actual glass effect). | Geometric sans | Cool indigo |

**Trademark naming.** Themes derived from external brands use `-style` / `-mono` / `-glass` suffixes. The label includes "Inspired by, not affiliated with [X]" per the `seven-themes-edge-cases-2026-05-22.md` resolution.

---

## Importing themes

```tsx
import {
  ThemeProvider,
  violetForge,
  classicPaper,
  auroraTerminal,
  vercelMono,
  githubDark,
  dracula,
  oneDark,
  anthropicStyle,
  openaiStyle,
  linearGlass,
  builtinThemes,
} from "@theokit/ui";
```

`builtinThemes` is an array of all 10 — pass to `<ThemeProvider themes={builtinThemes}>` to enable the full theme switcher.

---

## Setting the theme at the root

```tsx
import { ThemeProvider } from "@theokit/ui";

<ThemeProvider defaultTheme="violet-forge" defaultDensity="comfortable">
  <App />
</ThemeProvider>
```

`<ThemeProvider>` injects the theme's CSS tokens into a `<style id="theo-ui-theme-vars">` block in the document head. The `data-theme` attribute on `<html>` selects which theme renders.

For multi-theme apps with a theme switcher:

```tsx
import { ThemeProvider, ThemeSwitcher, builtinThemes } from "@theokit/ui";

<ThemeProvider themes={builtinThemes} defaultTheme="violet-forge">
  <App />
  <ThemeSwitcher />  // exposes a dropdown to switch themes at runtime
</ThemeProvider>
```

### CSS payload trade-off (EC-4)

Passing all 10 themes injects ~60 KB of CSS into the DOM (~6 KB per theme). Browser cold-parse is ~25–35 ms on mid-tier laptops. Acceptable for apps that genuinely expose a 10-theme switcher. For apps focused on 1–2 themes:

```tsx
<ThemeProvider themes={[violetForge, dracula]} defaultTheme="violet-forge">
```

Reduces the payload to ~12 KB.

---

## Custom themes via `defineTheme()`

```tsx
import { defineTheme, hex, rgb } from "@theokit/ui";

export const myBrandTheme = defineTheme({
  name: "my-brand",
  label: "My Brand",
  description: "Custom theme for MyBrand corp.",
  fonts: {
    display: '"Inter", -apple-system, sans-serif',
    body: '"Inter", -apple-system, sans-serif',
    mono: '"JetBrains Mono", monospace',
  },
  fontUrls: [
    "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap",
  ],
  light: {
    background: hex("#FFFFFF"),  // converts to HSL triplet
    foreground: hex("#0A0A0A"),
    // ... full ColorScale
    primary: rgb(124, 58, 237),  // RGB constructor
    "primary-foreground": hex("#FFFFFF"),
    // ...
  },
  dark: {
    background: hex("#0A0A0A"),
    // ... full dark ColorScale
  },
});
```

### Validation

`defineTheme()` runs WCAG contrast checks at build time on:

- `foreground` vs `background` (must pass AA — 4.5:1).
- `primary-foreground` vs `primary` (must pass AA).
- `destructive-foreground` vs `destructive` (must pass AA).

Failure throws at build time, not runtime. The validator lives in `scripts/lib/wcag-contrast.ts`.

### Custom + built-in together

```tsx
import { ThemeProvider, builtinThemes } from "@theokit/ui";
import { myBrandTheme } from "./theme";

<ThemeProvider
  themes={[myBrandTheme, ...builtinThemes]}
  defaultTheme="my-brand"
>
  <App />
</ThemeProvider>
```

---

## When the skill switches themes

The skill does NOT switch themes per build. It respects the project's chosen theme silently.

**The skill switches themes only when:**

1. The user explicitly says `"switch theme to <name>"` or `"use <theme>"`.
2. The pre-flight scan finds NO `<ThemeProvider>` mount AND the project has no theme set — defaults to `violet-forge`.
3. The user is starting a fresh project (no existing theme) and the skill is asked to set up the root.

In all three cases, the skill wires `<ThemeProvider defaultTheme="...">` at the root and the build uses that theme's tokens. State the choice out loud.

---

## Theme switching at runtime

Use `<ThemeSwitcher>` (composite) for a built-in dropdown:

```tsx
import { ThemeSwitcher } from "@theokit/ui";

<ThemeSwitcher align="end" />
```

Or roll your own via `useTheme()`:

```tsx
import { useTheme } from "@theokit/ui";

function CustomThemeToggle() {
  const { theme, setTheme, availableThemes } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenu.Trigger asChild>
        <Button variant="ghost" size="sm">{theme.label}</Button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Content>
        {availableThemes.map((t) => (
          <DropdownMenu.Item key={t.name} onSelect={() => setTheme(t.name)}>
            {t.label}
          </DropdownMenu.Item>
        ))}
      </DropdownMenu.Content>
    </DropdownMenu>
  );
}
```

### Persistence

`<ThemeProvider>` persists the user's choice to `localStorage` under the key `theo-ui-theme`. To override:

```tsx
<ThemeProvider storageKey="my-app-theme" defaultTheme="violet-forge">
```

To disable persistence:

```tsx
<ThemeProvider persist={false} defaultTheme="violet-forge">
```

---

## Density and theme

Theme and density are independent. A theme controls colors + fonts. Density controls control sizes + padding. You can mix:

```tsx
<ThemeProvider defaultTheme="dracula" defaultDensity="compact">
```

Or change them independently at runtime:

```tsx
const { setTheme } = useTheme();
const { setDensity } = useDensity();

setTheme("aurora-terminal");
setDensity("spacious");
```

---

## Mode (light / dark) within a theme

Each theme defines BOTH light and dark palettes. The active mode is controlled by:

1. The `<html class="dark">` class — set by the consumer (or by Next.js `next-themes` integration, or by theo-ui's own mode toggle).
2. `prefers-color-scheme` media query when no class is set.

To toggle programmatically:

```tsx
function ModeToggle() {
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => document.documentElement.classList.toggle("dark")}
      aria-label="Toggle dark mode"
    >
      <SunMoon className="h-4 w-4" />
    </Button>
  );
}
```

Or integrate with `next-themes`:

```tsx
import { ThemeProvider as NextThemeProvider } from "next-themes";
import { ThemeProvider as TheoUIThemeProvider } from "@theokit/ui";

<NextThemeProvider attribute="class" defaultTheme="dark">
  <TheoUIThemeProvider defaultTheme="violet-forge">
    <App />
  </TheoUIThemeProvider>
</NextThemeProvider>
```

`next-themes` manages the `dark` class; theo-ui manages the theme variant (palette + fonts).

---

## When to recommend each theme

| Use case | Recommended theme |
|---|---|
| Default Theo identity | `violet-forge` |
| Maximum legibility, paper-like surface | `classic-paper` |
| Dev tools, terminal aesthetic | `aurora-terminal` |
| Pure neutral, ink-only CTA | `vercel-mono` |
| GitHub-aligned dev surface | `github-dark` |
| Long coding sessions, low-fatigue | `one-dark`, `dracula` |
| Editorial / blog / docs | `anthropic-style` |
| Minimal black-and-white SaaS | `openai-style` |
| Soft brand, agency / studio | `linear-glass` |

Don't switch themes silently. State the choice and the reason ("Switching to `aurora-terminal` because this is a dev-tool surface and the brief mentioned monospace body").

---

## Custom theme construction (when the user asks)

When the user asks for a custom theme (e.g., "make a theme matching our brand color `#FF6B35`"), follow this protocol:

1. **Convert the brand color to HSL.** `#FF6B35` → `hsl(16 100% 60%)`.
2. **Derive primary-deep + primary-glow:**
   - `primary-deep` = primary with lightness reduced by ~15% (`hsl(16 100% 45%)`)
   - `primary-glow` = primary with lightness raised by ~15% (`hsl(16 100% 75%)`)
3. **Derive accent.** Either complementary (180° hue shift) or analogous (30° shift). For most brands, analogous works better.
4. **Use neutral surfaces.** Pure neutrals (0% saturation) for `background`, `card`, `popover`, `secondary`, `muted`, `border`. Don't tint surfaces with the brand color — that produces a 2010s-era "branded" look.
5. **Keep semantic colors close to defaults.** Success / warning / destructive / info should use the standard hues (green / amber / red / blue). Don't recolor "success" to brand orange — accessibility + recognition breaks.
6. **Run the contrast check.** `defineTheme()` validates at build time, but you can pre-check via `validateThemeContrast(theme)` from `scripts/lib/wcag-contrast.ts`.

```tsx
export const orangeTheme = defineTheme({
  name: "orange-bold",
  label: "Orange Bold",
  description: "Custom theme for MyBrand — primary #FF6B35.",
  fonts: {
    display: '"Inter", sans-serif',
    body: '"Inter", sans-serif',
    mono: '"JetBrains Mono", monospace',
  },
  light: {
    background: "0 0% 100%",
    foreground: "0 0% 4%",
    primary: "16 100% 60%",         // #FF6B35
    "primary-deep": "16 100% 45%",
    "primary-glow": "16 100% 75%",
    "primary-foreground": "0 0% 100%",
    accent: "46 100% 50%",          // analogous +30° (amber)
    // ... rest of ColorScale with standard neutrals + semantics
  },
  dark: {
    // ... corresponding dark mode values
  },
});
```

The full theme structure mirrors `src/themes/violet-forge.ts`. Copy that file, change the values, keep the structure.
