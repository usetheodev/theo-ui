#!/usr/bin/env tsx
/**
 * Generate / validate `package.json#exports`.
 *
 * Strategy (T3.2 / HIGH-005):
 *
 * The package ships a single ESM barrel (`dist/index.js`). For consumer-
 * friendly subpath imports (`import { Button } from "@usetheo/ui/button"`),
 * we emit one `./<name>` entry per exported component — each pointing at
 * the same barrel + canonical type declarations. Modern bundlers (Vite,
 * esbuild, Rollup, webpack 5, Bun) tree-shake `Button` from the barrel
 * regardless of which form the consumer used.
 *
 * Why this instead of per-component bundles: tsup `splitting: false`
 * produces one `dist/index.js`. To literally split into 99 dist files we
 * would need a 99-entry build, duplicating shared code (cn, types, Radix
 * runtime) into every chunk and inflating the tarball. The subpath
 * convenience and the per-file isolation are decoupled: subpath gives
 * consumers a clean import API, tree-shaking gives them a small bundle.
 * Both are now satisfied.
 *
 * Drift detection: `validateExportsMap` compares the rendered map against
 * the live `package.json#exports`. Run `pnpm sync:exports` whenever
 * `src/index.ts` adds or removes a component export.
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

const BASE_EXPORTS: Record<string, ExportEntry | string> = {
  ".": {
    types: "./dist/index.d.ts",
    import: "./dist/index.js",
  },
  "./styles.css": "./dist/styles.css",
  "./tokens.css": "./dist/tokens.css",
  "./fonts.css": "./dist/fonts.css",
  "./fonts-cdn.css": "./dist/fonts-cdn.css",
};

/**
 * Extract `./<name>` subpaths from `src/index.ts`. We expect lines like
 * `export { X } from "./components/<layer>/<name>/index.js";` — the
 * `<name>` segment becomes the subpath identifier.
 */
function extractComponentSubpaths(indexContent: string): string[] {
  const names = new Set<string>();
  const pattern = /from\s+["']\.\/components\/(?:primitives|composites)\/([^/]+)\/index\.js["']/g;
  let match: RegExpExecArray | null;
  match = pattern.exec(indexContent);
  while (match !== null) {
    if (match[1]) names.add(match[1]);
    match = pattern.exec(indexContent);
  }
  return Array.from(names).sort();
}

function buildExports(componentSubpaths: string[]): Record<string, ExportEntry | string> {
  const map: Record<string, ExportEntry | string> = { ...BASE_EXPORTS };
  for (const name of componentSubpaths) {
    map[`./${name}`] = {
      types: "./dist/index.d.ts",
      import: "./dist/index.js",
    };
  }
  return map;
}

async function main(): Promise<void> {
  const pkgPath = join(ROOT, "package.json");
  const pkg = JSON.parse(await readFile(pkgPath, "utf-8")) as PackageJson;
  const indexContent = await readFile(join(ROOT, "src/index.ts"), "utf-8");
  const subpaths = extractComponentSubpaths(indexContent);
  const exports = buildExports(subpaths);
  pkg.exports = exports;
  await writeFile(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`);
  process.stdout.write(
    `Synced package.json#exports: ${Object.keys(exports).length} entries (${subpaths.length} component subpaths + ${Object.keys(BASE_EXPORTS).length} base entries)\n`,
  );
}

export { BASE_EXPORTS, buildExports, extractComponentSubpaths };

// Only run main when invoked as the entrypoint (CLI). Importers
// (validateExportsMap) get the pure functions without side effects.
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err: unknown) => {
    console.error(err);
    process.exit(1);
  });
}
