import type { Config } from "tailwindcss";
import animate from "tailwindcss-animate";

const hsl = (token: string) => `hsl(var(${token}) / <alpha-value>)`;

export default {
  darkMode: ["class", '[data-theme="dark"]'],
  content: ["./src/**/*.{ts,tsx}", "./.ladle/**/*.{ts,tsx}"],
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
      fontSize: {
        "display-2xl": ["68px", { lineHeight: "1.05", letterSpacing: "-0.035em", fontWeight: "800" }],
        "display-xl": ["52px", { lineHeight: "1.08", letterSpacing: "-0.03em", fontWeight: "700" }],
        "display-lg": ["40px", { lineHeight: "1.12", letterSpacing: "-0.025em", fontWeight: "700" }],
        "display-md": ["32px", { lineHeight: "1.15", letterSpacing: "-0.02em", fontWeight: "600" }],
        headline: ["26px", { lineHeight: "1.25", letterSpacing: "-0.015em", fontWeight: "600" }],
        "title-lg": ["20px", { lineHeight: "1.35", letterSpacing: "-0.01em", fontWeight: "600" }],
        "title-md": ["17px", { lineHeight: "1.4", letterSpacing: "-0.005em", fontWeight: "600" }],
        "body-lg": ["16px", { lineHeight: "1.6", fontWeight: "400" }],
        "body-md": ["14px", { lineHeight: "1.55", fontWeight: "400" }],
        "body-sm": ["13px", { lineHeight: "1.5", fontWeight: "400" }],
        label: ["12px", { lineHeight: "1.2", letterSpacing: "0.02em", fontWeight: "600" }],
        "label-caps": ["11px", { lineHeight: "1.2", letterSpacing: "0.08em", fontWeight: "600" }],
        "code-md": ["13px", { lineHeight: "1.6", fontWeight: "400" }],
        "code-sm": ["12px", { lineHeight: "1.6", fontWeight: "400" }],
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
} satisfies Config;
