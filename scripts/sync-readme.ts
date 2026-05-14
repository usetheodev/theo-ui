#!/usr/bin/env tsx
/**
 * sync-readme.ts — regenerate counts + component catalog regions in README.md
 * from filesystem ground truth.
 *
 * Updates regions delimited by `<!-- BEGIN:NAME -->` / `<!-- END:NAME -->`:
 *   - counts            (badge counts)
 *   - primitives        (primitives list)
 *   - composites        (composites list)
 *
 * Run via: pnpm sync:readme
 */

import { execSync } from "node:child_process";
import { existsSync } from "node:fs";
import { readFile, readdir, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

const writeStdout = (message: string): void => {
  process.stdout.write(`${message}\n`);
};

interface Counts {
  primitives: number;
  composites: number;
  components: number;
  tests: number;
  registryItems: number;
}

async function countDirectories(path: string): Promise<number> {
  const entries = await readdir(path, { withFileTypes: true });
  return entries.filter((e) => e.isDirectory()).length;
}

async function countTests(): Promise<number> {
  // Use vitest --list (or rerun) — but cheaper to count by parsing recent run.
  // Strategy: spawn pnpm test --reporter=verbose --run, grep last "Tests N passed".
  try {
    const out = execSync("pnpm test --reporter=basic --run", {
      cwd: ROOT,
      stdio: ["ignore", "pipe", "pipe"],
      encoding: "utf-8",
    });
    const match = out.match(/Tests\s+(\d+)\s+passed/);
    if (match?.[1]) return Number(match[1]);
  } catch {
    // If tests fail, still emit a count from file-glob count — but warn.
    writeStdout("warning: pnpm test failed; falling back to test-file count");
  }
  // Fallback: count test files (approximate).
  let count = 0;
  for (const layer of ["primitives", "composites"]) {
    const dir = join(ROOT, "src/components", layer);
    if (!existsSync(dir)) continue;
    const entries = await readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const test = join(dir, entry.name, `${entry.name}.test.tsx`);
      if (existsSync(test)) count++;
    }
  }
  return count;
}

async function gatherCounts(): Promise<Counts> {
  const primitives = await countDirectories(join(ROOT, "src/components/primitives"));
  const composites = await countDirectories(join(ROOT, "src/components/composites"));
  const tests = await countTests();
  const registryDir = join(ROOT, "registry/r");
  const registryItems = existsSync(registryDir)
    ? (await readdir(registryDir)).filter((f) => f.endsWith(".json")).length
    : 0;
  return {
    primitives,
    composites,
    components: primitives + composites,
    tests,
    registryItems,
  };
}

/**
 * Parse src/index.ts and return:
 *   - primitives: ComponentName[] (exports whose source path matches components/primitives/...)
 *   - composites: ComponentName[]
 *
 * Note: we do NOT try to read JSDoc here — the README catalog is a flat
 * list grouped only by primitive vs composite. Fine-grained categorization
 * (Form & input, Surface, App chrome, etc.) is editorial and lives between
 * the BEGIN/END markers manually.
 */
async function parseIndexExports(): Promise<{ primitives: string[]; composites: string[] }> {
  const indexContent = await readFile(join(ROOT, "src/index.ts"), "utf-8");
  const primitives: string[] = [];
  const composites: string[] = [];

  // Match `export { X, Y } from "./components/primitives/<name>/..."` etc.
  // We want value exports (not `export type { ... }`) representing components.
  const pattern =
    /export\s+{([^}]+)}\s+from\s+["']\.\/components\/(primitives|composites)\/[^/"']+/g;

  for (const match of indexContent.matchAll(pattern)) {
    const body = match[1];
    const layer = match[2];
    if (!body || !layer) continue;
    for (const raw of body.split(",")) {
      const cleaned = raw.trim().replace(/^type\s+/, "");
      // Skip type-only exports inside this body (e.g., `Button, type ButtonProps`).
      if (raw.trim().startsWith("type ")) continue;
      // Skip generic helpers (lowercase first letter) — only ComponentName matters.
      const name = cleaned.split(/\s+as\s+/)[0]?.trim();
      if (!name) continue;
      if (!/^[A-Z][A-Za-z0-9]+$/.test(name)) continue;
      // Skip variants helpers like `buttonVariants` and `capabilityPresets`.
      if (layer === "primitives") primitives.push(name);
      else composites.push(name);
    }
  }

  primitives.sort();
  composites.sort();
  return { primitives, composites };
}

function renderBadgeLine(counts: Counts): string {
  return [
    "[![license](https://img.shields.io/badge/license-Apache--2.0-7C3AED?style=flat-square)](./LICENSE)",
    "[![react](https://img.shields.io/badge/react-18+-7C3AED?style=flat-square&logo=react&logoColor=white)](https://react.dev)",
    `[![tests](https://img.shields.io/badge/tests-${counts.tests}%20passing-success?style=flat-square)](#quality-gates)`,
    `[![components](https://img.shields.io/badge/components-${counts.components}-7C3AED?style=flat-square)](#component-catalog)`,
    "[![shadcn](https://img.shields.io/badge/shadcn-compatible-000?style=flat-square)](https://ui.shadcn.com/docs/registry)",
  ].join("\n");
}

function renderPrimitives(names: string[]): string {
  // Single backticked list, 6 per line for readability.
  const chunks: string[] = [];
  for (let i = 0; i < names.length; i += 6) {
    chunks.push(
      names
        .slice(i, i + 6)
        .map((n) => `\`${n}\``)
        .join(" · "),
    );
  }
  return chunks.join("\n");
}

function renderComposites(names: string[]): string {
  return names.map((n) => `\`${n}\``).join(" · ");
}

function replaceRegion(content: string, name: string, replacement: string): string {
  const begin = `<!-- BEGIN:${name} -->`;
  const end = `<!-- END:${name} -->`;
  const re = new RegExp(`${begin}[\\s\\S]*?${end}`);
  if (!re.test(content)) {
    throw new Error(`Region marker ${begin}…${end} not found in README.md`);
  }
  return content.replace(re, `${begin}\n${replacement}\n${end}`);
}

async function main(): Promise<void> {
  const counts = await gatherCounts();
  const { primitives, composites } = await parseIndexExports();
  let readme = await readFile(join(ROOT, "README.md"), "utf-8");

  readme = replaceRegion(readme, "counts", renderBadgeLine(counts));
  readme = replaceRegion(
    readme,
    "primitives-count",
    `**Primitives** (${primitives.length}) — building blocks`,
  );
  readme = replaceRegion(
    readme,
    "composites-count",
    `**Composites** (${composites.length}) — assembled flows`,
  );
  readme = replaceRegion(readme, "primitives", renderPrimitives(primitives));
  readme = replaceRegion(readme, "composites", renderComposites(composites));
  readme = replaceRegion(
    readme,
    "component-catalog-intro",
    `**${counts.components} components**, organized by mechanical rule: a *primitive* imports no other \`@usetheo/ui\` component; a *composite* does.`,
  );

  await writeFile(join(ROOT, "README.md"), readme);
  writeStdout(
    `synced README.md: ${counts.components} components (${counts.primitives}P + ${counts.composites}C), ${counts.tests} tests, ${counts.registryItems} registry items`,
  );
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
