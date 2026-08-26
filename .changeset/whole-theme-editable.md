---
"@theokit/ui": minor
---

The editor covers the whole theme, and a theme built in it survives a reload.

**Every colour token has a control.** It showed eleven of the thirty-three required tokens, which
made "customise your theme" a screen that quietly could not — the other twenty-two were editable
only by writing a theme file. They are grouped by the question a person is answering (surfaces,
brand, neutrals, semantic, status) with only the first open, using `<details>` so the keyboard and
screen-reader behaviour of a disclosure comes from the browser rather than from a reimplementation.
The three optional tonal variants stay absent: they are derived in CSS from their base, and a
control would silently stop that derivation.

**Elevation and motion have controls.** As presets rather than a shadow-per-slot or a
duration-per-slot grid — five shadows that do not agree with each other read as a bug, not as a
theme. `inherit` emits nothing, so `tokens.css` keeps composing shadows from the palette; `flat`,
`soft` and `strong` replace the language outright. `none` for motion sets durations to zero rather
than removing transitions, so a component still lands in its final state, and it is not a
substitute for `prefers-reduced-motion`, which `global.css` honours regardless.

**`useStoredTheme`** persists a theme across reloads and restores it on mount. A hook rather than
something the editor does by itself: `ThemeEditor` hands back a `Theme` and has no opinion about
where it lives, and baking `localStorage` in would make one case free and the others a fork. It
ignores a truncated write, an object of the wrong shape, and storage being unavailable — each with
a development warning rather than a crash.
