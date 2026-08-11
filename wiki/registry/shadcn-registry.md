---
type: Distribution Reference
title: The shadcn-compatible registry
description: How registry items are generated, hosted, cross-referenced across two packages, and installed into a consumer project.
tags: [registry, shadcn, distribution, copy-paste, gh-pages]
sources:
  - id: build-registry
    resource: "scripts/build-registry.ts"
  - id: gates-doc
    resource: "git:94d9b11:docs/quality-gates.md"
  - id: release-v1
    resource: "git:94d9b11:.claude/knowledge-base/releases/v1.0.0-release.md"
generated:
  by: "claude-code/opus-5"
  at: "2026-08-11"
status: stable
---

# The two distribution paths

```bash
# 1. Install the package
pnpm add @theokit/ui

# 2. Copy a single component into your source tree
npx shadcn@latest add https://usetheodev.github.io/theokit-ui/r/<name>.json
```

Both are supported and neither is the "real" one. The copy-paste path is why the
[taxonomy rule](/architecture/taxonomy-rule.md) has to be mechanical: an item that pulls in
a surprise transitive component is a bad copy-paste citizen, and a cycle in the import graph
becomes an unresolvable `registryDependencies` cycle.

# How items are produced

| Artifact | Written by | Note |
| --- | --- | --- |
| `registry/<name>.json` | By hand | The descriptor: title, description, dependencies, target path |
| `registry/r/<name>.json` | `pnpm registry:build` | **Generated from source. Never hand-edit.** |
| `registry/index.json` | `pnpm registry:build` | Includes `metadata.requires.tsconfigPathAlias` |

`scripts/build-registry.ts` inlines the source and rewrites relative imports
(`../../../lib/cn.js`) into the consumer-facing `@/...` convention via `sourceImportMap`.
`pnpm registry:validate` then checks the output, and `scripts/test-registry-install.ts` runs
`tsc --noEmit` against a real fixture consumer app so a broken rewrite fails the build
rather than the user.

# Hosting

Served from GitHub Pages at `usetheodev.github.io/theokit-ui/r/*.json`, deployed by a
`deploy-registry.yml` workflow. The branded `ui.usetheo.dev` endpoint is planned, pending a
DNS CNAME.

# Cross-package references

After the [v1 split](/migrations/v1-usetheo-ui-split.md) there are **two** registries.
Fifteen `@theokit/ui` entries declare `registryDependencies` pointing at `@usetheo/ui` items
hosted at `usetheodev.github.io/usetheo-ui/r/*.json`. All fifteen resolve `200`, verified at
release time — the shadcn copy-paste path is end-to-end functional across both packages.

# Consumer preconditions

Four environmental requirements, enumerated with their reasons in
[`/quality-gates/registry-gate.md`](/quality-gates/registry-gate.md). The load-bearing one:
`tsconfig.json#compilerOptions.paths["@/*"]` must map to `["./src/*"]`, because inlined
source contains `@/lib/cn` imports.

That precondition is declared in `registry/index.json` under
`metadata.requires.tsconfigPathAlias`, and a gate fails the build if the field is missing.
Putting it in the artifact rather than only in prose is what keeps the documentation and the
reality from drifting.
