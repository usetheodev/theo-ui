import type { Theme } from "./types.js";

/**
 * Vercel Mono — razor-sharp monochrome + signature blue.
 *
 * Inspired by, not affiliated with Vercel. Based on Geist Design tokens
 * (https://github.com/vercel/geist). Light = pure white + black ink + blue
 * accent (#0070F3); dark = near-black canvas + white text + same blue.
 *
 * Plan: .claude/knowledge-base/plans/seven-themes-plan.md T2.1
 */
export const vercelMono: Theme = {
  name: "vercel-mono",
  label: "Vercel Mono",
  description: "Inspired by, not affiliated with Vercel. Monochrome canvas + signature blue.",
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
    foreground: "0 0% 0%",
    card: "0 0% 100%",
    "card-foreground": "0 0% 0%",
    popover: "0 0% 100%",
    "popover-foreground": "0 0% 0%",
    primary: "212 100% 47%",
    "primary-deep": "212 100% 36%",
    "primary-glow": "212 100% 72%",
    "primary-foreground": "0 0% 100%",
    secondary: "0 0% 96%",
    "secondary-foreground": "0 0% 0%",
    accent: "212 100% 47%",
    "accent-deep": "212 100% 36%",
    "accent-foreground": "0 0% 100%",
    muted: "0 0% 96%",
    "muted-foreground": "0 0% 40%",
    border: "0 0% 92%",
    input: "0 0% 92%",
    ring: "212 100% 47%",
    success: "168 76% 40%",
    "success-foreground": "0 0% 100%",
    warning: "34 92% 45%",
    "warning-foreground": "0 0% 100%",
    destructive: "0 100% 40%",
    "destructive-foreground": "0 0% 100%",
    info: "212 100% 47%",
    "info-foreground": "0 0% 100%",
  },
  dark: {
    background: "0 0% 4%",
    foreground: "0 0% 93%",
    card: "0 0% 7%",
    "card-foreground": "0 0% 93%",
    popover: "0 0% 7%",
    "popover-foreground": "0 0% 93%",
    primary: "212 100% 55%",
    "primary-deep": "212 100% 42%",
    "primary-glow": "212 100% 75%",
    "primary-foreground": "0 0% 100%",
    secondary: "0 0% 13%",
    "secondary-foreground": "0 0% 93%",
    accent: "212 100% 60%",
    "accent-deep": "212 100% 47%",
    "accent-foreground": "0 0% 0%",
    muted: "0 0% 13%",
    "muted-foreground": "0 0% 60%",
    border: "0 0% 20%",
    input: "0 0% 20%",
    ring: "212 100% 55%",
    success: "144 89% 50%",
    "success-foreground": "0 0% 0%",
    warning: "34 92% 65%",
    "warning-foreground": "0 0% 0%",
    destructive: "0 100% 55%",
    "destructive-foreground": "0 0% 100%",
    info: "212 100% 55%",
    "info-foreground": "0 0% 100%",
  },
};
