#!/usr/bin/env tsx
/**
 * Build registry assets for shadcn-compatible distribution.
 *
 * Reads registry/<item>.json descriptors and the source files they reference,
 * emits registry/r/<item>.json containing the inlined file contents in the
 * shape that `npx shadcn add <url>` expects.
 *
 * The CLI consumer points shadcn at a URL serving registry/r/<name>.json.
 * Example (after this repo is published or served statically):
 *   npx shadcn@latest add https://ui.usetheo.dev/r/button.json
 *
 * Reference: https://ui.shadcn.com/docs/registry
 */

import { readdir, readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const REGISTRY_DIR = join(ROOT, "registry");
const OUT_DIR = join(REGISTRY_DIR, "r");
const SRC_DIR = join(ROOT, "src");

interface RegistryFile {
  path: string;
  type: "registry:component" | "registry:lib" | "registry:hook" | "registry:ui" | "registry:block";
  target?: string;
}

interface RegistryDescriptor {
  $schema?: string;
  name: string;
  type: RegistryFile["type"];
  title?: string;
  description?: string;
  dependencies?: string[];
  devDependencies?: string[];
  registryDependencies?: string[];
  files: RegistryFile[];
  tailwind?: { config?: Record<string, unknown> };
  cssVars?: Record<string, Record<string, string>>;
  meta?: Record<string, unknown>;
}

interface BuiltRegistryItem extends RegistryDescriptor {
  files: Array<RegistryFile & { content: string }>;
}

async function main(): Promise<void> {
  await mkdir(OUT_DIR, { recursive: true });

  const descriptorFiles = (await readdir(REGISTRY_DIR)).filter(
    (f) => f.endsWith(".json") && f !== "index.json",
  );

  if (descriptorFiles.length === 0) {
    console.warn("No registry descriptors found in registry/*.json. Index will be empty.");
  }

  const built: BuiltRegistryItem[] = [];

  for (const descriptorFile of descriptorFiles) {
    const descriptorPath = join(REGISTRY_DIR, descriptorFile);
    const descriptor = JSON.parse(await readFile(descriptorPath, "utf-8")) as RegistryDescriptor;

    const builtFiles: BuiltRegistryItem["files"] = [];
    for (const file of descriptor.files) {
      const sourcePath = join(SRC_DIR, file.path);
      if (!existsSync(sourcePath)) {
        throw new Error(
          `Registry descriptor ${descriptorFile} references missing file: src/${file.path}`,
        );
      }
      const content = await readFile(sourcePath, "utf-8");
      builtFiles.push({ ...file, content });
    }

    const item: BuiltRegistryItem = { ...descriptor, files: builtFiles };
    const outPath = join(OUT_DIR, `${descriptor.name}.json`);
    await writeFile(outPath, JSON.stringify(item, null, 2));
    built.push(item);
    console.log(`✓ ${descriptor.name} → registry/r/${descriptor.name}.json`);
  }

  // Update the index with the names of everything built.
  const index = {
    $schema: "https://ui.shadcn.com/schema/registry.json",
    name: "theo-ui",
    homepage: "https://usetheo.dev",
    items: built.map((item) => ({
      name: item.name,
      type: item.type,
      title: item.title ?? item.name,
      description: item.description ?? "",
    })),
  };
  await writeFile(join(REGISTRY_DIR, "index.json"), `${JSON.stringify(index, null, 2)}\n`);

  console.log(`\n${built.length} registry item(s) built.`);
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
