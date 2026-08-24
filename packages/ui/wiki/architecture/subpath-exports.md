---
type: Architecture Reference
title: Subpath exports — from cosmetic aliases to real per-component bundles
description: What @theokit/ui/<name> resolves to today, the measured bundle history that forced the change, and the DTS trade-off that remains.
tags: [architecture, bundling, tree-shaking, exports, tsup]
sources:
  - id: arch-doc
    resource: "archive:94d9b11:docs/architecture.md"
  - id: subpath-adr
    resource: "archive:94d9b11:.claude/knowledge-base/decisions/subpath-exports-per-component.md"
    author: "human:theoui-maintainers"
  - id: subpath-announce
    resource: "archive:94d9b11:docs/announcements/0.10.0-next.0-subpath-tree-shaking.md"
generated:
  by: "claude-code/opus-5"
  at: "2026-08-11"
status: stable
---

# Current state

`package.json#exports` ships one `./<name>` entry per exported component. Each entry
points at a **real per-component dist file**, not the barrel.[^subpath-adr] The entry list
is generated: `tsup.config.ts` discovers entries by globbing
`src/components/{primitives,composites}/<name>/index.ts` at config-load time, and
`scripts/regen-subpath-exports.ts` rewrites the exports map after every build.

```
import { AgentEvent } from "@theokit/ui";              // barrel — still works, non-breaking
import { AgentEvent } from "@theokit/ui/agent-event";  // per-component dist file
```

Both forms are supported. Consumers opt into bundle savings file-by-file at their own
pace.

# The history this replaced

From `0.7.0` to `0.9.x` the subpaths were **cosmetic**: all ~100 entries pointed at the
same `./dist/index.js` (a 417 KB barrel), so
`import { Alert } from "@theokit/ui/alert"` resolved byte-identical to the barrel import.

The TheoCloud dashboard team measured the consequence:

| Metric | Measured |
| --- | --- |
| `@theokit/ui` chunk | 43.05 KB brotli / 240.56 KB minified |
| Components actually used | ~30 of 116 |
| Tree-shaking drop | **0 bytes** |

The barrel re-export chain (`export * from …` × ~100), combined with `forwardRef`
call-expressions, `Object.assign` compound components, and a conservative
`sideEffects: ["**/*.css"]` analysis, defeated Vite/Rollup's tree-shaker entirely.

# Measured outcome of the fix

| Metric | Before | After |
| --- | --- | --- |
| Barrel `dist/index.js` | 417 KB | **49 KB** (−88%) |
| Tarball (compressed) | 1.1 MB | ~1.2 MB |
| Build time | 17.72 s | 15.98 s |

The barrel shrank because component code moved into shared chunks that the barrel
references. `splitting: true` deduplicates `cn`, theme helpers, and `forwardRef` wrappers
into `dist/chunk-<hash>.js` instead of inlining them ~116 times.

# The DTS trade-off (still live)

Tsup's `rollup-plugin-dts` worker thread **cannot** generate per-component `.d.ts` for 114
entries — it dies with `ERR_WORKER_OUT_OF_MEMORY` even under
`NODE_OPTIONS=--max-old-space-size=8192` (the flag does not propagate to worker threads).

Resolution: `dts: { entry: … }` is restricted to the barrel plus the isolated engines.
Per-component subpaths point their `types` field at the barrel `dist/index.d.ts`.
TypeScript still resolves `import { Alert } from "@theokit/ui/alert"` because `Alert` is
exported from the barrel `.d.ts` too.

**What this costs:** a consumer's typecheck pulls in the full type graph regardless of
which subpath they import. **What it preserves:** the JS dist — where tree-shaking
actually matters — stays per-component and small. This same shape is why
`pnpm quality:attw` is kept out of the default gate chain; see
[`/quality-gates/gate-catalog.md`](/quality-gates/gate-catalog.md).

# Module identity is preserved

Because `splitting: true` emits one chunk per component, and both `dist/index.js` and
`dist/primitives/alert/index.js` re-export from that same chunk, Node ESM caches them as
one module:

```js
import { Alert } from "@theokit/ui";
import { Alert as AlertSub } from "@theokit/ui/alert";
Alert === AlertSub; // true
```

The edge-case review had predicted the opposite. The smoke test now asserts both
behavioral equivalence via `renderToString` **and** the positive reference equality.

# Invariants the gate protects

- `regen-subpath-exports.ts` **refuses** to write an exports map with stragglers still
  pointing at the barrel. The cosmetic-subpath defect cannot regress.
- `validateExportsMap` (part of `pnpm quality:structure`) compares the generated map
  against the live `package.json#exports`. Adding an export to `src/index.ts` without
  regenerating fails the build.
- Isolated engines (`whiteboard`, `slide`, `slide-deck`, `vite-plugin`,
  `preset-v3-legacy`) and CSS entries are preserved verbatim — see
  [`/architecture/isolated-engines.md`](/architecture/isolated-engines.md).
- The bundle baseline JSON stays at 18 top-level files. Per-component dist files are too
  granular for a ±5% tolerance to mean anything; the gate protects the barrel and the
  engines.

# Rejected alternatives

| Alternative | Why not |
| --- | --- |
| Hand-maintained per-component entries | Drift is inevitable — the cosmetic-subpath defect *was* this failure mode (correct at 0.7.0, stale by 0.9.0). |
| Revert all subpath exports | Removes capability for no gain. |
| Pre-bundled UMD | Incompatible with the ESM-only stance ([`/architecture/package-shape.md`](/architecture/package-shape.md)), the Tailwind v4 pipeline, and the registry copy-paste path. |
| Per-component CSS extraction | Explodes the HTTP waterfall — one request per imported component. CSS stays barrel-level (`dist/styles.css` + `dist/components.css`). |
| `splitting: false` with per-component bundles | Inlines shared code into all 114 bundles. ~116× duplication. |

# Industry precedent

`@radix-ui/react-*` (a package per primitive), `lucide-react`
(`lucide-react/icons/<name>`), `@mui/material` (`@mui/material/Button` is the recommended
bundle-size pattern), `react-aria-components`.
