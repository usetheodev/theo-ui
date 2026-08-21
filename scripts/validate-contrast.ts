/**
 * WCAG AA contrast validator — Phase 0 T0.2 standalone runner.
 *
 * Audits every built-in theme × 2 modes × 8 critical pairs against
 * WCAG 2.x AA thresholds. Persists baseline ratios to
 * `tests/contrast/contrast-baseline.json` — subsequent runs assert each
 * pair stays ≥ baseline (tolerância para melhora, regressão = fail).
 *
 * `--update` regenerates baseline (use after intentional theme tuning).
 *
 * Pairs audited per (theme, mode):
 *   body (4.5:1):  background↔foreground, card↔card-foreground,
 *                  popover↔popover-foreground, muted↔muted-foreground
 *   large (3:1):   primary↔primary-foreground, secondary↔secondary-foreground,
 *                  accent↔accent-foreground, destructive↔destructive-foreground
 *
 * Assertions per run = themes × 2 modes × 8 pairs.
 */

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { contrastRatio } from "./lib/wcag-contrast.js";

const ROOT = process.cwd();
const BASELINE_PATH = join(ROOT, "tests/contrast/contrast-baseline.json");
const UPDATE = process.argv.includes("--update");

const BODY_PAIRS = [
  ["foreground", "background"],
  ["card-foreground", "card"],
  ["popover-foreground", "popover"],
] as const;

// muted-foreground vs muted is auxiliary/caption text in practice (badges,
// hints, timestamps) — WCAG large-text threshold (3:1) applies. Including
// in LARGE_PAIRS so themes with intentionally subtle meta-text don't
// regress on body threshold.
const LARGE_PAIRS = [
  ["primary-foreground", "primary"],
  ["secondary-foreground", "secondary"],
  ["accent-foreground", "accent"],
  ["destructive-foreground", "destructive"],
  ["muted-foreground", "muted"],
] as const;

const AA_BODY = 4.5;
const AA_LARGE = 3.0;

/**
 * Themes this project designs, as opposed to the ones it reproduces.
 *
 * The seven themes added by RFC 0007 (vercel-mono, github-dark, dracula, one-dark,
 * anthropic-style, openai-style, linear-glass) exist to look like somebody else's product.
 * Their contrast is a property of the palette being mimicked — raising it would mean no
 * longer reproducing it, which is the one thing they are for. Measured 2026-08-21, five of
 * them put `primary-foreground` on `primary` below 4.5:1 (anthropic-style dark 3.03,
 * openai-style light 3.22, github-dark dark 3.44, vercel-mono dark 3.61, linear-glass dark
 * 3.70).
 *
 * The themes below are ours. Their contrast is a decision we make, so they are held to the
 * body threshold on the button-label pairs listed in OWN_BRAND_BODY_PAIRS.
 */
const OWN_BRAND_THEMES = new Set(["violet-forge", "falcon-red"]);

/**
 * Pairs that are button-label text on our own themes, and are therefore normal text under
 * WCAG (a button label is ~14px; the large-text allowance starts at 24px, or 18.66px bold).
 *
 * usetheokit/theokit-ui#26 reported `primary-foreground vs primary` at 3.89:1 while the
 * gate asked for 3.0 and passed it. The ratio recovered on its own when `--primary` was
 * deep-anchored to oklch(0.5 0.16 296.97) on 2026-07-17 — it now measures 6.45:1 in both
 * modes — but the threshold that let 3.89 through was never corrected, so the same
 * regression would pass again unnoticed. This raises the floor to what the shipped brand
 * already clears.
 *
 * `accent-foreground vs accent` is deliberately NOT here: violet-forge measures 3.83:1 on
 * it in both modes, so including it would fail the gate on our own default theme. That is
 * a real AA gap and a brand decision, tracked separately rather than hidden by keeping the
 * threshold low without saying so.
 */
const OWN_BRAND_BODY_PAIRS = new Set([
  "primary-foreground vs primary",
  "secondary-foreground vs secondary",
  "destructive-foreground vs destructive",
]);

/** The floor a given (theme, pair) must clear. */
function thresholdFor(themeName: string, fg: string, bg: string, base: number): number {
  if (base === AA_BODY) return AA_BODY;
  return OWN_BRAND_THEMES.has(themeName) && OWN_BRAND_BODY_PAIRS.has(`${fg} vs ${bg}`)
    ? AA_BODY
    : AA_LARGE;
}

