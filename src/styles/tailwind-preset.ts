/**
 * Theo UI Tailwind preset — Violet Forge identity.
 *
 * Single source of truth for the design system's utility-level tokens:
 *   - colors mapped to CSS variables (HSL split via `hsl(var(--x) / <alpha>)`)
 *   - Geist-inspired typescale (display / title / body / label / code tiers)
 *   - radii, shadows, motion timing & duration, keyframes
 *   - tailwindcss-animate plugin
 *
 * Consumed by:
 *   - `tailwind.config.ts` (this repo) via `presets: [theoUIPreset]`
 *   - registry/r/tailwind-preset.json (shipped to consumers via shadcn CLI)
 *
 * Consumers integrate as:
 *
 *   import type { Config } from "tailwindcss";
 *   import { theoUIPreset } from "./styles/tailwind-preset";
 *
 *   export default {
 *     darkMode: "class",
 *     content: ["./src/**\/*.{ts,tsx}"],
 *     presets: [theoUIPreset],
 *   } satisfies Config;
 *
 * Note: `darkMode` and `content` are NOT in the preset — they are consumer
 * decisions. The preset only contains `theme.extend.*` and `plugins`.
 */

import type { Config } from "tailwindcss";
import animate from "tailwindcss-animate";

const hsl = (token: string) => `hsl(var(${token}) / <alpha-value>)`;

export const theoUIPreset: Partial<Config> = {
  theme: {
    container: {
      center: true,
      padding: "1rem",
      screens: {
        "2xl": "1280px",
      },
    },
    extend: {
      colors: {
        background: hsl("--background"),
        foreground: hsl("--foreground"),
        card: {
          DEFAULT: hsl("--card"),
          foreground: hsl("--card-foreground"),
        },
        popover: {
          DEFAULT: hsl("--popover"),
          foreground: hsl("--popover-foreground"),
        },
        primary: {
          DEFAULT: hsl("--primary"),
          deep: hsl("--primary-deep"),
          glow: hsl("--primary-glow"),
          foreground: hsl("--primary-foreground"),
        },
        secondary: {
          DEFAULT: hsl("--secondary"),
          foreground: hsl("--secondary-foreground"),
        },
        accent: {
          DEFAULT: hsl("--accent"),
          deep: hsl("--accent-deep"),
          foreground: hsl("--accent-foreground"),
        },
        muted: {
          DEFAULT: hsl("--muted"),
          foreground: hsl("--muted-foreground"),
        },
        success: {
          DEFAULT: hsl("--success"),
          foreground: hsl("--success-foreground"),
        },
        warning: {
          DEFAULT: hsl("--warning"),
          foreground: hsl("--warning-foreground"),
        },
        destructive: {
          DEFAULT: hsl("--destructive"),
          foreground: hsl("--destructive-foreground"),
        },
        info: {
          DEFAULT: hsl("--info"),
          foreground: hsl("--info-foreground"),
        },
        border: hsl("--border"),
        input: hsl("--input"),
        ring: hsl("--ring"),
      },
      fontFamily: {
        display: "var(--font-display)",
        sans: "var(--font-body)",
        mono: "var(--font-mono)",
      },
      /* Geist-inspired Violet Forge typescale.
       *
       * Three strict weights: 400 (body), 500 (UI), 600 (display/headings).
       * Letter-spacing scales with size — aggressive negative on display.
       * Mirrors the Vercel/Geist vocabulary while keeping Theo's identity.
       */
      fontSize: {
        // Display tier — aggressive compression, content-led headlines
        "display-2xl": ["64px", { lineHeight: "1", letterSpacing: "-0.0464em", fontWeight: "600" }],
        "display-xl": ["48px", { lineHeight: "1.05", letterSpacing: "-0.05em", fontWeight: "600" }],
        "display-lg": ["40px", { lineHeight: "1.1", letterSpacing: "-0.05em", fontWeight: "600" }],
        "display-md": ["32px", { lineHeight: "1.2", letterSpacing: "-0.04em", fontWeight: "600" }],
        headline: ["28px", { lineHeight: "1.25", letterSpacing: "-0.035em", fontWeight: "600" }],
        // Title tier — section / card heads
        "title-lg": ["24px", { lineHeight: "1.33", letterSpacing: "-0.04em", fontWeight: "600" }],
        "title-md": ["20px", { lineHeight: "1.4", letterSpacing: "-0.03em", fontWeight: "600" }],
        // Body tier — FAANG-density realignment 2026-05-22: body-md is the
        // industry-standard 14px (shadcn / Vercel Geist / Linear / Stripe /
        // Mantine). The previous 15px was idiosyncratic. body-sm (14px label
        // weight) remains separate via its line-height / weight signature.
        "body-lg": ["18px", { lineHeight: "1.56", letterSpacing: "-0.01em", fontWeight: "400" }],
        "body-md": ["14px", { lineHeight: "1.43", letterSpacing: "0", fontWeight: "400" }],
        "body-sm": ["13px", { lineHeight: "1.46", fontWeight: "400" }],
        // Label tier — used on buttons, nav, secondary actions
        label: ["14px", { lineHeight: "1.43", fontWeight: "500" }],
        "label-caps": ["12px", { lineHeight: "1.33", letterSpacing: "0.04em", fontWeight: "500" }],
        // Mono — code surfaces, technical labels
        "code-md": ["14px", { lineHeight: "1.5", fontWeight: "400" }],
        "code-sm": ["13px", { lineHeight: "1.54", fontWeight: "500" }],
      },
      borderRadius: {
        none: "var(--radius-none)",
        sm: "var(--radius-sm)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
        xl: "var(--radius-xl)",
        "2xl": "var(--radius-2xl)",
        full: "var(--radius-full)",
      },
      boxShadow: {
        sm: "var(--shadow-sm)",
        md: "var(--shadow-md)",
        lg: "var(--shadow-lg)",
        glow: "var(--shadow-glow)",
        "glow-strong": "var(--shadow-glow-strong)",
      },
      transitionTimingFunction: {
        "out-soft": "var(--ease-out-soft)",
        snap: "var(--ease-snap)",
      },
      transitionDuration: {
        fast: "var(--duration-fast)",
        base: "var(--duration-base)",
        slow: "var(--duration-slow)",
      },
      keyframes: {
        "fade-in-up": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "pulse-glow": {
          "0%, 100%": { boxShadow: "0 0 0 0 hsl(var(--primary) / 0.5)" },
          "50%": { boxShadow: "0 0 0 8px hsl(var(--primary) / 0)" },
        },
      },
      animation: {
        "fade-in-up": "fade-in-up var(--duration-base) var(--ease-out-soft) both",
        "pulse-glow": "pulse-glow 1.5s var(--ease-in-out) infinite",
      },
    },
  },
  plugins: [animate],
};
