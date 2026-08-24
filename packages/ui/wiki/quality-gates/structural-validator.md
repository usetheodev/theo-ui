---
type: Quality Gate Reference
title: The structural validator — every check in validate-quality-gates.ts
description: What pnpm quality:structure actually inspects, function by function, and which knowledge files it reads.
tags: [quality-gates, validator, gated, tooling]
sources:
  - id: gate-source
    resource: "scripts/validate-quality-gates.ts"
  - id: gates-doc
    resource: "archive:94d9b11:docs/quality-gates.md"
  - id: post-fix
    resource: "archive:94d9b11:.claude/knowledge-base/architecture/usetheo-ui/post-fix-2026-05-14.md"
generated:
  by: "claude-code/opus-5"
  at: "2026-08-11"
status: stable
---

# What it is

`pnpm quality:structure` runs `scripts/validate-quality-gates.ts`. Every check below is a
separate exported function; a failure names the file, the offending symbol, and the
command that fixes it. The script exits non-zero on any failure.

# Schema — the checks

## Taxonomy and structure

| Function | Fails when |
| --- | --- |
| `validateComponentStructure` | A component folder is missing its implementation, barrel, **test** (hard fail), story, or registry descriptor; or a primitive value-imports a sibling primitive |
| `validateCompositeBarrel` | A composite imports a primitive via a raw `*.js` file instead of the `index.js` barrel |
| `validateCompoundPattern` | A compound component does not follow the `Object.assign /*#__PURE__*/` shape that keeps it tree-shakeable |
| `validateUseClientDirective` | A component that needs `"use client"` for RSC has lost the directive |
| `validateDataSlot` | A component emits `data-slot="root"` instead of the displayName-derived slot (`card`, `card-header`) |

## Public surface

| Function | Fails when |
| --- | --- |
| `validatePublicExports` | The barrel exports something that should not be public, or omits something that should |
| `validateExportsMap` | `package.json#exports` drifts from the generated map — i.e. `src/index.ts` changed without `pnpm sync:exports` |
| `validateArchitectureCensus` | The census counts or name lists in [`/registry/component-census.md`](/registry/component-census.md) disagree with `src/index.ts` |
| `validateCountConsistency` | Component counts disagree across the artifacts that state them |
| `validateReadmeDrift` | The README mentions a `Component` in backticks that is not exported from `src/index.ts` |
| `validateNpmTarball` | The packed tarball is missing a file it must ship |

## Design system

| Function | Fails when |
| --- | --- |
| `validateDesignSystemFidelity` | Geist fonts or the Vercel type scale drift from the normative spec |
| `validateDocsTypography` | [`/design-system/typography.md`](/design-system/typography.md) loses its `Geist` reference, or names a superseded font family above `## Histórico` |
| `validateNoLiteralTailwindColors` | A file under `src/components/**` uses a literal Tailwind color class ([ADR-0004](/decisions/adr-0004-no-literal-tailwind-colors.md)) |
| `validateThemeContrast` | Any theme × mode × critical pair falls below its WCAG AA ratio |

## Registry

| Function | Fails when |
| --- | --- |
| `validateRegistryStoriesAndTests` | A registry item lacks its story or test |
| `validateRegistryPresetDep` | The registry preset dependency is missing or wrong |

## Accessibility

| Function | Fails when |
| --- | --- |
| `validateAxeCoverage` | Fewer than 30 interactive primitives run vitest-axe. The interactive list is **hardcoded on purpose** — adding a new interactive primitive must be a conscious decision, and missing coverage fails before merge rather than after |

## Governance and hygiene

| Function | Fails when |
| --- | --- |
| `validateGovernanceFiles` | `LICENSE`, `CHANGELOG.md`, or `README.md` is missing, or `CHANGELOG.md` lacks a `## [Unreleased]` section |
| `validateScriptsAndCi` | Required scripts or CI wiring are absent; also asserts the quality-gate knowledge file exists |
| `validateNoStrayArtifacts` | A `*.bak` or `*.json.tmp` file is left in the working tree |

# Knowledge files the validator reads

Three checks read files in this bundle. They are load-bearing: deleting or renaming one of
these breaks the build.

| File | Read by | Written by |
| --- | --- | --- |
| [`/registry/component-census.md`](/registry/component-census.md) | `validateArchitectureCensus` | `pnpm sync:readme` |
| [`/design-system/typography.md`](/design-system/typography.md) | `validateDocsTypography` | by hand |
| `wiki/quality-gates/index.md` (navigation index) | `main()` existence check | by hand |

Before 2026-08-11 these paths were `docs/architecture.md`, `docs/design-system.md`, and
`docs/quality-gates.md`. The scripts were re-pointed when `docs/` was replaced by this
bundle. The full crawl boundary is recorded in the bundle log.

# Why each check exists

None of these were designed up front. Each closed a defect that had already shipped.

- `validateReadmeDrift` — the README listed six components that did not exist
  (`ToolPalette`, `TerminalPane`, `TerminalLine`, `TaskBreadcrumbs`, `TaskStatusPill`,
  `ShellCommandCard`).
- `validateArchitectureCensus` — badges declared 84 components / 162 tests / 33 registry
  items while the code had 99 / 389 / 109.
- `validateDocsTypography` — the design-system doc and the `violet-forge.ts` JSDoc both
  still described the Boska/Switzer direction after the code shipped Geist.
- `validateGovernanceFiles` — `LICENSE` and `CHANGELOG.md` were absent while
  `package.json` declared Apache-2.0.
- `validateCompositeBarrel` — composites were reaching past the barrel into raw files.
- `validateCompoundPattern` — dot-namespace components were defeating tree-shaking.
- `validateNoLiteralTailwindColors` — twelve literal color classes across four components
  silently broke theme switching.

That history is the argument for the standing rule: **fix the root cause, never disable the
gate.**
