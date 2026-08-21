/**
 * Pure logic behind the release-version guard. Kept separate from the network so it can be
 * tested without one.
 *
 * Why this exists: `cycle-release` derives the next version from `git describe --tags`, and
 * its "tag already exists" stop condition consults git. On 2026-08-21 git's newest tag was
 * `v1.3.2` while npm already served 1.4.0 and 1.4.1 — published outside CI, never tagged,
 * never released on GitHub. The next cut would have computed `v1.4.0` and the guard would
 * not have fired, because that tag genuinely did not exist. The guard was aimed at the
 * wrong axis: the question is not "have we tagged this?" but "has this been published?".
 */

export interface DriftReport {
  /** Versions on the registry with no corresponding git tag. */
  publishedButUntagged: string[];
  /** True when `candidate` is already on the registry — publishing it would be refused. */
  candidateAlreadyPublished: boolean;
  /** The newest version the registry knows, by the order the registry returned. */
  latestPublished: string | undefined;
}

/** Strip a leading `v` so `v1.4.0` and `1.4.0` compare equal. */
export function normalizeVersion(value: string): string {
  return value.replace(/^v/, "");
}

/**
 * Compare what the registry serves against what git has tagged.
 *
 * Takes both lists as arguments rather than fetching, so the comparison is testable and the
 * single network call lives at the edge.
 */
export function compareVersions(
  publishedVersions: readonly string[],
  gitTags: readonly string[],
  candidate?: string,
): DriftReport {
  const tagged = new Set(gitTags.map(normalizeVersion));
  const published = publishedVersions.map(normalizeVersion);

  return {
    publishedButUntagged: published.filter((v) => !tagged.has(v)),
    candidateAlreadyPublished:
      candidate !== undefined && published.includes(normalizeVersion(candidate)),
    latestPublished: published.at(-1),
  };
}
