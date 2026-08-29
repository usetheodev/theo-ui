import type { Theme } from "./types.js";

/**
 * One Dark / One Light — Atom's iconic syntax theme.
 *
 * Sources:
 *   - atom/one-dark-syntax (MIT) — dark mode canonical
 *   - atom/one-light-syntax (MIT) — light mode canonical
 *
 * RFC: wiki/rfcs/0007-seven-themes.md
 */
export const oneDark: Theme = {
  name: "one-dark",
  label: "One Dark",
  description: "Atom's One Dark + One Light syntax theme (MIT). Iconic IDE look.",
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
    background: "oklch(0.985 0 0)",
    foreground: "oklch(0.35 0.014 276.7)",
    card: "oklch(1 0 0)",
    "card-foreground": "oklch(0.35 0.014 276.7)",
    popover: "oklch(1 0 0)",
    "popover-foreground": "oklch(0.35 0.014 276.7)",
    primary: "oklch(0.529 0.235 262.3)",
    "primary-foreground": "oklch(1 0 0)",
    secondary: "oklch(0.962 0 0)",
    "secondary-foreground": "oklch(0.35 0.014 276.7)",
    accent: "oklch(0.522 0.209 328.8)",
    "accent-foreground": "oklch(1 0 0)",
    muted: "oklch(0.962 0 0)",
    "muted-foreground": "oklch(0.588 0.013 276.9)",
    border: "oklch(0.923 0 0)",
    input: "oklch(0.923 0 0)",
    ring: "oklch(0.529 0.235 262.3)",
    success: "oklch(0.515 0.111 143.4)",
    "success-foreground": "oklch(1 0 0)",
    warning: "oklch(0.555 0.116 77)",
    "warning-foreground": "oklch(1 0 0)",
    destructive: "oklch(0.544 0.194 29.8)",
    "destructive-foreground": "oklch(1 0 0)",
    info: "oklch(0.499 0.108 236.7)",
    "info-foreground": "oklch(1 0 0)",
    "status-online": "oklch(0.515 0.111 143.4)",
    "status-online-foreground": "oklch(1 0 0)",
    "status-offline": "oklch(0.544 0.194 29.8)",
    "status-offline-foreground": "oklch(1 0 0)",
    "status-degraded": "oklch(0.555 0.116 77)",
    "status-degraded-foreground": "oklch(1 0 0)",
    "status-info": "oklch(0.499 0.108 236.7)",
    "status-info-foreground": "oklch(1 0 0)",
  },
  dark: {
    background: "oklch(0.292 0.016 264.3)",
    foreground: "oklch(0.761 0.021 264.4)",
    card: "oklch(0.262 0.013 264.3)",
    "card-foreground": "oklch(0.761 0.021 264.4)",
    popover: "oklch(0.262 0.013 264.3)",
    "popover-foreground": "oklch(0.761 0.021 264.4)",
    primary: "oklch(0.732 0.121 245.2)",
    "primary-foreground": "oklch(0.292 0.016 264.3)",
    secondary: "oklch(0.34 0.019 264.3)",
    "secondary-foreground": "oklch(0.761 0.021 264.4)",
    accent: "oklch(0.694 0.163 318)",
    "accent-foreground": "oklch(0.292 0.016 264.3)",
    muted: "oklch(0.34 0.019 264.3)",
    "muted-foreground": "oklch(0.63 0.02 264.4)",
    border: "oklch(0.387 0.023 264.3)",
    input: "oklch(0.387 0.023 264.3)",
    ring: "oklch(0.732 0.121 245.2)",
    success: "oklch(0.768 0.11 133.1)",
    "success-foreground": "oklch(0.292 0.016 264.3)",
    warning: "oklch(0.727 0.095 63.5)",
    "warning-foreground": "oklch(0.292 0.016 264.3)",
    destructive: "oklch(0.67 0.145 16.7)",
    "destructive-foreground": "oklch(1 0 0)",
    info: "oklch(0.722 0.091 206.9)",
    "info-foreground": "oklch(0.292 0.016 264.3)",
    "status-online": "oklch(0.768 0.11 133.1)",
    "status-online-foreground": "oklch(0.292 0.016 264.3)",
    "status-offline": "oklch(0.67 0.145 16.7)",
    "status-offline-foreground": "oklch(1 0 0)",
    "status-degraded": "oklch(0.727 0.095 63.5)",
    "status-degraded-foreground": "oklch(0.292 0.016 264.3)",
    "status-info": "oklch(0.722 0.091 206.9)",
    "status-info-foreground": "oklch(0.292 0.016 264.3)",
  },
};
