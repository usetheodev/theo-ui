---
"@theokit/ui": minor
---

The typeface control takes your own stack, not only a preset.

Presets keep the three faces agreeing with each other and cover the common case. They cannot cover
the case a design system exists for: a company with its own type does not want "Geometric", it wants
its own, and a control that cannot express that is one people fork around.

Each slot — display, body, mono — takes a stack, and overrides the preset for that slot alone, so a
custom display face can sit over a preset's body and mono rather than forcing all three to be
re-entered. Blank means unused; whitespace is dropped rather than emitted, because an empty
`font-family` erases the face instead of leaving it.

**Validated before applying, not after.** The provider throws on a stack that could break out of the
declaration — correct for a theme written in a file, and wrong for a field somebody is still typing
into, where `Font (Bold)` would take the page down on the `(`. The field keeps what was typed, marks
it with `aria-invalid`, and the theme receives it once it would survive injection.
`isValidFontFamily` is exported for anything else collecting one.
