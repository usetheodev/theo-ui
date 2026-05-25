import type { Theme } from "./types.js";

/**
 * GitHub Dark — GitHub's default dark theme.
 *
 * Based on the canonical Primer Primitives tokens
 * (https://github.com/primer/primitives, MIT). Light fallback uses GitHub's
 * "light-default" Primer scale.
 *
 * Plan: .claude/knowledge-base/plans/seven-themes-plan.md T3.1
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
  fontUrls: [
    "https://fonts.googleapis.com/css2?family=Geist:wght@100..900&family=Geist+Mono:wght@100..900&display=swap",
  ],
  light: {
    background: "0 0% 100%",
    foreground: "213 13% 16%",
    card: "210 29% 97%",
    "card-foreground": "213 13% 16%",
    popover: "0 0% 100%",
    "popover-foreground": "213 13% 16%",
    primary: "212 92% 44%",
    "primary-deep": "212 92% 36%",
    "primary-glow": "212 92% 58%",
    "primary-foreground": "0 0% 100%",
    secondary: "210 29% 97%",
    "secondary-foreground": "213 13% 16%",
    accent: "213 84% 52%",
    "accent-deep": "213 84% 42%",
    "accent-foreground": "0 0% 100%",
    muted: "210 29% 97%",
    "muted-foreground": "213 8% 43%",
    border: "210 14% 84%",
    input: "210 14% 84%",
    ring: "212 92% 44%",
    success: "137 66% 30%",
    "success-foreground": "0 0% 100%",
    warning: "41 100% 30%",
    "warning-foreground": "0 0% 100%",
    destructive: "355 71% 47%",
    "destructive-foreground": "0 0% 100%",
    info: "212 92% 44%",
    "info-foreground": "0 0% 100%",
  },
  dark: {
    background: "215 28% 7%",
    foreground: "210 67% 96%",
    card: "215 21% 11%",
    "card-foreground": "210 67% 96%",
    popover: "215 21% 11%",
    "popover-foreground": "210 67% 96%",
    primary: "212 92% 57%",
    "primary-deep": "212 92% 47%",
    "primary-glow": "213 92% 67%",
    "primary-foreground": "0 0% 100%",
    secondary: "215 21% 14%",
    "secondary-foreground": "210 67% 96%",
    accent: "213 92% 61%",
    "accent-deep": "213 92% 50%",
    "accent-foreground": "0 0% 100%",
    muted: "215 21% 14%",
    "muted-foreground": "213 9% 59%",
    border: "213 13% 21%",
    input: "213 13% 21%",
    ring: "212 92% 57%",
    success: "135 53% 49%",
    "success-foreground": "0 0% 0%",
    warning: "41 73% 48%",
    "warning-foreground": "0 0% 0%",
    destructive: "1 90% 62%",
    "destructive-foreground": "0 0% 100%",
    info: "212 92% 57%",
    "info-foreground": "0 0% 100%",
  },
};
