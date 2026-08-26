---
"@theokit/ui": patch
---

`ThemeEditor` and the contrast helpers are actually importable.

`1.6.0` announced them and did not export them. They were added to `themes/index.ts`, but
`src/index.ts` re-exports by explicit list, so `import { ThemeEditor } from "@theokit/ui"` resolved
to `undefined` — the code shipped, bundled and tested, and could not be reached.

Every gate passed, which is the part worth fixing rather than the missing line. `barrel-exports.test.ts`
already covered this defect for themes by name, because it happened in `1.4.0` with `falconRed`; it
now derives from the module and asserts that every runtime value the themes barrel exposes reaches
the package root, so the next addition is covered by existing.

Two deliberate exclusions are named in that test rather than filtered by a naming rule: `hexToHsl`
and `rgbToHslLegacy`, both `@deprecated` in favour of the OKLCH helpers, stay reachable from the
themes module and out of the root. A second assertion checks they are still real exports, so the
exclusion list cannot rot into a typo that silently widens the gate.
