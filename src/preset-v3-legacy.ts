/**
 * `@theokit/ui/preset-v3-legacy` — Tailwind v3 JS preset (legacy path).
 *
 * Default-export a `Partial<Config>` mirroring the design tokens shipped
 * in `@theokit/ui/tokens.css`. Adds a `content` field covering the
 * library's published artifact tree so v3-based Tailwind builds emit
 * the utilities used by `@theokit/ui` components.
 *
 * **Tailwind v4 consumers MUST use `@theokit/ui/preset.css`**, not this
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
 *   import preset from "@theokit/ui/preset-v3-legacy";
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
  "./node_modules/@theokit/ui/dist/**/*.{js,mjs,cjs}",
  // Yarn PnP / pnpm hoist fallback — Tailwind's globbing tolerates both.
  "./node_modules/@theokit/ui/dist/**/*.{ts,tsx}",
];

// `theoUIPreset` is shape-compatible with v3 `Partial<Config>` at runtime
// (tokens, theme, plugins, darkMode, etc are all carried through), but the
// pnpm hoist places `tailwindcss@3` types alongside `tailwindcss@4` types in
// the workspace — `theoUIPreset`'s inferred shape uses the v4 `UserConfig`
// presets array type, which TS sees as incompatible with v3's `Config.presets`
// (different element type). This file is the v3 LEGACY entry; its runtime
// works for v3 consumers regardless. The cast bridges the v3/v4 type seam.
const preset = {
  ...theoUIPreset,
  content: LIBRARY_CONTENT_GLOBS,
} as unknown as Partial<Config>;

export default preset;
