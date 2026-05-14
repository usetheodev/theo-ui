#!/usr/bin/env tsx
/**
 * One-shot patcher: add `tailwind-preset` to every `registry:ui` /
 * `registry:block` descriptor's `registryDependencies`. Type-only / lib items
 * (cn, types, tokens, *-types, theme-*) are skipped because they don't use
 * Tailwind utility classes.
 *
 * Idempotent — running twice produces no diff.
 *
 * Per ADR D3 (BLOCKER-002 remediation). After this script, every component
 * installed via `npx shadcn add <name>` automatically pulls the preset.
 */
import { existsSync } from "node:fs";
import { readFile, readdir, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const REGISTRY_DIR = join(ROOT, "registry");

interface RegistryDescriptor {
  name: string;
  type: string;
  registryDependencies?: string[];
  [key: string]: unknown;
}

async function main(): Promise<void> {
  const files = (await readdir(REGISTRY_DIR))
    .filter((f) => f.endsWith(".json") && f !== "index.json")
    .sort();

  let patched = 0;
  let skipped = 0;

  for (const file of files) {
    const path = join(REGISTRY_DIR, file);
    if (!existsSync(path)) continue;
    const content = await readFile(path, "utf-8");
    const descriptor = JSON.parse(content) as RegistryDescriptor;

    // Only patch registry:ui and registry:block.
    if (descriptor.type !== "registry:ui" && descriptor.type !== "registry:block") {
      skipped++;
      continue;
    }
    // The preset depends on nothing, must not depend on itself.
    if (descriptor.name === "tailwind-preset") {
      skipped++;
      continue;
    }

    const deps = new Set(descriptor.registryDependencies ?? []);
    if (deps.has("tailwind-preset")) {
      skipped++;
      continue;
    }
    deps.add("tailwind-preset");
    descriptor.registryDependencies = Array.from(deps).sort();

    await writeFile(path, `${JSON.stringify(descriptor, null, 2)}\n`);
    patched++;
  }

  process.stdout.write(`Patched ${patched} registry descriptor(s). Skipped ${skipped}.\n`);
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
