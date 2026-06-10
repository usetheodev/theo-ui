#!/usr/bin/env tsx
/**
 * regen-subpath-exports.ts — Brief #4 (subpath tree-shaking plan).
 *
 * Runs after `tsup` and rewrites `package.json#exports` so every
 * per-component subpath (e.g. `./alert`, `./table`, `./code-block`)
 * points at its own `dist/<layer>/<name>/index.js` instead of the
 * barrel `dist/index.js`. This is what makes subpath imports
 * actually shrink consumer bundles.
 *
 * Special entries (CSS, theme files, isolated engines like
 * `./whiteboard`, `./slide`, `./slide-deck`, `./vite-plugin`,
 * `./preset-v3-legacy`) are PRESERVED verbatim from the existing
 * `package.json#exports` map.
 *
 * D5 escalation note: per-component `.d.ts` files are NOT emitted by
 * tsup (would OOM the worker pool with 114 entries). Instead, each
 * subpath entry's `types` field points at the barrel `dist/index.d.ts`
 * — TypeScript still resolves `import { Alert } from "@theokit/ui/alert"`
 * because `Alert` is exported from the barrel `.d.ts` too. The JS dist
 * (where tree-shaking actually happens) is per-component and correct.
 */
import { execSync } from "node:child_process";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const pkgPath = "package.json";
const ROOT = process.cwd();
type ExportEntry = string | { types?: string; import?: string };
interface Pkg {
  exports: Record<string, ExportEntry>;
  [k: string]: unknown;
}
const pkg = JSON.parse(readFileSync(pkgPath, "utf-8")) as Pkg;

// Preserve these special entries verbatim (CSS, theme files, isolated
// bundles whose `dist/<name>/index.js` shape is unaffected by this plan).
const PRESERVE_KEYS = new Set<string>([
  ".",
  "./styles.css",
  "./styles-v3-legacy.css",
  "./components.css",
  "./tokens.css",
  "./tokens-v4.css",
  "./preset.css",
  "./preset",
  "./fonts.css",
  "./fonts-cdn.css",
  "./slide/themes/default.css",
  "./slide/themes/violet-forge.css",
  "./whiteboard",
  "./slide",
  "./slide/plugins/shiki",
  "./slide/plugins/math",
  "./slide/plugins/mermaid",
  "./slide/plugins/emoji",
  "./slide-deck",
  "./vite-plugin",
  "./preset-v3-legacy",
]);

// Auto-glob exclude list — matches tsup.config.ts. These components
// have explicit manual entries above (isolated bundles).
const EXCLUDE = new Set<string>(["whiteboard", "slide", "slide-deck"]);

const oldExports = pkg.exports;
const newExports: Record<string, ExportEntry> = {};

// Step 1: preserve special entries verbatim.
for (const k of PRESERVE_KEYS) {
  const v = oldExports[k];
  if (v !== undefined) newExports[k] = v;
}

// Step 2: emit one entry per per-component dist file. Types point at
// the barrel (per D5 escalation) because per-component .d.ts files
// are not emitted by tsup.
for (const layer of ["primitives", "composites"] as const) {
  const base = `dist/${layer}`;
  try {
    for (const dirent of readdirSync(base, { withFileTypes: true })) {
      if (!dirent.isDirectory()) continue;
      const jsFile = join(base, dirent.name, "index.js");
      try {
        statSync(jsFile);
      } catch {
        continue; // partial build — caught by step 3.5 below
      }
      const key = `./${dirent.name}`;
      newExports[key] = {
        types: "./dist/index.d.ts", // D5 escalation — types via barrel
        import: `./dist/${layer}/${dirent.name}/index.js`,
      };
    }
  } catch (e) {
    console.warn(`Skipping ${base}: ${(e as Error).message}`);
  }
}

// Step 3: validate — no entry (except the root ".") points at
// `./dist/index.js`. This is the permanent guard against the cosmetic-
// subpath defect coming back.
const stragglers = Object.entries(newExports).filter(([k, v]) => {
  if (k === ".") return false;
  if (typeof v !== "object" || v === null) return false;
  return v.import === "./dist/index.js";
});
if (stragglers.length > 0) {
  console.error(
    `regen-subpath-exports: ${stragglers.length} entries still point at the barrel:`,
    stragglers.map(([k]) => k),
  );
  process.exit(1);
}

// Step 3.5 (EC-2 fix): silent-skip guard. Compare source folders
// against emitted entries. If tsup emitted a partial build, step 2
// above silently skipped that folder. That would leave the consumer
// with `import { X } from "@theokit/ui/x"` returning
// ERR_PACKAGE_PATH_NOT_EXPORTED at runtime. Fail loud here.
const expectedSlugs = new Set<string>();
for (const layer of ["primitives", "composites"] as const) {
  for (const d of readdirSync(`src/components/${layer}`, { withFileTypes: true })) {
    if (d.isDirectory() && !EXCLUDE.has(d.name)) expectedSlugs.add(d.name);
  }
}
const gotSlugs = new Set(
  Object.keys(newExports)
    .filter((k) => k.startsWith("./") && !PRESERVE_KEYS.has(k))
    .map((k) => k.slice(2)),
);
const missing = [...expectedSlugs].filter((s) => !gotSlugs.has(s));
if (missing.length > 0) {
  console.error(
    `regen-subpath-exports: ${missing.length} components missing dist entries (partial build?):`,
    missing.sort(),
  );
  process.exit(1);
}

// Step 4: persist via `pnpm sync:exports`, which is the SINGLE source of truth
// for ordering (BASE → sorted components → ISOLATED) and post-formats via
// biome so the layout matches the `pnpm format:check` gate. Calling sync:exports
// here also re-derives entries from `src/index.ts`, which is the canonical set
// the structural validator (`quality:structure`) compares against — so a build
// can never leave the file in a state the validator would reject.
try {
  execSync("pnpm exec tsx scripts/sync-exports.ts", {
    cwd: ROOT,
    stdio: "ignore",
  });
} catch (err) {
  console.error("regen-subpath-exports: sync-exports failed", err);
  process.exit(1);
}
console.log(`regen-subpath-exports: wrote ${Object.keys(newExports).length} entries.`);
