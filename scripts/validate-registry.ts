#!/usr/bin/env tsx
import { existsSync } from "node:fs";
import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const REGISTRY_DIR = join(ROOT, "registry");
const OUT_DIR = join(REGISTRY_DIR, "r");
const SRC_DIR = join(ROOT, "src");

const writeStdout = (message: string): void => {
  process.stdout.write(`${message}\n`);
};

type RegistryType =
  | "registry:component"
  | "registry:lib"
  | "registry:hook"
  | "registry:ui"
  | "registry:block";

interface RegistryFile {
  path: string;
  type: RegistryType;
  target?: string;
  content?: string;
}

interface RegistryDescriptor {
  $schema?: string;
  name: string;
  type: RegistryType;
  title?: string;
  description?: string;
  dependencies?: string[];
  devDependencies?: string[];
  registryDependencies?: string[];
  files: RegistryFile[];
  cssVars?: Record<string, Record<string, string>>;
}

interface Failure {
  file: string;
  message: string;
}

const failures: Failure[] = [];

const addFailure = (file: string, message: string): void => {
  failures.push({ file, message });
};

const readJson = async <T>(path: string): Promise<T> =>
  JSON.parse(await readFile(path, "utf-8")) as T;

const stripExtension = (value: string): string => value.replace(/\.(tsx|ts|jsx|js|css)$/, "");

const importSpecifiers = (content: string): string[] => {
  const specs: string[] = [];
  const patterns = [/from\s+["']([^"']+)["']/g, /import\s+["']([^"']+)["']/g];

  for (const pattern of patterns) {
    let match: RegExpExecArray | null;
    match = pattern.exec(content);
    while (match !== null) {
      if (match[1]) specs.push(match[1]);
      match = pattern.exec(content);
    }
  }

  return specs;
};

const registryNameFromTarget = (specifier: string): string | undefined => {
  if (specifier.startsWith("@/components/ui/")) return specifier.replace("@/components/ui/", "");
  if (specifier.startsWith("@/components/blocks/"))
    return specifier.replace("@/components/blocks/", "");
  if (specifier === "@/lib/cn") return "cn";
  if (specifier === "@/lib/types") return "types";
  return undefined;
};

async function copyBuiltItemIntoFixture(
  item: RegistryDescriptor,
  fixtureRoot: string,
): Promise<void> {
  for (const file of item.files) {
    if (!file.target || !file.content) continue;
    const targetPath = join(fixtureRoot, file.target);
    await mkdir(dirname(targetPath), { recursive: true });
    await writeFile(targetPath, file.content);
  }
}

async function main(): Promise<void> {
  const descriptorFiles = (await readdir(REGISTRY_DIR))
    .filter((file) => file.endsWith(".json") && file !== "index.json")
    .sort();

  const descriptors = new Map<string, RegistryDescriptor>();
  for (const descriptorFile of descriptorFiles) {
    const descriptorPath = join(REGISTRY_DIR, descriptorFile);
    const descriptor = await readJson<RegistryDescriptor>(descriptorPath);
    descriptors.set(descriptor.name, descriptor);

    if (!descriptor.$schema?.includes("registry-item.json")) {
      addFailure(descriptorFile, "must declare the shadcn registry item schema");
    }
    if (!/^[a-z0-9][a-z0-9-]*$/.test(descriptor.name)) {
      addFailure(descriptorFile, `invalid registry item name "${descriptor.name}"`);
    }
    if (!descriptor.title || !descriptor.description) {
      addFailure(descriptorFile, "must include title and description");
    }
    if (!Array.isArray(descriptor.files) || descriptor.files.length === 0) {
      addFailure(descriptorFile, "must include at least one file");
    }

    for (const file of descriptor.files ?? []) {
      const sourcePath = join(SRC_DIR, file.path);
      if (!existsSync(sourcePath)) {
        addFailure(descriptorFile, `references missing source file src/${file.path}`);
      }
      if (!file.target) {
        addFailure(descriptorFile, `file ${file.path} must declare target`);
      }
    }
  }

  const index = await readJson<{
    items: Array<{ name: string; type: RegistryType; title: string; description: string }>;
  }>(join(REGISTRY_DIR, "index.json"));
  const indexNames = new Set(index.items.map((item) => item.name));
  for (const name of descriptors.keys()) {
    if (!indexNames.has(name)) addFailure("index.json", `missing descriptor item "${name}"`);
  }
  for (const name of indexNames) {
    if (!descriptors.has(name)) addFailure("index.json", `references missing descriptor "${name}"`);
  }

  for (const [name, descriptor] of descriptors) {
    const builtPath = join(OUT_DIR, `${name}.json`);
    if (!existsSync(builtPath)) {
      addFailure(`${name}.json`, `missing generated registry/r/${name}.json`);
      continue;
    }

    const built = await readJson<RegistryDescriptor>(builtPath);
    const dependencySet = new Set(descriptor.registryDependencies ?? []);

    for (const file of built.files) {
      if (!file.content) {
        addFailure(`registry/r/${name}.json`, `file ${file.path} is missing inlined content`);
        continue;
      }

      for (const specifier of importSpecifiers(file.content)) {
        if (specifier.startsWith("..")) {
          addFailure(
            `registry/r/${name}.json`,
            `contains consumer-unsafe relative import "${specifier}"`,
          );
        }
        if (specifier.endsWith(".js")) {
          addFailure(
            `registry/r/${name}.json`,
            `contains source ESM extension import "${specifier}"`,
          );
        }

        const dependencyName = registryNameFromTarget(stripExtension(specifier));
        if (dependencyName && dependencyName !== name && !dependencySet.has(dependencyName)) {
          addFailure(
            `${name}.json`,
            `imports ${specifier} but registryDependencies is missing "${dependencyName}"`,
          );
        }
      }
    }
  }

  const fixtureRoot = await mkdtemp(join(tmpdir(), "theo-registry-"));
  try {
    for (const descriptor of descriptors.values()) {
      const built = await readJson<RegistryDescriptor>(join(OUT_DIR, `${descriptor.name}.json`));
      await copyBuiltItemIntoFixture(built, fixtureRoot);
    }

    for (const descriptor of descriptors.values()) {
      for (const dependency of descriptor.registryDependencies ?? []) {
        if (!descriptors.has(dependency)) {
          addFailure(`${descriptor.name}.json`, `unknown registryDependency "${dependency}"`);
        }
      }
    }
  } finally {
    await rm(fixtureRoot, { recursive: true, force: true });
  }

  if (failures.length > 0) {
    console.error("Registry validation failed:");
    for (const failure of failures) {
      console.error(`- ${failure.file}: ${failure.message}`);
    }
    process.exit(1);
  }

  writeStdout(`Registry validation passed for ${descriptors.size} item(s).`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
