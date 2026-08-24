---
type: Architecture Contract
title: Package shape — ESM-only, the exports map, and the pre-publish gate
description: What @theokit/ui publishes, why there is no CJS build, and the six runtime checks that block a broken publish.
tags: [architecture, packaging, esm, npm, publish, contract]
sources:
  - id: adr-0003
    resource: "archive:94d9b11:docs/adr/0003-esm-only-confirmed-and-gated.md"
    author: "human:paulo"
  - id: adr-0002
    resource: "archive:94d9b11:docs/adr/0002-dist-tag-hotfix-and-prepublish-validation.md"
    author: "human:paulo"
  - id: adr-0001
    resource: "archive:94d9b11:docs/adr/0001-vite-plugin-subpath-export-contract.md"
    author: "human:paulo"
generated:
  by: "claude-code/opus-5"
  at: "2026-08-11"
status: stable
---

# ESM-only, deliberately

`package.json` declares `"type": "module"` and the exports map has **no `require`
condition**. A CJS consumer calling `require("@theokit/ui")` gets
`ERR_PACKAGE_PATH_NOT_EXPORTED` — a loud, named failure, not a silent one.[^adr-0003]

This is a decision, not an omission. See
[`/decisions/adr-0003-esm-only-confirmed-and-gated.md`](/decisions/adr-0003-esm-only-confirmed-and-gated.md)
for the full rationale and the incident that forced it to be made explicit.

# The public contract

These five subpaths are a **versioned public commitment**. Breaking any of them is a
breaking change requiring a cross-repo PR in `theokit`.[^adr-0001]

| Subpath | Shape | Breaking if changed |
| --- | --- | --- |
| `./vite-plugin` | `default: (opts?: { tailwind?: boolean }) => Plugin \| Plugin[]` carrying `name: string` | Yes — minor bump plus cross-repo PR |
| `./preset` | CSS file | Yes |
| `./styles.css` | CSS file | Yes |
| `./fonts.css` | CSS file | Yes |
| `./fonts-cdn.css` | CSS file | Yes |

Per-component subpaths (`./agent-event`, `./tool-call`, …) are covered separately in
[`/architecture/subpath-exports.md`](/architecture/subpath-exports.md).

# The pre-publish gate

```json
"prepublishOnly": "pnpm build && pnpm test:contract && node scripts/validate-exports.mjs"
```

Three layers block a broken publish:

## 1. Contract test (`tests/contract/theokit-consumer.test.ts`)

Five assertions mirroring the checks `theokit` runs on the consumer side:

- [x] Default export of `dist/vite-plugin.js` is a function.
- [x] Factory with no args returns a valid shape (`Plugin` or `Plugin[]`, each with `name: string`).
- [x] Factory with `{ tailwind: false }` does not throw.
- [x] `dist/preset.css` exists and is a `.css` file.
- [x] `dist/styles.css` and `dist/fonts.css` exist.

Path resolution uses an absolute `PKG_ROOT` computed from `import.meta.url`, not
`require.resolve('./dist/...')` — the latter resolves relative to the test file, which is
wrong (EC-1 fix).

## 2. `scripts/validate-exports.mjs`

Six runtime checks: `exports['.']` declared, `type: module` consistency, import actually
works, `require` conditional handling, the ESM-only notice, and subpath export presence.
Check 4 skips the `require` runtime probe when ESM-only is intentional and emits a notice
instead of a failure — the gate encodes the ADR-0003 invariant directly.

## 3. `publint --strict` (`pnpm quality:publint`)

Validates the exports map, `types` fields, dual-package shape, license metadata, and
npm-publish hygiene against the packed tarball.

# `npm dist-tag` is a two-eyes operation

`dist-tag` changes are **never automated**. They require a release engineer plus 2FA.
The rule exists because `latest` once pointed at `0.1.0-next.0` while the workspace was on
`0.12.0-next.0` — a stranger running `npm install @theokit/ui` got a version eleven minors
behind.[^adr-0002] A CI regression guard (`validate-ui-latest-tag.mjs`, run by the
`dogfood-stranger` workflow) now detects that drift before it reaches consumers.

# Published surface

| Artifact | Note |
| --- | --- |
| `dist/index.js` | The barrel. ~49 KB after the per-component split. |
| `dist/index.d.ts` | The full type graph — every subpath's `types` points here. |
| `dist/<layer>/<name>/index.js` | Per-component bundles. |
| `dist/styles.css` | Tailwind v4 entry (`@import "tailwindcss"`). |
| `dist/styles-v3-legacy.css` | Tailwind v3 variant, kept for v3 consumers. |
| `dist/tokens.css` | Runtime CSS variables — what `<ThemeProvider>` mutates. |
| `dist/tokens-v4.css` | Tailwind v4 `@theme` aliases layered on top of `tokens.css`. |
| `dist/preset.css` | The v4 preset. `./preset-v3-legacy` still serves the JS preset. |
| `dist/fonts.css`, `dist/fonts-cdn.css` | Geist Sans + Geist Mono. |
| `dist/whiteboard/`, `dist/slide/`, `dist/slide-deck/` | [Isolated engines](/architecture/isolated-engines.md). |
| `LICENSE`, `NOTICE`, `CHANGELOG.md`, `README.md` | Governance files — `validateGovernanceFiles` fails the build if any is missing or if `CHANGELOG.md` lacks `## [Unreleased]`. |
