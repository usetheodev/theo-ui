---
"@theokit/ui": minor
---

A theme can now change shape, and there is an editor that will not hand back a palette nobody can read.

**Radii defer to runtime variables.** `tokens-v4.css` is built on one rule — every `@theme` entry
aliases back to the variable `<ThemeProvider>` mutates — and the radii broke it with literals, under
a comment asserting Tailwind v4 "reads the value directly". It does not; it reads whatever the token
says. The cost was total and silent: `.rounded-xl` compiled to `border-radius: 14px`, so the
documented `--radius-*` variables were inert and radius was the only token in the set a theme could
not move. Measured in Chrome after the change, writing one property on the root takes a card from
14px to 0px to 999px and back (usetheokit/theokit-ui#88).

**`Theme` gained `radius`, `spacing`, `shadows` and `motion`.** Unlike the colour scales these do
not inherit from Violet Forge: an omitted key emits nothing and `tokens.css` stands. Colour has to
be complete — a palette missing `background` is not a palette — but shape is a set of independent
adjustments, and inheriting them would mean a theme that only wants square corners silently adopts
another theme's spacing and elevation. Values go through the same allowlist the colours do, because
they are interpolated into a `<style>` element just the same.

**`ThemeEditor`** builds a theme live — every change applies through `registerTheme`, no rebuild —
with a WCAG audit running beside it. Committing an unreadable theme is blocked; `allowFailing` opts
out in code rather than letting a person click past it.

**`contrastRatio`, `auditColorScale` and friends** ship for that audit, dependency-free. The build
already gates the built-in themes with `culori`, but that cannot help someone choosing a colour in a
UI — and adding 30kB to every consumer's bundle for one cube root and a matrix multiply is the wrong
trade. The OKLCH conversion is checked against `culori` in the tests, where it is a devDependency.

The runtime pair list is checked against the build gate's, so an editor cannot bless a theme the
build would reject.
