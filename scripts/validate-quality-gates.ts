#!/usr/bin/env tsx
import { execSync } from "node:child_process";
import { existsSync, readdirSync } from "node:fs";
import { readFileSync } from "node:fs";
import { readFile, readdir } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  type CompositeAdjacency,
  type LayerMembership,
  collectCompositeEdges,
  findCompositeCycles,
  findPrimitiveOffenses,
  importsScreen,
} from "./lib/import-graph.js";

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

const listDirectories = async (path: string): Promise<string[]> =>
  (await readdir(path, { withFileTypes: true }))
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();

const readJson = async <T>(path: string): Promise<T> =>
  JSON.parse(await readFile(path, "utf-8")) as T;

/**
 * Validate the mechanical taxonomy rule from `docs/architecture.md`:
 *
 *   - A primitive MUST NOT value-import another primitive (sibling).
 *   - A primitive MAY type-import another primitive (architecture.md §"Notes":
 *     "type imports across primitives/composites … don't add code at runtime").
 *   - A composite MAY import primitives via barrel; MUST NOT import screens.
 *
 * The previous implementation used the regex
 *   /from\s+["'](?:\.\.\/)+(?:primitives|composites)\//
 * which only matched specifiers containing the literal segments
 * `primitives/` or `composites/`. Sibling imports like `"../button/button.js"`
 * resolve to `src/components/primitives/button/...` but the SPECIFIER itself
 * contains no such segment, so the regex silently accepted them.
 *
 * This new implementation resolves each specifier to an absolute path and
 * checks layer membership — making the gate robust against any path scheme
 * future refactors might introduce. See `scripts/lib/import-graph.ts` for
 * the helpers and `scripts/lib/import-graph.test.ts` for the meta-tests.
 *
 * BLOCKER-001 (2026-05-14): documented in CHANGELOG `Unreleased > Fixed`.
 */
async function validateComponentStructure(): Promise<void> {
  const primitivesRoot = join(ROOT, "src/components/primitives");
  const compositesRoot = join(ROOT, "src/components/composites");
  const layers: LayerMembership = {
    primitives: new Set(existsSync(primitivesRoot) ? await listDirectories(primitivesRoot) : []),
    composites: new Set(existsSync(compositesRoot) ? await listDirectories(compositesRoot) : []),
  };

  // Architecture re-audit NEW-C: build composite-to-composite adjacency
  // alongside the per-file scan so we can detect cycles after the loop.
  const compositeAdjacency: CompositeAdjacency = new Map();

  for (const layer of ["primitives", "composites"] as const) {
    const layerRoot = join(ROOT, "src/components", layer);
    for (const name of await listDirectories(layerRoot)) {
      const dir = join(layerRoot, name);
      const implementation = join(dir, `${name}.tsx`);
      const index = join(dir, "index.ts");

      if (!existsSync(implementation)) fail(`${layer}/${name}`, `missing ${name}.tsx`);
      if (!existsSync(index)) fail(`${layer}/${name}`, "missing index.ts");

      if (!existsSync(implementation)) continue;
      const content = await readFile(implementation, "utf-8");

      if (layer === "primitives") {
        const offenses = findPrimitiveOffenses(implementation, name, content, layers);
        for (const offense of offenses) {
          fail(
            `${layer}/${name}`,
            `primitive value-imports sibling primitive "${offense.targetName}" at line ${offense.line}. Move to composites/ or split. See docs/architecture.md (taxonomy rule).`,
          );
        }
      }
      if (layer === "composites") {
        if (importsScreen(implementation, content)) {
          fail(`${layer}/${name}`, "composite imports a screen");
        }
        collectCompositeEdges(implementation, name, content, layers, compositeAdjacency);
      }
    }
  }

  // NEW-C: cycle detection across the full composite graph. The
  // architecture explicitly permits composite-to-composite imports; cycles
  // are the failure mode that documentation alone cannot guard against.
  const cycles = findCompositeCycles(compositeAdjacency);
  for (const cycle of cycles) {
    fail(
      "composites",
      `cycle detected: ${cycle.join(" → ")}. Composites may import each other but the dependency graph must remain acyclic. Break the cycle by promoting shared logic to a primitive or to src/lib/.`,
    );
  }
}

