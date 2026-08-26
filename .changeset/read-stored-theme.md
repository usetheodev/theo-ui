---
"@theokit/ui": patch
---

`readStoredTheme` — the half that makes a saved theme actually apply.

`useStoredTheme` restored a theme from an effect, and an effect is too late: `ThemeProvider`
resolves the active theme NAME in its own effect, from its own storage key, and falls back to the
default for a name it has no theme for. Measured after a reload — the palette was in `localStorage`,
the "forget it" affordance appeared, and `data-theme` was the built-in theme. The registry had it;
the page did not.

`readStoredTheme(key)` reads synchronously, so a consumer can hand the theme to the provider on the
way in and fix the ordering rather than race it:

```tsx
const stored = readStoredTheme("my-app:theme")
<ThemeProvider themes={stored ? [base, stored] : [base]} defaultTheme={stored?.name ?? base.name}>
```

It shares its parsing with the hook, so the two cannot disagree about what counts as a valid stored
theme, and returns `undefined` on a server where there is no storage to read.
