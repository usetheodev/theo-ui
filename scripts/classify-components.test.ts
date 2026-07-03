/**
 * Tests for the component classification gate (plan
 * `.claude/knowledge-base/plans/component-classification-manifest-plan.md` T1.1).
 *
 * `checkClassification` is a pure function (manifest + on-disk dirs -> drift result)
 * so the drift/consistency logic is tested in isolation. `loadAndCheck` is the thin
 * I/O wrapper; its input-guard cases (absent file, malformed JSON) are tested against
 * a temp directory.
 */
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  type ClassificationEntry,
  checkClassification,
  loadAndCheck,
  report,
} from "./classify-components.js";

const validEntry = {
  name: "button",
  layer: "primitive" as const,
  tier: "generic" as const,
  target: "@usetheo/ui" as const,
  rationale: "shadcn-like primitive",
};

const onDisk = { primitive: ["button", "agent-event"], composite: ["chat-message"] };

describe("checkClassification (pure drift + consistency)", () => {
  const fullManifest = [
    validEntry,
    {
      name: "agent-event",
      layer: "primitive",
      tier: "ai",
      target: "@theokit/ui",
      rationale: "agent surface",
    },
    {
      name: "chat-message",
      layer: "composite",
      tier: "ai",
      target: "@theokit/ui",
      rationale: "chat surface",
    },
  ];

  it("passes_when_every_dir_classified_and_consistent", () => {
    const r = checkClassification(fullManifest, onDisk);
    expect(r.ok).toBe(true);
    expect(r.classifiedCount).toBe(3);
    expect(r.offenders).toEqual([]);
  });

  it("fails_when_ondisk_dir_missing_from_manifest", () => {
    const r = checkClassification([validEntry], {
      primitive: ["button", "tool-call"],
      composite: [],
    });
    expect(r.ok).toBe(false);
    expect(r.offenders.some((o) => o.includes("tool-call"))).toBe(true);
  });

  it("fails_when_manifest_entry_references_nonexistent_dir", () => {
    const r = checkClassification(
      [
        validEntry,
        {
          name: "ghost",
          layer: "primitive",
          tier: "generic",
          target: "@usetheo/ui",
          rationale: "x",
        },
      ],
      { primitive: ["button"], composite: [] },
    );
    expect(r.ok).toBe(false);
    expect(r.offenders.some((o) => o.includes("ghost"))).toBe(true);
  });

  it("fails_when_tier_invalid", () => {
    const r = checkClassification([{ ...validEntry, tier: "foo" }], {
      primitive: ["button"],
      composite: [],
    });
    expect(r.ok).toBe(false);
    expect(r.offenders.some((o) => o.includes("tier"))).toBe(true);
  });

  it("fails_when_target_inconsistent_with_tier", () => {
    const r = checkClassification([{ ...validEntry, tier: "ai", target: "@usetheo/ui" }], {
      primitive: ["button"],
      composite: [],
    });
    expect(r.ok).toBe(false);
    expect(r.offenders.some((o) => o.includes("target"))).toBe(true);
  });

  it("fails_when_duplicate_entry", () => {
    const r = checkClassification(
      [validEntry, { ...validEntry, tier: "ai", target: "@theokit/ui" }],
      { primitive: ["button"], composite: [] },
    );
    expect(r.ok).toBe(false);
    expect(r.offenders.some((o) => o.includes("duplicate"))).toBe(true);
  });

  it("fails_when_declared_layer_mismatches_location", () => {
    const r = checkClassification([{ ...validEntry, layer: "composite" }], {
      primitive: ["button"],
      composite: [],
    });
    expect(r.ok).toBe(false);
    expect(r.offenders.some((o) => o.includes("layer"))).toBe(true);
  });

  it("fails_clear_when_manifest_not_array", () => {
    const r = checkClassification({ button: validEntry }, onDisk);
    expect(r.ok).toBe(false);
    expect(r.offenders.some((o) => o.includes("array"))).toBe(true);
  });
});