/**
 * Every `registry:ui` and `registry:block` must declare `tailwind-preset`
 * as a `registryDependency` (D3 / BLOCKER-002 remediation). Without the
 * preset, copy-paste consumers receive markup that uses utility classes
 * (`text-body-md`, `text-display-2xl`, `font-display`, …) that Tailwind
 * doesn't ship by default, so the component renders unstyled.
 *
 * The preset itself and `registry:lib` items (types, cn, tokens, theme-*)
 * are exempt.
 */
async function validateRegistryPresetDep(): Promise<void> {
  const descriptorFiles = (await readdir(join(ROOT, "registry")))
    .filter((file) => file.endsWith(".json") && file !== "index.json")
    .sort();

  for (const descriptorFile of descriptorFiles) {
    const descriptor = await readJson<{
      name: string;
      type: string;
      registryDependencies?: string[];
    }>(join(ROOT, "registry", descriptorFile));

    if (descriptor.type !== "registry:ui" && descriptor.type !== "registry:block") continue;
    if (descriptor.name === "tailwind-preset") continue;

    const deps = new Set(descriptor.registryDependencies ?? []);
    if (!deps.has("tailwind-preset")) {
      fail(
        descriptor.name,
        `registry:${descriptor.type === "registry:block" ? "block" : "ui"} item must declare \`tailwind-preset\` in registryDependencies (run \`pnpm tsx scripts/add-tailwind-preset-dep.ts\`)`,
      );
    }
  }
}

/**
 * Detect drift between `package.json#exports` and what `pnpm sync:exports`
 * would emit (HIGH-005 follow-up / T3.2). If a contributor hand-edits the
 * exports map and forgets to update `scripts/sync-exports.ts`, this gate
 * fires.
 *
 * The canonical map is computed by `buildExports` in
 * `scripts/sync-exports.ts` from `src/index.ts` exports. We import the
 * helper directly (pure function) and diff against the live package.json.
 */
async function validateExportsMap(): Promise<void> {
  const { buildExports, extractComponentSubpaths } = await import("./sync-exports.js");
  const pkg = JSON.parse(await readFile(join(ROOT, "package.json"), "utf-8")) as {
    exports?: Record<string, unknown>;
  };
  const indexContent = await readFile(join(ROOT, "src/index.ts"), "utf-8");
  const expected = buildExports(extractComponentSubpaths(indexContent));
  const actual = pkg.exports ?? {};
  const expectedJson = JSON.stringify(expected);
  const actualJson = JSON.stringify(actual);
  if (expectedJson !== actualJson) {
    fail("package.json#exports", "drifts from canonical set; run `pnpm sync:exports`.");
  }

  // T3.2 functional proof: every subpath must resolve to a file that exists
  // on disk under dist/. Without dist/ built, skip (the build gate runs
  // separately). With dist/ present, broken-symlink-like exports are caught
  // before npm publish.
  const distRoot = join(ROOT, "dist");
  if (!existsSync(distRoot)) return;
  for (const [subpath, value] of Object.entries(actual)) {
    const target =
      typeof value === "string" ? value : ((value as { import?: string }).import ?? null);
    if (!target) continue;
    if (!target.startsWith("./dist/")) continue;
    const absolute = join(ROOT, target);
    if (!existsSync(absolute)) {
      fail(
        "package.json#exports",
        `subpath "${subpath}" → "${target}" but the file does not exist on disk (run \`pnpm build\`).`,
      );
    }
  }
}

