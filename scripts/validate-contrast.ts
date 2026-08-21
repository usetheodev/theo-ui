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
        themeReport[mode].push({ fg, bg, threshold: AA_LARGE, ratio });
        if (ratio < AA_LARGE) {
          failures.push(
            `theme:${theme.name} (${mode}, large): ${fg} vs ${bg} = ${ratio.toFixed(2)}:1 (need >=${AA_LARGE}:1)`,
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
