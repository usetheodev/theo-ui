#!/usr/bin/env tsx
/**
 * Generate / validate `package.json#exports`.
 *
 * Decision history for HIGH-005:
 *
 *   Original plan (D5): emit `./<name>` subpath per component pointing at
 *   `./dist/components/<layer>/<name>/index.js`. Investigated; rejected
 *   because tsup `splitting: false` produces a single `dist/index.js`. To
 *   ship per-component dist files we would need either (a) 99-entry tsup
 *   build, multiplying tarball size and duplicating shared code, or
 *   (b) `splitting: true`, which yields opaque chunk filenames that defeat
 *   the consumer-friendliness goal. Both trade-offs are worse than the
 *   status quo: a single ESM barrel + Tailwind preset means modern bundlers
 *   (Vite, esbuild, Rollup, webpack 5, Bun) already tree-shake `Button`
 *   without touching `Dialog`.
 *
 *   Implemented decision: keep `.` as the canonical entrypoint; only emit
 *   subpaths for genuinely separable artifacts (CSS files, the Tailwind
 *   preset). Document the rationale in README "Bundle size" section.
 *
 * This script remains so `pnpm sync:exports` is idempotent and a quality
 * gate can detect drift.
 */
import { readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

interface PackageJson {
  exports?: Record<string, unknown>;
  [key: string]: unknown;
}

interface ExportEntry {
  types?: string;
  import?: string;
}

const CANONICAL_EXPORTS: Record<string, ExportEntry | string> = {
  ".": {
    types: "./dist/index.d.ts",
    import: "./dist/index.js",
  },
  "./styles.css": "./dist/styles.css",
  "./tokens.css": "./dist/tokens.css",
  "./fonts.css": "./dist/fonts.css",
  "./fonts-cdn.css": "./dist/fonts-cdn.css",
};

async function main(): Promise<void> {
  const pkgPath = join(ROOT, "package.json");
  const pkg = JSON.parse(await readFile(pkgPath, "utf-8")) as PackageJson;
  pkg.exports = CANONICAL_EXPORTS;
  await writeFile(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`);
  process.stdout.write(
    `Synced package.json#exports: ${Object.keys(CANONICAL_EXPORTS).length} canonical entries\n`,
  );
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
