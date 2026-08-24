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

/** The CSS property each control-class utility prefix sets. */
const UTILITY_PROPERTY: Record<string, string> = {
  h: "height",
  w: "width",
  px: "padding-inline",
  py: "padding-block",
  p: "padding",
  size: "inline-size",
};

/**
 * A safety net for peer versions we did not build against.
 *
 * The exact selectors Tailwind emits match one arbitrary value each, so a peer that changes
 * a default — 0.22.0's `2.25rem` became `2rem` in 0.35.1 — renders the control with no rule
 * at all. An attribute-substring selector matches the class whatever the fallback says.
 *
 * Emitted BEFORE Tailwind's own output and at equal specificity, so where an exact rule
 * exists it wins on source order and nothing changes for a version we did scan. Verified in
 * a browser: with both present, `w-[var(--theo-control-h,2rem)]` computes 32px from the
 * exact rule while an unseen `w-[var(--theo-control-h,3rem)]` computes 36px from the net.
 *
 * The trade-off, stated plainly: for a peer version we have not scanned, the control gets
 * OUR default rather than that version's. Nobody defines `--theo-control-h` — not this
 * package and not the peer — so the fallback in the class name IS the default, and no CSS
 * can read it back out. Approximately right beats unstyled, and the build gate above still
 * fails loudly whenever the peer we resolved is not covered. See usetheokit/theokit-ui#50.
 */
export function buildControlClassFallbackLayer(classes: readonly string[]): string {
  const seen = new Set<string>();
  const rules: string[] = [];

  for (const cls of [...classes].sort()) {
    const match = cls.match(/^([a-z-]+)-\[var\((--theo-[a-z-]+),\s*([^)]*)\)\]$/);
    if (!match) continue;
    const [, utility, variable, fallback] = match as unknown as [string, string, string, string];
    const property = UTILITY_PROPERTY[utility];
    if (!property || seen.has(`${utility}|${variable}`)) continue;
    seen.add(`${utility}|${variable}`);
    rules.push(
      `  [class*="${utility}-[var(${variable}"] { ${property}: var(${variable}, ${fallback}); }`,
    );
  }

  if (rules.length === 0) return "";
  return [
    "/* Version-independent net for @usetheo/ui control classes — see",
    "   scripts/lib/control-class-coverage.ts and usetheokit/theokit-ui#50.",
    "   Declared before Tailwind's output so an exact rule wins on source order. */",
    "@layer theme, base, components, utilities;",
    "@layer utilities {",
    ...rules,
    "}",
    "",
  ].join("\n");
}
