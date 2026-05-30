#!/usr/bin/env node
/**
 * T4.1 (dogfood-fixes-and-coverage-expansion plan) — pre-publish exports gate.
 *
 * FAANG-grade runtime validation (EC-8 fix):
 *   1. exports['.'] declared
 *   2. type:module consistency (D13 invariant)
 *   3. import condition file exists + actually imports at runtime
 *   4. require condition runtime check (ONLY if not ESM-only)
 *   5. ESM-only intentional notice (informational)
 *   6. Subpath exports TODOS validados (não só `.`)
 *
 * Bloqueia `npm publish` se shape OR comportamento regridir.
 */
import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const pkg = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf-8"));

function fail(msg) {
  console.error(`✗ FAIL: ${msg}`);
  process.exit(1);
}

function ok(msg) {
  console.log(`✓ ${msg}`);
}

// 1. exports['.'] declared
const dotExport = pkg.exports?.["."];
if (!dotExport) fail('package.json missing exports["."]');
ok('exports["."] declared');

// 2. type:module consistency (D13 invariant)
const isESMOnly = pkg.type === "module" && !dotExport.require;
const hasImportOnly = dotExport.import && !dotExport.require;
if (hasImportOnly && pkg.type !== "module") {
  fail('Inconsistent: exports["."] has import only but type !== "module" (D13 invariant)');
}
if (isESMOnly) {
  ok("package is ESM-only by design (type:module + import-only export per D13)");
}

// 3. import condition file exists + actually imports
if (dotExport.import) {
  const importPath = resolve(ROOT, dotExport.import.replace(/^\.\//, ""));
  if (!existsSync(importPath)) {
    fail(`exports["."].import points to ${dotExport.import} (file not found at ${importPath})`);
  }
  try {
    const mod = await import(pathToFileURL(importPath).href);
    if (!mod || typeof mod !== "object") {
      fail(`import("${dotExport.import}") returned ${typeof mod}, expected object`);
    }
    ok(`import("${dotExport.import}") works (${Object.keys(mod).length} exports)`);
  } catch (err) {
    fail(`import("${dotExport.import}") threw: ${err.message}`);
  }
}

// 4. require condition runtime check (ONLY if not ESM-only)
if (!isESMOnly) {
  if (!dotExport.require) {
    fail(
      `Not ESM-only (type !== "module") but exports["."].require missing — ` +
        `adicione require condition OR mude type para "module"`,
    );
  }
  const requirePath = resolve(ROOT, dotExport.require.replace(/^\.\//, ""));
  if (!existsSync(requirePath)) {
    fail(`exports["."].require points to ${dotExport.require} (file not found at ${requirePath})`);
  }
  try {
    const require_ = createRequire(import.meta.url);
    const mod = require_(pkg.name);
    if (!mod || typeof mod !== "object") {
      fail(`require("${pkg.name}") returned ${typeof mod}`);
    }
    ok(`require("${pkg.name}") works`);
  } catch (err) {
    fail(`require("${pkg.name}") threw: ${err.message}`);
  }
} else {
  ok(
    "Skip require check (ESM-only intentional — consumers using require() get ERR_PACKAGE_PATH_NOT_EXPORTED per D13)",
  );
}

// 5. Validate TODOS os subpath exports (não só `.`)
let subpathErrors = 0;
let subpathCount = 0;
for (const [subpath, def] of Object.entries(pkg.exports || {})) {
  if (subpath === ".") continue;
  subpathCount++;
  if (typeof def === "string") {
    const p = resolve(ROOT, def.replace(/^\.\//, ""));
    if (!existsSync(p)) {
      console.error(`✗ FAIL: exports["${subpath}"] → ${def} (missing at ${p})`);
      subpathErrors++;
    }
  } else if (typeof def === "object" && def !== null) {
    for (const cond of ["import", "require", "types", "default"]) {
      if (def[cond]) {
        const p = resolve(ROOT, def[cond].replace(/^\.\//, ""));
        if (!existsSync(p)) {
          console.error(`✗ FAIL: exports["${subpath}"].${cond} → ${def[cond]} (missing at ${p})`);
          subpathErrors++;
        }
      }
    }
  }
}
if (subpathErrors > 0) fail(`${subpathErrors} subpath exports broken (out of ${subpathCount})`);
ok(`All ${subpathCount} subpath exports valid`);

console.log("\n✓ ALL exports valid — safe to publish");
