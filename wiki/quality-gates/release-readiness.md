---
type: Quality Gate Reference
title: Release readiness — the chain and what sits outside it
description: Gate 9 conditions, the additive sub-gates, and the two tools deliberately excluded from the default chain with the reason.
tags: [quality-gates, release, ci, publish]
sources:
  - id: gates-doc
    resource: "archive:94d9b11:docs/quality-gates.md"
  - id: pkg
    resource: "package.json"
generated:
  by: "claude-code/opus-5"
  at: "2026-08-11"
status: stable
---

# Gate 9 conditions

A PR touching public UI passes release readiness only if:

- [ ] `pnpm quality:gates` passes.
- [ ] New public items are exported **intentionally**.
- [ ] Registry output is regenerated when descriptors or source registry files change.
- [ ] Docs and stories are updated for changed behavior.
- [ ] No unrelated generated churn is included.
- [ ] Breaking API changes include migration notes.
- [ ] Known warnings are either fixed, or documented with an owner and a reason.

# The chain

```
format:check → lint:ci → typecheck → quality:knip → test → build → quality:publint
→ registry:build → registry:validate → quality:structure → classify:check
→ quality:bundle → quality:a11y → quality:visual → ladle:build
→ dogfood:whiteboard → dogfood:slide → dogfood:slide-deck → dogfood:slide-rich
→ dogfood:v4-zero-config → dogfood:precompiled-utilities
```

`pnpm quality:gates:fast` (format, lint, typecheck, knip, registry build/validate,
structure) is for the iteration loop only.

# Sub-gates

| Sub-gate | Tool | Behavior |
| --- | --- | --- |
| `quality:knip` | [knip](https://knip.dev/) over `src/`, `scripts/`, `playground/`, `.ladle/` | **Hard-fails** on unused dependencies, unresolved imports, missing binaries, duplicate exports. **Soft-warns** on unused files, exports, types — surfacing drift without blocking merges. Config in `knip.json`. |
| `quality:publint` | [publint](https://publint.dev/) `--strict` | Validates the exports map, `types` fields, dual-package shape, license metadata, npm-publish hygiene. Reads `package.json` plus tarball contents; no config file. |
| `quality:bundle` | `scripts/validate-bundle-size.ts` | ±5% tolerance against `scripts/baselines/bundle-sizes.json`, 18 top-level entries. Also asserts engine bundle isolation. |
| `classify:check` | `scripts/classify-components.ts` | Zero drift against `registry/component-classification.json` — every component dir tagged `ai` / `generic` / `cloud-ops`. |

# Deliberately outside the chain

Two commands exist but do **not** run by default. Both exclusions are documented decisions,
not oversights.

## `pnpm quality:attw`

[@arethetypeswrong/cli](https://arethetypeswrong.github.io/) against the packed tarball.

The tool crashes on `@theokit/ui`'s intentional package shape: ~130 per-component subpath
exports share the root `dist/index.d.ts` rather than generating per-component DTS files,
because per-component DTS generation OOMs the tsup worker pool. See
[`/architecture/subpath-exports.md`](/architecture/subpath-exports.md) § the DTS trade-off.

Kept available for opt-in manual runs when investigating type-resolution issues. Revisit
when upstream stabilizes, or when a per-component DTS strategy becomes viable.

## `pnpm dogfood:v4-real-build`

Packs the tarball, installs it in a temp project alongside `@tailwindcss/cli@^4`, runs
Tailwind v4 against a fixture, and grep-asserts that the expected utility rules appear in
the emitted CSS with zero literal `@tailwind ` directives remaining — 12 assertions.

Excluded because it needs `@tailwindcss/cli@^4` installed, which conflicts with the local
`tailwindcss@^3` Ladle path, and because it is slow (~30s with network). It runs in CI
under a dedicated job.

# Pre-publish

`prepublishOnly` chains build → contract test → `validate-exports.mjs`. Full detail in
[`/architecture/package-shape.md`](/architecture/package-shape.md).

`npm dist-tag` operations are never automated: release engineer plus 2FA, two-eyes review.

# CI

`.github/workflows/quality-gates.yml` installs Playwright Chromium before running the
chain. Visual snapshots run under `mcr.microsoft.com/playwright:v1.49.0-jammy` so font
rendering is deterministic. The gate is made non-bypassable by
[branch protection](/quality-gates/branch-protection.md).
