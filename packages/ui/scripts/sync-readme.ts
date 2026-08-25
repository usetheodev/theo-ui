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

import { execFile as execFileCb } from "node:child_process";
import { existsSync } from "node:fs";
import { readFile, readdir, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const execFile = promisify(execFileCb);

const writeStdout = (message: string): void => {
  process.stdout.write(`${message}\n`);
};

interface Counts {
  primitives: number;
  composites: number;
  components: number;
  tests: number;
  registryItems: number;
  screens: number;
}

async function countTests(): Promise<number> {
  // The number vitest itself reports, obtained WITHOUT running the suite.
  //
  // This used to be a regex sweep over `src/**/*.test.*` counting `it(` and `test(`
  // literals, whose comment claimed it "matches `Tests N passed` within +/-1". Measured
  // on 2026-08-21 it produced 1201 against an actual 1486 — off by 285, or 19%, and the
  // README badge published the wrong figure. Two independent reasons:
  //
  //   1. It walked `src` only. `vitest.config.ts` includes `src`, `scripts` AND `tests`,
  //      so 143 real tests were never in scope. Same blind spot `lint:ci` had.
  //   2. `it.each([...])` registers one test per row. A regex counts the call site once,
  //      so every table-driven suite was undercounted no matter which roots it walked.
  //
  // (2) is not fixable by widening the glob — a static counter cannot know a table's
  // length without evaluating it. `vitest list` collects the suite and prints what would
  // run, which is the same enumeration the reporter counts, at roughly the cost of a
  // transform pass rather than a full run.
  const bin = join(ROOT, "node_modules/.bin/vitest");
  if (!existsSync(bin)) {
    // Never `npx`: invoked outside the project it resolves a DIFFERENT vitest, or exits
    // 0 having enumerated nothing, and the badge silently publishes that.
    throw new Error(
      `cannot count tests: ${bin} is missing. Run \`pnpm install\` before \`pnpm sync:readme\`.`,
    );
  }
  const { stdout } = await execFile(bin, ["list", "--json"], {
    cwd: ROOT,
    maxBuffer: 32 * 1024 * 1024,
  });
  const listed = JSON.parse(stdout) as unknown;
  if (!Array.isArray(listed)) {
    throw new Error("cannot count tests: `vitest list --json` did not return an array");
  }
  // Fail on zero rather than publish it. A collection error, a broken config or a glob
  // that matches nothing all surface here as an empty list, and a badge reading
  // "0 passing" is the failure this gate exists to prevent.
  if (listed.length === 0) {
    throw new Error(
      "cannot count tests: `vitest list --json` enumerated 0 tests. Check `include` in vitest.config.ts.",
    );
  }
  return listed.length;
}

async function countScreensInner(): Promise<number> {
  const screensDir = join(ROOT, "src/screens");
  if (!existsSync(screensDir)) return 0;
  return (await readdir(screensDir)).filter((f) => f.endsWith(".stories.tsx")).length;
}

async function gatherCounts(): Promise<Counts> {
  // Counts are derived from named exports in src/index.ts (the public API
  // surface), NOT from directory counts. This keeps every published number
  // — README badges, welcome STATS, architecture.md census — consistent
  // with what a consumer sees on the import side. The two differ when a
  // single directory exports multiple components (e.g. `scroll-area`
  // exports both `ScrollArea` and `ScrollBar`).
  const { primitives: primList, composites: compList } = await parseIndexExports();
  const primitives = primList.length;
  const composites = compList.length;
  const tests = await countTests();
  const registryDir = join(ROOT, "registry/r");
  const registryItems = existsSync(registryDir)
    ? (await readdir(registryDir)).filter((f) => f.endsWith(".json")).length
    : 0;
  const screens = await countScreensInner();
  return {
    primitives,
    composites,
    components: primitives + composites,
    tests,
    registryItems,
    screens,
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
/**
 * Pure parser — extracted from `parseIndexExports` so it can be unit-tested
 * without touching the filesystem (MEDIUM-013 / T6.7.5). Given the verbatim
 * content of `src/index.ts`, returns the named value exports grouped by
 * layer (primitives vs composites).
 */
export function parseExportsFromIndex(indexContent: string): {
  primitives: string[];
  composites: string[];
} {
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

async function parseIndexExports(): Promise<{ primitives: string[]; composites: string[] }> {
  const indexContent = await readFile(join(ROOT, "src/index.ts"), "utf-8");
  return parseExportsFromIndex(indexContent);
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

function renderArchitectureList(names: string[]): string {
  return names.map((n) => `\`${n}\``).join(", ");
}

function renderWelcomeStatsModule(counts: Counts): string {
  return `// GENERATED by scripts/sync-readme.ts — DO NOT EDIT BY HAND.
//
// All public-facing counts displayed in the welcome story are derived from
// src/index.ts named exports + registry/r/*.json on disk. To regenerate:
//
//   pnpm sync:readme
//
// The validateCountConsistency quality gate fails the build if these numbers
// drift from the source-of-truth.

export interface WelcomeStats {
  primitives: number;
  composites: number;
  components: number;
  themes: number;
  screens: number;
  registryItems: number;
  tests: number;
}

export const STATS: WelcomeStats = {
  primitives: ${counts.primitives},
  composites: ${counts.composites},
  components: ${counts.components},
  themes: 3,
  screens: ${counts.screens},
  registryItems: ${counts.registryItems},
  tests: ${counts.tests},
};
`;
}

async function main(): Promise<void> {
  // 1. STAGE — compute everything in memory before writing anything to disk.
  //    This keeps the operation atomic: if any read or compute step fails,
  //    no half-updated files are left in the working tree.
  const counts = await gatherCounts();
  const { primitives, composites } = await parseIndexExports();

  // README updates
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
  // The prose under "Production" repeats two of the same numbers, and `quality:structure` checks
  // it as well as the badge. While it sat outside a region this script fixed the badge and left
  // the sentence stale, so the gate still failed after running the script its own message names —
  // and it failed on the release pull request, which is an expensive place to find a one-word
  // edit (usetheokit/theokit-ui#86).
  readme = replaceRegion(
    readme,
    "production-stats",
    `- **Production.** ${String(counts.components)} components, ${String(counts.tests)} tests passing, zero a11y violations across the axe sweep over every story, bundle size enforced. Quality gates run on every PR.`,
  );
  readme = replaceRegion(
    readme,
    "component-catalog-intro",
    `**${counts.components} components**, organized by mechanical rule: a *primitive* imports no other \`@theokit/ui\` component; a *composite* does.`,
  );

  // architecture.md census updates
  const archPath = join(ROOT, "wiki/registry/component-census.md");
  let architecture = await readFile(archPath, "utf-8");
  architecture = replaceRegion(
    architecture,
    "primitives-census",
    `### Primitives (${primitives.length})`,
  );
  architecture = replaceRegion(architecture, "primitives-list", renderArchitectureList(primitives));
  architecture = replaceRegion(
    architecture,
    "composites-census",
    `### Composites (${composites.length})`,
  );
  architecture = replaceRegion(architecture, "composites-list", renderArchitectureList(composites));

  // welcome stats module
  const welcomeStats = renderWelcomeStatsModule(counts);

  /**
   * llms.txt — the published version line.
   *
   * That file calls itself the project's factual ground truth, and its version had drifted two
   * minors behind before anyone noticed (usetheokit/theokit-ui#73). A number that a human has to
   * remember to update at release time is a number that goes stale; deriving it here removes the
   * remembering. `scripts/llms-txt.test.ts` fails if the two ever disagree again.
   */
  const llmsPath = join(ROOT, "llms.txt");
  const { version } = JSON.parse(await readFile(join(ROOT, "package.json"), "utf-8")) as {
    version: string;
  };
  let llms = await readFile(llmsPath, "utf-8");
  const versionLine = /^- \*\*Current version:\*\* `[^`]+`/m;
  if (!versionLine.test(llms)) {
    throw new Error("llms.txt: `- **Current version:** `x.y.z`` line not found");
  }
  llms = llms.replace(versionLine, `- **Current version:** \`${version}\``);

  // 2. COMMIT — write all three files. We do this last so that compute failures
  //    in step 1 leave the working tree untouched.
  await writeFile(join(ROOT, "README.md"), readme);
  await writeFile(archPath, architecture);
  // Generated output lives outside `src/` so it does not enter the npm
  // tarball when consumers install the lib (HIGH-003 / T3.3).
  await writeFile(join(ROOT, ".ladle/generated/welcome.stats.ts"), welcomeStats);
  await writeFile(llmsPath, llms);

  writeStdout(
    `synced README.md + component-census.md + .ladle/generated/welcome.stats.ts + llms.txt: ${counts.components} components (${counts.primitives}P + ${counts.composites}C), ${counts.tests} tests, ${counts.registryItems} registry items, ${counts.screens} screens`,
  );
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
