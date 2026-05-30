/**
 * Tailwind configuration for the @usetheo/ui repo itself.
 *
 * The `theme.extend` block previously lived inline here. It has been
 * extracted to `src/styles/tailwind-preset.ts` (D3) so consumers can
 * install the same tokens via the registry `tailwind-preset` item
 * (BLOCKER-002 remediation). This file now only declares the
 * consumer-specific bits: dark mode strategy, content paths.
 *
 * Why no `satisfies Config`: the preset resolves the v4 `Config` type
 * (via `src/styles/node_modules/tailwindcss` symlink to v4.3.0) so the
 * preset can declare the v4-shape it actually produces; this file would
 * resolve v3 `Config` via the root symlink. Pinning either side to the
 * other's type breaks the build of consumers that read the published
 * preset under their own v4 install. The shape is enforced at runtime
 * via the dogfood gate `pnpm dogfood:v4-zero-config`.
 */
import { theoUIPreset } from "./src/styles/tailwind-preset";

export default {
  // Dark mode activates exclusively via the `.dark` class on `<html>`. Both
  // `ThemeProvider` and `ThemeScript` set this class. The previous second
  // selector `[data-theme="dark"]` was dead: `ThemeProvider` sets `data-theme`
  // to the theme NAME (e.g. `"violet-forge"`), never the literal `"dark"`.
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}", "./.ladle/**/*.{ts,tsx}", "./playground/**/*.{ts,tsx,html}"],
  presets: [theoUIPreset],
};
