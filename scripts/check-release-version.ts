#!/usr/bin/env tsx
/**
 * Refuse to publish a version the registry already serves, and surface git↔npm drift.
 *
 * `cycle-release` computes the next version from `git describe --tags` and halts if that
 * TAG already exists. That guard is aimed at the wrong axis. Measured on 2026-08-21: git's
 * newest tag was `v1.3.2` while npm already served 1.4.0 and 1.4.1, published outside CI
 * and never tagged. The next cut would have computed `v1.4.0`, found no such tag, and
 * produced a tag and a GitHub release describing content that is really 1.5.0 — permanently
 * mislabelling the history consumers read to decide whether to upgrade.
 *
 * Run as part of `prepublishOnly`, so the check sits on the path a publish actually takes
 * rather than on the path we hope it takes. See usetheokit/theokit-ui#46.
 *
 * Exit codes: 0 clean · 1 refused (candidate already published) · 2 could not check.
 */
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { compareVersions } from "./lib/version-drift.js";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const pkg = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf-8")) as {
  name: string;
  version: string;
};

/** Versions the registry serves, or `null` when it could not be reached. */
async function fetchPublishedVersions(name: string): Promise<string[] | null> {
  try {
    const response = await fetch(`https://registry.npmjs.org/${name.replace("/", "%2f")}`, {
      headers: { accept: "application/vnd.npm.install-v1+json" },
    });
    // A 404 means the package has never been published. That is a legitimate first
    // release, not a failure to check.
    if (response.status === 404) return [];
    if (!response.ok) return null;
    const body = (await response.json()) as { versions?: Record<string, unknown> };
    return Object.keys(body.versions ?? {});
  } catch {
    return null;
  }
}

function gitTags(): string[] {
  return execFileSync("git", ["tag", "--list"], { cwd: ROOT, encoding: "utf-8" })
    .split("\n")
    .map((t) => t.trim())
    .filter(Boolean);
}

async function main(): Promise<void> {
  const published = await fetchPublishedVersions(pkg.name);

  if (published === null) {
    // Never pass on an unreachable registry: "could not check" is not "checked and clean",
    // and a publish gate that waves through when its input is missing protects nothing.
    console.error(
      `✗ Could not reach the npm registry to check ${pkg.name}. Refusing to report this ` +
        "version as safe to publish. Re-run with network access.",
    );
    process.exit(2);
  }

  const report = compareVersions(published, gitTags(), pkg.version);

  if (report.publishedButUntagged.length > 0) {
    // A warning, not a failure: it describes history that is already public and cannot be
    // fixed by refusing today's publish. Silence is what let it reach two versions.
    console.warn(
      `⚠ ${report.publishedButUntagged.length} version(s) on npm have no git tag: ` +
        `${report.publishedButUntagged.join(", ")}.`,
    );
    console.warn("  The repository is not a complete record of what consumers can install.");
  }

  if (report.candidateAlreadyPublished) {
    console.error(
      `\n✗ ${pkg.name}@${pkg.version} is already on the registry. Publishing would be ` +
        "rejected, and tagging it would label this content with a version that means " +
        "something else.",
    );
    console.error(`  Latest published: ${report.latestPublished ?? "(none)"}`);
    console.error("  Pick the next version explicitly rather than deriving it from git tags.");
    process.exit(1);
  }

  console.log(
    `✓ ${pkg.name}@${pkg.version} is not on the registry ` +
      `(${published.length} version(s) checked, latest ${report.latestPublished ?? "none"}).`,
  );
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(2);
});