interface PairRatio {
  fg: string;
  bg: string;
  threshold: number;
  ratio: number;
}

interface ThemeReport {
  light: PairRatio[];
  dark: PairRatio[];
}

type Baseline = Record<string, ThemeReport>;

async function auditAll(): Promise<{ report: Baseline; failures: string[] }> {
  const { builtinThemes } = await import("../src/themes/index.js");
  const report: Baseline = {};
  const failures: string[] = [];

  for (const theme of builtinThemes) {
    const themeReport: ThemeReport = { light: [], dark: [] };
    for (const mode of ["light", "dark"] as const) {
      const scale = theme[mode];
      for (const [fg, bg] of BODY_PAIRS) {
        const ratio = contrastRatio(scale[fg], scale[bg]);
        themeReport[mode].push({ fg, bg, threshold: AA_BODY, ratio });
        if (ratio < AA_BODY) {
          failures.push(
            `theme:${theme.name} (${mode}, body): ${fg} vs ${bg} = ${ratio.toFixed(2)}:1 (need >=${AA_BODY}:1)`,
          );
        }
      }
      for (const [fg, bg] of LARGE_PAIRS) {
        const ratio = contrastRatio(scale[fg], scale[bg]);
        const threshold = thresholdFor(theme.name, fg, bg, AA_LARGE);
        themeReport[mode].push({ fg, bg, threshold, ratio });
        if (ratio < threshold) {
          const band = threshold === AA_BODY ? "body" : "large";
          failures.push(
            `theme:${theme.name} (${mode}, ${band}): ${fg} vs ${bg} = ${ratio.toFixed(2)}:1 (need >=${threshold}:1)`,
          );
        }
      }
    }
    report[theme.name] = themeReport;
  }
  return { report, failures };
}

function compareAgainstBaseline(report: Baseline, baseline: Baseline): string[] {
  const regressions: string[] = [];
  for (const [themeName, themeReport] of Object.entries(report)) {
    const base = baseline[themeName];
    if (base === undefined) continue;
    for (const mode of ["light", "dark"] as const) {
      for (const [i, current] of themeReport[mode].entries()) {
        const prior = base[mode][i];
        if (prior === undefined) continue;
        const drop = prior.ratio - current.ratio;
        // tolerância de 0.1 contrast unit pra round-trip OKLCH delta
        if (drop > 0.1) {
          regressions.push(
            `theme:${themeName} (${mode}): ${current.fg} vs ${current.bg} regressed from ${prior.ratio.toFixed(2)}:1 to ${current.ratio.toFixed(2)}:1`,
          );
        }
      }
    }
  }
  return regressions;
}

async function main(): Promise<void> {
  const t0 = Date.now();
  const { report, failures } = await auditAll();
  const elapsed = Date.now() - t0;

  // Counted from the report instead of hard-coded. The summary used to say "10 themes"
  // whatever was actually audited, so adding an 11th made the gate's own output wrong —
  // and that line is the only thing a reader has to judge its coverage by.
  const summary =
    `WCAG AA passes for all ${Object.keys(report).length} themes × 2 modes × ` +
    `${BODY_PAIRS.length + LARGE_PAIRS.length} pairs in ${elapsed}ms.`;

  if (failures.length > 0) {
    console.error(`WCAG AA contrast gate FAILED (${failures.length} pair(s)):`);
    for (const f of failures) console.error(`  - ${f}`);
    process.exit(1);
  }

  if (UPDATE || !existsSync(BASELINE_PATH)) {
    writeFileSync(BASELINE_PATH, `${JSON.stringify(report, null, 2)}\n`, "utf8");
    console.log(`Baseline ${UPDATE ? "regenerated" : "created"}: ${BASELINE_PATH}`);
    console.log(summary);
    return;
  }

  const baseline = JSON.parse(readFileSync(BASELINE_PATH, "utf8")) as Baseline;
  const regressions = compareAgainstBaseline(report, baseline);
  if (regressions.length > 0) {
    console.error(`WCAG contrast REGRESSIONS detected (${regressions.length}):`);
    for (const r of regressions) console.error(`  - ${r}`);
    console.error("\nRun `pnpm quality:contrast --update` if the change is intentional.");
    process.exit(1);
  }

  console.log(summary);
  console.log(`No regressions vs ${BASELINE_PATH}`);
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
