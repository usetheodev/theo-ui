# Migration Guide — HSL Split → OKLCH (2026-06-03)

| Field | Value |
| --- | --- |
| From version | 0.13.0 |
| To version | next |
| Plan | `.claude/knowledge-base/plans/theo-ui-community-best-practices-alignment-plan.md` |
| Related ADRs | ADR-0004, ADR-0005, ADR-0006, ADR-0007, ADR-0008, ADR-0009 |

This release migrates `@theokit/ui` from the legacy HSL string-tuple format
(`"262 83% 58%"`) to OKLCH (`"oklch(0.542 0.245 293)"`) as the canonical
color format across every theme, token, and helper. It also introduces
status semantic tokens (gateway online/offline/degraded), `respectSystemMode`
on `<ThemeProvider>`, forced-colors (Windows High Contrast Mode) support,
algorithmic tonal derivations, two new composites (`StatusIndicator` +
`MetricCard`), and a build-gate scanner that bans literal Tailwind color
classes in components.

## Quick summary

| Surface | Action |
| --- | --- |
| Pre-built themes | Nothing — runtime cascade unchanged, all 10 themes migrated automatically. |
| Custom themes via `defineTheme()` | Optional — both HSL split and OKLCH now accepted. |
| Custom themes via raw `Theme` interface | Required — add 8 status keys + adapt to optional tonal scales. |
| `hex()` / `rgb()` helper consumers | Optional — output is now OKLCH; legacy HSL via `hexToHsl()` / `rgbToHslLegacy()`. |
| `bg-emerald-500` and similar literal Tailwind colors in components | Required — replaced with semantic tokens; future use blocked by lint rule. |
| Apps wanting OS dark/light auto-detect | New: `respectSystemMode` prop defaults to `true`. |
| Apps targeting Windows enterprise (WHCM) | Automatic — `@media (forced-colors: active)` now active in `tokens.css`. |

## 1. Theme objects — `ColorScale` interface changes

### 1.1 New mandatory status group

`ColorScale` now has 8 new keys (4 status × 2 modes):

```ts
"status-online": string;
"status-online-foreground": string;
"status-offline": string;
"status-offline-foreground": string;
"status-degraded": string;
"status-degraded-foreground": string;
"status-info": string;
"status-info-foreground": string;
```

These are **mandatory** on the raw `Theme` interface (defense in depth — see
ADR-0007). Consumers using `defineTheme(partial)` are unaffected: the helper
auto-populates from `violetForge` defaults.

```ts
// BEFORE (still works through defineTheme)
import { defineTheme, hex } from "@theokit/ui";

export const corp = defineTheme({
  name: "corp",
  light: { primary: hex("#0EA5E9") },
});

// AFTER — same code; status tokens auto-derive from violet-forge defaults.
```

### 1.2 Optional tonal scales

`primary-deep`, `primary-glow`, `accent-deep` are now `optional` on
`ColorScale`. When omitted, CSS auto-derives via the OKLCH relative-color
expressions in `tokens.css` (ADR-0006):

```css
--primary-deep: oklch(from var(--primary) max(0.05, calc(l - 0.16)) c h);
--primary-glow: oklch(from var(--primary) min(0.95, calc(l + 0.18)) c h);
--accent-deep:  oklch(from var(--accent)  max(0.05, calc(l - 0.13)) c h);
```

Custom themes that want a per-token aesthetic can still declare them
explicitly — the cascade resolves theme-specific values over the `:root`
derivation.

### 1.3 Color values — both formats accepted

`COLOR_VALUE_PATTERN` (`src/themes/color-value-pattern.ts`) accepts:

- **OKLCH** (preferred post-migration): `"oklch(0.542 0.245 293)"`, with
  relative-color syntax for derivations: `"oklch(from var(--primary) calc(l - 0.16) c h)"`.
- **Hex**: `"#7C3AED"`, `"#7c3aedff"`.
- **HSL split** (legacy): `"262 83% 58%"` — still validates for backward
  compat with consumer-authored themes.
