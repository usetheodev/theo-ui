#!/usr/bin/env tsx
/**
 * Bundle-size regression gate (HIGH-008 / T6.3).
 *
 * Reads the recorded baseline sizes from `scripts/baselines/bundle-sizes.json`
 * and compares against the actual byte sizes of the dist artifacts. Fails the
 * gate when any file is outside the ±5% tolerance (default).
 *
 * Run after `pnpm build`:
 *
 *   pnpm tsx scripts/validate-bundle-size.ts            # verify
 *   pnpm tsx scripts/validate-bundle-size.ts --update   # rebaseline
 *
 * The baseline lives in source control; rebaseline produces a diff a reviewer
 * sees in the PR, so accidental size regressions can never sneak in.
 */
import { statSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const BASELINE_PATH = join(ROOT, "scripts/baselines/bundle-sizes.json");

interface Baseline {
  $comment?: string;
  files: Record<string, number>;
  tolerancePercent: number;
}

const writeStdout = (m: string): void => {
  process.stdout.write(`${m}\n`);
};

async function readBaseline(): Promise<Baseline> {
  return JSON.parse(await readFile(BASELINE_PATH, "utf-8")) as Baseline;
}

async function main(): Promise<void> {
  const update = process.argv.includes("--update");
  const baseline = await readBaseline();
  const tolerance = baseline.tolerancePercent / 100;

  const measured: Record<string, number> = {};
  const failures: string[] = [];

  for (const [relPath] of Object.entries(baseline.files)) {
    const absPath = join(ROOT, relPath);
    try {
      measured[relPath] = statSync(absPath).size;
    } catch (err) {
      failures.push(`${relPath}: missing on disk (run \`pnpm build\`?). Detail: ${String(err)}`);
    }
  }

  if (update) {
    const next: Baseline = {
      ...baseline,
      files: measured,
    };
    await writeFile(BASELINE_PATH, `${JSON.stringify(next, null, 2)}\n`);
    writeStdout(`Rebaselined ${Object.keys(measured).length} entries.`);
    for (const [path, size] of Object.entries(measured)) {
      writeStdout(`  ${path}: ${size}`);
    }
    return;
  }

  for (const [relPath, expected] of Object.entries(baseline.files)) {
    const actual = measured[relPath];
    if (actual === undefined) continue;
    const delta = actual - expected;
    const ratio = Math.abs(delta) / expected;
    if (ratio > tolerance) {
      const sign = delta > 0 ? "+" : "";
      const pct = ((delta / expected) * 100).toFixed(1);
      failures.push(
        `${relPath}: ${actual} bytes (baseline ${expected}, ${sign}${delta} bytes / ${sign}${pct}%). Tolerance ±${baseline.tolerancePercent}%. Rebaseline with \`pnpm quality:bundle:update\` if intentional.`,
      );
    }
  }

  if (failures.length > 0) {
    process.stderr.write("Bundle-size gate failed:\n");
    for (const failure of failures) {
      process.stderr.write(`- ${failure}\n`);
    }
    process.exit(1);
  }

  writeStdout(
    `Bundle-size gate passed: ${Object.keys(measured).length} files within ±${baseline.tolerancePercent}% of baseline.`,
  );
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
