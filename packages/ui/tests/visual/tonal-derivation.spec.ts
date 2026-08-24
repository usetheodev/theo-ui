import { expect, test } from "@playwright/test";

/**
 * Tonal derivation clamp validation — Phase 3 T3.1 AC.
 *
 * Asserts that `oklch(from var(--primary) max(0.05, calc(l - 0.16)) c h)`
 * preserves the matiz (chroma > 0.02) and does not clip to pure black
 * (L > 0.05) for dark-themed primaries (aurora-terminal, dracula, one-dark,
 * vercel-mono — themes where the base primary L is already in the lower
 * half of the OKLCH range).
 *
 * EC-7 absorbed: without the max() floor, themes with primary L ≈ 0.10
 * would derive deep L ≈ -0.06 → browser clips to 0 (pure black) and the
 * pressed-state visually collapses into the dark background.
 */

// The real themes, imported from source — see the note in theme-matrix.spec.ts on why the
// checked-in "auto-generated" fixture was removed rather than regenerated.
import { builtinThemes as themeFixtures } from "../../src/themes/index.js";

// Themes whose dark-mode primary L is < 0.45 — most likely to hit the clamp.
const DARK_PRIMARY_THEMES = ["aurora-terminal", "dracula", "one-dark", "vercel-mono"];

interface OklchTriple {
  l: number;
  c: number;
  h: number;
}

function parseOklch(css: string): OklchTriple {
  // CSS computed value normalises to `oklch(L C H)` or `oklch(L C H / A)` post-resolve.
  const match = /oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)/i.exec(css);
  if (match === null) throw new Error(`parseOklch: cannot parse "${css}"`);
  return {
    l: Number.parseFloat(match[1] ?? "0"),
    c: Number.parseFloat(match[2] ?? "0"),
    h: Number.parseFloat(match[3] ?? "0"),
  };
}

for (const themeName of DARK_PRIMARY_THEMES) {
  const fixture = themeFixtures.find((t) => t.name === themeName);
  if (fixture === undefined) continue;

  test(`tonal derivation clamp — ${themeName} dark mode preserves matiz`, async ({ page }) => {
    const vars = Object.entries(fixture.dark)
      .map(([k, v]) => `--${k}: ${v};`)
      .join(" ");
    await page.setContent(`
      <!doctype html>
      <html><head><meta charset="utf-8"/>
      <style>
        :root { ${vars} }
        :root {
          --primary-deep: oklch(from var(--primary) max(0.05, calc(l - 0.16)) c h);
          --primary-glow: oklch(from var(--primary) min(0.95, calc(l + 0.18)) c h);
        }
        .deep { background: var(--primary-deep); width: 80px; height: 80px; }
        .glow { background: var(--primary-glow); width: 80px; height: 80px; }
      </style></head>
      <body>
        <div class="deep" id="deep"></div>
        <div class="glow" id="glow"></div>
      </body></html>
    `);
    await page.evaluate(() => document.fonts.ready);

    const deepBg = await page.evaluate(() => {
      const el = document.getElementById("deep") as HTMLElement;
      return getComputedStyle(el).backgroundColor;
    });
    const glowBg = await page.evaluate(() => {
      const el = document.getElementById("glow") as HTMLElement;
      return getComputedStyle(el).backgroundColor;
    });

    const deep = parseOklch(deepBg);
    const glow = parseOklch(glowBg);

    // Clamp invariants (EC-7).
    expect(deep.l, `${themeName}: primary-deep L must be > 0.05 (clamp floor)`).toBeGreaterThan(
      0.05,
    );
    expect(
      deep.c,
      `${themeName}: primary-deep chroma must be > 0.02 (matiz preserved)`,
    ).toBeGreaterThan(0.02);
    // Ceiling is inclusive — themes with very-light primaries clamp exactly to 0.95.
    expect(
      glow.l,
      `${themeName}: primary-glow L must be ≤ 0.95 (clamp ceiling)`,
    ).toBeLessThanOrEqual(0.95);
  });
}
