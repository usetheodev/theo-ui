---
type: Architecture Decision Record
title: "ADR — Subpath exports point at per-component dist files, not the barrel"
description: The decision record behind the tree-shaking fix, its acceptance gate, and the measured savings that had to be proven before merge.
tags: [adr, bundling, tree-shaking, exports, measurement]
sources:
  - id: adr
    resource: "archive:94d9b11:.claude/knowledge-base/decisions/subpath-exports-per-component.md"
    author: "human:theoui-maintainers"
    last_modified: "2026-05-25"
generated:
  by: "claude-code/opus-5"
  at: "2026-08-11"
status: stable
---

| Field | Value |
| --- | --- |
| Status | **Accepted** |
| Date | 2026-05-25 |
| Deciders | TheoUI maintainer team |

# Summary

Emit real per-component dist files for every primitive and composite, and rewrite
`package.json#exports` so each subpath points at its own file rather than the barrel.

The **mechanics, the measured before/after, the DTS trade-off, the module-identity result,
and the rejected alternatives** are all documented as a living reference in
[`/architecture/subpath-exports.md`](/architecture/subpath-exports.md). This record exists
to preserve the two things that a reference page loses: **the decision's acceptance gate**,
and **the rule it established about how measurement claims are made here**.

# The acceptance gate

The decision was not accepted on the strength of its reasoning. It was accepted **subject
to a measured outcome**:

> The hard merge gate requires **≥ 10 KB brotli reduction** on the consumer's
> `@theokit/ui` chunk after migrating its top-10 imports to subpath form. If savings fall
> below 8 KB, the plan investigates side effects in primitive `index.ts` files or missing
> externals **before merging**.

The verification workflow:

1. `pnpm build && pnpm pack` in the library.
2. Install the tarball (or `pnpm link`) into the consuming dashboard.
3. Manually split multi-component imports across the consumer's ~13 files — one line per
   top-10 component using `@theokit/ui/<kebab-name>`.
4. `pnpm run build && pnpm run size`, compared against the pre-migration baseline.

This is the pattern worth carrying forward: **a bundling decision states the number it must
hit and where that number is measured**, before it is allowed to merge. The original defect
existed precisely because the earlier subpath work was never measured — it was correct at
`0.7.0` and silently stale by `0.9.0`.

# A prediction that turned out wrong

The edge-case review predicted that barrel and subpath imports would resolve to **different
module instances**, breaking reference equality. The opposite happened: because
`splitting: true` emits one chunk per component and both entry points re-export from it,
Node ESM caches them as a single module, so `Alert === AlertSub` is `true`.

This is recorded rather than quietly corrected. The smoke test now asserts **both**
behavioral equivalence via `renderToString` and the positive reference equality — testing
what actually happens, not what was predicted.

# Consequences

- Future components get subpath entries **automatically** via the auto-glob. No
  hand-maintenance of `package.json#exports`.
- `regen-subpath-exports.ts` refuses to write an exports map with stragglers still pointing
  at the barrel — the cosmetic-subpath defect cannot regress.
- The taxonomy gate is unaffected: it reads **source** structure, not dist structure.
- Consumer migration is opt-in, file by file.
- `scripts/sync-exports.ts` — the obsolete script that originally wrote the cosmetic
  exports — was marked for deletion in a follow-up cleanup.
