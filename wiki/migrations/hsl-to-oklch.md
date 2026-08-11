---
type: Migration Guide
title: "Migration — HSL split to OKLCH"
description: What each kind of consumer must do (often nothing) when the canonical color format changed, plus the alpha-composition pattern that genuinely breaks.
tags: [migration, color, oklch, themes, breaking-change]
sources:
  - id: guide
    resource: "git:94d9b11:docs/migration/hsl-to-oklch.md"
generated:
  by: "claude-code/opus-5"
  at: "2026-08-11"
status: stable
---

| Field | Value |
| --- | --- |
| From | 0.13.0 |
| To | next |
| Related | [ADR-0004](/decisions/adr-0004-no-literal-tailwind-colors.md) through [ADR-0009](/decisions/adr-0009-prefers-color-scheme-default.md) |

This release moves from the legacy HSL string-tuple format (`"262 83% 58%"`) to OKLCH
(`"oklch(0.542 0.245 293)"`) as the canonical color format across every theme, token, and
helper. It also introduces status semantic tokens, `respectSystemMode`, forced-colors
support, algorithmic tonal derivations, two new composites, and a gate banning literal
Tailwind color classes.

# Who does what

| Surface | Action |
| --- | --- |
| Pre-built themes | **Nothing.** The runtime cascade is unchanged; all ten themes migrated automatically. |
| Custom themes via `defineTheme()` | **Optional.** Both HSL split and OKLCH are accepted. |
| Custom themes via the raw `Theme` interface | **Required.** Add 8 status keys; adapt to optional tonal scales. |
| `hex()` / `rgb()` consumers | **Optional.** Output is now OKLCH; legacy output via `hexToHsl()` / `rgbToHslLegacy()`. |
| Components using literal Tailwind colors | **Required.** Replace with semantic tokens; future use is blocked by the gate. |
| Apps wanting OS dark/light auto-detect | **New capability** — `respectSystemMode` defaults to `true`. |
| Apps targeting Windows enterprise (WHCM) | **Automatic.** `@media (forced-colors: active)` is now in `tokens.css`. |
| Custom CSS composing alpha on theme tokens | **Required.** See § 3 below — this is the one silent breakage. |

# 1. `ColorScale` changes

## 1.1 New mandatory status group

Eight new keys, mandatory on the raw `Theme` interface (defense in depth —
[ADR-0007](/decisions/adr-0007-status-semantic-tokens.md)):

```ts
"status-online": string;            "status-online-foreground": string;
"status-offline": string;           "status-offline-foreground": string;
"status-degraded": string;          "status-degraded-foreground": string;
"status-info": string;              "status-info-foreground": string;
```

Consumers using `defineTheme(partial)` are **unaffected** — the helper auto-populates from
violet-forge defaults. The code below is identical before and after:

```ts
export const corp = defineTheme({
  name: "corp",
  light: { primary: hex("#0EA5E9") },
});
```

## 1.2 Optional tonal scales

`primary-deep`, `primary-glow`, and `accent-deep` are now **optional**. When omitted, CSS
auto-derives them:

```css
--primary-deep: oklch(from var(--primary) max(0.05, calc(l - 0.16)) c h);
--primary-glow: oklch(from var(--primary) min(0.95, calc(l + 0.18)) c h);
--accent-deep:  oklch(from var(--accent)  max(0.05, calc(l - 0.13)) c h);
```

Custom themes wanting a per-token aesthetic can still declare them explicitly — the cascade
resolves theme-specific values over the `:root` derivation.

## 1.3 Both value formats are accepted

`COLOR_VALUE_PATTERN` accepts OKLCH (preferred), hex, **HSL split (legacy)**, `var()`
references, and CSS keywords. **No migration is required for theme values** — pre-existing
HSL split themes continue to validate and render.

# 2. Helper output changed

```ts
hex("#7C3AED");      // "oklch(0.542 0.245 293)"   ← NEW
rgb(124, 58, 237);   // "oklch(0.542 0.245 293)"   ← NEW

hexToHsl("#7C3AED");          // "262 83% 58%"     — deprecated, removed next major
rgbToHslLegacy(124, 58, 237); // "262 83% 58%"     — deprecated
```

The signatures are unchanged; only the **output format** moved. If downstream code depends
on the HSL string literal, switch to the legacy helpers.

# 3. Alpha composition — the one silent breakage

Before, alpha was composed as `hsl(var(--primary) / 0.5)`. That **fails** once `--primary`
is OKLCH, because the value is no longer an HSL triplet.

```css
/* BEFORE */
.tile { background: hsl(var(--primary) / 0.1); }

/* AFTER */
.tile { background: color-mix(in oklch, var(--primary) 10%, transparent); }
```

`tokens.css` (shadows, textures) and `tokens-v4.css` (animations) are already migrated. Apps
inheriting `@theokit/ui/tokens.css` need no change. **Apps with custom shadows or gradients
composing alpha on theme tokens must update their own CSS** — nothing will error, the color
will simply not render.

# 4. Components — literal Tailwind colors are banned

[ADR-0004](/decisions/adr-0004-no-literal-tailwind-colors.md) bans `bg-emerald-500` and
friends in `src/components/**`. The scanner fires on `pnpm quality:structure` and lists
every violation with suggested tokens. The mapping cheat sheet is in
[`/design-system/color-tokens.md`](/design-system/color-tokens.md).

Twelve violations were swept across `gateway-status-indicator`, `run-status-pill`,
`update-banner`, and `stability-bundle-viewer`.

# 5. New `respectSystemMode` on `<ThemeProvider>`

```tsx
<ThemeProvider themes={builtinThemes}>{children}</ThemeProvider>            // respects OS

<ThemeProvider themes={builtinThemes} respectSystemMode={false} defaultMode="dark">
  {children}                                                               // force-dark
</ThemeProvider>
```

Once the user calls `setMode()` or a stored `localStorage` preference exists, the OS signal
is ignored. The listener is cleaned up on unmount. Full precedence table in
[ADR-0009](/decisions/adr-0009-prefers-color-scheme-default.md).

# 6. Validation moved to valibot

`<ThemeProvider>` and `registerTheme()` now run a valibot schema as the first defense layer
(missing keys, malformed font URLs). The per-value regex remains the second defense against
CSS injection. Bundle delta ~1.5 KB gzipped, versus ~12 KB for Zod.

In development a schema failure throws with a field-path message. In production it warns,
skips the theme, and the per-value fallback keeps the app rendering.

# 7. Backwards-compat invariants

- `<ThemeProvider>` API surface unchanged — the new prop is additive.
- `defineTheme(partial)` API unchanged.
- `hex()` / `rgb()` signatures unchanged; **output format changed**.
- Pre-existing HSL split themes continue to validate and render.
- The contrast gate accepts both formats via culori delegation, so it kept working through
  the migration.

# 8. Rollback

```json
{ "dependencies": { "@theokit/ui": "0.13.0" } }
```

A single npm version cut. **No data migration** — CSS regenerates from theme objects on
every page load.
