import { expect, test } from "@playwright/test";

/**
 * Visual smoke baseline — Phase 0 T0.1 / Phase 5 T5.3.
 *
 * Self-contained spec that renders a Theo button inside an inline page with
 * inlined `--primary` token + a known background. No dev server boot
 * required — keeps the gate fast and deterministic.
 *
 * The full 5-page × 10-theme × 2-mode matrix is documented as deferred in
 * `tests/visual/README.md`. This single spec exists to prove the Playwright
 * infrastructure is wired correctly and to gate against catastrophic OKLCH
 * regressions (e.g., a future migration that breaks the token cascade).
 *
 * EC-1: `document.fonts.ready` awaited before screenshot.
 * EC-2: animations disabled via Playwright config.
 */

const VIOLET_FORGE_PRIMARY = "oklch(0.542 0.245 293)";
const VIOLET_FORGE_BG = "oklch(1 0 0)";
const VIOLET_FORGE_FG = "oklch(0.146 0 0)";

const PAGE = `
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Theme smoke</title>
  <style>
    :root {
      --primary: ${VIOLET_FORGE_PRIMARY};
      --primary-foreground: oklch(1 0 0);
      --background: ${VIOLET_FORGE_BG};
      --foreground: ${VIOLET_FORGE_FG};
    }
    body {
      background: var(--background);
      color: var(--foreground);
      font-family: system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
      margin: 0;
      padding: 48px;
    }
    .btn {
      background: var(--primary);
      color: var(--primary-foreground);
      padding: 12px 20px;
      border-radius: 10px;
      border: 0;
      font-size: 14px;
      font-weight: 500;
    }
    .btn-deep {
      background: oklch(from var(--primary) max(0.05, calc(l - 0.16)) c h);
    }
  </style>
</head>
<body>
  <div style="display:flex; gap:12px; align-items:center;">
    <button class="btn">Primary</button>
    <button class="btn btn-deep">Primary deep (derived)</button>
  </div>
</body>
</html>`;

test.describe("OKLCH theme cascade smoke", () => {
  test("primary + derived deep render", async ({ page }) => {
    await page.setContent(PAGE);
    await page.evaluate(() => document.fonts.ready);
    await expect(page).toHaveScreenshot("primary-and-derived.png", {
      threshold: 0.001,
      animations: "disabled",
    });
  });
});
