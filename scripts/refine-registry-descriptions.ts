#!/usr/bin/env tsx
/**
 * refine-registry-descriptions — replace placeholder descriptions in registry
 * stubs with the component's JSDoc summary.
 *
 * Looks for the JSDoc block whose first line matches "Name — summary"
 * (em-dash convention). Falls back to the first JSDoc block.
 *
 * Targets entries where the description ends in
 * "backfilled registry stub. Please refine the description.".
 * Idempotent: re-running on already-refined entries is a no-op.
 */

import { existsSync } from "node:fs";
import { readFile, readdir, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const REGISTRY_DIR = join(ROOT, "registry");
const SRC_DIR = join(ROOT, "src");

const PLACEHOLDER = "backfilled registry stub";

interface ParsedDoc {
  firstLine: string;
  body: string;
}

function parseAllDocs(source: string): ParsedDoc[] {
  const docs: ParsedDoc[] = [];
  const re = /\/\*\*([\s\S]*?)\*\//g;
  let match: RegExpExecArray | null = re.exec(source);
  while (match !== null) {
    const body = match[1] ?? "";
    const lines = body
      .split("\n")
      .map((line) => line.replace(/^\s*\*\s?/, "").trim())
      .filter(Boolean);
    if (lines.length > 0) {
      docs.push({ firstLine: lines[0] ?? "", body: lines.join(" ") });
    }
    match = re.exec(source);
  }
  return docs;
}

/**
 * Pick the JSDoc that describes the component itself: its first line starts
 * with "ComponentName — ..." (em-dash). If no doc matches that convention,
 * fall back to the first doc block found.
 */
function extractComponentDoc(source: string, componentName: string): string | null {
  const docs = parseAllDocs(source);
  if (docs.length === 0) return null;

  const prefix = new RegExp(`^${componentName}\\s[—-]\\s`, "i");
  const match = docs.find((doc) => prefix.test(doc.firstLine));
  const chosen = match ?? docs[0];
  if (!chosen) return null;

  let sentence = chosen.firstLine;

  // Trim at first sentence-ending period.
  const periodEnd = sentence.match(/^(.+?[.])(\s|$)/);
  if (periodEnd?.[1]) sentence = periodEnd[1];

  // Strip the "Name — " prefix since the registry already has it via `title`.
  sentence = sentence.replace(/^[A-Z][A-Za-z0-9]*\s[—-]\s/, "");

  return sentence.trim() || null;
}

function toPascalCase(kebab: string): string {
  return kebab
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");
}

interface RegistryDescriptor {
  name: string;
  description?: string;
  files: Array<{ path: string }>;
  [key: string]: unknown;
}

async function main(): Promise<void> {
  const force = process.argv.includes("--force");
  const files = (await readdir(REGISTRY_DIR))
    .filter((file) => file.endsWith(".json") && file !== "index.json")
    .sort();

  let refined = 0;
  let skipped = 0;
  let unchanged = 0;
  const noMatch: string[] = [];

  for (const filename of files) {
    const fullPath = join(REGISTRY_DIR, filename);
    const descriptor = JSON.parse(await readFile(fullPath, "utf-8")) as RegistryDescriptor;
    if (!force && !descriptor.description?.includes(PLACEHOLDER)) {
      skipped++;
      continue;
    }
    const tsxPath = descriptor.files?.[0]?.path;
    if (!tsxPath) {
      skipped++;
      continue;
    }
    const source = join(SRC_DIR, tsxPath);
    if (!existsSync(source)) {
      skipped++;
      continue;
    }
    const content = await readFile(source, "utf-8");
    const componentName = toPascalCase(descriptor.name);
    const paragraph = extractComponentDoc(content, componentName);
    if (!paragraph) {
      skipped++;
      noMatch.push(descriptor.name);
      continue;
    }
    if (descriptor.description === paragraph) {
      unchanged++;
      continue;
    }
    descriptor.description = paragraph;
    await writeFile(fullPath, `${JSON.stringify(descriptor, null, 2)}\n`);
    process.stdout.write(`+ ${descriptor.name}: ${paragraph}\n`);
    refined++;
  }

  process.stdout.write(`\nRefined ${refined}, unchanged ${unchanged}, skipped ${skipped}.\n`);
  if (noMatch.length > 0) {
    process.stdout.write(`No JSDoc found for: ${noMatch.join(", ")}\n`);
  }
}

main().catch((err: unknown) => {
  process.stderr.write(`${String(err)}\n`);
  process.exit(1);
});
