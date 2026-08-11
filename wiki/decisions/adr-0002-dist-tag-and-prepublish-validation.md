---
type: Architecture Decision Record
title: "ADR 0002 — npm dist-tag hotfix and the pre-publish validation gate"
description: Why dist-tag changes require two people and 2FA, and the six runtime checks that block a publish with a broken exports map.
tags: [adr, publish, npm, dist-tag, ci, governance]
sources:
  - id: adr
    resource: "git:94d9b11:docs/adr/0002-dist-tag-hotfix-and-prepublish-validation.md"
    author: "human:paulo"
    last_modified: "2026-05-28"
generated:
  by: "claude-code/opus-5"
  at: "2026-08-11"
status: stable
---

| Field | Value |
| --- | --- |
| Status | **Accepted** |
| Date | 2026-05-28 |
| Deciders | paulo |
| Informed | release engineer, theokit maintainers |

# Context

`@theokit/ui` shipped with `npm dist-tag latest = 0.1.0-next.0` while the workspace was on
`0.12.0-next.0`. A stranger running `npm install @theokit/ui` got a version **eleven
minors behind**. Root cause: the dist-tag was not updated during a prior release.

Separately, no pre-publish check existed to prevent `exports['.']` from breaking before
`npm publish`.

# Decision drivers

1. **Honesty** — the published `latest` tag *is* the contract with a stranger, and it was
   violated.
2. **Do not trust a human to remember** — a pre-publish gate plus a post-publish CI guard.
3. **Reversibility** — the dist-tag fix is a trivial operation; the regression gate is the
   structural part.

# Outcome

Three decisions accepted.

## D1 — Operational hotfix

`npm dist-tag add @theokit/ui@0.12.0-next.0 latest`. One command, reversible, resets the
stranger experience immediately.

## D9 — Pre-publish hook validates the exports map

`scripts/validate-exports.mjs` (~80 LOC) runs six runtime checks:

- [x] `exports['.']` is declared.
- [x] `type: module` is consistent with the exports shape.
- [x] The import actually works.
- [x] The `require` conditional is handled — **skipped with a notice** when ESM-only is
      intentional, encoding the [ADR-0003](/decisions/adr-0003-esm-only-confirmed-and-gated.md)
      invariant directly into the gate.
- [x] The ESM-only notice is emitted.
- [x] Subpath exports are present.

Chained into `prepublishOnly` after build and the contract test, and exposed standalone as
`pnpm validate:exports`.

## D12 — `dist-tag` operations require two eyes

**Never automated.** Release engineer plus mandatory 2FA.

# CI regression guard

`validate-ui-latest-tag.mjs` lives in the meta-repo (`theokit-tools/scripts/`) and is
invoked by the `validate-ui-tag` job of `theokit/.github/workflows/dogfood-stranger.yml`.
Drift is detected by CI before it reaches a consumer.

# Consequences

**Positive.** The next stranger `npm install` resolves the correct version. A broken
publish is blocked by six runtime checks. Dist-tag regression is caught by CI.

**Negative.** A 2FA dependency on the release engineer. `prepublishOnly` adds roughly 10
seconds to publish time.

# Related

[`/architecture/package-shape.md`](/architecture/package-shape.md) describes all three
pre-publish layers together.
