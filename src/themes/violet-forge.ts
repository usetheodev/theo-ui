import type { Theme } from "./types.js";

/**
 * Violet Forge — the default Theo theme.
 *
 * Identity: Theo violet primary (#7C3AED), burnt sienna accent (#C96442),
 * warm off-white / charcoal violet-tinted base, Boska + Switzer + JetBrains Mono.
 *
 * Source of truth for `data-theme` overrides. Mirrors values declared in
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
  fontUrls: [
    "https://fonts.googleapis.com/css2?family=Geist:wght@100..900&family=Geist+Mono:wght@100..900&display=swap",
  ],
  light: {
    background: "0 0% 100%",
    foreground: "0 0% 4%",
    card: "0 0% 100%",
    "card-foreground": "0 0% 4%",
    popover: "0 0% 100%",
    "popover-foreground": "0 0% 4%",
    primary: "262 83% 58%",
    "primary-deep": "263 70% 42%",
    "primary-glow": "263 90% 76%",
    "primary-foreground": "0 0% 100%",
    secondary: "0 0% 96%",
    "secondary-foreground": "0 0% 4%",
    accent: "15 54% 53%",
    "accent-deep": "15 55% 40%",
    "accent-foreground": "0 0% 100%",
    muted: "0 0% 96%",
    "muted-foreground": "0 0% 45%",
    border: "0 0% 91%",
    input: "0 0% 91%",
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
    background: "0 0% 4%",
    foreground: "0 0% 96%",
    card: "0 0% 7%",
    "card-foreground": "0 0% 96%",
    popover: "0 0% 9%",
    "popover-foreground": "0 0% 96%",
    primary: "262 83% 58%",
    "primary-deep": "263 70% 42%",
    "primary-glow": "263 90% 76%",
    "primary-foreground": "0 0% 100%",
    secondary: "0 0% 11%",
    "secondary-foreground": "0 0% 96%",
    accent: "15 54% 53%",
    "accent-deep": "15 55% 40%",
    "accent-foreground": "0 0% 100%",
    muted: "0 0% 11%",
    "muted-foreground": "0 0% 60%",
    border: "0 0% 16%",
    input: "0 0% 11%",
    ring: "262 83% 58%",
    success: "152 79% 52%",
    "success-foreground": "0 0% 4%",
    warning: "38 92% 50%",
    "warning-foreground": "0 0% 4%",
    destructive: "350 100% 65%",
    "destructive-foreground": "0 0% 4%",
    info: "213 100% 70%",
    "info-foreground": "0 0% 4%",
  },
};
