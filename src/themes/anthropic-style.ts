import type { Theme } from "./types.js";

/**
 * Anthropic-style — claude.ai-inspired editorial calm.
 *
 * Inspired by, not affiliated with Anthropic. Visually informed by claude.ai's
 * warm cream canvas + burnt sienna primary + ink-on-paper feel. No proprietary
 * assets reproduced (font is Geist, colors are independent measurements).
 *
 * Plan: .claude/knowledge-base/plans/seven-themes-plan.md T6.1
 */
export const anthropicStyle: Theme = {
  name: "anthropic-style",
  label: "Anthropic-style",
  description:
    "Inspired by, not affiliated with Anthropic. Warm cream + burnt sienna editorial feel.",
  fonts: {
    display: '"Geist", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    body: '"Geist", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    mono: '"Geist Mono", ui-monospace, SFMono-Regular, Menlo, monospace',
  },
  fontUrls: [
    "https://fonts.googleapis.com/css2?family=Geist:wght@100..900&family=Geist+Mono:wght@100..900&display=swap",
  ],
  light: {
    background: "60 27% 97%",
    foreground: "0 0% 10%",
    card: "0 0% 100%",
    "card-foreground": "0 0% 10%",
    popover: "0 0% 100%",
    "popover-foreground": "0 0% 10%",
    primary: "15 54% 45%",
    "primary-deep": "15 54% 35%",
    "primary-glow": "15 54% 65%",
    "primary-foreground": "0 0% 100%",
    secondary: "45 22% 92%",
    "secondary-foreground": "0 0% 10%",
    accent: "26 39% 39%",
    "accent-deep": "26 39% 29%",
    "accent-foreground": "0 0% 100%",
    muted: "45 22% 92%",
    "muted-foreground": "0 0% 39%",
    border: "45 22% 87%",
    input: "45 22% 87%",
    ring: "15 54% 45%",
    success: "127 35% 35%",
    "success-foreground": "0 0% 100%",
    warning: "35 65% 35%",
    "warning-foreground": "0 0% 100%",
    destructive: "5 60% 40%",
    "destructive-foreground": "0 0% 100%",
    info: "200 50% 35%",
    "info-foreground": "0 0% 100%",
  },
  dark: {
    background: "0 0% 10%",
    foreground: "36 28% 93%",
    card: "0 0% 15%",
    "card-foreground": "36 28% 93%",
    popover: "0 0% 15%",
    "popover-foreground": "36 28% 93%",
    primary: "16 62% 60%",
    "primary-deep": "16 62% 48%",
    "primary-glow": "16 62% 72%",
    "primary-foreground": "0 0% 100%",
    secondary: "0 0% 18%",
    "secondary-foreground": "36 28% 93%",
    accent: "21 33% 55%",
    "accent-deep": "21 33% 42%",
    "accent-foreground": "0 0% 100%",
    muted: "0 0% 18%",
    "muted-foreground": "30 6% 64%",
    border: "0 0% 25%",
    input: "0 0% 25%",
    ring: "16 62% 60%",
    success: "142 71% 58%",
    "success-foreground": "0 0% 10%",
    warning: "45 96% 65%",
    "warning-foreground": "0 0% 10%",
    destructive: "0 84% 60%",
    "destructive-foreground": "0 0% 100%",
    info: "200 70% 60%",
    "info-foreground": "0 0% 10%",
  },
};
