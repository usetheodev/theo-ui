#!/usr/bin/env tsx
/**
 * Build registry assets for shadcn-compatible distribution.
 *
 * Reads registry/<item>.json descriptors and the source files they reference,
 * emits registry/r/<item>.json containing the inlined file contents in the
 * shape that `npx shadcn add <url>` expects.
 *
 * The CLI consumer points shadcn at a URL serving registry/r/<name>.json.
 * Functional URL (live on every push to main via deploy-registry.yml):
 *   npx shadcn@latest add https://usetheodev.github.io/theo-ui/r/button.json
 * Branded URL pending DNS CNAME:
 *   npx shadcn@latest add https://ui.usetheo.dev/r/button.json
 *
 * Reference: https://ui.shadcn.com/docs/registry
 */

import { existsSync } from "node:fs";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const REGISTRY_DIR = join(ROOT, "registry");
const OUT_DIR = join(REGISTRY_DIR, "r");
const SRC_DIR = join(ROOT, "src");

const writeStdout = (message: string): void => {
  process.stdout.write(`${message}\n`);
};

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

const stripExtension = (value: string): string => value.replace(/\.(tsx|ts|jsx|js|css)$/, "");

const toPosix = (value: string): string => value.split("\\").join("/");

function consumerImportForTarget(target: string): string {
  const withoutExtension = stripExtension(toPosix(target));
  if (withoutExtension.startsWith("components/ui/")) {
    return `@/${withoutExtension}`;
  }
  if (withoutExtension.startsWith("components/blocks/")) {
    return `@/${withoutExtension}`;
  }
  if (withoutExtension.startsWith("lib/")) {
    return `@/${withoutExtension}`;
  }
  if (withoutExtension.startsWith("types/")) {
    return `@/${withoutExtension}`;
  }
  return withoutExtension.startsWith(".") ? withoutExtension : `@/${withoutExtension}`;
}

function buildSourceImportMap(descriptors: RegistryDescriptor[]): Map<string, string> {
  const map = new Map<string, string>();

  for (const descriptor of descriptors) {
    for (const file of descriptor.files) {
      if (!file.target) continue;
      const sourceKey = stripExtension(toPosix(file.path));
      const consumerImport = consumerImportForTarget(file.target);
      map.set(sourceKey, consumerImport);
      // Also register the barrel index path so composites that import via the
      // primitive's index.ts (e.g. `../../primitives/button/index.js`) rewrite
      // correctly. The barrel and the implementation file collapse to the
      // same consumer import path.
      if (/components\/(?:primitives|composites)\/[^/]+\/[^/]+$/.test(sourceKey)) {
        const dir = sourceKey.replace(/\/[^/]+$/, "");
        map.set(`${dir}/index`, consumerImport);
      }
    }
  }

  return map;
}

function rewriteRegistryImports(
  content: string,
  sourcePathFromSrc: string,
  sourceImportMap: Map<string, string>,
): string {
  const sourceDir = dirname(sourcePathFromSrc);

  return content.replace(/from\s+["']([^"']+)["']/g, (match, specifier: string) => {
    if (!specifier.startsWith(".")) return match;

    const resolvedFromSrc = stripExtension(
      toPosix(relative(SRC_DIR, resolve(SRC_DIR, sourceDir, specifier)).replace(/^\.\//, "")),
    );
    const mapped = sourceImportMap.get(resolvedFromSrc);
    if (mapped) return match.replace(specifier, mapped);

    return match.replace(specifier, stripExtension(specifier));
  });
}

async function main(): Promise<void> {
  await mkdir(OUT_DIR, { recursive: true });

  const descriptorFiles = (await readdir(REGISTRY_DIR))
    .filter((f) => f.endsWith(".json") && f !== "index.json")
    .sort();

  if (descriptorFiles.length === 0) {
    console.warn("No registry descriptors found in registry/*.json. Index will be empty.");
  }

  const descriptors = await Promise.all(
    descriptorFiles.map(async (descriptorFile) => {
      const descriptorPath = join(REGISTRY_DIR, descriptorFile);
      const descriptor = JSON.parse(await readFile(descriptorPath, "utf-8")) as RegistryDescriptor;
      return { descriptorFile, descriptor };
    }),
  );
  const sourceImportMap = buildSourceImportMap(descriptors.map(({ descriptor }) => descriptor));

  const built: BuiltRegistryItem[] = [];

  for (const { descriptorFile, descriptor } of descriptors) {
    const builtFiles: BuiltRegistryItem["files"] = [];
    for (const file of descriptor.files) {
      const sourcePath = join(SRC_DIR, file.path);
      if (!existsSync(sourcePath)) {
        throw new Error(
          `Registry descriptor ${descriptorFile} references missing file: src/${file.path}`,
        );
      }
      const sourceContent = await readFile(sourcePath, "utf-8");
      const content = rewriteRegistryImports(sourceContent, file.path, sourceImportMap);
      builtFiles.push({ ...file, content });
    }

    const item: BuiltRegistryItem = { ...descriptor, files: builtFiles };
    const outPath = join(OUT_DIR, `${descriptor.name}.json`);
    await writeFile(outPath, JSON.stringify(item, null, 2));
    built.push(item);
    writeStdout(`Built ${descriptor.name} -> registry/r/${descriptor.name}.json`);
  }

  // Update the index with the names of everything built.
  //
  // T2.3: declare the environmental precondition required by the
  // copy-paste install path. shadcn CLI consumers must have the `@/` path
  // alias mapped to `./src` in their tsconfig.json (the convention since
  // shadcn-ui 2.0). Without it, the inlined `import { cn } from "@/lib/cn"`
  // statements fail to resolve. Surfacing this in the index lets future
  // tooling check for it before attempting an install.
  const index = {
    $schema: "https://ui.shadcn.com/schema/registry.json",
    name: "theo-ui",
    homepage: "https://usetheo.dev",
    metadata: {
      requires: {
        // The shadcn-standard path alias. Consumers must have this mapped
        // in tsconfig.json#compilerOptions.paths (or jsconfig.json).
        // Standard mapping: { "@/*": ["./src/*"] }.
        tsconfigPathAlias: { "@/*": ["./src/*"] },
      },
    },
    items: built.map((item) => ({
      name: item.name,
      type: item.type,
      title: item.title ?? item.name,
      description: item.description ?? "",
    })),
  };
  await writeFile(join(REGISTRY_DIR, "index.json"), `${JSON.stringify(index, null, 2)}\n`);

  writeStdout(`\n${built.length} registry item(s) built.`);
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