/**
 * Inspect what `npm pack` would publish and fail if forbidden artifacts
 * appear. Catches HIGH-001 regressions (re-adding `"src"` to files etc.).
 *
 * Forbidden patterns in the published tarball:
 *   - any *.test.* / *.spec.* / *.stories.* file
 *   - anything under src/screens/
 *   - referencia/ (internal exploration archive)
 *   - playground/ (live demo only)
 *   - .ladle/ (story config)
 *   - tests/ (fixture app)
 *
 * Also fails when the total size exceeds 5 MB — early signal that something
 * accidentally got added.
 */
async function validateNpmTarball(): Promise<void> {
  let pack: { files?: Array<{ path: string }>; size?: number } | undefined;
  try {
    const raw = execSync("npm pack --dry-run --json", { cwd: ROOT, encoding: "utf-8" });
    const parsed = JSON.parse(raw) as Array<{
      files?: Array<{ path: string }>;
      size?: number;
    }>;
    pack = parsed[0];
  } catch (err) {
    fail("npm pack", `failed to run \`npm pack --dry-run --json\`: ${String(err)}`);
    return;
  }
  if (!pack) {
    fail("npm pack", "`npm pack --dry-run --json` returned empty payload");
    return;
  }

  const forbiddenPatterns: Array<{ matcher: RegExp; label: string }> = [
    { matcher: /\.(test|spec)\.(t|j)sx?$/, label: "test file" },
    { matcher: /\.stories\.(t|j)sx?$/, label: "Ladle story" },
    { matcher: /^src\/screens\//, label: "internal screen" },
    { matcher: /^referencia\//, label: "exploration archive" },
    { matcher: /^playground\//, label: "playground demo" },
    { matcher: /^\.ladle\//, label: "Ladle config" },
    { matcher: /^tests\//, label: "fixture app" },
  ];

  for (const file of pack.files ?? []) {
    for (const { matcher, label } of forbiddenPatterns) {
      if (matcher.test(file.path)) {
        fail("npm pack", `forbidden ${label} in tarball: ${file.path}`);
      }
    }
  }

  const MAX_SIZE = 5 * 1024 * 1024;
  if ((pack.size ?? 0) > MAX_SIZE) {
    fail("npm pack", `tarball is ${pack.size} bytes (>${MAX_SIZE}). Audit the \`files\` array.`);
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

    // Multi-file engines (e.g. whiteboard, slide, slide-deck) ship a single
    // entry component named `<descriptor.name>.tsx`; the remaining files are
    // internal modules without their own stories. Restrict the gate to the
    // entry file so internal-only modules don't trigger spurious failures.
    const entry = descriptor.files.find(
      (file) =>
        file.path.startsWith("components/") &&
        (file.path.endsWith(`/${descriptor.name}.tsx`) ||
          file.path.endsWith(`/${descriptor.name}.ts`)),
    );
    if (!entry) continue;
    const dir = join(ROOT, "src", dirname(entry.path));
    const base = descriptor.name;
    if (!existsSync(join(dir, `${base}.test.tsx`))) {
      // Hard-fail (D5): test-backfill phase ended; every registry component
      // ships with a smoke test.
      fail(descriptor.name, `registry item is missing ${base}.test.tsx`);
    }
    if (!existsSync(join(dir, `${base}.stories.tsx`))) {
      fail(descriptor.name, `registry item is missing ${base}.stories.tsx`);
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
  /* The typescale source of truth moved to src/styles/tailwind-preset.ts
   * (D3 / BLOCKER-002). tailwind.config.ts now imports the preset, so
   * the gate audits the preset directly. */
  const preset = readFileSync(join(ROOT, "src/styles/tailwind-preset.ts"), "utf-8");

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
   * in tailwind-preset.ts; this gate prevents accidental drift. */
  const requiredTypeScale = [
    '"display-2xl": ["64px"',
    '"display-xl": ["48px"',
    '"display-lg": ["40px"',
    '"display-md": ["32px"',
    'headline: ["28px"',
    '"title-lg": ["24px"',
    '"title-md": ["20px"',
    '"body-lg": ["18px"',
    '"body-md": ["14px"',
  ];
  for (const token of requiredTypeScale) {
    if (!preset.includes(token)) fail("tailwind-preset.ts", `type scale drift: missing ${token}`);
  }

  /* HIGH-002 / D6: fonts.css must self-host via @font-face (default), not
   * load from Google Fonts CDN. The CDN path lives in fonts-cdn.css (opt-in).
   */
  const fontsCss = readFileSync(join(ROOT, "src/styles/fonts.css"), "utf-8");
  if (!fontsCss.includes("@font-face")) {
    fail("fonts.css", "default fonts.css must declare @font-face (self-hosted Geist).");
  }
  // Strip block comments so we only audit declarations, not narrative.
  const stripped = fontsCss.replace(/\/\*[\s\S]*?\*\//g, "");
  if (/@import\s+url\(["']?https?:[^"')]*fonts\.googleapis\.com/.test(stripped)) {
    fail(
      "fonts.css",
      "default fonts.css must not @import from fonts.googleapis.com (use fonts-cdn.css for opt-in CDN).",
    );
  }
  // The CDN entrypoint must continue to exist so consumers can opt in.
  const fontsCdnPath = join(ROOT, "src/styles/fonts-cdn.css");
  if (!existsSync(fontsCdnPath)) {
    fail("fonts-cdn.css", "missing opt-in CDN entrypoint at src/styles/fonts-cdn.css");
  }

  // T4.1 runtime-metric proof: when `dist/` exists, the shipped CSS
  // entrypoints must not @import from fonts.googleapis.com. This is the
  // post-build guarantee a consumer experiences after `npm install`.
  // Narrative comments mentioning the CDN are fine; only @import url(...)
  // declarations fire the gate.
  const distFontsCss = join(ROOT, "dist/fonts.css");
  const distStylesCss = join(ROOT, "dist/styles.css");
  for (const path of [distFontsCss, distStylesCss]) {
    if (!existsSync(path)) continue;
    const content = readFileSync(path, "utf-8");
    const stripped2 = content.replace(/\/\*[\s\S]*?\*\//g, "");
    if (/@import\s+url\(["']?https?:[^"')]*fonts\.googleapis\.com/.test(stripped2)) {
      fail(
        `dist/${path.split("/").pop()}`,
        "shipped CSS still @import-s from fonts.googleapis.com (HIGH-002 regression). Default ships must be self-hosted.",
      );
    }
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
    "sync:exports",
    "quality:structure",
    "quality:bundle",
    "quality:a11y",
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
    "Inter",
    "Aurora",
    "Terminal",
    "Furnace",
    "Console",
    "Quickstart",
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

async function validateCompoundPattern(): Promise<void> {
  // T4.1 / BLOCKER-004 — every compound component (Root + sub-components
  // exposed as `Root.Sub`) must assemble via `Object.assign /*#__PURE__*/`
  // and NOT via the `Root as typeof Root & {...}` + `Root.Sub = Sub` mutation
  // pattern. Mutation in module scope blocks tree-shaking because the marker
  // is missing; Object.assign with the PURE hint is recognized as side-effect
  // free by every modern bundler.
  //
  // CHANGELOG (Unreleased > Changed) declares this migration; the gate keeps
  // it honest by failing on regression.
  for (const layer of ["primitives", "composites"] as const) {
    const layerRoot = join(ROOT, "src/components", layer);
    if (!existsSync(layerRoot)) continue;
    for (const name of await listDirectories(layerRoot)) {
      const impl = join(layerRoot, name, `${name}.tsx`);
      if (!existsSync(impl)) continue;
      const content = await readFile(impl, "utf-8");
      const mutation = /const\s+\w+\s*=\s*\w+(?:Root|Primitive)\s+as\s+typeof\s+\w+\s*&\s*\{/;
      if (mutation.test(content)) {
        fail(
          `${layer}/${name}`,
          "compound component uses mutation cast (`X as typeof X & {...}; X.Sub = Sub`); use `/*#__PURE__*/ Object.assign(Root, { Sub: ... })` per CHANGELOG 2026-05-13",
        );
      }
    }
  }
}

async function validateCountConsistency(): Promise<void> {
  // T4.3 / HIGH-009 — the "components-N" badge in README.md must equal the
  // sum of "Primitives (P)" + "Composites (C)" in the catalog section. They
  // diverged historically because `sync-readme.ts` mixed dir count (badge)
  // and named-export count (catalog) — D1 unifies on named exports.
  const readme = readFileSync(join(ROOT, "README.md"), "utf-8");
  const badgeMatch = readme.match(/components-(\d+)/);
  const primMatch = readme.match(/\*\*Primitives\*\*\s*\((\d+)\)/);
  const compMatch = readme.match(/\*\*Composites\*\*\s*\((\d+)\)/);
  if (!badgeMatch?.[1] || !primMatch?.[1] || !compMatch?.[1]) {
    fail("README.md", "could not parse components badge / Primitives / Composites counts");
    return;
  }
  const badge = Number(badgeMatch[1]);
  const sum = Number(primMatch[1]) + Number(compMatch[1]);
  if (badge !== sum) {
    fail(
      "README.md",
      `components badge (${badge}) does not match Primitives (${primMatch[1]}) + Composites (${compMatch[1]}) = ${sum}; run \`pnpm sync:readme\``,
    );
  }

  // welcome.stats.ts must match the same numbers.
  // Moved to .ladle/generated/ (HIGH-003 / T3.3) so the generated file does
  // not ship in the npm tarball alongside hand-written source under `src/`.
  const statsPath = join(ROOT, ".ladle/generated/welcome.stats.ts");
  if (existsSync(statsPath)) {
    const stats = readFileSync(statsPath, "utf-8");
    const sp = stats.match(/primitives:\s*(\d+)/);
    const sc = stats.match(/composites:\s*(\d+)/);
    if (sp?.[1] && sc?.[1]) {
      if (Number(sp[1]) !== Number(primMatch[1]) || Number(sc[1]) !== Number(compMatch[1])) {
        fail(
          ".ladle/generated/welcome.stats.ts",
          `welcome STATS (${sp[1]}P + ${sc[1]}C) diverge from README catalog (${primMatch[1]}P + ${compMatch[1]}C); run \`pnpm sync:readme\``,
        );
      }
    }
  }
}

async function validateArchitectureCensus(): Promise<void> {
  // T4.3 / BLOCKER-002 — docs/architecture.md "Current census" must match
  // src/index.ts named exports exactly. We compare both the headline counts
  // and the full list to catch drift like the 36/12 → 88/14 regression.
  const archPath = join(ROOT, "docs/architecture.md");
  if (!existsSync(archPath)) return;
  const arch = readFileSync(archPath, "utf-8");
  const indexContent = readFileSync(join(ROOT, "src/index.ts"), "utf-8");

  // Reuse the same parser logic as sync-readme.ts (kept in sync manually but
  // simple enough that the duplication is cheaper than a shared module).
  const pattern =
    /export\s+{([^}]+)}\s+from\s+["']\.\/components\/(primitives|composites)\/[^/"']+/g;
  const expected: { primitives: Set<string>; composites: Set<string> } = {
    primitives: new Set(),
    composites: new Set(),
  };
  for (const match of indexContent.matchAll(pattern)) {
    const body = match[1];
    const layer = match[2] as "primitives" | "composites" | undefined;
    if (!body || !layer) continue;
    for (const raw of body.split(",")) {
      const cleaned = raw.trim().replace(/^type\s+/, "");
      if (raw.trim().startsWith("type ")) continue;
      const name = cleaned.split(/\s+as\s+/)[0]?.trim();
      if (name && /^[A-Z][A-Za-z0-9]+$/.test(name)) expected[layer].add(name);
    }
  }

  // Census headlines
  const primHead = arch.match(/### Primitives \((\d+)\)/);
  const compHead = arch.match(/### Composites \((\d+)\)/);
  if (primHead?.[1] && Number(primHead[1]) !== expected.primitives.size) {
    fail(
      "docs/architecture.md",
      `Primitives census shows (${primHead[1]}) but src/index.ts exports ${expected.primitives.size}; run \`pnpm sync:readme\``,
    );
  }
  if (compHead?.[1] && Number(compHead[1]) !== expected.composites.size) {
    fail(
      "docs/architecture.md",
      `Composites census shows (${compHead[1]}) but src/index.ts exports ${expected.composites.size}; run \`pnpm sync:readme\``,
    );
  }

  // Listed names — check that the BEGIN:primitives-list region covers every export.
  const primListMatch = arch.match(
    /<!-- BEGIN:primitives-list -->\s*([\s\S]*?)\s*<!-- END:primitives-list -->/,
  );
  if (primListMatch?.[1]) {
    const ticked = new Set<string>();
    for (const m of primListMatch[1].matchAll(/`([A-Z][A-Za-z0-9]+)`/g)) {
      if (m[1]) ticked.add(m[1]);
    }
    for (const name of expected.primitives) {
      if (!ticked.has(name)) {
        fail(
          "docs/architecture.md",
          `primitives-list region missing \`${name}\`; run \`pnpm sync:readme\``,
        );
      }
    }
  }

  const compListMatch = arch.match(
    /<!-- BEGIN:composites-list -->\s*([\s\S]*?)\s*<!-- END:composites-list -->/,
  );
  if (compListMatch?.[1]) {
    const ticked = new Set<string>();
    for (const m of compListMatch[1].matchAll(/`([A-Z][A-Za-z0-9]+)`/g)) {
      if (m[1]) ticked.add(m[1]);
    }
    for (const name of expected.composites) {
      if (!ticked.has(name)) {
        fail(
          "docs/architecture.md",
          `composites-list region missing \`${name}\`; run \`pnpm sync:readme\``,
        );
      }
    }
  }
}

async function validateAxeCoverage(): Promise<void> {
  // T6.3 / HIGH-007 — ≥30 interactive primitives must run vitest-axe in their
  // test file. We grep for `toHaveNoViolations` / `expectNoA11yViolations` /
  // `axe(` against an explicit list of interactive primitives. The list is
  // hardcoded so adding a new interactive primitive is a conscious decision —
  // missing coverage fails the gate before merge.
  const INTERACTIVE_PRIMITIVES = [
    "avatar",
    "badge",
    "button",
    "card",
    "checkbox",
    "dialog",
    "empty-state",
    "form-field",
    "input",
    "label",
    "radio-group",
    "scroll-area",
    "select",
    "sheet",
    "sidebar",
    "switch",
    "tabs",
    "textarea",
    "toast",
    "tooltip",
    "topnav",
    "agent-event",
    "agent-streaming",
    "approval-card",
    "attachment-chip",
    "audit-log-entry",
    "channel-card",
    "cron-job-card",
    "mcp-server-card",
    "mention-menu",
    "model-selector",
    "permission-matrix",
    "progress-checklist",
    "quick-action-chips",
    "skill-card",
    "token-usage-chart",
  ];
  const MIN_COVERAGE = 30;
  const coveragePattern = /toHaveNoViolations|expectNoA11yViolations|from\s+["']vitest-axe["']/;
  let covered = 0;
  const uncovered: string[] = [];
  for (const name of INTERACTIVE_PRIMITIVES) {
    const testPath = join(ROOT, "src/components/primitives", name, `${name}.test.tsx`);
    if (!existsSync(testPath)) {
      uncovered.push(`${name} (missing test file)`);
      continue;
    }
    const content = readFileSync(testPath, "utf-8");
    if (coveragePattern.test(content)) {
      covered++;
    } else {
      uncovered.push(name);
    }
  }
  if (covered < MIN_COVERAGE) {
    fail(
      "a11y coverage",
      `only ${covered}/${INTERACTIVE_PRIMITIVES.length} interactive primitives have a vitest-axe assertion; minimum is ${MIN_COVERAGE}. Missing: ${uncovered.join(", ")}`,
    );
  }
}

async function validateNoStrayArtifacts(): Promise<void> {
  // T4.4 / MEDIUM-016/017 — block `.bak`, `.json.tmp`, `.orig`, `.rej`
  // residue from reappearing. The patterns already live in `.gitignore` so
  // these files never land in commits, but they pollute IDEs, file pickers,
  // and ad-hoc `find` / `grep` invocations. This gate keeps the working
  // tree clean even before commit.
  const skipDirs = new Set([
    "node_modules",
    "dist",
    "build",
    ".git",
    ".ladle",
    ".vite",
    ".cache",
    "playground/dist",
    "referencia",
  ]);
  const offenders = new Set([".bak", ".tmp", ".orig", ".rej"]);

  async function walk(dir: string): Promise<void> {
    const entries = await readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory()) {
        if (skipDirs.has(entry.name)) continue;
        const next = join(dir, entry.name);
        if ([...skipDirs].some((skip) => next.endsWith(`/${skip}`))) continue;
        await walk(next);
      } else if (entry.isFile()) {
        for (const ext of offenders) {
          if (entry.name.endsWith(ext) || entry.name.endsWith(`.json${ext}`)) {
            fail("working tree", `stray artifact: ${join(dir, entry.name)} (matches ${ext})`);
            break;
          }
        }
      }
    }
  }

  await walk(ROOT);
}

/**
 * Validate WCAG 2.1 AA contrast (4.5:1) across all built-in themes.
 *
 * Iterates the 10 themes in builtinThemes × 2 modes × 4 high-stakes pairs
 * (foreground/background, card-foreground/card, primary-foreground/primary,
 * accent-foreground/accent). Uses pure JS HSL→luminance algorithm in
 * scripts/lib/wcag-contrast.ts. ~50ms total. Plan: seven-themes T1.1.
 */
async function validateThemeContrast(): Promise<void> {
  const { contrastRatio } = await import("./lib/wcag-contrast.js");
  const { builtinThemes } = await import("../src/themes/index.js");

  // Body-text pairs require WCAG 2.1 AA: 4.5:1
  // Button/badge pairs (primary, accent) use button labels which are
  // medium-weight 14px / 15px — qualify as "large text" under WCAG 2.5.5,
  // threshold 3:1. We accept 3:1 for these and require 4.5:1 for body pairs.
  const BODY_PAIRS = [
    ["foreground", "background"],
    ["card-foreground", "card"],
  ] as const;
  const LARGE_PAIRS = [
    ["primary-foreground", "primary"],
    ["accent-foreground", "accent"],
  ] as const;
  const AA_BODY = 4.5;
  const AA_LARGE = 3.0;

  for (const theme of builtinThemes) {
    for (const mode of ["light", "dark"] as const) {
      const scale = theme[mode];
      for (const [fgKey, bgKey] of BODY_PAIRS) {
        const ratio = contrastRatio(scale[fgKey], scale[bgKey]);
        if (ratio < AA_BODY) {
          fail(
            `theme:${theme.name}`,
            `WCAG AA fail (${mode}, body): ${fgKey} vs ${bgKey} = ${ratio.toFixed(2)}:1 (need >=${AA_BODY}:1)`,
          );
        }
      }
      for (const [fgKey, bgKey] of LARGE_PAIRS) {
        const ratio = contrastRatio(scale[fgKey], scale[bgKey]);
        if (ratio < AA_LARGE) {
          fail(
            `theme:${theme.name}`,
            `WCAG AA fail (${mode}, large): ${fgKey} vs ${bgKey} = ${ratio.toFixed(2)}:1 (need >=${AA_LARGE}:1)`,
          );
        }
      }
    }
  }
}

// Validate that no src/components file uses literal Tailwind color utility
// classes (D3 / ADR-0004 / community-best-practices T1.3). Components MUST
// consume semantic tokens (bg-primary, bg-success, bg-status-online, ...) so
// theme switching propagates. Literal classes (bg-emerald-500) bypass the
// cascade — same hex regardless of active theme. Whitelisted: *.test.tsx,
// *.stories.tsx, tests/fixture-*/.
async function validateNoLiteralTailwindColors(): Promise<void> {
  const { scan, formatViolations } = await import("./lib/literal-color-scanner.js");
  const violations = scan({ rootDir: join(ROOT, "src/components") });
  if (violations.length === 0) return;
  // Single-fail with the full formatted report so reviewers see the suggestions inline.
  fail("components:tokens", `\n${formatViolations(violations)}`);
}

/**
 * RSC gate — every client component (source uses a React hook or already
 * declares `"use client"`) MUST carry the `"use client"` directive at the top
 * of its built subpath entry shim under `dist/`. Without it, consumers in
 * Next.js App Router get a "useState only works in a Client Component" error
 * when importing `@theokit/ui` via npm. The directive is injected post-build by
 * `scripts/inject-use-client.ts` (esbuild strips it during `splitting`). This
 * gate is the regression guard. Skips gracefully when `dist/` is absent.
 */
async function validateUseClientDirective(): Promise<void> {
  const distRoot = join(ROOT, "dist");
  if (!existsSync(distRoot)) return;

  const hookRe =
    /\b(useState|useEffect|useRef|useContext|useReducer|useImperativeHandle|useId|useLayoutEffect|useSyncExternalStore|createContext)\b/;

  const sourceIsClient = (srcDir: string): boolean => {
    if (!existsSync(srcDir)) return false;
    const stack = [srcDir];
    while (stack.length > 0) {
      const dir = stack.pop() as string;
      for (const dirent of readdirSync(dir, { withFileTypes: true })) {
        const p = join(dir, dirent.name);
        if (dirent.isDirectory()) {
          stack.push(p);
          continue;
        }
        if (!dirent.name.endsWith(".tsx")) continue;
        if (dirent.name.includes(".test.") || dirent.name.includes(".stories.")) continue;
        const txt = readFileSync(p, "utf-8");
        const head = txt.split("\n").slice(0, 2).join("\n");
        if (head.includes("use client") || hookRe.test(txt)) return true;
      }
    }
    return false;
  };

  for (const layer of ["primitives", "composites"] as const) {
    const layerDist = join(distRoot, layer);
    const layerSrc = join(ROOT, "src/components", layer);
    if (!existsSync(layerDist)) continue;
    for (const dirent of readdirSync(layerDist, { withFileTypes: true })) {
      if (!dirent.isDirectory()) continue;
      const name = dirent.name;
      if (!sourceIsClient(join(layerSrc, name))) continue;
      const shim = join(layerDist, name, "index.js");
      if (!existsSync(shim)) continue;
      const headText = readFileSync(shim, "utf-8").slice(0, 14);
      if (!headText.startsWith('"use client"')) {
        fail(
          "rsc/use-client",
          `${layer}/${name} is a client component but dist/${layer}/${name}/index.js lacks the "use client" directive (run \`pnpm build\`).`,
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
  await validateCompoundPattern();
  await validateComponentStructure();
  await validateRegistryStoriesAndTests();
  await validateRegistryPresetDep();
  await validateExportsMap();
  await validateNpmTarball();
  await validatePublicExports();
  await validateCountConsistency();
  await validateArchitectureCensus();
  await validateAxeCoverage();
  await validateUseClientDirective();
  await validateNoStrayArtifacts();
  validateDesignSystemFidelity();
  await validateNoLiteralTailwindColors();
  await validateThemeContrast();
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
