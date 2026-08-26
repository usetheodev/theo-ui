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
 * Omitting a mode *entirely* is the same rule with a much larger blast
 * radius, so it warns in development: a theme that defines only `dark`
 * renders as Violet Forge for every visitor whose system is set to light,
 * which `ThemeProvider` follows by default via `respectSystemMode`. Pass
 * an empty object (`light: {}`) to say the inheritance is deliberate and
 * silence the warning.
 *
 * @example
 *   import { defineTheme, hex } from "@theokit/ui";
 *   export const corp = defineTheme({
 *     name: "corp",
 *     light: { primary: hex("#0EA5E9") },
 *     dark: { primary: hex("#38BDF8") },
 *   });
 *
 * RFC: `wiki/rfcs/0005-theming-and-sizes.md`.
 */
import { isDev } from "../lib/env.js";
import type {
  ColorScale,
  MotionScale,
  RadiusScale,
  ShadowScale,
  SpaceScale,
  Theme,
  ThemeFonts,
} from "./types.js";
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
   *
   * Leaving this out while `dark` is set warns in development — pass `{}`
   * to declare the inheritance deliberate.
   */
  light?: Partial<ColorScale>;
  /**
   * Override dark-mode colours. Any key omitted is inherited from
   * `violetForge.dark`.
   *
   * Leaving this out while `light` is set warns in development — pass `{}`
   * to declare the inheritance deliberate.
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
  /**
   * Corner radii. Unlike the colour scales, these do NOT inherit from Violet Forge: an omitted
   * key emits nothing and the scale in `tokens.css` stands.
   *
   * The difference is deliberate. Colour has to be complete — a palette missing `background` is
   * not a palette — so the merge fills the gaps. Shape is a set of independent adjustments, and
   * inheriting them from another theme would mean a theme that only wants square corners silently
   * adopts Violet Forge's spacing and elevation too.
   */
  radius?: RadiusScale;
  /** The spacing base every `p-*`/`gap-*`/`m-*` utility multiplies. Omitted leaves it alone. */
  spacing?: string;
  /** Elevation. Omitted keys keep the palette-derived shadows. */
  shadows?: ShadowScale;
  /** The named spacing steps a consumer reads directly. Omitted keys keep the defaults. */
  space?: SpaceScale;
  /** Durations and easings. Omitted keys keep the defaults. */
  motion?: MotionScale;
}

function defaultLabel(name: string): string {
  if (name.length === 0) return name;
  return name.charAt(0).toUpperCase() + name.slice(1);
}

/**
 * Warn when a theme paints one mode and leaves the other entirely absent.
 *
 * The merge below is documented and deliberate, but the failure it produces is silent and total:
 * every key of the missing mode comes from Violet Forge, so a theme that defines only `dark` is a
 * different product in light — different background, different accent, different brand. Nothing
 * in `tsc`, lint, tests or build sees it, because it is a valid `Theme`; it surfaces only when
 * somebody opens the app on a system set to the other mode.
 *
 * `undefined` (forgot) is distinguished from `{}` (meant it), so the escape hatch costs two
 * characters and reads as intent at the call site.
 */
function warnOneSidedTheme(name: string, input: DefineThemeInput): void {
  if (!isDev()) return;

  const given = input.light !== undefined ? "light" : "dark";
  const missing = given === "light" ? "dark" : "light";
  const overrides = Object.keys(
    given === "light" ? (input.light ?? {}) : (input.dark ?? {}),
  ).length;
  if (overrides === 0) return;

  // biome-ignore lint/suspicious/noConsole: dev-only authoring diagnostic (#81)
  console.warn(
    `[@theokit/ui] defineTheme("${name}") sets ${String(overrides)} ${given}-mode colour${
      overrides === 1 ? "" : "s"
    } but omits \`${missing}\` entirely, so every ${missing}-mode key falls back to Violet Forge — a different palette, not a dimmer or brighter version of yours. ThemeProvider follows the system preference by default (respectSystemMode), so visitors in ${missing} mode see Violet Forge. Define \`${missing}\`, or pass \`${missing}: {}\` if inheriting it is deliberate.`,
  );
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

  const oneSided = (input.light === undefined) !== (input.dark === undefined);
  if (oneSided) warnOneSidedTheme(input.name, input);

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

  // Carried through only when present, so `theme.radius` stays `undefined` rather than becoming an
  // empty object. `shapeToCss` reads that difference: nothing declared means no rule emitted, and
  // an empty rule in the injected sheet is noise for whoever reads the page's styles.
  if (input.radius !== undefined) theme.radius = input.radius;
  if (input.spacing !== undefined) theme.spacing = input.spacing;
  if (input.shadows !== undefined) theme.shadows = input.shadows;
  if (input.space !== undefined) theme.space = input.space;
  if (input.motion !== undefined) theme.motion = input.motion;

  return theme;
}