- **var() references**: `"var(--primary)"`, `"var(--primary, #fff)"`.
- **CSS keywords**: `transparent`, `currentColor`.

No migration required for theme values; pre-existing HSL split themes
continue to work.

## 2. Helpers — `hex()` / `rgb()` output changes

### 2.1 New default: OKLCH

```ts
import { hex, rgb } from "@theokit/ui";

hex("#7C3AED");      // "oklch(0.542 0.245 293)"   ← NEW
rgb(124, 58, 237);   // "oklch(0.542 0.245 293)"   ← NEW
```

### 2.2 Legacy HSL — deprecated but preserved

Imported alongside the new helpers; **deprecated** with @deprecated JSDoc.
Removal scheduled for the next major release.

```ts
import { hexToHsl, rgbToHslLegacy } from "@theokit/ui";

hexToHsl("#7C3AED");          // "262 83% 58%"
rgbToHslLegacy(124, 58, 237); // "262 83% 58%"
```

### 2.3 Alpha composition — switch to `color-mix(in oklch, ...)`

Pre-migration, alpha was composed via `hsl(var(--primary) / 0.5)`. This
fails post-migration because `--primary` is OKLCH (not HSL). The
replacement pattern is perceptually correct:

```css
/* BEFORE */
.tile {
  background: hsl(var(--primary) / 0.1);
}

/* AFTER */
.tile {
  background: color-mix(in oklch, var(--primary) 10%, transparent);
}
```

`tokens.css` (shadows, texture utilities) and `tokens-v4.css` (animations)
have already been migrated. Apps inheriting from `@theokit/ui/tokens.css`
need no change; apps with custom shadows or gradients composing alpha on
theme tokens must update their CSS.

## 3. Components — no more literal Tailwind colors

ADR-0004 bans `bg-emerald-500`, `text-amber-600`, `border-blue-500/40`,
etc. in `src/components/**`. The build-gate scanner
(`scripts/lib/literal-color-scanner.ts`) fires on `pnpm quality:structure`
and lists every violation with suggested semantic tokens.

Mapping cheat sheet:

| Literal Tailwind | Semantic alternative | When to use which |
| --- | --- | --- |
| `bg-emerald-500`, `bg-green-500` | `bg-success` | Action result (positive) |
| `bg-emerald-500`, `bg-green-500` | `bg-status-online` | Operational state (alive) |
| `bg-red-500`, `bg-rose-500` | `bg-destructive` | Action result (negative) |
| `bg-red-500`, `bg-rose-500` | `bg-status-offline` | Operational state (dead) |
| `bg-amber-500`, `bg-yellow-500` | `bg-warning` | Action result (caution) |
| `bg-amber-500`, `bg-yellow-500` | `bg-status-degraded` | Operational state (slow) |
| `bg-blue-500`, `bg-sky-500` | `bg-info` | Action result (info) |
| `bg-blue-500`, `bg-sky-500` | `bg-status-info` | Operational state (info flag) |
| `bg-blue-500`, `bg-indigo-500` | `bg-primary` | Brand surface |
| `bg-gray-100`, `bg-slate-100` | `bg-muted` | Background neutral |
| `bg-gray-200`, `bg-zinc-200` | `bg-secondary` | Button neutral |

12 violations swept in `gateway-status-indicator`, `run-status-pill`,
`update-banner`, `stability-bundle-viewer` as part of T1.2.

## 4. New `respectSystemMode` prop on `<ThemeProvider>`

```tsx
import { ThemeProvider, builtinThemes } from "@theokit/ui";

// Default behavior (NEW post-T5.1) — respect OS prefers-color-scheme:
<ThemeProvider themes={builtinThemes}>{children}</ThemeProvider>

// Force-dark regardless of OS:
<ThemeProvider
  themes={builtinThemes}
  respectSystemMode={false}
  defaultMode="dark"
>
  {children}
</ThemeProvider>
```

Once the user explicitly calls `setMode()` (or a stored `localStorage`
preference exists), the OS signal is ignored. Listener is cleaned up on
unmount (no leaks in micro-frontend mount cycles, EC-12).

