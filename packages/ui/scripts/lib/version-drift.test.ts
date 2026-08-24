import { describe, expect, it } from "vitest";
import { compareVersions, normalizeVersion } from "./version-drift.js";

describe("normalizeVersion", () => {
  it("treats a v-prefixed tag and a bare version as the same version", () => {
    expect(normalizeVersion("v1.4.0")).toBe(normalizeVersion("1.4.0"));
  });
});

describe("compareVersions", () => {
  it("reports a published version that was never tagged", () => {
    // The measured state of this repo on 2026-08-21: npm served 1.4.0 and 1.4.1 while the
    // newest git tag was v1.3.2.
    const report = compareVersions(["1.3.2", "1.4.0", "1.4.1"], ["v1.2.0", "v1.3.0", "v1.3.2"]);

    expect(report.publishedButUntagged).toEqual(["1.4.0", "1.4.1"]);
  });

  it("refuses a candidate that is already on the registry even when no tag exists", () => {
    // This is the case the git-only guard could not see: `cycle-release` computes v1.4.0
    // from the newest tag v1.3.2, and no v1.4.0 tag exists to trip over.
    const report = compareVersions(["1.3.2", "1.4.0"], ["v1.3.2"], "v1.4.0");

    expect(report.candidateAlreadyPublished).toBe(true);
  });

  it("accepts a candidate the registry has never seen", () => {
    const report = compareVersions(["1.3.2", "1.4.0", "1.4.1"], ["v1.3.2"], "1.5.0");

    expect(report.candidateAlreadyPublished).toBe(false);
  });

  it("reports no drift when every published version is tagged", () => {
    const report = compareVersions(["1.3.2"], ["v1.3.2"]);

    expect(report.publishedButUntagged).toEqual([]);
  });
});
