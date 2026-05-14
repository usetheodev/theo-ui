#!/usr/bin/env tsx
import { existsSync } from "node:fs";
import { readFileSync } from "node:fs";
import { readFile, readdir } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

const writeStdout = (message: string): void => {
  process.stdout.write(`${message}\n`);
};

interface Failure {
  scope: string;
  message: string;
}

const failures: Failure[] = [];
const warnings: Failure[] = [];

const fail = (scope: string, message: string): void => {
  failures.push({ scope, message });
};

const warn = (scope: string, message: string): void => {
  warnings.push({ scope, message });
};

const listDirectories = async (path: string): Promise<string[]> =>
  (await readdir(path, { withFileTypes: true }))
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();

const readJson = async <T>(path: string): Promise<T> =>
  JSON.parse(await readFile(path, "utf-8")) as T;

const hasImportFromTheoComponent = (content: string): boolean =>
  /from\s+["'](?:\.\.\/)+(?:primitives|composites)\//.test(content) ||
  /from\s+["'](?:\.\.\/)+components\/(?:primitives|composites)\//.test(content);

async function validateComponentStructure(): Promise<void> {
  for (const layer of ["primitives", "composites"] as const) {
    const layerRoot = join(ROOT, "src/components", layer);
    for (const name of await listDirectories(layerRoot)) {
      const dir = join(layerRoot, name);
      const implementation = join(dir, `${name}.tsx`);
      const index = join(dir, "index.ts");

      if (!existsSync(implementation)) fail(`${layer}/${name}`, `missing ${name}.tsx`);
      if (!existsSync(index)) fail(`${layer}/${name}`, "missing index.ts");

      if (existsSync(implementation)) {
        const content = await readFile(implementation, "utf-8");
        if (layer === "primitives" && hasImportFromTheoComponent(content)) {
          fail(`${layer}/${name}`, "primitive imports another Theo component");
        }
        if (layer === "composites" && /from\s+["'](?:\.\.\/)+screens\//.test(content)) {
          fail(`${layer}/${name}`, "composite imports a screen");
        }
      }
    }
  }
}

async function validateRegistryStoriesAndTests(): Promise<void> {
  const descriptorFiles = (await readdir(join(ROOT, "registry")))
    .filter((file) => file.endsWith(".json") && file !== "index.json")
    .sort();

  for (const descriptorFile of descriptorFiles) {
    const descriptor = await readJson<{
      name: string;
      type: string;
      files: Array<{ path: string }>;
    }>(join(ROOT, "registry", descriptorFile));

    if (!["registry:ui", "registry:block"].includes(descriptor.type)) continue;

    for (const file of descriptor.files) {
      if (!file.path.startsWith("components/")) continue;
      const dir = join(ROOT, "src", dirname(file.path));
      const base = descriptor.name;
      if (!existsSync(join(dir, `${base}.test.tsx`))) {
        // Test coverage is a soft requirement during the test-backfill
        // phase. Stories remain hard-required for documentation parity.
        warn(descriptor.name, `registry item is missing ${base}.test.tsx`);
      }
      if (!existsSync(join(dir, `${base}.stories.tsx`))) {
        fail(descriptor.name, `registry item is missing ${base}.stories.tsx`);
      }
    }
  }
}

async function validatePublicExports(): Promise<void> {
  const indexContent = await readFile(join(ROOT, "src/index.ts"), "utf-8");
  const executableIndexContent = indexContent
    .split("\n")
    .filter((line) => !line.trimStart().startsWith("//"))
    .join("\n");
  if (/components\/(?!primitives|composites)/.test(executableIndexContent)) {
    fail("src/index.ts", "exports from legacy src/components/* paths");
  }

  const publicComponentExports = Array.from(
    indexContent.matchAll(/\.\/components\/(primitives|composites)\/([^/]+)\/index\.js/g),
  ).map((match) => ({ layer: match[1], name: match[2] }));

  for (const item of publicComponentExports) {
    if (!item.layer || !item.name) continue;
    const expected = join(ROOT, "src/components", item.layer, item.name, "index.ts");
    if (!existsSync(expected)) {
      fail("src/index.ts", `exports missing component ${item.layer}/${item.name}`);
    }
  }
}

function validateDesignSystemFidelity(): void {
  const tokens = readFileSync(join(ROOT, "src/styles/tokens.css"), "utf-8");
  const theme = readFileSync(join(ROOT, "src/themes/violet-forge.ts"), "utf-8");
  const tailwind = readFileSync(join(ROOT, "tailwind.config.ts"), "utf-8");

  /* Normative fonts for the Violet Forge identity (Geist Sans + Geist Mono,
   * Vercel-inspired). Decided 2026-05-13 — see docs/design-system.md and the
   * "Vercel-style typescale" sprint. The previous Boska/Switzer direction was
   * replaced because users reported it was hard to read at body sizes. */
  for (const font of ["Geist", "Geist Mono"]) {
    if (!tokens.includes(font)) fail("tokens.css", `missing normative font ${font}`);
    if (!theme.includes(font)) fail("violet-forge.ts", `missing normative font ${font}`);
  }

  /* Vercel-inspired type scale — aggressive negative tracking at display sizes,
   * 3 strict weights (400 body / 500 UI / 600 display). Source of truth lives
   * in tailwind.config.ts; this gate prevents accidental drift. */
  const requiredTypeScale = [
    '"display-2xl": ["64px"',
    '"display-xl": ["48px"',
    '"display-lg": ["40px"',
    '"display-md": ["32px"',
    'headline: ["28px"',
    '"title-lg": ["24px"',
    '"title-md": ["20px"',
    '"body-lg": ["18px"',
    '"body-md": ["15px"',
  ];
  for (const token of requiredTypeScale) {
    if (!tailwind.includes(token)) fail("tailwind.config.ts", `type scale drift: missing ${token}`);
  }
}

function validateScriptsAndCi(): void {
  const packageJson = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf-8")) as {
    scripts?: Record<string, string>;
  };
  const requiredScripts = [
    "format:check",
    "registry:build",
    "registry:validate",
    "quality:structure",
    "quality:gates",
    "ladle:build",
  ];

  for (const script of requiredScripts) {
    if (!packageJson.scripts?.[script]) fail("package.json", `missing script ${script}`);
  }

  const ciPath = join(ROOT, ".github/workflows/quality-gates.yml");
  if (!existsSync(ciPath)) {
    fail(".github/workflows", "missing quality-gates.yml");
  }
}

async function main(): Promise<void> {
  if (!existsSync(join(ROOT, "docs/quality-gates.md"))) {
    fail("docs", "missing docs/quality-gates.md");
  }

  await validateComponentStructure();
  await validateRegistryStoriesAndTests();
  await validatePublicExports();
  validateDesignSystemFidelity();
  validateScriptsAndCi();

  if (warnings.length > 0) {
    writeStdout(`Quality gate warnings (${warnings.length}):`);
    for (const warning of warnings) {
      writeStdout(`- ${warning.scope}: ${warning.message}`);
    }
    writeStdout("");
  }

  if (failures.length > 0) {
    console.error("Quality gate validation failed:");
    for (const failure of failures) {
      console.error(`- ${failure.scope}: ${failure.message}`);
    }
    process.exit(1);
  }

  writeStdout(
    `Quality gate structure validation passed${
      warnings.length > 0 ? ` (with ${warnings.length} warning(s))` : ""
    }.`,
  );
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
