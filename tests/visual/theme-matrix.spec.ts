import { expect, test } from "@playwright/test";

/**
 * Visual regression matrix — Phase 0 T0.1 / Phase 5 T5.3 / ADR-0009.
 *
 * 5 surface fixtures × 10 built-in themes × 2 modes = 100 snapshots.
 *
 * Surfaces are inlined HTML pages that exercise the most representative
 * Theo UI token combinations. No Ladle dev server boot required — keeps
 * the gate self-contained, fast, and deterministic.
 *
 * EC-1: `document.fonts.ready` awaited before each snapshot.
 * EC-2: `animations: 'disabled'` (set globally in playwright.config.ts).
 * EC-13: snapshots committed under a Docker-pinned image — see
 *   `tests/visual/README.md`.
 */

interface ThemeScale {
  background: string;
  foreground: string;
  card: string;
  "card-foreground": string;
  popover: string;
  "popover-foreground": string;
  primary: string;
  "primary-foreground": string;
  secondary: string;
  "secondary-foreground": string;
  accent: string;
  "accent-foreground": string;
  muted: string;
  "muted-foreground": string;
  border: string;
  ring: string;
  success: string;
  "success-foreground": string;
  warning: string;
  "warning-foreground": string;
  destructive: string;
  "destructive-foreground": string;
  info: string;
  "info-foreground": string;
  "status-online": string;
  "status-offline": string;
  "status-degraded": string;
  "status-info": string;
}

interface ThemeFixture {
  name: string;
  light: ThemeScale;
  dark: ThemeScale;
}

// Static OKLCH snapshots of the 10 built-in themes (light + dark).
// Mirrors src/themes/<name>.ts after the T2.4 migration. Kept inline so
// this spec doesn't depend on building the package (visual gate runs
// pre-build in the chain).
import { themeFixtures } from "./theme-fixtures.js";

const SURFACES: Array<{ slug: string; html: (scale: ThemeScale) => string }> = [
  {
    slug: "buttons",
    html: (s) => `
      <div style="display:grid; gap:12px; grid-template-columns:repeat(3,auto);">
        <button class="btn btn-primary">Primary</button>
        <button class="btn btn-deep">Deep</button>
        <button class="btn btn-secondary">Secondary</button>
        <button class="btn btn-accent">Accent</button>
        <button class="btn btn-destructive">Destructive</button>
        <button class="btn btn-ghost">Ghost</button>
      </div>`,
  },
  {
    slug: "card-row",
    html: (s) => `
      <div style="display:grid; gap:16px; grid-template-columns:1fr 1fr;">
        <div class="card">
          <div class="card-title">Revenue</div>
          <div class="card-value">$12,345</div>
          <div class="card-delta-up">+12%</div>
        </div>
        <div class="card">
          <div class="card-title">Cost</div>
          <div class="card-value">$3,200</div>
          <div class="card-delta-down">-5%</div>
        </div>
      </div>`,
  },
  {
    slug: "status-row",
    html: (s) => `
      <div style="display:flex; gap:24px;">
        <span class="status"><span class="dot dot-online"></span>Online</span>
        <span class="status"><span class="dot dot-offline"></span>Offline</span>
        <span class="status"><span class="dot dot-degraded"></span>Degraded</span>
        <span class="status"><span class="dot dot-info"></span>Info</span>
      </div>`,
  },
  {
    slug: "form",
    html: (s) => `
      <form class="form">
        <label class="label">Email
          <input class="input" value="user@example.com" />
        </label>
        <label class="label">Password
          <input class="input" type="password" value="secret" />
        </label>
        <button class="btn btn-primary" type="button">Sign in</button>
      </form>`,
  },
  {
    slug: "alert-stack",
    html: (s) => `
      <div style="display:grid; gap:8px;">
        <div class="alert alert-success">Form saved.</div>
        <div class="alert alert-warning">Disk usage at 82%.</div>
        <div class="alert alert-destructive">Operation failed.</div>
        <div class="alert alert-info">Maintenance window 02:00 UTC.</div>
      </div>`,
  },
];

