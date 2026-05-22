#!/usr/bin/env tsx
/**
 * Dogfood — RFC 0008 follow-up (Tailwind v4 native artifacts).
 *
 * Asserts that the shipped CSS artifacts are actually Tailwind v4 shaped:
 *   - `dist/styles.css` uses `@import "tailwindcss"` (v4) — NOT the v3
 *     `@tailwind base/components/utilities` directives that Tailwind v4
 *     emits as literal strings (the bug 0.5.0-next.0 shipped under v4 peer).
 *   - `dist/tokens-v4.css` defines a `@theme { --color-* }` namespace
 *     covering all 25 color tokens + the Violet Forge typescale + radii
 *     + shadows + animations.
 *   - `dist/preset.css` imports `tokens.css` (runtime vars) and
 *     `tokens-v4.css` (@theme aliases).
 *   - `dist/styles-v3-legacy.css` still ships for any v3 consumer who
 *     pinned an explicit subpath.
 *   - `dist/preset-v3-legacy.{js,d.ts}` still ships as the v3 JS preset.
 *
 * Also validates the new `package.json#exports` shape: `./preset` resolves
 * to the CSS file (NOT the previous JS preset), and the v3 fallback path
 * `./preset-v3-legacy` exists.
 *
 * What this does NOT do: actually run @tailwindcss/cli@^4 against the
 * fixture HTML — that would require installing tailwindcss@^4 as a
 * devDep, which conflicts with the existing v3 devDep used by Ladle.
 * That end-to-end build verification belongs in TheoKit's own
 * integration tests (per the bug report's "After publishing" checklist).
 *
 * Run after `pnpm build`:
 *
 *   pnpm tsx scripts/dogfood-v4-zero-config.ts
 *
 * Exit 0 on success, 1 on any assertion failure.
 */
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

interface Check {
  label: string;
  result: boolean;
  detail?: string;
}

const checks: Check[] = [];

function assert(label: string, condition: boolean, detail?: string): void {
  checks.push({ label, result: condition, detail });
}

function readDist(rel: string): string {
  const path = join(ROOT, "dist", rel);
  if (!existsSync(path)) {
    throw new Error(`expected dist artifact missing: dist/${rel} (run \`pnpm build\`?)`);
  }
  return readFileSync(path, "utf-8");
}

/* ─── dist/styles.css ────────────────────────────────────────────────── */
const styles = readDist("styles.css");
assert(
  'dist/styles.css uses Tailwind v4 syntax: @import "tailwindcss"',
  styles.includes('@import "tailwindcss"'),
  'expected `@import "tailwindcss"` near the top of dist/styles.css',
);
assert(
  "dist/styles.css does NOT contain v3 `@tailwind base;` directive",
  !/^\s*@tailwind\s+base\s*;/m.test(styles),
  'Tailwind v4 emits `@tailwind base;` as a literal — must be replaced by `@import "tailwindcss"`',
);
assert(
  "dist/styles.css does NOT contain v3 `@tailwind components;` directive",
  !/^\s*@tailwind\s+components\s*;/m.test(styles),
);
assert(
  "dist/styles.css does NOT contain v3 `@tailwind utilities;` directive",
  !/^\s*@tailwind\s+utilities\s*;/m.test(styles),
);
assert(
  "dist/styles.css imports tokens.css (runtime --primary cascade)",
  styles.includes('@import "./tokens.css"'),
);
assert(
  "dist/styles.css imports tokens-v4.css (@theme namespace)",
  styles.includes('@import "./tokens-v4.css"'),
);

