/**
 * Theo UI — Theme types.
 *
 * A Theme is a frozen bundle of CSS-var values that the runtime can swap by
 * setting `data-theme="<name>"` on `<html>`. The structure mirrors what lives
 * in tokens.css so themes can be merged without ambiguity.
 */

export type ThemeMode = "light" | "dark";

export interface ColorScale {
  background: string;
  foreground: string;
  card: string;
  "card-foreground": string;
  popover: string;
  "popover-foreground": string;
  primary: string;
  /**
   * Tonal scale variants of `primary`. Optional since T3.2 (ADR-0006).
   * When omitted, derived in CSS from `--primary` via `oklch(from ...)`.
   * Override per-theme by providing an explicit string.
   */
  "primary-deep"?: string;
  "primary-glow"?: string;
  "primary-foreground": string;
  secondary: string;
  "secondary-foreground": string;
  accent: string;
  /**
   * Tonal scale variant of `accent`. Optional since T3.2 — derived in CSS
   * when omitted. Override per-theme by providing an explicit string.
   */
  "accent-deep"?: string;
  "accent-foreground": string;
  muted: string;
  "muted-foreground": string;
  border: string;
  input: string;
  ring: string;
  success: string;
  "success-foreground": string;
  warning: string;
  "warning-foreground": string;
  destructive: string;
  "destructive-foreground": string;
  info: string;
  "info-foreground": string;
  /**
   * Status semantic group (D4 ADR — community-best-practices plan).
   *
   * Operational state colors (gateway connected/disconnected/slow/info-flag)
   * separated from action-result semantics (success/destructive/warning/info).
   * Defaults in built-in themes mirror their semantic counterparts; consumers
   * may override for visually-distinct status surfaces. `defineTheme(partial)`
   * auto-populates from semantic group when omitted.
   */
  "status-online": string;
  "status-online-foreground": string;
  "status-offline": string;
  "status-offline-foreground": string;
  "status-degraded": string;
  "status-degraded-foreground": string;
  "status-info": string;
  "status-info-foreground": string;
}

export interface ThemeFonts {
  /** Display headlines (h1-h3, hero text). */
  display: string;
  /** Body / UI text. */
  body: string;
  /** Code, mono, paths, timestamps. */
  mono: string;
}

/**
 * The corner radii a theme may set.
 *
 * Every key is optional and only what is present is emitted, so a theme that says nothing about
 * shape inherits the scale in `tokens.css` untouched — the same rule the colour scale follows for
 * its own optional tonal variants.
 *
 * Values are CSS lengths (`0px`, `0.5rem`, `9999px`). They reach the page as `--radius-*`, which
 * the Tailwind `@theme` namespace defers to, so setting one moves every `rounded-*` utility at
 * paint time (usetheokit/theokit-ui#88).
 */
export interface RadiusScale {
  none?: string;
  sm?: string;
  md?: string;
  lg?: string;
  xl?: string;
  "2xl"?: string;
  full?: string;
  /** The shadcn-compatible `--radius`, which components read when they want "the" radius. */
  DEFAULT?: string;
}

/**
 * The elevation a theme may set.
 *
 * Shadows in `tokens.css` are composed from `--foreground` via `color-mix`, so they already follow
 * a palette change. Setting one here replaces that composition outright — useful for a flat theme
 * (`sm: "none"`) or a heavier one, and the reason to reach for it is a different elevation
 * *language*, not a different colour.
 */
export interface ShadowScale {
  sm?: string;
  md?: string;
  lg?: string;
  glow?: string;
  "glow-strong"?: string;
}

/**
 * The motion a theme may set: three durations and three easings.
 *
 * A theme that wants to feel brisk or deliberate changes these rather than every transition in
 * every component. `prefers-reduced-motion` is handled in `global.css` and is not affected by what
 * a theme declares here — a theme cannot re-enable motion for someone who asked for less.
 */
export interface MotionScale {
  "duration-fast"?: string;
  "duration-base"?: string;
  "duration-slow"?: string;
  "ease-out-soft"?: string;
  "ease-snap"?: string;
  "ease-in-out"?: string;
}

export interface Theme {
  /** Stable id, used in `data-theme`. */
  name: string;
  /** Human-readable label for theme switchers. */
  label: string;
  /** Optional short description shown in switchers. */
  description?: string;
  fonts: ThemeFonts;
  light: ColorScale;
  dark: ColorScale;
  /**
   * Optional URL(s) to fetch before applying. The provider injects a `<link>`
   * tag once per URL to load remote fonts. Already-injected URLs are deduped.
   */
  fontUrls?: string[];
  /**
   * Corner radii. Omitted keys keep the scale from `tokens.css`.
   *
   * Shape is not mode-dependent the way colour is — a rounder theme is rounder in both — so these
   * sit beside `light`/`dark` rather than inside them.
   */
  radius?: RadiusScale;
  /**
   * The spacing base. Every `p-*`, `gap-*` and `m-*` utility is `calc(var(--spacing) * n)`, so one
   * value scales the whole rhythm — `"3px"` tightens the entire UI, `"5px"` loosens it.
   */
  spacing?: string;
  /** Elevation. Omitted keys keep the palette-derived shadows from `tokens.css`. */
  shadows?: ShadowScale;
  /** Durations and easings. Omitted keys keep the defaults. */
  motion?: MotionScale;
}
