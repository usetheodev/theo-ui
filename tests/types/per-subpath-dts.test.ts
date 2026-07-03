/**
 * Per-subpath declaration test (community-standard-componentization T3.1).
 *
 * Each component subpath ships its OWN isolated `.d.ts` (emitted by
 * `tsc -p tsconfig.dts.json` under `dist/components/`) instead of pointing
 * `types` at the whole barrel. This keeps the type surface a consumer loads
 * for `@theokit/ui/cost-meter` scoped to Button, not all 135 components.
 *
 * Reads the real `dist/` + `package.json#exports`. Skips gracefully pre-build.
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();
const hasDist = existsSync(join(ROOT, "dist", "index.d.ts"));

interface ExportObj {
  types?: string;
  import?: string;
}

function exportsMap(): Record<string, string | ExportObj> {
  const pkg = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8"));
  return pkg.exports as Record<string, string | ExportObj>;
}

describe.skipIf(!hasDist)("per-subpath .d.ts isolation", () => {
  it("cost-meter subpath has its own isolated declaration file", () => {
    const dts = join(ROOT, "dist/components/primitives/cost-meter/index.d.ts");
    expect(existsSync(dts)).toBe(true);
    // Isolated = re-exports only CostMeter surface, not the whole barrel.
    const body = readFileSync(dts, "utf8");
    expect(body).toContain("CostMeter");
  });

  it("package.json maps `./cost-meter` types to the per-subpath .d.ts, not the barrel", () => {
    const entry = exportsMap()["./cost-meter"] as ExportObj;
    expect(entry.types).toBe("./dist/components/primitives/cost-meter/index.d.ts");
    expect(entry.import).toBe("./dist/primitives/cost-meter/index.js");
  });

  it("the barrel keeps its own root declaration", () => {
    const barrel = exportsMap()["."] as ExportObj;
    expect(barrel.types).toBe("./dist/index.d.ts");
    expect(existsSync(join(ROOT, "dist/index.d.ts"))).toBe(true);
  });

  it("every component subpath `types` resolves to an existing file", () => {
    const map = exportsMap();
    const missing: string[] = [];
    for (const [key, value] of Object.entries(map)) {
      if (typeof value === "string") continue;
      if (!key.startsWith("./") || key.includes(".css")) continue;
      const t = value.types;
      if (t && !existsSync(join(ROOT, t))) missing.push(`${key} -> ${t}`);
    }
    expect(missing).toEqual([]);
  });
});
