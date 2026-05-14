import type { Theme } from "./types.js";

/**
 * Classic Paper — light-primary with deep-navy dark mirror; Inter + JetBrains Mono.
 *
 * Identity: warm paper background, deep navy foreground, indigo primary
 * (closer to traditional dashboard SaaS), Inter throughout. Maximizes
 * legibility and familiarity — use when reading endurance > differentiation.
 *
 * Provides a full `dark` palette mirror so consumers toggling `.dark` still
 * get a coherent surface (it is not "light-only" by accident).
 */
export const classicPaper: Theme = {
  name: "classic-paper",
  label: "Classic Paper",
  description: "Inter + paper background. Maximum legibility, conservative.",
  fonts: {
    display: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    body: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    mono: '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace',
  },
  fontUrls: [
    "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;700&display=swap",
  ],
  light: {
    background: "36 30% 98%",
    foreground: "222 47% 11%",
    card: "0 0% 100%",
    "card-foreground": "222 47% 11%",
    popover: "0 0% 100%",
    "popover-foreground": "222 47% 11%",
    primary: "221 83% 53%",
    "primary-deep": "224 76% 38%",
    "primary-glow": "217 91% 70%",
    "primary-foreground": "0 0% 100%",
    secondary: "210 40% 96%",
    "secondary-foreground": "222 47% 11%",
    accent: "37 92% 50%",
    "accent-deep": "32 81% 40%",
    "accent-foreground": "0 0% 100%",
    muted: "210 40% 96%",
    "muted-foreground": "215 16% 47%",
    border: "214 32% 91%",
    input: "214 32% 91%",
    ring: "221 83% 53%",
    success: "142 71% 36%",
    "success-foreground": "0 0% 100%",
    warning: "33 92% 44%",
    "warning-foreground": "0 0% 100%",
    destructive: "0 72% 51%",
    "destructive-foreground": "0 0% 100%",
    info: "217 91% 60%",
    "info-foreground": "0 0% 100%",
  },
  // Dark mirror — mainly the same hues with inverted lightness so the theme
  // still feels coherent if a consumer toggles `.dark`.
  dark: {
    background: "222 47% 8%",
    foreground: "210 40% 98%",
    card: "222 47% 11%",
    "card-foreground": "210 40% 98%",
    popover: "222 47% 11%",
    "popover-foreground": "210 40% 98%",
    primary: "217 91% 60%",
    "primary-deep": "221 83% 45%",
    "primary-glow": "213 100% 80%",
    "primary-foreground": "222 47% 11%",
    secondary: "217 19% 18%",
    "secondary-foreground": "210 40% 98%",
    accent: "37 92% 60%",
    "accent-deep": "32 81% 45%",
    "accent-foreground": "222 47% 11%",
    muted: "217 19% 18%",
    "muted-foreground": "215 20% 65%",
    border: "217 19% 22%",
    input: "217 19% 18%",
    ring: "217 91% 60%",
    success: "152 79% 52%",
    "success-foreground": "222 47% 11%",
    warning: "38 92% 50%",
    "warning-foreground": "222 47% 11%",
    destructive: "350 100% 65%",
    "destructive-foreground": "222 47% 11%",
    info: "213 100% 70%",
    "info-foreground": "222 47% 11%",
  },
};
