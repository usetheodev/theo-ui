#!/usr/bin/env tsx
/**
 * generate-registry-stubs — backfill missing registry/<name>.json files.
 *
 * Scans `src/components/{primitives,composites}/*\/<name>.tsx`, parses their
 * imports, and emits a registry descriptor only when one does not exist yet.
 * Never overwrites existing descriptors.
 *
 *   - external `dependencies`: derived from non-relative imports
 *     (e.g. `lucide-react`, `@radix-ui/react-dialog`, `class-variance-authority`).
 *   - `registryDependencies`: derived from relative imports that map to
 *     known registry items (cn / types / chat-types / mode-types / rule-types /
 *     sibling primitives or composites).
 *
 * Usage: pnpm tsx scripts/generate-registry-stubs.ts
 */

import { existsSync } from "node:fs";
import { readFile, readdir, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const REGISTRY_DIR = join(ROOT, "registry");
const SRC_DIR = join(ROOT, "src");

const KNOWN_TYPE_DEPS: Record<string, string> = {
  "../../../lib/cn.js": "cn",
  "../../../lib/types.js": "types",
  "../../../types/chat.js": "chat-types",
  "../../../types/mode.js": "mode-types",
  "../../../types/rule.js": "rule-types",
};

const TYPE_MAP: Record<string, "registry:ui"> = {
  primitives: "registry:ui",
  composites: "registry:ui",
};

interface ComponentInfo {
  name: string;
  kind: "primitives" | "composites";
  filePath: string;
}

async function listComponents(): Promise<ComponentInfo[]> {
  const out: ComponentInfo[] = [];
  for (const kind of ["primitives", "composites"] as const) {
    const dir = join(SRC_DIR, "components", kind);
    const entries = await readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const name = entry.name;
      const filePath = join(dir, name, `${name}.tsx`);
      if (existsSync(filePath)) out.push({ name, kind, filePath });
    }
  }
  return out;
}

function parseImports(source: string): {
  external: Set<string>;
  relative: Set<string>;
} {
  const external = new Set<string>();
  const relative = new Set<string>();
  const importRe = /(?:^|\n)\s*import\s+(?:[\s\S]+?)\s+from\s+["']([^"']+)["']/g;
  let m: RegExpExecArray | null;
  m = importRe.exec(source);
  while (m !== null) {
    const spec = m[1] ?? "";
    if (spec.startsWith(".")) relative.add(spec);
    else external.add(spec);
    m = importRe.exec(source);
  }
  return { external, relative };
}

function externalsToDependencies(externals: Set<string>): string[] {
  const out = new Set<string>();
  for (const spec of externals) {
    if (spec === "react" || spec.startsWith("react/")) continue;
    if (spec === "react-dom" || spec.startsWith("react-dom/")) continue;
    // Reduce @scope/pkg/sub → @scope/pkg
    const parts = spec.split("/");
    const top = spec.startsWith("@") ? `${parts[0]}/${parts[1]}` : parts[0];
    if (top) out.add(top);
  }
  return Array.from(out).sort();
}

function relativeToRegistryDep(spec: string, componentDir: string): string | null {
  const norm = spec.endsWith(".js") ? spec : `${spec}.js`;
  if (KNOWN_TYPE_DEPS[norm]) return KNOWN_TYPE_DEPS[norm] ?? null;
  // Resolve relative to component dir to find which file it points to.
  const resolved = resolve(componentDir, norm);
  const fromSrc = resolved.startsWith(SRC_DIR)
    ? resolved.slice(SRC_DIR.length + 1).replace(/\.js$/, "")
    : null;
  if (!fromSrc) return null;
  // src/components/{primitives|composites}/<name>/<name>
  const m = fromSrc.match(/^components\/(?:primitives|composites)\/([^/]+)\/\1$/);
  if (m?.[1]) return m[1];
  return null;
}

function buildDescriptor(info: ComponentInfo, source: string): Record<string, unknown> {
  const { external, relative } = parseImports(source);
  const componentDir = dirname(info.filePath);
  const dependencies = externalsToDependencies(external);
  const registryDependencies = new Set<string>();
  for (const rel of relative) {
    const dep = relativeToRegistryDep(rel, componentDir);
    if (dep && dep !== info.name) registryDependencies.add(dep);
  }
  const title = info.name
    .split("-")
    .map((part) => (part.length === 0 ? "" : (part[0]?.toUpperCase() ?? "") + part.slice(1)))
    .join("");
  return {
    $schema: "https://ui.shadcn.com/schema/registry-item.json",
    name: info.name,
    type: TYPE_MAP[info.kind],
    title,
    description: `${title} — backfilled registry stub. Please refine the description.`,
    dependencies,
    registryDependencies: Array.from(registryDependencies).sort(),
    files: [
      {
        path: `components/${info.kind}/${info.name}/${info.name}.tsx`,
        type: TYPE_MAP[info.kind],
        target: `components/ui/${info.name}.tsx`,
      },
    ],
  };
}

async function main(): Promise<void> {
  const components = await listComponents();
  let created = 0;
  let skipped = 0;
  for (const info of components) {
    const out = join(REGISTRY_DIR, `${info.name}.json`);
    if (existsSync(out)) {
      skipped++;
      continue;
    }
    const source = await readFile(info.filePath, "utf-8");
    const descriptor = buildDescriptor(info, source);
    await writeFile(out, `${JSON.stringify(descriptor, null, 2)}\n`);
    process.stdout.write(`+ ${info.name}.json\n`);
    created++;
  }
  process.stdout.write(`\nCreated ${created}, skipped ${skipped}.\n`);
}

main().catch((err: unknown) => {
  process.stderr.write(`${String(err)}\n`);
  process.exit(1);
});
