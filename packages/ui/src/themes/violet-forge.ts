import type { Theme } from "./types.js";

/**
 * Violet Forge — the default Theo theme.
 *
 * Identity: Theo violet deep-anchored primary (#6F49B1, oklch(0.5 0.16 296.97),
 * hue 296.97, standardized 2026-07-17), burnt sienna accent (#C96442), Vercel-style neutral surfaces
 * (pure white light / charcoal dark), Geist Sans + Geist Mono throughout.
 *
 * Source of truth for `data-theme` overrides. Values mirror
 * src/styles/tokens.css for the default `:root`.
 */
export const violetForge: Theme = {
  name: "violet-forge",
  label: "Violet Forge",
  description: "Theo default — violet primary, burnt sienna accent, Geist Sans + Geist Mono.",
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
    foreground: "oklch(0.146 0 0)",
    card: "oklch(1 0 0)",
    "card-foreground": "oklch(0.146 0 0)",
    popover: "oklch(1 0 0)",
    "popover-foreground": "oklch(0.146 0 0)",
    primary: "oklch(0.5 0.16 296.97)",
    "primary-foreground": "oklch(1 0 0)",
    secondary: "oklch(0.97 0 0)",
    "secondary-foreground": "oklch(0.146 0 0)",
    accent: "oklch(0.621 0.132 39)",
    // Near-black, not white. The burnt sienna sits at L=0.621, where white reaches only
    // 3.83:1 — below the 4.5:1 WCAG AA needs for normal text, and a button label is normal
    // text. This value is the theme's own `foreground`, and measures 5.16:1 against the same
    // accent in both modes. The brand colour is unchanged; only what is legible on top of it
    // is. See usetheokit/theokit-ui#47 and ADR-0006 on deriving tokens rather than hand-
    // tuning them.
    "accent-foreground": "oklch(0.146 0 0)",
    muted: "oklch(0.97 0 0)",
    "muted-foreground": "oklch(0.555 0 0)",
    border: "oklch(0.931 0 0)",
    input: "oklch(0.931 0 0)",
    ring: "oklch(0.5 0.16 296.97)",
    success: "oklch(0.611 0.161 149.7)",
    "success-foreground": "oklch(1 0 0)",
    warning: "oklch(0.67 0.154 60.6)",
    "warning-foreground": "oklch(1 0 0)",
    destructive: "oklch(0.579 0.214 27.2)",
    "destructive-foreground": "oklch(1 0 0)",
    info: "oklch(0.626 0.186 259.6)",
    "info-foreground": "oklch(1 0 0)",
    "status-online": "oklch(0.611 0.161 149.7)",
    "status-online-foreground": "oklch(1 0 0)",
    "status-offline": "oklch(0.579 0.214 27.2)",
    "status-offline-foreground": "oklch(1 0 0)",
    "status-degraded": "oklch(0.67 0.154 60.6)",
    "status-degraded-foreground": "oklch(1 0 0)",
    "status-info": "oklch(0.626 0.186 259.6)",
    "status-info-foreground": "oklch(1 0 0)",
  },
  dark: {
    background: "oklch(0.146 0 0)",
    foreground: "oklch(0.97 0 0)",
    card: "oklch(0.182 0 0)",
    "card-foreground": "oklch(0.97 0 0)",
    popover: "oklch(0.182 0 0)",
    "popover-foreground": "oklch(0.97 0 0)",
    primary: "oklch(0.5 0.16 296.97)",
    "primary-foreground": "oklch(1 0 0)",
    secondary: "oklch(0.227 0 0)",
    "secondary-foreground": "oklch(0.97 0 0)",
    accent: "oklch(0.621 0.132 39)",
    // Near-black, not white. The burnt sienna sits at L=0.621, where white reaches only
    // 3.83:1 — below the 4.5:1 WCAG AA needs for normal text, and a button label is normal
    // text. This value is the theme's own `foreground`, and measures 5.16:1 against the same
    // accent in both modes. The brand colour is unchanged; only what is legible on top of it
    // is. See usetheokit/theokit-ui#47 and ADR-0006 on deriving tokens rather than hand-
    // tuning them.
    "accent-foreground": "oklch(0.146 0 0)",
    muted: "oklch(0.227 0 0)",
    "muted-foreground": "oklch(0.683 0 0)",
    border: "oklch(0.28 0 0)",
    input: "oklch(0.34 0 0)",
    ring: "oklch(0.5 0.16 296.97)",
    success: "oklch(0.814 0.192 155.7)",
    "success-foreground": "oklch(0.146 0 0)",
    warning: "oklch(0.77 0.165 70.6)",
    "warning-foreground": "oklch(0.146 0 0)",
    destructive: "oklch(0.677 0.213 15.6)",
    "destructive-foreground": "oklch(0.146 0 0)",
    info: "oklch(0.732 0.142 254.4)",
    "info-foreground": "oklch(0.146 0 0)",
    "status-online": "oklch(0.814 0.192 155.7)",
    "status-online-foreground": "oklch(0.146 0 0)",
    "status-offline": "oklch(0.677 0.213 15.6)",
    "status-offline-foreground": "oklch(0.146 0 0)",
    "status-degraded": "oklch(0.77 0.165 70.6)",
    "status-degraded-foreground": "oklch(0.146 0 0)",
    "status-info": "oklch(0.732 0.142 254.4)",
    "status-info-foreground": "oklch(0.146 0 0)",
  },
};
