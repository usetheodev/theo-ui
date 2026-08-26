---
"@theokit/ui": minor
---

The editor writes both modes, and offers a typeface.

**Both modes.** It held one palette — the mode being edited — and emitted `{}` for the other, which
inherits from Violet Forge. That is the silent one-sided theme `defineTheme` warns about
(usetheokit/theokit-ui#81), produced by the tool built to prevent it: somebody who tuned dark and
switched to light would have found their work replaced by another product's palette. Both scales are
now held and both are emitted, seeded from the active theme so an untouched mode carries what it
already had.

**Typeface.** Four presets — system, geometric, editorial, monospaced — plus `inherit`, which emits
nothing so `tokens.css` keeps its own faces. Named sets rather than three free-text fields, for the
same reason elevation is a preset: a display serif over a geometric body over a slab mono is three
decisions that have to agree. Every stack ends in a generic family, and nothing here loads a webfont
— `fontUrls` is where a theme asks for one, and a typeface picker that quietly fetched from a third
party would be a surprising thing for it to do.
