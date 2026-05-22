import type { Theme } from "./types.js";

/**
 * One Dark / One Light — Atom's iconic syntax theme.
 *
 * Sources:
 *   - atom/one-dark-syntax (MIT) — dark mode canonical
 *   - atom/one-light-syntax (MIT) — light mode canonical
 *
 * Plan: .claude/knowledge-base/plans/seven-themes-plan.md T5.1
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
  fontUrls: [
    "https://fonts.googleapis.com/css2?family=Geist:wght@100..900&family=Geist+Mono:wght@100..900&display=swap",
  ],
  light: {
    background: "0 0% 98%",
    foreground: "230 8% 24%",
    card: "0 0% 100%",
    "card-foreground": "230 8% 24%",
    popover: "0 0% 100%",
    "popover-foreground": "230 8% 24%",
    primary: "220 88% 50%",
    "primary-deep": "220 88% 40%",
    "primary-glow": "220 88% 70%",
    "primary-foreground": "0 0% 100%",
    secondary: "0 0% 95%",
    "secondary-foreground": "230 8% 24%",
    accent: "301 62% 40%",
    "accent-deep": "301 62% 30%",
    "accent-foreground": "0 0% 100%",
    muted: "0 0% 95%",
    "muted-foreground": "230 4% 50%",
    border: "0 0% 90%",
    input: "0 0% 90%",
    ring: "220 88% 50%",
    success: "119 34% 35%",
    "success-foreground": "0 0% 100%",
    warning: "41 99% 30%",
    "warning-foreground": "0 0% 100%",
    destructive: "5 74% 45%",
    "destructive-foreground": "0 0% 100%",
    info: "198 99% 30%",
    "info-foreground": "0 0% 100%",
  },
  dark: {
    background: "220 13% 18%",
    foreground: "220 14% 71%",
    card: "220 13% 15%",
    "card-foreground": "220 14% 71%",
    popover: "220 13% 15%",
    "popover-foreground": "220 14% 71%",
    primary: "207 82% 66%",
    "primary-deep": "207 82% 52%",
    "primary-glow": "207 82% 78%",
    "primary-foreground": "220 13% 18%",
    secondary: "220 13% 23%",
    "secondary-foreground": "220 14% 71%",
    accent: "286 60% 67%",
    "accent-deep": "286 60% 52%",
    "accent-foreground": "220 13% 18%",
    muted: "220 13% 23%",
    "muted-foreground": "220 8% 55%",
    border: "220 13% 28%",
    input: "220 13% 28%",
    ring: "207 82% 66%",
    success: "95 38% 62%",
    "success-foreground": "220 13% 18%",
    warning: "29 54% 61%",
    "warning-foreground": "220 13% 18%",
    destructive: "355 65% 65%",
    "destructive-foreground": "0 0% 100%",
    info: "187 47% 55%",
    "info-foreground": "220 13% 18%",
  },
};
