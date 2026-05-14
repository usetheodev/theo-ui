/**
 * Fixture Tailwind config — imports the preset that ships via the registry.
 * Mirrors what a real consumer would do after `npx shadcn add tailwind-preset`.
 */
import type { Config } from "tailwindcss";
import { theoUIPreset } from "./src/styles/tailwind-preset";

export default {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  presets: [theoUIPreset],
  // Force-emit the full Violet Forge typescale so the registry CSS-build
  // gate (scripts/test-registry-install.ts) can prove every preset entry
  // actually compiles, even when the fixture App.tsx doesn't reference
  // every utility class. Without this, Tailwind's content-based JIT
  // tree-shaking would strip unused entries and the gate would yield
  // false positives.
  safelist: [
    "text-display-2xl",
    "text-display-xl",
    "text-display-lg",
    "text-display-md",
    "text-headline",
    "text-title-lg",
    "text-title-md",
    "text-body-lg",
    "text-body-md",
    "text-body-sm",
    "text-label",
    "text-label-caps",
    "text-code-md",
    "text-code-sm",
    "font-display",
    "font-sans",
    "font-mono",
  ],
} satisfies Config;
