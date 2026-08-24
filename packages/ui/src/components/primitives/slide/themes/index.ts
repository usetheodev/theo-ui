/**
 * Theme registry for the Slide primitive. Built-in themes that ship with the
 * `@theokit/ui/slide` subpath. Custom themes are NOT registered through this
 * module in v0.1 — consumers override CSS variables on `.theo-slide` directly.
 */

export const slideThemes = ["default", "violet-forge"] as const;
export type SlideTheme = (typeof slideThemes)[number];

/** Returns true if `value` is a recognized built-in theme. */
export function isSlideTheme(value: unknown): value is SlideTheme {
  return typeof value === "string" && (slideThemes as readonly string[]).includes(value);
}
