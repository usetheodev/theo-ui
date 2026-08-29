import type { Theme } from "./types.js";

/**
 * GitHub Dark — GitHub's default dark theme.
 *
 * Based on the canonical Primer Primitives tokens
 * (https://github.com/primer/primitives, MIT). Light fallback uses GitHub's
 * "light-default" Primer scale.
 *
 * RFC: wiki/rfcs/0007-seven-themes.md
 */
export const githubDark: Theme = {
  name: "github-dark",
  label: "GitHub Dark",
  description: "GitHub's default dark theme. Primer Primitives tokens.",
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
    foreground: "oklch(0.276 0.013 253.5)",
    card: "oklch(0.976 0.004 247.9)",
    "card-foreground": "oklch(0.276 0.013 253.5)",
    popover: "oklch(1 0 0)",
    "popover-foreground": "oklch(0.276 0.013 253.5)",
    primary: "oklch(0.539 0.187 257.1)",
    "primary-foreground": "oklch(1 0 0)",
    secondary: "oklch(0.976 0.004 247.9)",
    "secondary-foreground": "oklch(0.276 0.013 253.5)",
    accent: "oklch(0.592 0.19 256.7)",
    "accent-foreground": "oklch(1 0 0)",
    muted: "oklch(0.976 0.004 247.9)",
    "muted-foreground": "oklch(0.531 0.018 253.4)",
    border: "oklch(0.874 0.01 247.9)",
    input: "oklch(0.874 0.01 247.9)",
    ring: "oklch(0.539 0.187 257.1)",
    success: "oklch(0.524 0.14 147.9)",
    "success-foreground": "oklch(1 0 0)",
    warning: "oklch(0.556 0.116 76.9)",
    "warning-foreground": "oklch(1 0 0)",
    destructive: "oklch(0.549 0.203 23.7)",
    "destructive-foreground": "oklch(1 0 0)",
    info: "oklch(0.539 0.187 257.1)",
    "info-foreground": "oklch(1 0 0)",
    "status-online": "oklch(0.524 0.14 147.9)",
    "status-online-foreground": "oklch(1 0 0)",
    "status-offline": "oklch(0.549 0.203 23.7)",
    "status-offline-foreground": "oklch(1 0 0)",
    "status-degraded": "oklch(0.556 0.116 76.9)",
    "status-degraded-foreground": "oklch(1 0 0)",
    "status-info": "oklch(0.539 0.187 257.1)",
    "status-info-foreground": "oklch(1 0 0)",
  },
  dark: {
    background: "oklch(0.176 0.014 256.8)",
    foreground: "oklch(0.966 0.012 247.9)",
    card: "oklch(0.221 0.015 256.8)",
    "card-foreground": "oklch(0.966 0.012 247.9)",
    popover: "oklch(0.221 0.015 256.8)",
    "popover-foreground": "oklch(0.966 0.012 247.9)",
    primary: "oklch(0.637 0.182 254.9)",
    "primary-foreground": "oklch(1 0 0)",
    secondary: "oklch(0.252 0.019 256.8)",
    "secondary-foreground": "oklch(0.966 0.012 247.9)",
    accent: "oklch(0.66 0.17 255.2)",
    "accent-foreground": "oklch(1 0 0)",
    muted: "oklch(0.252 0.019 256.8)",
    "muted-foreground": "oklch(0.668 0.018 253.4)",
    border: "oklch(0.326 0.016 253.5)",
    input: "oklch(0.326 0.016 253.5)",
    ring: "oklch(0.637 0.182 254.9)",
    success: "oklch(0.712 0.18 147.9)",
    "success-foreground": "oklch(0 0 0)",
    warning: "oklch(0.726 0.142 80.6)",
    "warning-foreground": "oklch(0 0 0)",
    destructive: "oklch(0.653 0.209 25.9)",
    "destructive-foreground": "oklch(1 0 0)",
    info: "oklch(0.637 0.182 254.9)",
    "info-foreground": "oklch(1 0 0)",
    "status-online": "oklch(0.712 0.18 147.9)",
    "status-online-foreground": "oklch(0 0 0)",
    "status-offline": "oklch(0.653 0.209 25.9)",
    "status-offline-foreground": "oklch(1 0 0)",
    "status-degraded": "oklch(0.726 0.142 80.6)",
    "status-degraded-foreground": "oklch(0 0 0)",
    "status-info": "oklch(0.637 0.182 254.9)",
    "status-info-foreground": "oklch(1 0 0)",
  },
};
