---
"@theokit/ui": minor
---

`ThemeEditor` takes its copy as a prop, and offers density alongside corners.

**Labels.** The component hard-coded its own strings, which made it usable only in the language it
was written in — it shipped into a Portuguese product and rendered "Save theme" in the middle of it.
For a component library that is the difference between adoption and a fork.

`labels` accepts a subset, and nested groups merge one level: translating two colour names does not
mean restating eleven. The strings that depend on state take the state — `subtitle(mode)`,
`belowMinimum(count)`, `needs(minimum)` — rather than being assembled from fragments, which is what
makes a translation that has to reorder them possible.

**Density.** One radio group writes `--spacing`, and every `p-*`, `gap-*` and `m-*` utility moves
with it, because they all compile to `calc(var(--spacing) * n)`. A whole-UI rhythm control for one
custom property.

Corners and density are separate radio groups with separate `name`s. Sharing one would mean
choosing a corner clears the density, which is asserted rather than assumed.
