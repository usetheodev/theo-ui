#!/usr/bin/env tsx
/**
 * Dogfood — RFC 0008 follow-up #2: pre-compiled utility CSS.
 *
 * Asserts that `dist/components.css` (chained from `dist/styles.css`)
 * contains the materialized utility rules for the classes the library's
 * components reference at runtime. This is the regression guard for the
 * pnpm-symlink bug fixed in 0.6.1-next.0 — the exact contract grep the
 * TheoKit reproduction script uses:
 *
 *   $ grep -c "\.hover\\:bg-muted" .../@usetheo/ui/dist/*.css
 *   must return >= 1 (pre-fix: 0)
 *
 * If any required class fails to appear, the gate fails — meaning the
 * library will once again render flat under pnpm. The dogfood runs in
 * `quality:gates` so the regression cannot reach npm.
 *
 * Run after `pnpm build`:
 *
 *   pnpm tsx scripts/dogfood-precompiled-utilities.ts
 */
import { existsSync, readFileSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

interface Check {
  label: string;
  ok: boolean;
}
const checks: Check[] = [];
const assert = (label: string, ok: boolean): void => {
  checks.push({ label, ok });
};

function readDist(rel: string): string {
  const path = join(ROOT, "dist", rel);
  if (!existsSync(path)) {
    throw new Error(`expected dist artifact missing: dist/${rel} (run \`pnpm build\`?)`);
  }
  return readFileSync(path, "utf-8");
}

/* ─── dist/components.css exists + is non-trivial ────────────────────── */
const componentsPath = join(ROOT, "dist/components.css");
assert("dist/components.css exists", existsSync(componentsPath));

if (existsSync(componentsPath)) {
  const bytes = statSync(componentsPath).size;
  assert(`dist/components.css >= 5 KB (got ${bytes} bytes)`, bytes >= 5_000);
  assert(`dist/components.css <= 200 KB sanity ceiling (got ${bytes} bytes)`, bytes <= 200_000);
}

/* ─── dist/styles.css chains components.css ──────────────────────────── */
const styles = readDist("styles.css");
assert(
  'dist/styles.css contains `@import "./components.css"`',
  styles.includes('@import "./components.css"'),
);

/* ─── Contract validation greps from the TheoKit reproduction ──────── */
const components = readDist("components.css");

const REQUIRED_HOVER_RULES = [
  // The exact two rules TheoKit's reproduction script checks for.
  ".hover\\:bg-muted:hover",
  ".hover\\:text-foreground:hover",
];
for (const rule of REQUIRED_HOVER_RULES) {
  assert(`dist/components.css contains rule \`${rule}\``, components.includes(rule));
}

const REQUIRED_BASE_RULES = [
  // Sample of base color/background rules the library components rely on.
  ".bg-primary",
  ".bg-card",
  ".bg-muted",
  ".bg-accent",
  ".text-foreground",
  ".text-muted-foreground",
  ".text-primary",
  ".border-border",
  // Typescale tokens declared in tokens-v4.css.
  ".text-body-md",
  ".text-body-sm",
  ".text-label",
  ".text-label-caps",
  // Radii from @theme.
  ".rounded-md",
  ".rounded-lg",
];
for (const rule of REQUIRED_BASE_RULES) {
  // Match `.X{` or `.X:` to avoid partial overlap (e.g. `.bg-primary-deep`
  // matching `.bg-primary`).
  const pattern = new RegExp(`\\${rule}[:{ ]`);
  assert(`dist/components.css contains \`${rule}\` rule`, pattern.test(components));
}

const REQUIRED_VARIANT_RULES = [
  // A few hover/focus/active/data-state variants from across the library.
  ".hover\\:bg-secondary",
  ".hover\\:shadow-md",
  ".hover\\:underline",
  ".focus-visible\\:outline",
];
for (const rule of REQUIRED_VARIANT_RULES) {
  assert(`dist/components.css contains rule \`${rule}\``, components.includes(rule));
}

/* ─── Negative assertions: no broken legacy patterns ─────────────────── */
assert(
  "dist/components.css does NOT include the broken `node_modules/@usetheo/ui` @source pattern",
  !components.includes("node_modules/@usetheo/ui"),
);

/* ─── Report ─────────────────────────────────────────────────────────── */
let passed = 0;
let failed = 0;
for (const c of checks) {
  if (c.ok) {
    passed++;
    process.stdout.write(`  ✓  ${c.label}\n`);
  } else {
    failed++;
    process.stdout.write(`  ✗  ${c.label}\n`);
  }
}
process.stdout.write(`\nDogfood precompiled-utilities — ${passed}/${checks.length} passed\n`);
if (failed > 0) {
  process.stdout.write(`${failed} check(s) failed.\n`);
  process.exit(1);
}
