---
"@theokit/ui": minor
---

Density reaches the controls, and the editor moves it with the spacing.

**`useDensity` controlled nothing.** It set `data-density` on `<html>` and injected
`--theo-control-h` / `--theo-control-px` under each value, and `density.ts` documented form-control
variants reading them. A grep for those variables across `src/components` returned zero matches: the
switch worked, the CSS was correct, the tests asserted the injection, and no pixel moved. The `md`
tier of ten controls now reads them, with the current value as the fallback so nothing changes for a
consumer who never touches density. `h-8` tiers stay fixed, as `density.ts` says they should — an
explicit size beats density.

**The editor moves both mechanisms.** Density is one decision to the person making it, and was two
in the implementation: `--spacing` (a theme token) scales `p-*`/`gap-*`/`m-*`, `data-density` sets
control height. Choosing "compact" tightened the layout and left every input at its comfortable
height. They stay separate mechanisms — `useDensity` still works on its own, without the editor —
but the editor's one control now drives both.

**Not covered:** `@usetheo/ui` has 26 fixed control heights of its own and does not know about these
variables. Density stops at the boundary between the two packages, which is a real limit rather than
an oversight to discover later.