For SSR (Next.js, Remix): place `<ThemeScript>` in `<head>` so the no-flash
script reads `matchMedia` + `localStorage` before React hydrates.

## 5. New composites

### 5.1 `<StatusIndicator>` (composite)

```tsx
import { StatusIndicator } from "@theokit/ui";

<StatusIndicator status="online" />
<StatusIndicator status="degraded" label="Slow" pulse />
<StatusIndicator status="offline" label="Disconnected" size="md" />
```

4 statuses (`online` / `offline` / `degraded` / `info`) backed by the new
`--status-*` tokens. See `@theokit/ui/status-indicator` subpath for
tree-shake-friendly import.

### 5.2 `<MetricCard>` (composite)

```tsx
import { MetricCard } from "@theokit/ui";
import { DollarSign } from "lucide-react";

<MetricCard
  title="Revenue"
  value="$12,345"
  delta={{ value: "+12%", trend: "up" }}
  hint="vs last month"
  icon={<DollarSign className="size-4" />}
/>

// invertTrend: for cost / churn / latency where "up" is bad
<MetricCard
  title="Monthly Cost"
  value="$3,200"
  delta={{ value: "+18%", trend: "up" }}
  invertTrend
/>
```

Uses `@container/metric-card` (Tailwind v4 container queries) so the value
font scales when the card width exceeds 18rem — drop a row of cards into
any parent without bespoke responsive logic.

## 6. Forced colors (Windows High Contrast Mode)

`tokens.css` now declares a `@media (forced-colors: active)` block that
maps Theo's semantic tokens to system colors (`Canvas`, `CanvasText`,
`Highlight`, `ButtonBorder`, ...). Apps inheriting `@theokit/ui/tokens.css`
become WCAG 2.2 SC 1.4.1 compliant automatically.

Texture utilities (`.bg-dotted-violet`, `.bg-hero-glow`, ...) opt out via
`forced-color-adjust: none`.

EC-15 documented limitation: WHCM has no semantic system color for
success/destructive/warning — the status group maps all to `Highlight`.
WHCM users rely on text + icons, not color, for distinction.

## 7. Validation surface — Valibot schema

`<ThemeProvider>` and `registerTheme()` now invoke a Valibot schema
(`src/themes/schema.ts`) as a first defense layer (catches missing keys,
malformed font URLs). The per-value regex (`COLOR_VALUE_PATTERN`) remains
as the second defense against CSS injection.

Bundle delta: ~1.5KB gzipped (vs Zod ~12KB — D5 revised post-EC-6).

In dev: schema failures throw with a field-path-keyed message.
In production: schema failures log a `console.warn` and skip the theme;
the per-value fallback (`transparent`) keeps the app rendering.

## 8. Quality gate additions

```bash
pnpm quality:structure   # adds: literal-color-scanner gate
pnpm quality:visual      # NEW: Playwright snapshot diff (1 spec today,
                         # matrix expansion deferred — see tests/visual/README.md)
pnpm quality:gates       # runs the full chain incl. visual
```

CI workflow (`.github/workflows/quality-gates.yml`) installs Playwright
Chromium before running `quality:gates`.

## 9. Backwards-compat invariants

- `<ThemeProvider>` API surface unchanged (new prop opt-in).
- `defineTheme(partial)` API unchanged.
- `hex()` / `rgb()` callable with the same signatures; **output format
  changed** (OKLCH string instead of HSL split). Use `hexToHsl()` /
  `rgbToHslLegacy()` if your downstream code depends on the HSL string
  literal.
- Pre-existing themes registered with HSL split values continue to
  validate and render — no forced migration.
- `validateThemeContrast` (CI gate) accepts both formats via culori
  delegation.

## 10. Rollback path

If a consumer needs to revert to 0.13.0 behavior:

```json
{
  "dependencies": {
    "@theokit/ui": "0.13.0"
  }
}
```

The OKLCH migration is a single npm version cut — no data migration
required (CSS regenerates from theme objects on every page load).

## Questions or issues

File an issue at https://github.com/usetheo/theo-ui/issues with the
`oklch-migration` label.
