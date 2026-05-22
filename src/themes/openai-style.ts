import type { Theme } from "./types.js";

/**
 * OpenAI-style — chatgpt.com-inspired minimal tech-utility.
 *
 * Inspired by, not affiliated with OpenAI. Pure white / charcoal canvas +
 * signature ChatGPT green (#10A37F). Minimal saturation, high contrast.
 *
 * Plan: .claude/knowledge-base/plans/seven-themes-plan.md T7.1
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
  fontUrls: [
    "https://fonts.googleapis.com/css2?family=Geist:wght@100..900&family=Geist+Mono:wght@100..900&display=swap",
  ],
  light: {
    background: "0 0% 100%",
    foreground: "0 0% 13%",
    card: "240 5% 97%",
    "card-foreground": "0 0% 13%",
    popover: "0 0% 100%",
    "popover-foreground": "0 0% 13%",
    primary: "165 82% 35%",
    "primary-deep": "165 82% 28%",
    "primary-glow": "165 82% 50%",
    "primary-foreground": "0 0% 100%",
    secondary: "240 5% 96%",
    "secondary-foreground": "0 0% 13%",
    accent: "165 82% 35%",
    "accent-deep": "165 82% 28%",
    "accent-foreground": "0 0% 100%",
    muted: "240 5% 96%",
    "muted-foreground": "240 7% 47%",
    border: "0 0% 90%",
    input: "0 0% 90%",
    ring: "165 82% 35%",
    success: "165 82% 35%",
    "success-foreground": "0 0% 100%",
    warning: "30 91% 44%",
    "warning-foreground": "0 0% 100%",
    destructive: "0 73% 50%",
    "destructive-foreground": "0 0% 100%",
    info: "212 100% 47%",
    "info-foreground": "0 0% 100%",
  },
  dark: {
    background: "0 0% 13%",
    foreground: "0 0% 93%",
    card: "0 0% 18%",
    "card-foreground": "0 0% 93%",
    popover: "0 0% 18%",
    "popover-foreground": "0 0% 93%",
    primary: "155 78% 30%",
    "primary-deep": "155 78% 22%",
    "primary-glow": "155 78% 50%",
    "primary-foreground": "0 0% 100%",
    secondary: "0 0% 20%",
    "secondary-foreground": "0 0% 93%",
    accent: "155 78% 50%",
    "accent-deep": "155 78% 40%",
    "accent-foreground": "0 0% 13%",
    muted: "0 0% 20%",
    "muted-foreground": "0 0% 61%",
    border: "0 0% 26%",
    input: "0 0% 26%",
    ring: "155 78% 43%",
    success: "155 78% 43%",
    "success-foreground": "0 0% 100%",
    warning: "38 92% 50%",
    "warning-foreground": "0 0% 13%",
    destructive: "0 84% 60%",
    "destructive-foreground": "0 0% 100%",
    info: "212 100% 55%",
    "info-foreground": "0 0% 100%",
  },
};
