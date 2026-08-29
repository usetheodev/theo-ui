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
 * RFC: wiki/rfcs/0007-seven-themes.md
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
  light: {
    background: "oklch(0.977 0.008 106.5)",
    foreground: "oklch(0.284 0.022 277.1)",
    card: "oklch(1 0 0)",
    "card-foreground": "oklch(0.284 0.022 277.1)",
    popover: "oklch(1 0 0)",
    "popover-foreground": "oklch(0.284 0.022 277.1)",
    primary: "oklch(0.489 0.227 305.4)",
    "primary-foreground": "oklch(1 0 0)",
    secondary: "oklch(0.949 0.011 106.6)",
    "secondary-foreground": "oklch(0.284 0.022 277.1)",
    accent: "oklch(0.438 0.191 302.4)",
    "accent-foreground": "oklch(1 0 0)",
    muted: "oklch(0.949 0.011 106.6)",
    "muted-foreground": "oklch(0.478 0.051 270.1)",
    border: "oklch(0.919 0.012 106.6)",
    input: "oklch(0.919 0.012 106.6)",
    ring: "oklch(0.489 0.227 305.4)",
    success: "oklch(0.515 0.1 147.3)",
    "success-foreground": "oklch(1 0 0)",
    warning: "oklch(0.549 0.111 82.7)",
    "warning-foreground": "oklch(1 0 0)",
    destructive: "oklch(0.504 0.187 27.2)",
    "destructive-foreground": "oklch(1 0 0)",
    info: "oklch(0.533 0.093 217.1)",
    "info-foreground": "oklch(1 0 0)",
    "status-online": "oklch(0.515 0.1 147.3)",
    "status-online-foreground": "oklch(1 0 0)",
    "status-offline": "oklch(0.504 0.187 27.2)",
    "status-offline-foreground": "oklch(1 0 0)",
    "status-degraded": "oklch(0.549 0.111 82.7)",
    "status-degraded-foreground": "oklch(1 0 0)",
    "status-info": "oklch(0.533 0.093 217.1)",
    "status-info-foreground": "oklch(1 0 0)",
  },
  dark: {
    background: "oklch(0.284 0.022 277.1)",
    foreground: "oklch(0.977 0.008 106.5)",
    card: "oklch(0.322 0.024 278.1)",
    "card-foreground": "oklch(0.977 0.008 106.5)",
    popover: "oklch(0.322 0.024 278.1)",
    "popover-foreground": "oklch(0.977 0.008 106.5)",
    primary: "oklch(0.756 0.181 347.2)",
    "primary-foreground": "oklch(0.284 0.022 277.1)",
    secondary: "oklch(0.376 0.03 278)",
    "secondary-foreground": "oklch(0.977 0.008 106.5)",
    accent: "oklch(0.747 0.146 302.2)",
    "accent-foreground": "oklch(0.284 0.022 277.1)",
    muted: "oklch(0.376 0.03 278)",
    "muted-foreground": "oklch(0.688 0.055 270.5)",
    border: "oklch(0.403 0.032 278)",
    input: "oklch(0.403 0.032 278)",
    ring: "oklch(0.756 0.181 347.2)",
    success: "oklch(0.871 0.218 148)",
    "success-foreground": "oklch(0.284 0.022 277.1)",
    warning: "oklch(0.955 0.137 112.9)",
    "warning-foreground": "oklch(0.284 0.022 277.1)",
    destructive: "oklch(0.684 0.205 24.3)",
    "destructive-foreground": "oklch(1 0 0)",
    info: "oklch(0.882 0.093 213.7)",
    "info-foreground": "oklch(0.284 0.022 277.1)",
    "status-online": "oklch(0.871 0.218 148)",
    "status-online-foreground": "oklch(0.284 0.022 277.1)",
    "status-offline": "oklch(0.684 0.205 24.3)",
    "status-offline-foreground": "oklch(1 0 0)",
    "status-degraded": "oklch(0.955 0.137 112.9)",
    "status-degraded-foreground": "oklch(0.284 0.022 277.1)",
    "status-info": "oklch(0.882 0.093 213.7)",
    "status-info-foreground": "oklch(0.284 0.022 277.1)",
  },
};
