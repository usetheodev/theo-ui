/**
 * Every third-party GitHub Action is pinned to a commit SHA.
 *
 * SonarCloud's `githubactions:S7637` used to assert this, and `sonar-project.properties` now
 * exempts it for `.github/workflows/**` — the repository accepts `@v1` for
 * `usetheokit/shared-workflows`, and the reasoning is recorded above the `uses:` line in
 * `dep-check.yml`: the rule defends against a THIRD PARTY moving a ref, and shared-workflows is
 * this same organisation.
 *
 * That exemption is scoped to the rule and the path, but it is still an exemption, and the case
 * it stops covering is the one it was written for: an action from someone else, added later,
 * without a hash. Nothing else in the pipeline would catch it — zizmor is suppressed on those
 * lines too.
 *
 * So the narrow part of the rule moves here, where it can fail. An exemption whose remaining
 * scope nothing verifies is an exemption that quietly becomes total.
 */
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const WORKFLOWS = join(__dirname, "..", "..", "..", "..", ".github", "workflows");

/** `usetheokit/*` is us. Everything else is a third party, whatever its reputation. */
const OWN_ORG = "usetheokit/";

/** `uses: owner/repo[/path]@ref`, ignoring anything after a `#` comment. */
const USES = /^\s*(?:-\s*)?uses:\s*([^\s#]+)/gm;

/** A local action (`./.github/actions/x`) or a container image is not a ref we can pin. */
const isRemoteRepoRef = (ref: string) => !ref.startsWith("./") && !ref.startsWith("docker://");

function collectUses(): { file: string; ref: string }[] {
  return readdirSync(WORKFLOWS)
    .filter((f) => f.endsWith(".yml") || f.endsWith(".yaml"))
    .flatMap((file) => {
      const body = readFileSync(join(WORKFLOWS, file), "utf-8");
      return [...body.matchAll(USES)]
        .map((m) => m[1])
        .filter(isRemoteRepoRef)
        .map((ref) => ({ file, ref }));
    });
}

describe("third-party actions are pinned to a commit", () => {
  it("finds workflows to check at all", () => {
    // Without this, a wrong WORKFLOWS path makes every assertion below vacuously true:
    // zero refs collected, nothing unpinned, green.
    expect(collectUses().length).toBeGreaterThan(0);
  });

  it("pins every action that is not ours to a 40-character SHA", () => {
    const unpinned = collectUses()
      .filter(({ ref }) => !ref.startsWith(OWN_ORG))
      .filter(({ ref }) => !/@[0-9a-f]{40}$/.test(ref));

    expect(
      unpinned,
      "a third-party action resolved through a movable ref — a tag can be repointed at any " +
        "commit by whoever controls it, and Sonar's rule is exempted for this directory",
    ).toEqual([]);
  });

  it("still sees our own refs, so the filter above is narrowing and not emptying", () => {
    // If OWN_ORG ever stopped matching, the test above would widen rather than break, and a
    // widened test that passes tells nobody anything.
    expect(collectUses().filter(({ ref }) => ref.startsWith(OWN_ORG)).length).toBeGreaterThan(0);
  });
});
