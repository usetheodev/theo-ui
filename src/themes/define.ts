/**
 * `defineTheme(input)` — build a `Theme` from a partial override.
 *
 * Reduces the boilerplate of authoring a custom theme from 58 colour
 * keys (`light` × 29 + `dark` × 29) to "just what you want to change".
 * The merge always uses `violetForge` as the base — this is a pure,
 * deterministic helper that does not depend on whatever theme is active
 * at the call site.
 *
 * The `Theme` object it returns is drop-in compatible with
 * `<ThemeProvider themes={[...]}>` — same shape as `violetForge`,
 * `classicPaper`, and `auroraTerminal`.
 *
 * Honest caveat: if you override `light.primary` but NOT `dark.primary`,
 * the two modes will use different colours — your override in light,
 * Violet Forge's default in dark. That's intentional. Pass both sides
 * to keep them in sync.
 *
 * @example
 *   import { defineTheme, hex } from "@usetheo/ui";
 *   export const corp = defineTheme({
 *     name: "corp",
 *     light: { primary: hex("#0EA5E9") },
 *     dark: { primary: hex("#38BDF8") },
 *   });
 *
 * Plan: `.claude/knowledge-base/plans/theming-and-sizes-plan.md` T2.1.
 */
import type { ColorScale, Theme, ThemeFonts } from "./types.js";
import { violetForge } from "./violet-forge.js";

const NAME_PATTERN = /^[a-z][a-z0-9-]*$/i;

export interface DefineThemeInput {
  /**
   * Stable id used in `data-theme="<name>"` on the root element. Must
   * match `/^[a-z][a-z0-9-]*$/i` (CSS-identifier-safe). Required.
   */
  name: string;
  /**
   * Human-readable label for theme switchers. Defaults to the
   * capitalized version of `name` (e.g. "corp" → "Corp").
   */
  label?: string;
  /** Optional one-line description shown in switchers. */
  description?: string;
  /**
   * Override light-mode colours. Any key omitted is inherited from
   * `violetForge.light`. See `ColorScale` for the full list.
   */
  light?: Partial<ColorScale>;
  /**
   * Override dark-mode colours. Any key omitted is inherited from
   * `violetForge.dark`.
   */
  dark?: Partial<ColorScale>;
  /**
   * Override fonts (`display`, `body`, `mono`). Any key omitted is
   * inherited from `violetForge.fonts`.
   */
  fonts?: Partial<ThemeFonts>;
  /**
   * Replace the default remote font URLs. Pass an empty array to skip
   * font fetching entirely. Defaults to `violetForge.fontUrls` when
   * omitted (so consumers that don't care still get Geist preloaded).
   */
  fontUrls?: string[];
}

function defaultLabel(name: string): string {
  if (name.length === 0) return name;
  return name.charAt(0).toUpperCase() + name.slice(1);
}

export function defineTheme(input: DefineThemeInput): Theme {
  if (typeof input?.name !== "string" || input.name.length === 0) {
    throw new Error("defineTheme: `name` is required and cannot be empty.");
  }
  if (!NAME_PATTERN.test(input.name)) {
    throw new Error(
      `defineTheme: invalid name "${input.name}". Must match /^[a-z][a-z0-9-]*$/i — letters, digits, and hyphens only, starting with a letter.`,
    );
  }

  const lightOverride = input.light ?? {};
  const darkOverride = input.dark ?? {};
  const fontsOverride = input.fonts ?? {};

  const theme: Theme = {
    name: input.name,
    label: input.label ?? defaultLabel(input.name),
    description: input.description,
    fonts: { ...violetForge.fonts, ...fontsOverride },
    light: { ...violetForge.light, ...lightOverride },
    dark: { ...violetForge.dark, ...darkOverride },
    fontUrls: input.fontUrls ?? violetForge.fontUrls,
  };

  return theme;
}
