---
"@theokit/ui": patch
---

`ThemeProvider` no longer stores a theme or a mode it never applied. An app that ships its own theme kept its palette on the second visit instead of falling back to the kit's light one, and `respectSystemMode={false}` now actually prevents the operating system from deciding the mode. Two causes, fixed independently: state that disagreed with the theme on screen, and persistence that fired on any state change rather than on a human decision.
