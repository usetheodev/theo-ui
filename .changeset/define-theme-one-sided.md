---
"@theokit/ui": patch
---

`defineTheme` warns when a theme paints one mode and omits the other entirely.

`defineTheme({ name, dark: {...} })` merges over Violet Forge, so every light-mode key comes from
Violet Forge — and `ThemeProvider` follows the system preference by default via
`respectSystemMode`. A theme that defines only `dark` therefore renders as a different product for
every visitor whose system is set to light: different background, different accent, different
brand. It is a valid `Theme`, so nothing in typecheck, lint, tests or build sees it; it surfaces
only when somebody opens the app in the other mode (usetheokit/theokit-ui#81).

The existing caveat covered a different case — one key overridden on one side, which yields two
different colours. This one is the whole palette, and it now warns in development, naming how many
colours were set and what the other mode falls back to.

Pass an empty object (`light: {}`) to declare the inheritance deliberate and silence it. A
name-only alias of Violet Forge stays silent, since nothing was lost.
