---
type: Historical Record
title: Release record
description: Notable releases with their scope, gate evidence, and the divergences recorded honestly at the time.
tags: [history, releases, semver, npm, provenance]
sources:
  - id: v016
    resource: "git:94d9b11:.claude/knowledge-base/releases/v0.16.0-release.md"
  - id: v100
    resource: "git:94d9b11:.claude/knowledge-base/releases/v1.0.0-release.md"
generated:
  by: "claude-code/opus-5"
  at: "2026-08-11"
status: stable
---

# v0.16.0 — 2026-06-18

**Scope:** `community-standard-componentization` — five of six phases of shadcn v4
alignment: `use client` RSC preservation, `data-slot` on 135 components with correct
compound naming, per-subpath `.d.ts`, `data-variant` / `data-size` on CVA components, and
accessibility (pre-satisfied).

**Phase 4 (Tailwind v4) was deferred** via
[an explicit ADR](/decisions/defer-tailwind-v4-migration.md) rather than silently dropped.

Minor bump from the last tag `0.14.2`; `0.15.0` was an untagged prior cut.

# v1.0.0 — 2026-07-03

**Scope:** the [AI-exclusive pivot](/history/ai-exclusive-pivot.md), milestones M-A through
M-E. Major bump `0.19.0 → 1.0.0`: BREAKING Removed (54 components) plus BREAKING Changed
(AI-exclusive dependency on `@usetheo/ui`).

## Gates at release

| Package | Evidence |
| --- | --- |
| `usetheo-ui` | build + **664 tests** |
| `theokit-ui` | typecheck 0, build, **1401 tests**, `publint` "All good!", `quality:structure` PASS |

## End-to-end proof

A fresh `npm install @theokit/ui@1.0.0` in a clean directory resolves `@theokit/ui@1.0.0`
plus its dependency `@usetheo/ui@0.14.0`, both `dist/index.js` present, zero
vulnerabilities.

## Divergences recorded at the time

- **npm `1.0.0` did not exactly match git tag `v1.0.0`.** The tag predated the release-time
  `file:` → `^0.14.0` dependency swap; npm was published from `develop` HEAD. Reconciled by
  a follow-up merge — `main` afterwards equals what is on npm, zero commits divergent.
- **Published locally with `--no-provenance`** for both packages.
  `publishConfig.provenance: true` remains set for the eventual CI publish path.
- **A security follow-up was logged**: an npm token pasted into a chat was used per
  instruction and removed from `~/.npmrc`, but remained exposed in conversation history and
  was flagged for rotation.

Recording the third item is the point. A release note that lists only what succeeded is a
marketing artifact, not a record.

## Follow-ups completed the same day

`develop → main` reconciled; `usetheo-ui` `main` bootstrapped with an annotated tag and a
GitHub release; the gh-pages registry deployed, with all 15 cross-package
`registryDependencies` URLs resolving `200`. The shadcn copy-paste path became end-to-end
functional across both packages.

# Current version

`1.3.2` as of 2026-08-11. Releases between 1.0.0 and 1.3.2 are recorded in `CHANGELOG.md`
at the repository root, which remains the authoritative per-version log —
`validateGovernanceFiles` fails the build if it is missing or lacks its `## [Unreleased]`
section.

# Release process

`workspace → develop → main`, with the release cut as a `develop → main` PR plus an
annotated semver tag. See
[`/quality-gates/branch-protection.md`](/quality-gates/branch-protection.md).
