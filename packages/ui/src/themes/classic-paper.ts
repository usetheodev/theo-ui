import type { Theme } from "./types.js";

/**
 * Classic Paper — visibly warm cream surface; Inter + JetBrains Mono.
 *
 * Identity: cream paper background with sepia warmth (calibrated against the
 * Vintage Paper / Anthropic Claude UI references), deep navy foreground,
 * indigo primary. Optimized for long agent/chat sessions where pure-white
 * surfaces cause vision fatigue (per IxDF 2026 + ACM 2025 light-mode studies).
 *
 * Token calibration (light mode):
 *   - background L=0.95 chroma=0.025 hue=80 — visibly cream paper
 *   - card L=0.97 chroma=0.012 hue=80 — sub-paper layer (cards stand out)
 *   - foreground unchanged (deep navy, AAA contrast >12:1 vs background)
 *
 * Dark mirror unchanged.
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
  // The one theme that still fetches. Inter and JetBrains Mono are NOT among the six woff2 the
  // package self-hosts — those are Geist and Geist Mono — so dropping this would leave the
  // theme on system fonts. A consumer choosing it must widen `style-src` AND `font-src`, since
  // theokit's default CSP admits neither host (#125). Every other built-in theme is self-hosted
  // and needs no such change.
  fontUrls: [
    "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;700&display=swap",
  ],
  light: {
    background: "oklch(0.95 0.025 80)",
    foreground: "oklch(0.206 0.039 265.5)",
    card: "oklch(0.97 0.012 80)",
    "card-foreground": "oklch(0.206 0.039 265.5)",
    popover: "oklch(0.98 0.008 80)",
    "popover-foreground": "oklch(0.206 0.039 265.5)",
    primary: "oklch(0.545 0.215 262.7)",
    "primary-foreground": "oklch(1 0 0)",
    secondary: "oklch(0.93 0.02 80)",
    "secondary-foreground": "oklch(0.206 0.039 265.5)",
    accent: "oklch(0.647 0.139 69)",
    "accent-foreground": "oklch(1 0 0)",
    muted: "oklch(0.93 0.02 80)",
    "muted-foreground": "oklch(0.45 0.03 80)",
    border: "oklch(0.88 0.025 80)",
    input: "oklch(0.92 0.02 80)",
    ring: "oklch(0.545 0.215 262.7)",
    success: "oklch(0.611 0.161 149.7)",
    "success-foreground": "oklch(1 0 0)",
    warning: "oklch(0.67 0.154 60.6)",
    "warning-foreground": "oklch(1 0 0)",
    destructive: "oklch(0.579 0.214 27.2)",
    "destructive-foreground": "oklch(1 0 0)",
    info: "oklch(0.626 0.186 259.6)",
    "info-foreground": "oklch(1 0 0)",
    "status-online": "oklch(0.611 0.161 149.7)",
    "status-online-foreground": "oklch(1 0 0)",
    "status-offline": "oklch(0.579 0.214 27.2)",
    "status-offline-foreground": "oklch(1 0 0)",
    "status-degraded": "oklch(0.67 0.154 60.6)",
    "status-degraded-foreground": "oklch(1 0 0)",
    "status-info": "oklch(0.626 0.186 259.6)",
    "status-info-foreground": "oklch(1 0 0)",
  },
  // Dark mirror — mainly the same hues with inverted lightness so the theme
  // still feels coherent if a consumer toggles `.dark`.
  dark: {
    background: "oklch(0.177 0.029 265.8)",
    foreground: "oklch(0.984 0.003 247.9)",
    card: "oklch(0.206 0.039 265.5)",
    "card-foreground": "oklch(0.984 0.003 247.9)",
    popover: "oklch(0.206 0.039 265.5)",
    "popover-foreground": "oklch(0.984 0.003 247.9)",
    primary: "oklch(0.626 0.186 259.6)",
    "primary-foreground": "oklch(0.206 0.039 265.5)",
    secondary: "oklch(0.291 0.022 259.9)",
    "secondary-foreground": "oklch(0.984 0.003 247.9)",
    accent: "oklch(0.803 0.15 74.7)",
    "accent-foreground": "oklch(0.206 0.039 265.5)",
    muted: "oklch(0.291 0.022 259.9)",
    "muted-foreground": "oklch(0.71 0.035 256.8)",
    border: "oklch(0.329 0.026 259.9)",
    input: "oklch(0.291 0.022 259.9)",
    ring: "oklch(0.626 0.186 259.6)",
    success: "oklch(0.814 0.192 155.7)",
    "success-foreground": "oklch(0.206 0.039 265.5)",
    warning: "oklch(0.77 0.165 70.6)",
    "warning-foreground": "oklch(0.206 0.039 265.5)",
    destructive: "oklch(0.677 0.213 15.6)",
    "destructive-foreground": "oklch(0.206 0.039 265.5)",
    info: "oklch(0.732 0.142 254.4)",
    "info-foreground": "oklch(0.206 0.039 265.5)",
    "status-online": "oklch(0.814 0.192 155.7)",
    "status-online-foreground": "oklch(0.206 0.039 265.5)",
    "status-offline": "oklch(0.677 0.213 15.6)",
    "status-offline-foreground": "oklch(0.206 0.039 265.5)",
    "status-degraded": "oklch(0.77 0.165 70.6)",
    "status-degraded-foreground": "oklch(0.206 0.039 265.5)",
    "status-info": "oklch(0.732 0.142 254.4)",
    "status-info-foreground": "oklch(0.206 0.039 265.5)",
  },
};
