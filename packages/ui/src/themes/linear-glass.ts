import type { Theme } from "./types.js";

/**
 * Linear Glass — linear.app-inspired glassy indigo.
 *
 * Inspired by, not affiliated with Linear. Refined indigo-violet primary
 * (#5E6AD2) on near-black canvas in dark, pure white in light. Subtle
 * glassmorphic surface temperature.
 *
 * RFC: wiki/rfcs/0007-seven-themes.md
 */
export const linearGlass: Theme = {
  name: "linear-glass",
  label: "Linear Glass",
  description: "Inspired by, not affiliated with Linear. Refined indigo on glassy surfaces.",
  fonts: {
    display: '"Geist", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    body: '"Geist", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    mono: '"Geist Mono", ui-monospace, SFMono-Regular, Menlo, monospace',
  },
  // No `fontUrls`: Geist and Geist Mono are self-hosted. `@theokit/ui/styles.css` imports
  // `fonts.css`, whose six `@font-face` rules point at woff2 that ship in the package — verified
  // in a browser, `document.fonts` reports Geist 400/500/600 loaded with no network request.
  //
  // The CDN <link> this used to carry was therefore redundant, and not harmless: theokit's default
  // CSP is `style-src 'self' 'unsafe-inline'`, so the browser blocked it and logged a violation on
  // every page load (usetheokit/theokit-ui#125). `fonts.css` already documented self-hosting as the
  // default (HIGH-002 / D6); the decision landed in the CSS and never reached the theme registry.
  light: {
    background: "oklch(1 0 0)",
    foreground: "oklch(0.232 0.006 285.9)",
    card: "oklch(0.983 0.002 264.5)",
    "card-foreground": "oklch(0.232 0.006 285.9)",
    popover: "oklch(1 0 0)",
    "popover-foreground": "oklch(0.232 0.006 285.9)",
    primary: "oklch(0.523 0.175 273.1)",
    "primary-foreground": "oklch(1 0 0)",
    secondary: "oklch(0.967 0.002 286.4)",
    "secondary-foreground": "oklch(0.232 0.006 285.9)",
    accent: "oklch(0.55 0.181 282.4)",
    "accent-foreground": "oklch(1 0 0)",
    muted: "oklch(0.967 0.002 286.4)",
    "muted-foreground": "oklch(0.533 0.014 285.9)",
    border: "oklch(0.943 0.004 286.3)",
    input: "oklch(0.943 0.004 286.3)",
    ring: "oklch(0.523 0.175 273.1)",
    success: "oklch(0.583 0.12 160.3)",
    "success-foreground": "oklch(1 0 0)",
    warning: "oklch(0.665 0.138 68.3)",
    "warning-foreground": "oklch(1 0 0)",
    destructive: "oklch(0.579 0.221 26.6)",
    "destructive-foreground": "oklch(1 0 0)",
    info: "oklch(0.523 0.175 273.1)",
    "info-foreground": "oklch(1 0 0)",
    "status-online": "oklch(0.583 0.12 160.3)",
    "status-online-foreground": "oklch(1 0 0)",
    "status-offline": "oklch(0.579 0.221 26.6)",
    "status-offline-foreground": "oklch(1 0 0)",
    "status-degraded": "oklch(0.665 0.138 68.3)",
    "status-degraded-foreground": "oklch(1 0 0)",
    "status-info": "oklch(0.523 0.175 273.1)",
    "status-info-foreground": "oklch(1 0 0)",
  },
  dark: {
    background: "oklch(0.165 0.006 285.8)",
    foreground: "oklch(0.923 0 0)",
    card: "oklch(0.219 0.009 285.7)",
    "card-foreground": "oklch(0.923 0 0)",
    popover: "oklch(0.219 0.009 285.7)",
    "popover-foreground": "oklch(0.923 0 0)",
    primary: "oklch(0.627 0.149 285.1)",
    "primary-foreground": "oklch(1 0 0)",
    secondary: "oklch(0.25 0.011 285.6)",
    "secondary-foreground": "oklch(0.923 0 0)",
    accent: "oklch(0.718 0.16 291.8)",
    "accent-foreground": "oklch(0.165 0.006 285.8)",
    muted: "oklch(0.25 0.011 285.6)",
    "muted-foreground": "oklch(0.73 0.012 286.1)",
    border: "oklch(0.282 0.009 285.8)",
    input: "oklch(0.282 0.009 285.8)",
    ring: "oklch(0.627 0.149 285.1)",
    success: "oklch(0.73 0.142 156)",
    "success-foreground": "oklch(0.165 0.006 285.8)",
    warning: "oklch(0.813 0.143 66.8)",
    "warning-foreground": "oklch(0.165 0.006 285.8)",
    destructive: "oklch(0.706 0.187 20.3)",
    "destructive-foreground": "oklch(0.165 0.006 285.8)",
    info: "oklch(0.627 0.149 285.1)",
    "info-foreground": "oklch(1 0 0)",
    "status-online": "oklch(0.73 0.142 156)",
    "status-online-foreground": "oklch(0.165 0.006 285.8)",
    "status-offline": "oklch(0.706 0.187 20.3)",
    "status-offline-foreground": "oklch(0.165 0.006 285.8)",
    "status-degraded": "oklch(0.813 0.143 66.8)",
    "status-degraded-foreground": "oklch(0.165 0.006 285.8)",
    "status-info": "oklch(0.627 0.149 285.1)",
    "status-info-foreground": "oklch(1 0 0)",
  },
};
