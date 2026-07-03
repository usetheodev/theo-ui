/**
 * Component classification gate — plan
 * `.claude/knowledge-base/plans/component-classification-manifest-plan.md` T1.1.
 *
 * Reads `registry/component-classification.json` and cross-checks it against the
 * on-disk component directories under `src/components/{primitives,composites}`.
 * Fails (exit 1, clear offender list) on any drift: unclassified dir, stale entry,
 * invalid tier/target, duplicate entry, declared-layer/location mismatch, or a
 * malformed/absent/non-array manifest.
 *
 * Enumeration is TOP-LEVEL only (mirrors validate-quality-gates.ts `listDirectories`),
 * so nested dirs like `slide/plugins` and `whiteboard/themes` are not phantom
 * components.
 */
import { existsSync } from "node:fs";
import { readFile, readdir } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export type Tier = "ai" | "generic" | "cloud-ops";
export type Layer = "primitive" | "composite";
export type Target = "@theokit/ui" | "@usetheo/ui";

export interface ClassificationEntry {
  name: string;
  layer: Layer;
  tier: Tier;
  target: Target;
  rationale: string;
  disputed?: boolean;
}

export interface CheckResult {
  ok: boolean;
  classifiedCount: number;
  offenders: string[];
}

export interface OnDisk {
  primitive: string[];
  composite: string[];
}

const TIERS: readonly Tier[] = ["ai", "generic", "cloud-ops"];
const expectedTarget = (tier: Tier): Target => (tier === "ai" ? "@theokit/ui" : "@usetheo/ui");

/**
 * Pure drift + consistency check. No I/O — testable in isolation.
 */
export function checkClassification(manifest: unknown, onDisk: OnDisk): CheckResult {
  if (!Array.isArray(manifest)) {
    return {
      ok: false,
      classifiedCount: 0,
      offenders: ["manifest must be a JSON array of entries"],
    };
  }
  const entries = manifest as ClassificationEntry[];
  const offenders: string[] = [];

  // Duplicate (layer, name) — a component must never carry two conflicting tiers.
  // Set-based detection is O(n); an indexOf-in-filter would be O(n^2).
  const seenKeys = new Set<string>();
  const dupes = new Set<string>();
  for (const e of entries) {
    const key = `${e.layer}/${e.name}`;
    if (seenKeys.has(key)) dupes.add(key);
    else seenKeys.add(key);
  }
  if (dupes.size) {
    offenders.push(`duplicate entries: ${[...dupes].join(", ")}`);
  }

  const byRoot: Record<Layer, Set<string>> = {
    primitive: new Set(onDisk.primitive),
    composite: new Set(onDisk.composite),
  };
  // Key on-disk + manifest by (layer, name) — consistent with the duplicate key —
  // so a homonym across the two roots cannot silently satisfy the classified check.
  const named = new Set(entries.map((e) => `${e.layer}/${e.name}`));
  const onDiskKeyed: Array<[Layer, string]> = [
    ...onDisk.primitive.map((n): [Layer, string] => ["primitive", n]),
    ...onDisk.composite.map((n): [Layer, string] => ["composite", n]),
  ];

  for (const [layer, dir] of onDiskKeyed) {
    if (!named.has(`${layer}/${dir}`)) offenders.push(`unclassified: ${layer}/${dir}`);
  }

  for (const e of entries) {
    const existsSomewhere = byRoot.primitive.has(e.name) || byRoot.composite.has(e.name);
    if (!existsSomewhere) {
      offenders.push(`stale entry (no such dir): ${e.name}`);
      continue;
    }
    if (!TIERS.includes(e.tier)) offenders.push(`invalid tier: ${e.name} (${String(e.tier)})`);
    else if (e.target !== expectedTarget(e.tier)) {
      offenders.push(
        `target mismatch: ${e.name} (tier ${e.tier} expects ${expectedTarget(e.tier)})`,
      );
    }
    if (!byRoot[e.layer]?.has(e.name))
      offenders.push(`layer mismatch: ${e.name} (declared ${e.layer})`);
  }

  return { ok: offenders.length === 0, classifiedCount: onDiskKeyed.length, offenders };
}

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const MANIFEST_PATH = join(ROOT, "registry", "component-classification.json");

export const listTopLevelDirs = async (path: string): Promise<string[]> =>
  existsSync(path)
    ? (await readdir(path, { withFileTypes: true }))
        .filter((e) => e.isDirectory())
        .map((e) => e.name)
    : [];

/**
 * I/O wrapper: input-guards (absent file, malformed JSON) then delegates to the
 * pure checker over the real component roots.
 */
export async function loadAndCheck(manifestPath: string = MANIFEST_PATH): Promise<CheckResult> {
  if (!existsSync(manifestPath)) {
    return { ok: false, classifiedCount: 0, offenders: [`manifest not found at ${manifestPath}`] };
  }
  let manifest: unknown;
  try {
    manifest = JSON.parse(await readFile(manifestPath, "utf-8"));
  } catch {
    return {
      ok: false,
      classifiedCount: 0,
      offenders: [`malformed manifest JSON at ${manifestPath}`],
    };
  }
  const onDisk: OnDisk = {
    primitive: await listTopLevelDirs(join(ROOT, "src", "components", "primitives")),
    composite: await listTopLevelDirs(join(ROOT, "src", "components", "composites")),
  };
  return checkClassification(manifest, onDisk);
}

/**
 * Pure render of a CheckResult into an exit code + message. Extracted so the CLI
 * dispatch stays a trivial 3-line shell.
 */
export function report(r: CheckResult): { code: 0 | 1; message: string } {
  if (r.ok) {
    return { code: 0, message: `classified ${r.classifiedCount} components, 0 drift` };
  }
  const lines = [
    `classification gate FAILED (${r.offenders.length} offender(s)):`,
    ...r.offenders.map((o) => `  - ${o}`),
  ];
  return { code: 1, message: lines.join("\n") };
}

const isMain = process.argv[1] === fileURLToPath(import.meta.url);
if (isMain) {
  loadAndCheck().then((r) => {
    const { code, message } = report(r);
    (code === 0 ? console.log : console.error)(message);
    process.exit(code);
  });
}