describe("loadAndCheck (I/O input guards)", () => {
  let dir: string;
  beforeAll(() => {
    dir = mkdtempSync(join(tmpdir(), "classify-"));
  });
  afterAll(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it("fails_clear_when_manifest_absent", async () => {
    const r = await loadAndCheck(join(dir, "does-not-exist.json"));
    expect(r.ok).toBe(false);
    expect(r.offenders.some((o) => o.includes("not found"))).toBe(true);
  });

  it("fails_clear_when_malformed_json", async () => {
    const p = join(dir, "bad.json");
    writeFileSync(p, "{ not valid json ");
    const r = await loadAndCheck(p);
    expect(r.ok).toBe(false);
    expect(r.offenders.some((o) => o.includes("malformed"))).toBe(true);
  });

  it("passes_against_the_real_authored_manifest", async () => {
    const r = await loadAndCheck();
    expect(r.ok).toBe(true);
    expect(r.classifiedCount).toBe(136);
  });
});

describe("report (exit code + message)", () => {
  it("returns code 0 and a drift-free message on ok", () => {
    const { code, message } = report({ ok: true, classifiedCount: 136, offenders: [] });
    expect(code).toBe(0);
    expect(message).toContain("136 components, 0 drift");
  });

  it("returns code 1 and lists offenders on failure", () => {
    const { code, message } = report({
      ok: false,
      classifiedCount: 0,
      offenders: ["unclassified: tool-call"],
    });
    expect(code).toBe(1);
    expect(message).toContain("FAILED");
    expect(message).toContain("tool-call");
  });
});

describe("component-classification.json (authored manifest — T1.2)", () => {
  const manifestPath = join(
    dirname(fileURLToPath(import.meta.url)),
    "..",
    "registry",
    "component-classification.json",
  );
  const manifest = JSON.parse(readFileSync(manifestPath, "utf-8")) as ClassificationEntry[];
  const byName = new Map(manifest.map((e) => [e.name, e]));

  it("manifest_has_136_entries", () => {
    expect(manifest.length).toBe(136);
  });

  // Blueprint §Q2 placement table: 2 stay in @theokit/ui, 9 go to @usetheo/ui.
  const Q2_PLACEMENT: Record<string, ClassificationEntry["target"]> = {
    "terminal-panel": "@theokit/ui",
    "build-log-stream": "@theokit/ui",
    "env-var-editor": "@usetheo/ui",
    "metrics-panel": "@usetheo/ui",
    "deployment-row": "@usetheo/ui",
    "domain-config": "@usetheo/ui",
    "rollback-ui": "@usetheo/ui",
    "cron-job-card": "@usetheo/ui",
    "cron-jobs-list": "@usetheo/ui",
    "preview-env-card": "@usetheo/ui",
    "project-card": "@usetheo/ui",
  };

  it("placement_matches_blueprint_q2", () => {
    for (const [name, target] of Object.entries(Q2_PLACEMENT)) {
      expect(byName.get(name), `missing entry: ${name}`).toBeDefined();
      expect(byName.get(name)?.target, `wrong target for ${name}`).toBe(target);
    }
  });

  it("boundary_fully_resolved_no_disputed_entries", () => {
    // The 3 originally-disputed entries were resolved with component evidence
    // (2026-07-03 scope decision: coding-agent + chat surfaces are both `ai`).
    const disputed = manifest.filter((e) => e.disputed);
    expect(disputed).toEqual([]);
    // Resolved placements (evidence-based):
    expect(byName.get("build-log-stream")?.target).toBe("@theokit/ui"); // coding-agent run output
    expect(byName.get("env-var-editor")?.target).toBe("@usetheo/ui"); // deployment env, not sandbox
    expect(byName.get("metrics-panel")?.target).toBe("@usetheo/ui"); // service-ops metrics
  });
});