const STYLES = `
  body { background: var(--background); color: var(--foreground); font-family: system-ui, sans-serif; margin: 0; padding: 48px; }
  .btn { padding: 10px 16px; border-radius: 10px; border: 1px solid transparent; font-size: 14px; font-weight: 500; cursor: pointer; }
  .btn-primary { background: var(--primary); color: var(--primary-foreground); }
  .btn-deep { background: oklch(from var(--primary) max(0.05, calc(l - 0.16)) c h); color: var(--primary-foreground); }
  .btn-secondary { background: var(--secondary); color: var(--secondary-foreground); border-color: var(--border); }
  .btn-accent { background: var(--accent); color: var(--accent-foreground); }
  .btn-destructive { background: var(--destructive); color: var(--destructive-foreground); }
  .btn-ghost { background: transparent; color: var(--foreground); border-color: var(--border); }
  .card { background: var(--card); color: var(--card-foreground); border: 1px solid var(--border); border-radius: 10px; padding: 16px; }
  .card-title { font-size: 12px; text-transform: uppercase; color: var(--muted-foreground); letter-spacing: 0.04em; }
  .card-value { font-size: 28px; font-weight: 600; margin-top: 4px; }
  .card-delta-up { font-size: 12px; color: var(--success); margin-top: 4px; }
  .card-delta-down { font-size: 12px; color: var(--destructive); margin-top: 4px; }
  .status { display: inline-flex; align-items: center; gap: 8px; font-size: 13px; }
  .dot { width: 8px; height: 8px; border-radius: 9999px; display: inline-block; }
  .dot-online { background: var(--status-online); }
  .dot-offline { background: var(--status-offline); }
  .dot-degraded { background: var(--status-degraded); }
  .dot-info { background: var(--status-info); }
  .form { display: grid; gap: 12px; max-width: 320px; }
  .label { display: grid; gap: 4px; font-size: 13px; color: var(--foreground); }
  .input { background: var(--background); color: var(--foreground); border: 1px solid var(--border); border-radius: 8px; padding: 8px 12px; font-size: 14px; }
  .alert { padding: 12px 16px; border-radius: 8px; font-size: 13px; }
  .alert-success { background: color-mix(in oklch, var(--success) 10%, transparent); color: var(--success); border: 1px solid color-mix(in oklch, var(--success) 30%, transparent); }
  .alert-warning { background: color-mix(in oklch, var(--warning) 10%, transparent); color: var(--warning); border: 1px solid color-mix(in oklch, var(--warning) 30%, transparent); }
  .alert-destructive { background: color-mix(in oklch, var(--destructive) 10%, transparent); color: var(--destructive); border: 1px solid color-mix(in oklch, var(--destructive) 30%, transparent); }
  .alert-info { background: color-mix(in oklch, var(--info) 10%, transparent); color: var(--info); border: 1px solid color-mix(in oklch, var(--info) 30%, transparent); }
`;

function renderPage(theme: ThemeFixture, mode: "light" | "dark", surfaceHtml: string): string {
  const scale = theme[mode];
  const vars = Object.entries(scale)
    .map(([k, v]) => `--${k}: ${v};`)
    .join(" ");
  return `<!doctype html>
<html><head><meta charset="utf-8"/><title>${theme.name}/${mode}</title>
<style>:root { ${vars} } ${STYLES}</style>
</head><body>${surfaceHtml}</body></html>`;
}

for (const theme of themeFixtures) {
  test.describe(`theme=${theme.name}`, () => {
    for (const mode of ["light", "dark"] as const) {
      for (const surface of SURFACES) {
        test(`${surface.slug} @ ${mode}`, async ({ page }) => {
          await page.setContent(renderPage(theme, mode, surface.html(theme[mode])));
          await page.evaluate(() => document.fonts.ready);
          await expect(page).toHaveScreenshot(`${theme.name}-${mode}-${surface.slug}.png`, {
            // Antialiasing-robust per-pixel threshold (config default). The
            // aggregate maxDiffPixels safety net comes from playwright.config.ts.
            threshold: 0.2,
          });
        });
      }
    }
  });
}
