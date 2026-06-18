# Implementation Summary — Community-Standard Componentization

**Plan:** `.claude/knowledge-base/plans/community-standard-componentization-plan.md`
**Branch:** `develop`
**Status:** 5 of 6 phases delivered + verified green. Phase 4 toolchain-blocked.

## Phase status

| Phase | Status | Evidence | Commit |
|---|---|---|---|
| **Phase 1 — `"use client"` RSC** | ✅ DONE | 45 client source files marked; `scripts/inject-use-client.ts` re-injects into entry shims + component chunks post-build (esbuild strips under splitting); RSC smoke test 5/5; gate `validateUseClientDirective`. Verified RSC-correct on both subpath and barrel paths. | `5ace8bd` |
| **Phase 2 — `data-slot`** | ✅ DONE | All 135 components emit `data-slot` (codemod `scripts/codemod-data-slot.ts`, ts-morph); gate `validateDataSlot`; registry regenerated; 1904 tests green. | `a261379`, `d31b589` |
| **Phase 3 — `.d.ts` per subpath** | ✅ DONE | tsup's rollup-plugin-dts OOMs at 130+ entries (confirmed with `resolve:false` + 8 GB heap → `ERR_WORKER_OUT_OF_MEMORY`). Delegated declaration emit to `tsc -p tsconfig.dts.json` (scales fine). Each subpath resolves an isolated `.d.ts` under `dist/components/`; `sync-exports.ts` canonical builder + tests updated; publint green; 4/4 per-subpath tests. | (this session) |
| **Phase 5 — cva/asChild** | ✅ DONE (focused) | 9 cva components emit `data-variant`/`data-size` (codemod `scripts/codemod-data-variant.ts`); `*Variants` already exported. Per YAGNI, NOT forced on non-variant components. | (this session) |
| **Phase 6 — a11y** | ✅ ALREADY SATISFIED | Verified the plan's targets were already fixed by prior 2026-05-16 work: nested `aria-live` in `agent-streaming` (`inLiveRegion` guard + nested test), `button-name` in editors (T5.3), `aria-label` in MetricsPanel tiles. `quality:a11y` 307/307. No change fabricated. | — |
| **Phase 4 — Tailwind v4 / React 19 matrix** | ⛔ BLOCKED (toolchain) | See below. | — |

## Phase 4 — why blocked

Bumping the `tailwindcss` devDep `^3.4.17 → ^4` (empirically attempted + reverted) cascades into a coordinated migration that cannot ship as a safe increment:

1. **PostCSS plugin API changed.** `playground/vite.config.ts` calls `tailwindcss({ config })` as a PostCSS plugin (v3 API). In v4 that is `@tailwindcss/postcss`, not `tailwindcss`. Bumping → `TS2769 No overload matches` + library `pnpm build` fails (exit 1).
2. **`tailwindcss-animate` is a JS plugin** consumed by `src/styles/tailwind-preset.ts` (`plugins: [animate]`). The v4 replacement `tw-animate-css` is a CSS `@import`, not a JS plugin — swapping requires re-architecting the preset from JS-config to CSS-config.
3. **v3-legacy artifacts** (`preset-v3-legacy`, `styles-v3-legacy`) are wired into tsup entries, `package.json#exports`, `sync-exports.ts`, the bundle baseline, and `validateRegistryPresetDep`. Removing them (authorized by "no backcompat") is a multi-file surgical change.
4. **Visual + bundle re-baseline** would be required after the CSS pipeline changes.

This is a dedicated migration cycle, not a tail-end increment. The shipped `dist/components.css` is ALREADY built with Tailwind v4 (`@tailwindcss/cli` v4.3.0), so the consumer-facing CSS is already v4; the gap is the dev/test version label + the v3-legacy compat artifacts. Recommend a separate `/to-plan tailwind-v4-migration` cycle with its own visual-regression re-baseline.

## Pre-existing issue corrected during validation

The `dist/components.css` bundle baseline (104 KB) was set in an environment where Tailwind v4 `@source` under-scanned the library tree (pnpm-symlink fragility documented in `build-precompiled-css.ts`). Full scan is 469 KB. Proven bundle-neutral for this feature (removing `data-slot` leaves `components.css` byte-identical). Baseline corrected in `acdc34c`.

## Quality gates

`pnpm quality:gates` green end-to-end on the 5-phase state (format, lint, typecheck, knip, 1904+ tests, build, publint, registry 148, structure + 2 new gates, bundle, a11y 307, visual, ladle, 6 dogfoods).