/* ─── dist/tokens-v4.css ─────────────────────────────────────────────── */
const tokensV4 = readDist("tokens-v4.css");
assert("dist/tokens-v4.css declares an `@theme {}` block", /@theme\s*\{/.test(tokensV4));

const requiredColorAliases = [
  "--color-background",
  "--color-foreground",
  "--color-primary",
  "--color-primary-deep",
  "--color-primary-glow",
  "--color-primary-foreground",
  "--color-secondary",
  "--color-secondary-foreground",
  "--color-accent",
  "--color-accent-deep",
  "--color-accent-foreground",
  "--color-muted",
  "--color-muted-foreground",
  "--color-card",
  "--color-card-foreground",
  "--color-popover",
  "--color-popover-foreground",
  "--color-border",
  "--color-input",
  "--color-ring",
  "--color-success",
  "--color-success-foreground",
  "--color-warning",
  "--color-warning-foreground",
  "--color-destructive",
  "--color-destructive-foreground",
  "--color-info",
  "--color-info-foreground",
];
for (const alias of requiredColorAliases) {
  assert(`dist/tokens-v4.css declares ${alias}`, tokensV4.includes(`${alias}:`));
}

const requiredTextTiers = [
  "--text-display-2xl",
  "--text-display-xl",
  "--text-display-lg",
  "--text-display-md",
  "--text-headline",
  "--text-title-lg",
  "--text-title-md",
  "--text-body-lg",
  "--text-body-md",
  "--text-body-sm",
  "--text-label",
  "--text-label-caps",
  "--text-code-md",
  "--text-code-sm",
];
for (const t of requiredTextTiers) {
  assert(`dist/tokens-v4.css declares ${t}`, tokensV4.includes(`${t}:`));
}

assert(
  "dist/tokens-v4.css declares `--font-sans` / `--font-mono` / `--font-display`",
  tokensV4.includes("--font-sans:") &&
    tokensV4.includes("--font-mono:") &&
    tokensV4.includes("--font-display:"),
);

assert(
  "dist/tokens-v4.css declares `@keyframes fade-in-up`",
  /@keyframes\s+fade-in-up/.test(tokensV4),
);
assert(
  "dist/tokens-v4.css declares `@keyframes pulse-glow`",
  /@keyframes\s+pulse-glow/.test(tokensV4),
);

assert(
  "dist/tokens-v4.css aliases `--color-primary` to hsl(var(--primary)) — runtime indirection preserved",
  /--color-primary:\s*hsl\(\s*var\(--primary\)/.test(tokensV4),
);

/* ─── dist/preset.css ────────────────────────────────────────────────── */
const presetCss = readDist("preset.css");
assert("dist/preset.css imports tokens.css", presetCss.includes('@import "./tokens.css"'));
assert("dist/preset.css imports tokens-v4.css", presetCss.includes('@import "./tokens-v4.css"'));

/* ─── dist/styles-v3-legacy.css ─────────────────────────────────────── */
assert(
  "dist/styles-v3-legacy.css still ships for tailwindcss@^3 consumers",
  existsSync(join(ROOT, "dist/styles-v3-legacy.css")),
);
const v3legacy = readDist("styles-v3-legacy.css");
assert(
  "dist/styles-v3-legacy.css uses v3 `@tailwind base;` directive",
  /@tailwind\s+base\s*;/.test(v3legacy),
);

/* ─── dist/preset-v3-legacy.{js,d.ts} ───────────────────────────────── */
assert(
  "dist/preset-v3-legacy.js still ships for tailwindcss@^3 consumers",
  existsSync(join(ROOT, "dist/preset-v3-legacy.js")),
);
assert(
  "dist/preset-v3-legacy.d.ts ships alongside",
  existsSync(join(ROOT, "dist/preset-v3-legacy.d.ts")),
);

/* ─── package.json#exports ──────────────────────────────────────────── */
interface PkgExports {
  exports: Record<string, unknown>;
}
const pkg = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf-8")) as PkgExports;
assert(
  "package.json#exports `./preset` points to CSS (not JS)",
  pkg.exports["./preset"] === "./dist/preset.css",
);
assert(
  "package.json#exports `./preset.css` points to CSS file",
  pkg.exports["./preset.css"] === "./dist/preset.css",
);
assert(
  "package.json#exports `./tokens-v4.css` registered",
  pkg.exports["./tokens-v4.css"] === "./dist/tokens-v4.css",
);
assert(
  "package.json#exports `./styles-v3-legacy.css` registered",
  pkg.exports["./styles-v3-legacy.css"] === "./dist/styles-v3-legacy.css",
);
const preset3Legacy = pkg.exports["./preset-v3-legacy"] as
  | {
      types?: string;
      import?: string;
    }
  | undefined;
assert(
  "package.json#exports `./preset-v3-legacy` resolves to JS + d.ts",
  preset3Legacy?.import === "./dist/preset-v3-legacy.js" &&
    preset3Legacy?.types === "./dist/preset-v3-legacy.d.ts",
);

/* ─── Report ─────────────────────────────────────────────────────────── */
let passed = 0;
let failed = 0;
for (const c of checks) {
  if (c.result) {
    passed++;
    process.stdout.write(`  ✓  ${c.label}\n`);
  } else {
    failed++;
    process.stdout.write(`  ✗  ${c.label}\n`);
    if (c.detail) process.stdout.write(`     ${c.detail}\n`);
  }
}

process.stdout.write(`\nDogfood v4 zero-config — ${passed}/${checks.length} passed\n`);
if (failed > 0) {
  process.stdout.write(`${failed} check(s) failed.\n`);
  process.exit(1);
}
