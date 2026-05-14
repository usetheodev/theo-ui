/**
 * Tailwind configuration for the @usetheo/ui repo itself.
 *
 * The `theme.extend` block previously lived inline here. It has been
 * extracted to `src/styles/tailwind-preset.ts` (D3) so consumers can
 * install the same tokens via the registry `tailwind-preset` item
 * (BLOCKER-002 remediation). This file now only declares the
 * consumer-specific bits: dark mode strategy, content paths.
 */
import type { Config } from "tailwindcss";
import { theoUIPreset } from "./src/styles/tailwind-preset";

export default {
  // Dark mode activates exclusively via the `.dark` class on `<html>`. Both
  // `ThemeProvider` and `ThemeScript` set this class. The previous second
  // selector `[data-theme="dark"]` was dead: `ThemeProvider` sets `data-theme`
  // to the theme NAME (e.g. `"violet-forge"`), never the literal `"dark"`.
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}", "./.ladle/**/*.{ts,tsx}", "./playground/**/*.{ts,tsx,html}"],
  presets: [theoUIPreset],
} satisfies Config;
