import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright config for visual regression — Phase 0 T0.1 / D9.
 *
 * Chromium-only baseline (one renderer is enough for OKLCH theme switch
 * smoke; matrix expansion deferred until consumer demand warrants it).
 *
 * EC-1 absorbed: spec files explicitly `await page.evaluate(() => document.fonts.ready)`
 * before each toHaveScreenshot — Geist font async load otherwise renders
 * fallback `-apple-system` in the snapshot.
 *
 * EC-2 absorbed: `animations: 'disabled'` pauses CSS animations + transitions
 * so the snapshot captures a stable frame regardless of timing.
 *
 * EC-13 absorbed: production baseline generation lives in
 * `mcr.microsoft.com/playwright:v1.49.0-jammy` via `pnpm quality:visual:docker`.
 * Local dev runs work but baselines committed to git are Docker-generated to
 * keep cross-OS font rendering consistent.
 */
export default defineConfig({
  testDir: "./tests/visual",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  expect: {
    toHaveScreenshot: {
      // `threshold` is the per-pixel perceptual (YIQ) color delta below which a
      // pixel counts as unchanged. Playwright's default is 0.2; the prior 0.001
      // counted sub-pixel font antialiasing as a difference, so the suite could
      // only pass on the exact machine that generated the baselines — it failed
      // in CI with ~488-1882 antialiased px diffing (ratio ≤0.2%, no real
      // regression). 0.2 ignores antialiasing; `maxDiffPixels: 200` is a safety net.
      //
      // What that net does NOT catch, measured rather than assumed: inverting a button
      // label from white to near-black across the whole theme matrix moves exactly 72
      // pixels per surface (2026-08-21, re-run with maxDiffPixels: 0 while fixing
      // usetheokit/theokit-ui#47). The sentence that used to sit here — that a changed
      // colour "diffs thousands+ of pixels" — holds for a filled surface and not for text
      // on a small element, so this gate is blind to a text-colour change on a button,
      // which is the class of accessibility defect #47 was about.
      //
      // The allowance is deliberately NOT lowered here. It exists because antialiasing
      // once diffed 488-1882 px across machines, and one developer laptop is not evidence
      // about CI. Recorded so the next person knows what this number protects and what it
      // does not.
      threshold: 0.2,
      maxDiffPixels: 200,
      animations: "disabled",
    },
  },
  use: {
    viewport: { width: 1280, height: 720 },
    actionTimeout: 5_000,
    navigationTimeout: 10_000,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
