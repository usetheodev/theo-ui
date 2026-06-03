# ADR: Subpath exports point at per-component dist files (not the barrel)

- **Status:** Accepted
- **Date:** 2026-05-25
- **Deciders:** TheoUI maintainer team
- **Plan:** `.claude/knowledge-base/plans/subpath-tree-shaking-plan.md`
- **Brief:** `theo/docs/handoff/2026-05-24-theo-ui-subpath-tree-shaking-brief-4.md`
- **Edge-case review:** `.claude/knowledge-base/reviews/edge-cases/subpath-tree-shaking-edge-cases-2026-05-25.md`

## Context

Since `@theokit/ui@0.7.0` (Brief #1), the package declared ~100 subpath exports
in `package.json#exports` (`./alert`, `./button`, `./table`, …). Every entry
pointed at the same `./dist/index.js` (the full 417 KB barrel). The subpath
form was **cosmetic**: `import { Alert } from "@theokit/ui/alert"` resolved
byte-identical to `import { Alert } from "@theokit/ui"`.

The TheoCloud dashboard team measured (MEET-ASYNC-AMENDMENT-2026-05-24-002):

```
@theokit/ui chunk:  43.05 KB brotli / 240.56 KB minified
Components used:    ~30 of 116
Tree-shaking drop:  0 bytes
```

The barrel re-export chain (`export * from "./components/primitives/alert/index.js"`
× ~100) combined with `forwardRef` call-expressions, `Object.assign` compound
components, and conservative `sideEffects: ["**/*.css"]` analysis defeats
Vite/Rollup's tree-shaker. With sufficient consumer growth (6-8 more dashboard
pages), the chunk would breach its 50 KB brotli cap.

## Decision

Emit **real per-component dist files** for every primitive and composite. The
auto-glob helper in `tsup.config.ts` discovers entries from
`src/components/{primitives,composites}/<name>/index.ts` at config-load time
(no hand-maintained entry list). Tsup `splitting: true` deduplicates shared
code (`cn`, theme helpers, forwardRef wrappers) into `dist/chunk-<hash>.js`.
After every build, `scripts/regen-subpath-exports.ts` rewrites
`package.json#exports` so per-component subpaths point at their own dist file.
Isolated engines (`whiteboard`, `slide`, `slide-deck`, `vite-plugin`,
`preset-v3-legacy`) and CSS entries are preserved verbatim.

The barrel `import { X } from "@theokit/ui"` continues to work — additive,
non-breaking. Consumers opt into bundle savings by switching to
`import { X } from "@theokit/ui/<x>"` at their own pace.

## Alternatives rejected

- **Hand-maintained per-component entries** — drift inevitable; the cosmetic
  subpath defect is exactly this failure mode (was correct at 0.7.0, stale
  by 0.9.0).
- **Revert all subpath exports** — removes capability for no gain; would block
  any consumer that wants bundle savings later.
- **Pre-bundled UMD** — incompatible with our ESM-only stance (CLAUDE.md
  locked names), Tailwind v4 pipeline, and the registry's shadcn-style
  copy-paste path.
- **Per-component CSS extraction** — would explode the HTTP waterfall (one
  request per imported component). CSS stays barrel-level (`dist/styles.css`
  + `dist/components.css`).
- **`splitting: false` with per-component bundles** — would inline shared
  code (`cn`, themes) into all 114 bundles. ~116× duplication.

## Trade-offs

- **DTS build OOM with 114 entries.** Tsup's rollup-plugin-dts worker thread
  cannot generate per-component `.d.ts` for all entries — `ERR_WORKER_OUT_OF_MEMORY`
  even with `NODE_OPTIONS=--max-old-space-size=8192` (the flag does not
  propagate to worker threads). **Resolution:** restrict `dts: { entry: ... }`
  to the barrel + isolated engines only. Per-component subpaths point their
  `types` field at the barrel `dist/index.d.ts` — TypeScript still resolves
  `import { Alert } from "@theokit/ui/alert"` because `Alert` is exported
  from the barrel `.d.ts` too. Trade-off: consumers' typecheck pulls in the
  full 167 KB type graph regardless of which subpath they import, but the
  **JS** dist (where tree-shaking matters) is per-component and small.
- **Tarball grew** from 1.1 MB to ~1.2 MB compressed. Acceptable.
- **Bundle baseline JSON** stays at 18 top-level files (per-component dist
  files are too small/granular for ±5% tolerance to be meaningful; the gate
  protects against barrel + isolated-engine regressions, not per-component
  drift).
- **Build time** went from 17.72s to 15.98s (slightly faster — splitting
  dedupes redundant work that was inlined before).
- **Barrel size shrank** from 417 KB to 49 KB (-88%) because all the
  component code now lives in shared chunks referenced by the barrel.
- **Shared-chunk identity:** because `splitting: true` produces a
  single chunk per component (e.g. `dist/chunk-W3DUDZDU.js` holds
  `Alert`) and both `dist/index.js` (barrel) AND
  `dist/primitives/alert/index.js` (subpath) re-export from the same
  chunk, Node ESM caches them as one module. `Alert === AlertSub` is
  `true` regardless of import path. EC-3 in the edge-case review
  predicted the opposite — turns out the design works even better
  than expected. Smoke test now asserts behavioral equivalence via
  `renderToString` AND the (positive) reference equality.

## Validation methodology

Acceptance gate is **measured ≥10 KB brotli savings** on the TheoCloud
`@theokit/ui` chunk after migrating its top 10 imports to subpath form.
Workflow:

1. `cd theo-ui && pnpm build && pnpm pack`
2. `cd theo/cloud/dashboard && pnpm install <theo-ui-tarball>` (or `pnpm link`)
3. Manually split multi-component imports in the consumer's ~13 dashboard
   files: replace `import { Card, Button, Alert, ... } from "@theokit/ui"`
   with one line per top-10 component using `@theokit/ui/<kebab-name>`.
4. `pnpm run build && pnpm run size` → compare `@theokit/ui` chunk size
   against the pre-migration baseline.

The hard merge gate requires ≥10 KB brotli reduction. If savings < 8 KB, the
plan investigates side-effects in primitive `index.ts` files or missing
externals before merging.

## Industry precedent

- `@radix-ui/react-*` — each primitive is its own published package
- `lucide-react` — `import { Icon } from "lucide-react/icons/icon-name"`
- `@mui/material` — `import { Button } from "@mui/material/Button"` is the
  recommended pattern for bundle size
- `react-aria-components` — per-component subpath imports

## Consequences

- Future component additions get subpath entries **automatically** via
  auto-glob. No `package.json#exports` hand-maintenance.
- The `regen-subpath-exports.ts` validation step refuses to write a
  `package.json#exports` map that still has stragglers pointing at the
  barrel. The cosmetic-subpath defect cannot regress.
- `scripts/sync-exports.ts` (the obsolete script that originally wrote the
  cosmetic exports) should be deleted in a follow-up cleanup PR.
- `validate-quality-gates.ts` (taxonomy gate) is unaffected — it reads
  source structure, not dist structure.
- Consumer migration is **opt-in**, file-by-file. TheoCloud's PR to switch
  its top 10 imports is out of scope for this ADR.
