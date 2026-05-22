/**
 * `@usetheo/ui/preset` — Tailwind v4 preset for zero-config consumers.
 *
 * Default-export a `Partial<Config>` mirroring the design tokens shipped
 * in `@usetheo/ui/tokens.css`. Adds a `content` field covering the
 * library's published artifact tree so consumers' Tailwind builds emit
 * the utilities used by `@usetheo/ui` components.
 *
 * The token surface is delegated to `./styles/tailwind-preset.ts` (the
 * existing source of truth used by the local Ladle dev surface and the
 * shadcn registry). This subpath simply wraps it with `content` and
 * preserves the same shape, so the v3 registry preset and the v4 import
 * preset stay byte-for-byte aligned and impossible to drift.
 *
 * Consumer usage:
 *
 *   // tailwind.config.ts
 *   import preset from "@usetheo/ui/preset";
 *   export default {
 *     presets: [preset],
 *     content: ["./app/**\/*.{ts,tsx}"],
 *   };
 *
 * See RFC 0008.
 */
import type { Config } from "tailwindcss";
import { theoUIPreset } from "./styles/tailwind-preset.js";

const LIBRARY_CONTENT_GLOBS: string[] = [
  // Resolved relative to the consumer's `tailwind.config.{ts,js}`.
  "./node_modules/@usetheo/ui/dist/**/*.{js,mjs,cjs}",
  // Yarn PnP / pnpm hoist fallback — Tailwind's globbing tolerates both.
  "./node_modules/@usetheo/ui/dist/**/*.{ts,tsx}",
];

const preset: Partial<Config> = {
  ...theoUIPreset,
  content: LIBRARY_CONTENT_GLOBS,
};

export default preset;
