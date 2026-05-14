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

function validateGovernanceFiles(): void {
  // Implemented in T1.7 — checks LICENSE, CHANGELOG.md, README.md presence.
  for (const file of ["LICENSE", "CHANGELOG.md", "README.md"]) {
    if (!existsSync(join(ROOT, file))) fail("repo", `missing ${file}`);
  }
  const changelogPath = join(ROOT, "CHANGELOG.md");
  if (existsSync(changelogPath)) {
    const ch = readFileSync(changelogPath, "utf-8");
    if (!ch.includes("## [Unreleased]")) {
      fail("CHANGELOG.md", "must contain '## [Unreleased]' section");
    }
  }
}

function validateReadmeDrift(): void {
  // Implemented in T1.8 — fails if README mentions exports that don't exist
  // or fails to mention exports declared in src/index.ts.
  const readmePath = join(ROOT, "README.md");
  if (!existsSync(readmePath)) return;
  const indexContent = readFileSync(join(ROOT, "src/index.ts"), "utf-8");
  const readmeContent = readFileSync(readmePath, "utf-8");

  // Extract exported names from `export { A, B, type C }` lines, ignoring `type`.
  const exportedNames = new Set<string>();
  for (const match of indexContent.matchAll(/export\s+(?:type\s+)?{([^}]+)}/g)) {
    const body = match[1];
    if (!body) continue;
    for (const raw of body.split(",")) {
      const cleaned = raw
        .trim()
        .replace(/^type\s+/, "")
        .split(/\s+as\s+/)[0]
        ?.trim();
      if (cleaned && /^[A-Z][A-Za-z0-9]+$/.test(cleaned)) exportedNames.add(cleaned);
    }
  }

  // Whitelist for non-component capitalized names that legitimately appear in README.
  const whitelist = new Set([
    "Apache",
    "Vercel",
    "React",
    "Tailwind",
    "Radix",
    "Geist",
    "Sans",
    "Mono",
    "Theo",
    "AI",
    "PaaS",
    "MIT",
    "OR",
    "EMAIL",
    "DESIGN",
    "LAB",
    "Quickstart",
    "Engineered",
    "Precision",
    "Roadmap",
    "Component",
    "Components",
    "Composites",
    "Primitives",
    "Themes",
    "DESIGN.md",
    "ARCHITECTURE.md",
    "CONTRIBUTING.md",
    "CHANGELOG.md",
    "README.md",
    "Sprint",
    "Phase",
    "Card",
    "Dialog",
    "ScrollBar",
    "ScrollArea",
    "Boska",
    "Switzer",
    "JetBrains",
    "Inter",
    "Berkeley",
    "Departure",
    "Söhne",
    "Migra",
    "Monaspace",
    "Neon",
    "PP",
    "Editorial",
    "New",
    "General",
    "Industrial",
    "Aurora",
    "Terminal",
    "Furnace",
    "Console",
  ]);

  // Find capitalized words in backticks that aren't in exportedNames or whitelist.
  const ticked = new Set<string>();
  for (const match of readmeContent.matchAll(/`([A-Z][A-Za-z0-9]+)`/g)) {
    const name = match[1];
    if (name && !whitelist.has(name)) ticked.add(name);
  }

  for (const name of ticked) {
    if (!exportedNames.has(name)) {
      fail("README.md", `mentions \`${name}\` but it is not exported from src/index.ts`);
    }
  }
}

function validateDocsTypography(): void {
  // Implemented in T1.9 — fails if docs/design-system.md mentions deprecated fonts
  // outside a "Histórico" section, or doesn't mention Geist (the normative font).
  const dsPath = join(ROOT, "docs/design-system.md");
  if (!existsSync(dsPath)) return;
  const ds = readFileSync(dsPath, "utf-8");

  if (!ds.includes("Geist")) {
    fail("design-system.md", "missing normative font 'Geist' (must be cited)");
  }

  // Split at "## Histórico" or "## Alternativas consideradas" — anything before
  // these headers must not mention deprecated fonts.
  const splitMarker = /^##\s+(Histórico|Alternativas consideradas|History|Appendix)/m;
  const normativeSection = ds.split(splitMarker)[0] ?? ds;
  const deprecatedFonts = ["Boska", "Switzer", "JetBrains Mono"];
  for (const font of deprecatedFonts) {
    if (normativeSection.includes(font)) {
      fail(
        "design-system.md",
        `mentions deprecated font '${font}' in normative section (must live under '## Histórico')`,
      );
    }
  }
}

async function validateCompositeBarrel(): Promise<void> {
  // Implemented in T8.1 — fails if a composite imports a primitive via its raw
  // implementation file (e.g. ../primitives/X/X.js) instead of the barrel
  // (../primitives/X/index.js or ../primitives/X).
  const compositesRoot = join(ROOT, "src/components/composites");
  if (!existsSync(compositesRoot)) return;

  for (const name of await listDirectories(compositesRoot)) {
    const impl = join(compositesRoot, name, `${name}.tsx`);
    if (!existsSync(impl)) continue;
    const content = await readFile(impl, "utf-8");
    // Match imports of the form ../../primitives/<X>/<X>.js (i.e. NOT index.js)
    const pattern = /from\s+["']((?:\.\.\/)+primitives\/([^/]+)\/(?!index)([^"']+))["']/g;
    for (const match of content.matchAll(pattern)) {
      const importedFile = match[3];
      if (importedFile && !importedFile.startsWith("index")) {
        fail(
          `composites/${name}`,
          `imports primitive via raw file (${match[1]}); use the barrel index instead`,
        );
      }
    }
  }
}

async function main(): Promise<void> {
  if (!existsSync(join(ROOT, "docs/quality-gates.md"))) {
    fail("docs", "missing docs/quality-gates.md");
  }

  validateGovernanceFiles();
  validateReadmeDrift();
  validateDocsTypography();
  await validateCompositeBarrel();
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
