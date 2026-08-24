#!/usr/bin/env node
/**
 * Component inventory — walks src/components/{primitives,composites}/<name>/
 * and emits a machine-readable JSON listing each component, its kind, story
 * presence, test presence, and barrel-export status.
 *
 * Output: component-inventory.json sorted by name.
 * Consumer: scripts/generate-missing-stories.mjs (next task), CI drift gate,
 * dogfood coverage.json cross-link.
 */
import { readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

const ROOT = resolve(new URL(".", import.meta.url).pathname, "..");
const SRC = join(ROOT, "src");
const COMPONENTS_DIR = join(SRC, "components");
const BARREL_PATH = join(SRC, "index.ts");

const KIND_DIRS = ["primitives", "composites"];

function walkComponents(kindDir, kind) {
  const out = [];
  const dirPath = join(COMPONENTS_DIR, kindDir);
  let entries;
  try {
    entries = readdirSync(dirPath, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const name = entry.name;
    const dirAbs = join(dirPath, name);
    const componentFile = join(dirAbs, `${name}.tsx`);
    let componentExists = false;
    try {
      componentExists = statSync(componentFile).isFile();
    } catch {
      // Nested dirs (e.g. slide/plugins/emoji) without <dirname>.tsx are skipped
      // here but recursed into below if they have their own component files.
    }
    if (componentExists) {
      const storyFile = join(dirAbs, `${name}.stories.tsx`);
      const testFile = join(dirAbs, `${name}.test.tsx`);
      let hasStory = false;
      let hasTest = false;
      try {
        hasStory = statSync(storyFile).isFile();
      } catch {}
      try {
        hasTest = statSync(testFile).isFile();
      } catch {}
      out.push({
        name,
        path: `src/components/${kindDir}/${name}/${name}.tsx`,
        kind,
        hasStory,
        hasTest,
        exported: false, // computed below
      });
    }
    // Recurse into nested dirs (e.g. slide/plugins/emoji/emoji.tsx)
    const nested = walkNested(dirAbs, `${kindDir}/${name}`, kind);
    out.push(...nested);
  }
  return out;
}

function walkNested(dirAbs, relPrefix, kind) {
  const out = [];
  let entries;
  try {
    entries = readdirSync(dirAbs, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const nestedAbs = join(dirAbs, entry.name);
    const compFile = join(nestedAbs, `${entry.name}.tsx`);
    let componentExists = false;
    try {
      componentExists = statSync(compFile).isFile();
    } catch {}
    if (componentExists) {
      const storyFile = join(nestedAbs, `${entry.name}.stories.tsx`);
      const testFile = join(nestedAbs, `${entry.name}.test.tsx`);
      let hasStory = false;
      let hasTest = false;
      try {
        hasStory = statSync(storyFile).isFile();
      } catch {}
      try {
        hasTest = statSync(testFile).isFile();
      } catch {}
      out.push({
        name: entry.name,
        path: `src/components/${relPrefix}/${entry.name}/${entry.name}.tsx`,
        kind,
        hasStory,
        hasTest,
        exported: false,
      });
    }
    out.push(...walkNested(nestedAbs, `${relPrefix}/${entry.name}`, kind));
  }
  return out;
}

function detectExported(barrelSrc, name) {
  // Pragmatic: grep the dir name in barrel re-export paths.
  // e.g. `export ... from "./components/primitives/button";`
  const re = new RegExp(
    `['"\`]\\./components/(?:primitives|composites)[\\w/-]*/${name}(?:/|['"\`])`,
  );
  return re.test(barrelSrc);
}

function main() {
  let barrelSrc = "";
  try {
    barrelSrc = readFileSync(BARREL_PATH, "utf8");
  } catch {
    process.stderr.write(
      `[inventory] warn: barrel ${BARREL_PATH} not found; exported=false for all\n`,
    );
  }

  const all = [];
  for (const kindDir of KIND_DIRS) {
    const kind = kindDir.slice(0, -1); // primitives -> primitive, composites -> composite
    all.push(...walkComponents(kindDir, kind));
  }

  for (const c of all) c.exported = detectExported(barrelSrc, c.name);

  all.sort((a, b) => a.name.localeCompare(b.name) || a.path.localeCompare(b.path));

  const inventory = {
    version: 1,
    generatedAt: new Date().toISOString(),
    counts: {
      total: all.length,
      primitives: all.filter((c) => c.kind === "primitive").length,
      composites: all.filter((c) => c.kind === "composite").length,
      withStory: all.filter((c) => c.hasStory).length,
      withoutStory: all.filter((c) => !c.hasStory).length,
      withTest: all.filter((c) => c.hasTest).length,
      exported: all.filter((c) => c.exported).length,
    },
    components: all,
  };

  const outPath = join(ROOT, "component-inventory.json");
  writeFileSync(outPath, `${JSON.stringify(inventory, null, 2)}\n`);
  process.stdout.write(
    `[inventory] ${inventory.counts.total} components ` +
      `(${inventory.counts.withStory} stories, ${inventory.counts.withoutStory} missing) → ${outPath}\n`,
  );
}

main();
