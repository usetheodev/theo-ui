#!/usr/bin/env tsx
/**
 * One-off (T6.1): append a smoke `toHaveNoViolations` assertion to test files
 * that currently don't have one. We pick the canonical render statement from
 * each primitive's existing test and reuse it inside the new `it("has no a11y
 * violations", ...)` block — so the assertion exercises whatever shape the
 * tests already prove works.
 *
 * Idempotent: re-running on a test file that already imports vitest-axe / has
 * a "no a11y violations" block is a no-op.
 *
 * Files explicitly skipped because they are non-interactive display surfaces:
 *   - skeleton, run-stats, agent-starting-state, etc. — covered by the
 *     parent composite test if any. They can still be augmented later.
 */
import { existsSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

const STDOUT = (m: string): void => {
  process.stdout.write(`${m}\n`);
};

// Primitives picked as "interactive" for the validateAxeCoverage gate.
// The list is hardcoded by design so adding a new interactive primitive is a
// conscious decision (the gate fails if coverage drops below the threshold).
const INTERACTIVE_PRIMITIVES = [
  "avatar",
  "badge",
  "card",
  "checkbox",
  "dialog",
  "empty-state",
  "form-field",
  "input",
  "radio-group",
  "scroll-area",
  "select",
  "sheet",
  "switch",
  "tabs",
  "textarea",
  "toast",
  "tooltip",
  "agent-event",
  "agent-streaming",
  "approval-card",
  "attachment-chip",
  "cron-job-card",
  "mcp-server-card",
  "permission-matrix",
  "progress-checklist",
  "quick-action-chips",
  "skill-card",
  "mention-menu",
  "model-selector",
  "audit-log-entry",
];

function alreadyCovered(content: string): boolean {
  return /toHaveNoViolations|from\s+["']vitest-axe["']|expectNoA11yViolations/.test(content);
}

function pickSampleRender(testContent: string): string | null {
  // Find the first `render(...)` argument body. We grab whatever the existing
  // tests already render — that's the most representative shape.
  const match = testContent.match(/render\(\s*([\s\S]*?)\s*\)/);
  if (!match?.[1]) return null;
  return match[1].trim();
}

function relativeImportPath(): string {
  // From src/components/primitives/<name>/<name>.test.tsx → ../../../test/a11y.js
  return "../../../test/a11y.js";
}

async function processFile(name: string): Promise<"added" | "skipped" | "missing"> {
  const testPath = join(ROOT, "src/components/primitives", name, `${name}.test.tsx`);
  if (!existsSync(testPath)) return "missing";
  const content = await readFile(testPath, "utf-8");
  if (alreadyCovered(content)) return "skipped";
  const sample = pickSampleRender(content);
  if (!sample) return "skipped";

  const importLine = `import { expectNoA11yViolations } from "${relativeImportPath()}";`;
  // Insert import after the last existing import statement.
  const lastImport = content.match(/^(?:import[\s\S]*?from\s+["'][^"']+["'];\s*)+/m);
  if (!lastImport || lastImport.index === undefined) return "skipped";
  const importEnd = lastImport.index + lastImport[0].length;

  const block = `\n  it("has no a11y violations", async () => {\n    await expectNoA11yViolations(${sample});\n  });\n`;

  // Insert block before the last `});` (closing describe).
  const closing = content.lastIndexOf("});");
  if (closing === -1) return "skipped";

  const next = `${
    content.slice(0, importEnd) + importLine
  }\n${content.slice(importEnd, closing)}${block}${content.slice(closing)}`;

  await writeFile(testPath, next);
  return "added";
}

async function main(): Promise<void> {
  let added = 0;
  let skipped = 0;
  const missing: string[] = [];
  for (const name of INTERACTIVE_PRIMITIVES) {
    const result = await processFile(name);
    if (result === "added") {
      added++;
      STDOUT(`+ ${name}`);
    } else if (result === "missing") {
      missing.push(name);
    } else {
      skipped++;
    }
  }
  STDOUT(`\nAdded ${added}, skipped ${skipped}.`);
  if (missing.length > 0) STDOUT(`Missing test files for: ${missing.join(", ")}`);
}

main().catch((err: unknown) => {
  process.stderr.write(`${String(err)}\n`);
  process.exit(1);
});
