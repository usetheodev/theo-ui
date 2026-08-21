/**
 * Does our precompiled stylesheet actually cover the classes the resolved peer renders?
 *
 * `@usetheo/ui` ships no CSS of its own — neither 0.22.0 nor 0.35.1 has a single `.css`
 * file — so `@theokit/ui` precompiles its utilities by `@source`-scanning that package's
 * dist at OUR build time. The emitted selectors therefore carry the literal class strings
 * of whichever version we happened to build against.
 *
 * Those strings embed a default value: `w-[var(--theo-control-h,2.25rem)]` in 0.22.0 became
 * `w-[var(--theo-control-h,2rem)]` in 0.35.1. Selectors are exact-match on the whole
 * arbitrary value, so a changed fallback is as good as a deleted class — the icon Button
 * loses its width and height entirely, which is the squished-button regression returning.
 * Both versions sit inside the peer range we publish (`>=0.22.0 <1`).
 *
 * This does not decide how to fix that coupling (usetheokit/theokit-ui#50 carries the
 * options). It makes the mismatch a loud build failure instead of CSS that ships wrong, so
 * the defect can no longer reach a consumer silently.
 *
 * Scope, stated honestly: only classes of the form `<utility>-[var(--theo-…)]` are checked.
 * They are the drift surface, because they are the ones that inline a design-system default
 * into the class name itself. A general sweep of every arbitrary-value class would flag
 * strings Tailwind never emits — a `cva` key that merely looks like a utility — and a gate
 * that cries wolf is a gate people learn to skip.
 */

/** `w-[var(--theo-control-h,2.25rem)]` and friends, as they appear in compiled JS. */
const CONTROL_CLASS = /[a-z-]+-\[var\(--theo-[^\]]*\)\]/g;

/** Every distinct design-system control class present in the given compiled sources. */
export function extractControlClasses(sources: readonly string[]): string[] {
  const found = new Set<string>();
  for (const source of sources) {
    for (const match of source.matchAll(CONTROL_CLASS)) found.add(match[0]);
  }
  return [...found].sort();
}

/**
 * The classes the peer renders that our stylesheet has no rule for.
 *
 * Compares against the CSS with its selector escapes removed, so
 * `.w-\[var\(--theo-control-h\,2\.25rem\)\]` matches the class as written in the source.
 */
export function findUncoveredControlClasses(sources: readonly string[], css: string): string[] {
  const unescaped = css.replace(/\\/g, "");
  return extractControlClasses(sources).filter((cls) => !unescaped.includes(`.${cls}`));
}
