import type { Theme } from "./types.js";

/**
 * OpenAI-style — chatgpt.com-inspired minimal tech-utility.
 *
 * Inspired by, not affiliated with OpenAI. Pure white / charcoal canvas +
 * signature ChatGPT green (#10A37F). Minimal saturation, high contrast.
 *
 * RFC: wiki/rfcs/0007-seven-themes.md
 */
export const openaiStyle: Theme = {
  name: "openai-style",
  label: "OpenAI-style",
  description: "Inspired by, not affiliated with OpenAI. Minimal canvas + ChatGPT green.",
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
    foreground: "oklch(0.248 0 0)",
    card: "oklch(0.976 0.001 286.4)",
    "card-foreground": "oklch(0.248 0 0)",
    popover: "oklch(1 0 0)",
    "popover-foreground": "oklch(0.248 0 0)",
    primary: "oklch(0.636 0.124 169.1)",
    "primary-foreground": "oklch(1 0 0)",
    secondary: "oklch(0.968 0.001 286.4)",
    "secondary-foreground": "oklch(0.248 0 0)",
    accent: "oklch(0.636 0.124 169.1)",
    "accent-foreground": "oklch(1 0 0)",
    muted: "oklch(0.968 0.001 286.4)",
    "muted-foreground": "oklch(0.549 0.026 285.5)",
    border: "oklch(0.923 0 0)",
    input: "oklch(0.923 0 0)",
    ring: "oklch(0.636 0.124 169.1)",
    success: "oklch(0.636 0.124 169.1)",
    "success-foreground": "oklch(1 0 0)",
    warning: "oklch(0.651 0.158 55.2)",
    "warning-foreground": "oklch(1 0 0)",
    destructive: "oklch(0.576 0.218 27.6)",
    "destructive-foreground": "oklch(1 0 0)",
    info: "oklch(0.57 0.211 257.9)",
    "info-foreground": "oklch(1 0 0)",
    "status-online": "oklch(0.636 0.124 169.1)",
    "status-online-foreground": "oklch(1 0 0)",
    "status-offline": "oklch(0.576 0.218 27.6)",
    "status-offline-foreground": "oklch(1 0 0)",
    "status-degraded": "oklch(0.651 0.158 55.2)",
    "status-degraded-foreground": "oklch(1 0 0)",
    "status-info": "oklch(0.57 0.211 257.9)",
    "status-info-foreground": "oklch(1 0 0)",
  },
  dark: {
    background: "oklch(0.248 0 0)",
    foreground: "oklch(0.947 0 0)",
    card: "oklch(0.301 0 0)",
    "card-foreground": "oklch(0.947 0 0)",
    popover: "oklch(0.301 0 0)",
    "popover-foreground": "oklch(0.947 0 0)",
    primary: "oklch(0.555 0.125 158.4)",
    "primary-foreground": "oklch(1 0 0)",
    secondary: "oklch(0.321 0 0)",
    "secondary-foreground": "oklch(0.947 0 0)",
    accent: "oklch(0.808 0.186 157.7)",
    "accent-foreground": "oklch(0.248 0 0)",
    muted: "oklch(0.321 0 0)",
    "muted-foreground": "oklch(0.691 0 0)",
    border: "oklch(0.38 0 0)",
    input: "oklch(0.38 0 0)",
    ring: "oklch(0.722 0.165 157.9)",
    success: "oklch(0.722 0.165 157.9)",
    "success-foreground": "oklch(1 0 0)",
    warning: "oklch(0.77 0.165 70.6)",
    "warning-foreground": "oklch(0.248 0 0)",
    destructive: "oklch(0.636 0.208 25.4)",
    "destructive-foreground": "oklch(1 0 0)",
    info: "oklch(0.627 0.203 256.2)",
    "info-foreground": "oklch(1 0 0)",
    "status-online": "oklch(0.722 0.165 157.9)",
    "status-online-foreground": "oklch(1 0 0)",
    "status-offline": "oklch(0.636 0.208 25.4)",
    "status-offline-foreground": "oklch(1 0 0)",
    "status-degraded": "oklch(0.77 0.165 70.6)",
    "status-degraded-foreground": "oklch(0.248 0 0)",
    "status-info": "oklch(0.627 0.203 256.2)",
    "status-info-foreground": "oklch(1 0 0)",
  },
};
