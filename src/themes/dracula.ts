import type { Theme } from "./types.js";

/**
 * Dracula — the cult OSS dark theme (https://draculatheme.com, MIT).
 *
 * Dark mode = canonical Dracula spec (background #282A36, signature pink
 * #FF79C6, purple #BD93F9, etc.).
 *
 * Note: "light" mode is a Theo-original adaptation — Dracula upstream
 * spec is dark-only. We darken the signature pink/purple to pass WCAG AA
 * against light backgrounds, sacrificing palette purity for accessibility.
 *
 * Plan: .claude/knowledge-base/plans/seven-themes-plan.md T4.1
 */
export const dracula: Theme = {
  name: "dracula",
  label: "Dracula",
  description: "Cult OSS theme (draculatheme.com, MIT). Light mode is Theo-adapted for WCAG AA.",
  fonts: {
    display: '"Geist", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    body: '"Geist", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    mono: '"Geist Mono", ui-monospace, SFMono-Regular, Menlo, monospace',
  },
  fontUrls: [
    "https://fonts.googleapis.com/css2?family=Geist:wght@100..900&family=Geist+Mono:wght@100..900&display=swap",
  ],
  light: {
    background: "60 30% 96%",
    foreground: "231 15% 18%",
    card: "0 0% 100%",
    "card-foreground": "231 15% 18%",
    popover: "0 0% 100%",
    "popover-foreground": "231 15% 18%",
    primary: "275 70% 45%",
    "primary-deep": "271 63% 35%",
    "primary-glow": "265 89% 70%",
    "primary-foreground": "0 0% 100%",
    secondary: "60 20% 92%",
    "secondary-foreground": "231 15% 18%",
    accent: "271 63% 40%",
    "accent-deep": "271 63% 30%",
    "accent-foreground": "0 0% 100%",
    muted: "60 20% 92%",
    "muted-foreground": "225 20% 40%",
    border: "60 15% 88%",
    input: "60 15% 88%",
    ring: "275 70% 45%",
    success: "129 33% 35%",
    "success-foreground": "0 0% 100%",
    warning: "43 89% 30%",
    "warning-foreground": "0 0% 100%",
    destructive: "0 71% 42%",
    "destructive-foreground": "0 0% 100%",
    info: "190 88% 30%",
    "info-foreground": "0 0% 100%",
  },
  dark: {
    background: "231 15% 18%",
    foreground: "60 30% 96%",
    card: "232 14% 22%",
    "card-foreground": "60 30% 96%",
    popover: "232 14% 22%",
    "popover-foreground": "60 30% 96%",
    primary: "326 100% 74%",
    "primary-deep": "326 100% 60%",
    "primary-glow": "326 100% 85%",
    "primary-foreground": "231 15% 18%",
    secondary: "232 14% 28%",
    "secondary-foreground": "60 30% 96%",
    accent: "265 89% 78%",
    "accent-deep": "265 89% 65%",
    "accent-foreground": "231 15% 18%",
    muted: "232 14% 28%",
    "muted-foreground": "225 27% 65%",
    border: "232 14% 31%",
    input: "232 14% 31%",
    ring: "326 100% 74%",
    success: "135 94% 65%",
    "success-foreground": "231 15% 18%",
    warning: "65 92% 76%",
    "warning-foreground": "231 15% 18%",
    destructive: "0 100% 67%",
    "destructive-foreground": "0 0% 100%",
    info: "191 97% 77%",
    "info-foreground": "231 15% 18%",
  },
};
