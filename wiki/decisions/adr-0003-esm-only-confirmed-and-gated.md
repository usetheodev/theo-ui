---
type: Architecture Decision Record
title: "ADR 0003 — ESM-only is intentional; the consumer changes, not the library"
description: Why @theokit/ui ships no CJS build, the hydration incident that forced the decision to be made explicit, and the permanent gate that prevents the regression.
tags: [adr, esm, packaging, cross-repo, root-cause]
sources:
  - id: adr
    resource: "git:94d9b11:docs/adr/0003-esm-only-confirmed-and-gated.md"
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
| Informed | theokit and theokit-sdk maintainers |

# Context

`@theokit/ui` is a modern React library (React 19+, Vite 6+). Its `package.json` declares
`"type": "module"` and an exports map with **no `require` condition** — by design.

The decision became urgent through a real failure. During a 2026-05-28 dogfood run, a
scaffolded page did not hydrate. Root cause: `theokit`'s `theoui-detect.ts` and
`auto-detect.ts` were calling `createRequire(...).resolve()` against `@theokit/ui`, and the
ESM-only package correctly returned `ERR_PACKAGE_PATH_NOT_EXPORTED`.

The question was whether to add a `require` condition as a workaround, or to confirm
ESM-only and fix the consumer.

# Decision drivers

1. **CJS maintenance cost** — dual emit means roughly 30% more artifacts plus a permanent
   drift risk.
2. **CJS is legacy** — Node ESM has been stable since 20; every modern bundler (Vite,
   Webpack 5+, esbuild, Bun, Deno) supports ESM.
3. **No workarounds at the root cause** — `theokit` was using the wrong API. The correct
   fix is for `theokit` to change, not for the library to compromise its shape.

# Options

## A — Add a `require` condition (rejected)

```jsonc
"exports": { ".": { "import": "./dist/index.js", "require": "./dist/index.cjs" } }
```

Requires tsup dual-format emit and contract tests for both. Costs ~30% more artifacts,
introduces CJS/ESM drift risk, and **no real CJS consumer was asking for it**.

## B — Confirm ESM-only and gate the consumer (accepted)

# Outcome

`@theokit/ui` changed nothing. `theokit` changed:

- `theoui-detect.ts:resolveExportSubpath` now reads `package.json:exports[subpath]` plus a
  filesystem walk.
- `auto-detect.ts` (`resolvePackageJson` + `fallbackProbe`) uses a pure filesystem walk.
- `theokit/tests/integration/no-require-on-esm-only-deps.test.ts` — a **permanent CI gate**
  preventing the regression.
- `theokit/tests/e2e/scaffold-page-hydrates.spec.ts` — a Playwright regression gate.

On the producer side, `scripts/validate-exports.mjs` (created under
[ADR-0002](/decisions/adr-0002-dist-tag-and-prepublish-validation.md)) explicitly encodes
the invariant: check 2 validates `type: module` consistency, and check 4 skips the
`require` runtime probe when ESM-only is intentional, emitting a notice instead of a
failure.

# Consequences

**Positive.** The bundle avoids ~30% dual-emit overhead. Zero CJS/ESM drift. The consumer
is forced onto the correct API. The regression is systematically impossible.

**Negative.** Any future CJS consumer receives `ERR_PACKAGE_PATH_NOT_EXPORTED`. That error
is **clear and named, not silent** — but it does require migration. A new integration test
now lives in `theokit` (zero maintenance while the invariant holds).

# Verification

Chrome DevTools confirmed the page hydrated after the change: `hasMain: true`,
`hasTextarea: true`, 12 interactive elements. The fix was verified empirically, not
assumed.
