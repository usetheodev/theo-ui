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
}
