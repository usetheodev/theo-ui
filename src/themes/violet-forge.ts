import type { Theme } from "./types.js";

/**
 * Violet Forge — the default Theo theme.
 *
 * Identity: Theo violet primary (#7C3AED), burnt sienna accent (#C96442),
 * warm off-white / charcoal violet-tinted base, Geist Sans + Geist Mono.
 *
 * Source of truth for `data-theme` overrides. Mirrors values declared in
 * src/styles/tokens.css for the default `:root`.
 */
export const violetForge: Theme = {
  name: "violet-forge",
  label: "Violet Forge",
  description: "Theo default — violet primary, burnt sienna accent, Geist.",
  fonts: {
    display: '"Geist", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    body: '"Geist", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    mono: '"Geist Mono", ui-monospace, SFMono-Regular, Menlo, monospace',
  },
  fontUrls: [
    "https://fonts.googleapis.com/css2?family=Geist:wght@100..900&family=Geist+Mono:wght@100..900&display=swap",
  ],
  light: {
    background: "36 26% 97%",
    foreground: "261 27% 7%",
    card: "0 0% 100%",
    "card-foreground": "261 27% 7%",
    popover: "0 0% 100%",
    "popover-foreground": "261 27% 7%",
    primary: "262 83% 58%",
    "primary-deep": "263 70% 42%",
    "primary-glow": "263 90% 76%",
    "primary-foreground": "0 0% 100%",
    secondary: "36 18% 92%",
    "secondary-foreground": "261 27% 7%",
    accent: "15 54% 53%",
    "accent-deep": "15 55% 40%",
    "accent-foreground": "0 0% 100%",
    muted: "36 18% 92%",
    "muted-foreground": "268 8% 35%",
    border: "261 18% 11%",
    input: "36 18% 88%",
    ring: "262 83% 58%",
    success: "142 71% 36%",
    "success-foreground": "0 0% 100%",
    warning: "33 92% 44%",
    "warning-foreground": "0 0% 100%",
    destructive: "0 72% 51%",
    "destructive-foreground": "0 0% 100%",
    info: "217 91% 60%",
    "info-foreground": "0 0% 100%",
  },
  dark: {
    background: "261 27% 7%",
    foreground: "36 26% 95%",
    card: "261 26% 9%",
    "card-foreground": "36 26% 95%",
    popover: "261 26% 9%",
    "popover-foreground": "36 26% 95%",
    primary: "262 83% 58%",
    "primary-deep": "263 70% 42%",
    "primary-glow": "263 90% 76%",
    "primary-foreground": "0 0% 100%",
    secondary: "261 18% 11%",
    "secondary-foreground": "36 26% 95%",
    accent: "15 54% 53%",
    "accent-deep": "15 55% 40%",
    "accent-foreground": "0 0% 100%",
    muted: "261 18% 11%",
    "muted-foreground": "261 12% 63%",
    border: "263 17% 16%",
    input: "261 18% 11%",
    ring: "262 83% 58%",
    success: "152 79% 52%",
    "success-foreground": "261 27% 7%",
    warning: "38 92% 50%",
    "warning-foreground": "261 27% 7%",
    destructive: "350 100% 65%",
    "destructive-foreground": "261 27% 7%",
    info: "213 100% 70%",
    "info-foreground": "261 27% 7%",
  },
};
