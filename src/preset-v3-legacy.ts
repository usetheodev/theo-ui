/**
 * `@usetheo/ui/preset-v3-legacy` — Tailwind v3 JS preset (legacy path).
 *
 * Default-export a `Partial<Config>` mirroring the design tokens shipped
 * in `@usetheo/ui/tokens.css`. Adds a `content` field covering the
 * library's published artifact tree so v3-based Tailwind builds emit
 * the utilities used by `@usetheo/ui` components.
 *
 * **Tailwind v4 consumers MUST use `@usetheo/ui/preset.css`**, not this
 * file — Tailwind v4 dropped the JS preset format entirely. This file
 * exists for any remaining `tailwindcss@^3` consumer (notably the
 * shadcn-style copy-paste registry path); new code should not import
 * from this subpath.
 *
 * The token surface is delegated to `./styles/tailwind-preset.ts` (the
 * existing source of truth used by the local Ladle dev surface and the
 * shadcn registry).
 *
 * v3 consumer usage:
 *
 *   // tailwind.config.ts (Tailwind v3 only)
 *   import preset from "@usetheo/ui/preset-v3-legacy";
 *   export default {
 *     presets: [preset],
 *     content: ["./app/**\/*.{ts,tsx}"],
 *   };
 *
 * See RFC 0008 follow-up.
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
