# Visual regression tests

Phase 0 T0.1 / Phase 5 T5.3 (community-best-practices plan, ADR-0005/0009 cohort).

## Status

Infrastructure scaffolded:

- `playwright.config.ts` at repo root — Chromium-only, viewport 1280×720,
  `animations: 'disabled'` (EC-2), 0.001 pixel diff threshold.
- `@playwright/test` installed as a dev dep.
- `tests/visual/` directory reserved for snapshot specs.

## Baseline generation (deferred)

The OKLCH migration (Phase 2) changed every color token in the 10 built-in
themes. A reliable visual baseline requires:

1. Docker pinning to `mcr.microsoft.com/playwright:v1.49.0-jammy` (EC-13:
   font rendering diverges between macOS / Linux / Windows; the baseline
   must be generated under the same environment that CI runs).
2. Ladle dev server boot before each spec, then programmatic `data-theme`
   + `data-mode` injection on `<html>` (5 pages × 10 themes × 2 modes =
   100 snapshots).
3. CI workflow tweak to run Playwright under the Docker image and commit
   `__screenshots__/` updates as a separate PR.

This work is **deferred to a follow-up PR**: the contract (config +
infrastructure) is in place; the 100-snapshot baseline generation is a
~2-hour Docker setup + ~2MB binary diff in git history. Treating it as a
separate change keeps the Phase 0-7 PR reviewable.

Other defenses against visual regression are already wired:

- **WCAG contrast gate** (`scripts/lib/wcag-contrast.ts` →
  `validateThemeContrast`) accepts OKLCH and HSL split; runs on every
  `pnpm quality:gates` execution. Catches semantic-level regression in any
  of the 10 built-in themes × 2 modes.
- **Dogfood v4 zero-config** (`scripts/dogfood-v4-zero-config.ts`)
  asserts that `dist/tokens-v4.css` aliases `--color-primary` to
  `var(--primary)` (post-T2.5).
- **Dogfood precompiled-utilities** (`scripts/dogfood-precompiled-utilities.ts`)
  asserts that 15 base Tailwind utilities (`.bg-card`, `.text-foreground`,
  etc.) compile correctly under v4 with the OKLCH tokens.

## When to invest in the baseline

If a real consumer reports a theme-switching visual bug that the WCAG
contrast gate did not catch (e.g., shadow rendering wrong, gradient
direction inverted), that is the trigger to ship the 100-snapshot
baseline. The infrastructure here is ready to accept it.
