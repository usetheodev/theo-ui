#!/usr/bin/env node
/**
 * Future-proofing story generator + CI gate.
 *
 * v1 discovery (T0.1 inventory): all 121 components already ship with a story
 * — coverage is 100%. This script ships as a CI guard: any new component
 * landed without a corresponding `<name>.stories.tsx` is flagged.
 *
 * Modes:
 *   --check  : exits non-zero if any component lacks a story. CI mode.
 *   --write  : emits a default story for missing components (D8).
 *
 * EC-5 (D12): kebab→Pascal name conversion + match-confirmation via grep
 * on `export\s+(?:const|function|class)\s+(<Pascal>)`. Components whose
 * Pascal-converted name does NOT match an exported symbol are listed as
 * MANUAL-REQUIRED (skipped, but reported as a soft warning).
 */
import { readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

const ROOT = resolve(new URL(".", import.meta.url).pathname, "..");
const INVENTORY = join(ROOT, "component-inventory.json");

const mode = process.argv.includes("--write")
  ? "write"
  : process.argv.includes("--check")
    ? "check"
    : "report";

export function kebabToPascal(name) {
  return name
    .split("-")
    .filter((s) => s.length > 0)
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join("");
}

function readExports(componentAbs) {
  let src = "";
  try {
    src = readFileSync(componentAbs, "utf8");
  } catch {
    return new Set();
  }
  const out = new Set();
  const reExport =
    /^export\s+(?:declare\s+)?(?:const|function|class|interface|type)\s+([A-Za-z_$][A-Za-z0-9_$]*)/gm;
  const reReExport = /^export\s+\{([^}]+)\}/gm;
  let m = reExport.exec(src);
  while (m !== null) {
    out.add(m[1]);
    m = reExport.exec(src);
  }
  m = reReExport.exec(src);
  while (m !== null) {
    for (const n of m[1].split(",")) {
      const clean = n
        .trim()
        .split(/\s+as\s+/)[0]
        .trim();
      if (clean.length > 0) out.add(clean.replace(/^type\s+/, "").trim());
    }
    m = reReExport.exec(src);
  }
  return out;
}

function storyTemplate(name, pascal, kind) {
  const titleKind = `${kind.charAt(0).toUpperCase() + kind.slice(1)}s`;
  return `import type { Story } from "@ladle/react";
import { ${pascal} } from "./${name}";

export default { title: "${titleKind}/${pascal}" };

export const Default: Story = () => <${pascal} />;
`;
}

function main() {
  let inventory;
  try {
    inventory = JSON.parse(readFileSync(INVENTORY, "utf8"));
  } catch {
    process.stderr.write(
      `[generate-missing-stories] ERROR: ${INVENTORY} not found. Run \`pnpm inventory\` first.\n`,
    );
    process.exit(2);
  }

  const missing = inventory.components.filter((c) => !c.hasStory);
  const manualRequired = [];
  const emitted = [];

  for (const c of missing) {
    const componentAbs = join(ROOT, c.path);
    const componentDir = dirname(componentAbs);
    const pascal = kebabToPascal(c.name);
    const exports = readExports(componentAbs);
    if (!exports.has(pascal)) {
      manualRequired.push({ name: c.name, expected: pascal, found: [...exports] });
      continue;
    }
    if (mode === "write") {
      const storyPath = join(componentDir, `${c.name}.stories.tsx`);
      try {
        statSync(storyPath);
      } catch {
        writeFileSync(storyPath, storyTemplate(c.name, pascal, c.kind));
        emitted.push(c.name);
      }
    }
  }

  if (mode === "check") {
    if (missing.length === 0) {
      process.stdout.write(
        `[generate-missing-stories] PASS: all ${inventory.counts.total} components have stories.\n`,
      );
      process.exit(0);
    }
    const auto = missing.length - manualRequired.length;
    process.stderr.write(
      `[generate-missing-stories] FAIL: ${missing.length} components lack stories ` +
        `(${auto} auto-emittable, ${manualRequired.length} MANUAL-REQUIRED).\n`,
    );
    for (const c of missing) process.stderr.write(`  - ${c.path}\n`);
    process.exit(1);
  }

  if (mode === "write") {
    process.stdout.write(
      `[generate-missing-stories] wrote ${emitted.length} stories; ` +
        `${manualRequired.length} MANUAL-REQUIRED (export name mismatch).\n`,
    );
    for (const m of manualRequired) {
      process.stdout.write(
        `  ⚠ ${m.name}: expected export "${m.expected}", found [${m.found.join(", ")}]\n`,
      );
    }
    process.exit(0);
  }

  // report mode (default)
  process.stdout.write(
    `[generate-missing-stories] missing=${missing.length} ` +
      `(auto=${missing.length - manualRequired.length}, manual=${manualRequired.length})\n`,
  );
}

main();
