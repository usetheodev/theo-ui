import type { Theme } from "./types.js";

/**
 * Linear Glass — linear.app-inspired glassy indigo.
 *
 * Inspired by, not affiliated with Linear. Refined indigo-violet primary
 * (#5E6AD2) on near-black canvas in dark, pure white in light. Subtle
 * glassmorphic surface temperature.
 *
 * Plan: .claude/knowledge-base/plans/seven-themes-plan.md T8.1
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
  fontUrls: [
    "https://fonts.googleapis.com/css2?family=Geist:wght@100..900&family=Geist+Mono:wght@100..900&display=swap",
  ],
  light: {
    background: "0 0% 100%",
    foreground: "240 5% 12%",
    card: "220 25% 98%",
    "card-foreground": "240 5% 12%",
    popover: "0 0% 100%",
    "popover-foreground": "240 5% 12%",
    primary: "233 56% 55%",
    "primary-deep": "233 56% 45%",
    "primary-glow": "233 56% 70%",
    "primary-foreground": "0 0% 100%",
    secondary: "240 9% 96%",
    "secondary-foreground": "240 5% 12%",
    accent: "245 60% 60%",
    "accent-deep": "245 60% 50%",
    "accent-foreground": "0 0% 100%",
    muted: "240 9% 96%",
    "muted-foreground": "240 4% 44%",
    border: "240 9% 93%",
    input: "240 9% 93%",
    ring: "233 56% 55%",
    success: "155 62% 35%",
    "success-foreground": "0 0% 100%",
    warning: "35 76% 45%",
    "warning-foreground": "0 0% 100%",
    destructive: "358 75% 50%",
    "destructive-foreground": "0 0% 100%",
    info: "233 56% 55%",
    "info-foreground": "0 0% 100%",
  },
  dark: {
    background: "240 9% 6%",
    foreground: "0 0% 90%",
    card: "240 8% 11%",
    "card-foreground": "0 0% 90%",
    popover: "240 8% 11%",
    "popover-foreground": "0 0% 90%",
    primary: "245 60% 67%",
    "primary-deep": "245 60% 55%",
    "primary-glow": "245 60% 78%",
    "primary-foreground": "0 0% 100%",
    secondary: "240 8% 14%",
    "secondary-foreground": "0 0% 90%",
    accent: "253 100% 78%",
    "accent-deep": "253 100% 65%",
    "accent-foreground": "240 9% 6%",
    muted: "240 8% 14%",
    "muted-foreground": "240 5% 67%",
    border: "240 6% 17%",
    input: "240 6% 17%",
    ring: "245 60% 67%",
    success: "147 49% 53%",
    "success-foreground": "240 9% 6%",
    warning: "32 100% 66%",
    "warning-foreground": "240 9% 6%",
    destructive: "357 100% 70%",
    "destructive-foreground": "240 9% 6%",
    info: "245 60% 67%",
    "info-foreground": "0 0% 100%",
  },
};
