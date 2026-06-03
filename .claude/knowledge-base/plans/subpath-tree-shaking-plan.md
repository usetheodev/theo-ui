# Plan: Subpath Tree-Shaking — emit per-component dist files so subpath exports actually shrink consumer bundles

> **Version 1.1** — incorporates 4 MUST FIX edges from
> `/edge-case-plan` (2026-05-25): EC-1 (hashed chunk names), EC-2
> (silent partial-build skip in regen script), EC-3 (incorrect
> identity-equality smoke claim), EC-4 (sed pattern non-robust for
> multi-component imports). Review at
> `.claude/knowledge-base/reviews/edge-cases/subpath-tree-shaking-edge-cases-2026-05-25.md`.
>
> **Version 1.0** — fixes a publishing-pipeline defect surfaced by the
> TheoCloud dashboard bundle audit (2026-05-24). All ~100 subpath
> exports declared in `package.json#exports` since 0.7.0 (Brief #1)
> currently point at the same `./dist/index.js` (417 KB minified),
> making them cosmetic. `import { Alert } from "@theokit/ui/alert"`
> resolves byte-identical to `import { Alert } from "@theokit/ui"`,
> and barrel tree-shaking fails in consumers because of `forwardRef`
> side-effect bailouts + `Object.assign` compound components + the
> barrel re-export chain. Result for TheoCloud (using ~30 of 116
> components): the `@theokit/ui` chunk is **43.05 KB brotli /
> 240.56 KB minified**, with **0 KB dropped** by Vite/Rollup
> tree-shaking. This plan extends the per-component dist pattern that
> already works for `whiteboard` / `slide` / `slide-deck` /
> `slide/plugins/*` to every primitive and composite, regenerates
> `package.json#exports` to point at the new files, and ships
> `0.10.0-next.0` with **measured ≥10 KB brotli savings** evidence
> against the canonical consumer.

## Context

- **Defect verified empirically (2026-05-24):**
  - `dist/index.js` = 417 KB minified, ships every component.
  - `package.json#exports` declares ~100 subpaths (`./alert`,
    `./button`, `./card`, …) all aliasing `./dist/index.js`. There
    is no `dist/alert/`, `dist/button/`, etc.
  - Verified pattern already correct for `whiteboard/index`,
    `slide/index`, `slide/plugins/{shiki,math,mermaid,emoji}/index`,
    `slide-deck/index`, `vite-plugin`, `preset-v3-legacy` (per RFC
    0001 / 0002 / 0003 / 0008 — each owns a real `dist/<name>/`).
- **Consumer impact (TheoCloud `MEET-ASYNC-AMENDMENT-2026-05-24-002`):**
  - Current `@theokit/ui` chunk: 43.05 KB brotli (cap 50 KB, 14% headroom).
  - Total initial JS: 178.28 KB brotli (cap 240 KB, 26% headroom).
  - Headroom is ENOUGH for Phase 0 of consumer migration, NOT enough
    for 6-8 more dashboard pages (each ~2-5 KB brotli incremental
    `@theokit/ui` surface).
- **Why tree-shaking from the barrel fails (verified analysis):**
  - `forwardRef<...>(...)` is a call expression — Rollup's
    conservative side-effect analysis bails out.
  - Compound components (`Object.assign(Root, { Header, Body, ... })`
    — Table, Sidebar, DangerZone, Dialog, Badge, etc.) trigger
    bailout for the entire tree.
  - `sideEffects: ["**/*.css"]` correctly preserves CSS (intentional),
    but the bundler conservatively treats barrel-level expressions
    as side-effectful until proven pure.
  - Empirically: **0 bytes** dropped from the 240 KB minified barrel
    regardless of how few exports the consumer imports.
- **Source of truth:**
  - Brief #4 — `/home/paulo/Projetos/usetheo/theo/docs/handoff/2026-05-24-theo-ui-subpath-tree-shaking-brief-4.md`
  - Current `tsup.config.ts` — uses `entry` map with 11 entries
    (`index` + 6 slide-related + `slide-deck/index` + `vite-plugin`
    + `preset-v3-legacy` + `whiteboard/index`). `splitting: false`,
    `treeshake: true`, `dts: true`.
  - Current bundle baseline — `scripts/baselines/bundle-sizes.json`
    measures 18 files within ±5% tolerance.
  - Taxonomy gate — `scripts/validate-quality-gates.ts` confirms
    zero primitive→primitive imports (good for isolation).
  - Composite→primitive imports happen via
    `../../primitives/<x>/index.js` (NEVER via the barrel) — already
    OK; shared chunks (cn, themes, react) will dedupe under
    `splitting: true`.

## Objective

Ship `@theokit/ui@0.10.0-next.0` with **real per-component dist
files** for every primitive + composite, with the barrel `import { X }
from "@theokit/ui"` preserved unchanged (back-compat). Acceptance
gate is the **measured consumer bundle-delta** against TheoCloud
dashboard: ≥10 KB brotli reduction after migrating its top 10
imports to subpath form.

Mensurable goals:

- 1 new `tsup.config.ts` entry-discovery helper (auto-glob primitives + composites)
- ~110 new dist files (`dist/primitives/<name>/index.{js,d.ts,js.map}` + `dist/composites/<name>/...`)
- 1 new script `scripts/regen-subpath-exports.ts` wired into `build`
- `package.json#exports` regenerated — every per-component subpath points at its own dist file (zero entries pointing at `./dist/index.js` except the root `"."`)
- `splitting: true` in tsup, with a verified shared-chunk graph that does NOT vendor `react`/`react-dom`
- ADR `subpath-exports-per-component.md` in `.claude/knowledge-base/decisions/`
- CHANGELOG entry under `[0.10.0-next.0]` with bundle-delta numbers
- `pnpm test` 1577+ tests green, `pnpm typecheck` zero errors, `pnpm ladle:build` green
- TheoCloud `@theokit/ui` chunk: 43.05 → ≤33 KB brotli (≥10 KB savings) after top 10 subpath migration
- npm publish `0.10.0-next.0 --tag next` + smoke install verifying subpath import returns smaller resolved module
- theo-opendocs: bump dep, update llms.txt for 0.10, redeploy
- Dogfood QA pass

## ADRs

### D1 — Auto-glob entries, never hand-maintain

- **Decision:** `tsup.config.ts` discovers primitive + composite
  entries by reading `src/components/{primitives,composites}/`
  directories at config-load time. No hand-maintained list of 116
  paths.
- **Rationale:** the previous Briefs #1/#2/#3 added components and
  `package.json#exports` already drifted (the cosmetic subpath
  entries are an existing drift). Hand-maintained entry lists rot the
  same way. Auto-glob makes "did the maintainer remember to add the
  entry?" a non-question.
- **Consequences:**
  - Config has to skip folders that don't ship `index.ts` (drafts,
    `whiteboard/`, `slide/`, `slide-deck/` because they already have
    explicit isolated entries).
  - Exclude list: `["whiteboard", "slide", "slide-deck"]` —
    case-sensitive, top-level only.

### D2 — Barrel stays; per-component dist is additive

- **Decision:** `dist/index.js` (the full barrel) continues to exist
  and continues to be the target of `import { X } from "@theokit/ui"`.
  Per-component dist files (`dist/primitives/<x>/index.js`) are
  **additive** targets reached only via subpath imports.
- **Rationale:** all existing consumers (TheoCloud, internal apps,
  external installs) use the barrel. A breaking change here would
  cascade into every downstream codebase. Additive subpath is the
  same migration shape `@mui/material` and `lucide-react` took
  (barrel still works; subpath is opt-in for bundle savings).
- **Consequences:**
  - `pnpm pack` tarball grows by the size of the per-component dist
    + their `.d.ts` files (probably +50-100 KB compressed, +500 KB
    uncompressed). Acceptable trade-off.
  - Bundle baseline JSON expands from 18 files to ~130 files. The
    tolerance ±5% per-file stays unchanged.

### D3 — `splitting: true` to dedupe shared utilities

- **Decision:** flip `tsup.config.ts` `splitting: false` →
  `splitting: true`. Tsup emits a `_chunks/` directory with shared
  pieces (cn, forwardRef wrappers, theme tokens, lucide icon
  imports) that each per-component dist references.
- **Rationale:** without splitting, tsup inlines shared code into
  every per-component bundle. With 116 components and a shared `cn`
  helper, that's ~116× duplication. With splitting, shared code
  lives in one chunk + per-component bundles are tiny.
- **Consequences:**
  - More files in `dist/` (the shared chunks).
  - Consumer-side: bundler still resolves shared chunks correctly —
    Vite/Rollup are designed for this and the slide engine already
    runs `splitting: false` only because it's a single bundled
    surface.
  - **Risk:** `vite-plugin` and `preset-v3-legacy` entries are
    consumed by tooling (Vite build pipelines), not browsers. They
    must still work as standalone files. Smoke test required.

### D4 — CSS stays barrel-level

- **Decision:** `dist/styles.css` + `dist/components.css` +
  `dist/tokens*.css` + `dist/fonts*.css` continue to be barrel-level
  monolithic files. No per-component CSS extraction.
- **Rationale:** per-component CSS would trigger a network
  waterfall (one HTTP request per imported component) that would
  more than wipe out the JS savings. Tailwind v4 also doesn't
  natively support per-component CSS extraction without an extra
  build step.
- **Consequences:**
  - Consumer still imports `@theokit/ui/styles.css` once at the app
    root. No change.
  - The 91 KB `dist/components.css` is unaffected by this plan.

### D5 — `dts: true` over all 116 entries, accept the build-time cost

- **Decision:** keep `dts: true` for all entries. Per-component
  `.d.ts` files emit alongside `.js`.
- **Rationale:** TypeScript consumers expect `import { Alert } from
  "@theokit/ui/alert"` to resolve types from a `.d.ts` at that
  subpath. Pointing `types` at the barrel `dist/index.d.ts` would
  inflate consumer typecheck time (the barrel `.d.ts` is 169 KB).
  Per-component types stay small.
- **Consequences:**
  - Build time goes up substantially (`DTS` is already the slowest
    tsup step at ~13s for 1 entry). Estimate 2-5x slower for the
    full build.
  - Mitigation: measure pre/post. If post-build is >5 min in CI,
    escalate to `dts: { entry: <only public-facing entries> }` and
    have per-component types re-export from the barrel `.d.ts`.

### D6 — Version bump 0.10.0-next.0 (minor, additive)

- **Decision:** bump `0.9.0-next.0` → `0.10.0-next.0`. Tag `next`.
- **Rationale:** zero public API broken. New subpath capability
  exposed. Minor by SemVer.
- **Consequences:** consumers can install `@theokit/ui@next` and
  opt in to subpath imports at their own pace. No forced migration.

### D7 — Acceptance is bundle-delta, not "feature shipped"

- **Decision:** the merge gate is **measured ≥10 KB brotli savings**
  on the TheoCloud `@theokit/ui` chunk after migrating its top 10
  imports to subpath. NOT "subpath imports exist and resolve".
- **Rationale:** subpath imports that fail to actually reduce bundle
  size are worse than the current state — they suggest the fix
  worked when it didn't. Bundle-delta evidence forces us to verify
  tree-shaking happens.
- **Consequences:**
  - The verification flow (link theo-ui → cloud/dashboard, switch
    imports, measure) is part of the plan.
  - If savings < 8 KB brotli, the plan FAILS — investigate why and
    fix or document why before merging.

## Dependency Graph

```
Phase 0: baseline snapshot (current dist/, bundle-sizes.json, dist sample)
   │
   ▼
Phase 1: tsup auto-glob entries + splitting:true
   │
   ▼
Phase 2: scripts/regen-subpath-exports.ts + wire into build
   │
   ▼
Phase 3: rebaseline bundle-sizes.json + verify CSS unchanged + verify splitting smoke
   │
   ▼
Phase 4: ADR + smoke tests (vite-plugin / preset-v3-legacy standalone)
   │
   ▼
Phase 5: quality:gates full chain + ladle:build + verify barrel unchanged
   │
   ▼
Phase 6: CHANGELOG + version bump 0.10.0-next.0 + npm publish (--tag next)
   │
   ▼
Phase 7: theo-opendocs bump dep + update llms.txt + redeploy
   │
   ▼
Phase 8: TheoCloud bundle-delta evidence (canary measurement)
   │
   ▼
Phase 9: Dogfood QA
```

Phases 0 → 6 are sequential. Phase 7 can run in parallel with Phase
8 once Phase 6 completes. Phase 9 is the final gate.

---

## Phase 0: Baseline snapshot

**Objective:** capture the current `dist/` shape, file count, sizes,
and bundle-baseline JSON so we can prove the after-state is a real
improvement, not regression.

### T0.1 — Snapshot current dist + measurements

#### Objective
Record current state empirically so Phase 8 evidence is comparable.

#### Evidence
- `dist/index.js` = 417 KB (per `ls -lh dist/index.js`).
- `dist/components.css` = 91 KB.
- `dist/index.d.ts` = 169 KB.
- 18 files tracked in `scripts/baselines/bundle-sizes.json`.

#### Files to edit
```
.claude/knowledge-base/baselines/2026-05-25-pre-subpath/dist-tree.txt  (NEW)
.claude/knowledge-base/baselines/2026-05-25-pre-subpath/sizes.txt      (NEW)
.claude/knowledge-base/baselines/2026-05-25-pre-subpath/pnpm-pack.txt  (NEW)
.claude/knowledge-base/baselines/2026-05-25-pre-subpath/build-time.txt (NEW)
```

#### Deep file dependency analysis

- These are baseline-capture artifacts. No code is touched.
  Comparing them against post-Phase-2 measurements is the empirical
  proof of fix.

#### Deep Dives

**Capture commands:**
```bash
cd /home/paulo/Projetos/usetheo/theo-ui
pnpm build  # ensure dist is current
find dist -maxdepth 3 -type f | sort > <out>/dist-tree.txt
du -sh dist > <out>/sizes.txt
ls -la dist/ >> <out>/sizes.txt
pnpm pack --pack-destination /tmp/usetheo-ui-pre-subpath > /dev/null
ls -lh /tmp/usetheo-ui-pre-subpath/*.tgz > <out>/pnpm-pack.txt
# Build time (rerun clean build, time it)
rm -rf dist && time pnpm build 2>&1 | tee <out>/build-time.txt
```

#### Tasks

1. `mkdir -p .claude/knowledge-base/baselines/2026-05-25-pre-subpath`
2. Run the capture commands above; write outputs.
3. Verify the `dist-tree.txt` file shows: `dist/index.js`, no
   `dist/primitives/`, no `dist/composites/`.

#### TDD

```
N/A — baseline capture, no code change.
VERIFY: cat .claude/knowledge-base/baselines/2026-05-25-pre-subpath/dist-tree.txt | grep -c "^dist/"
        — should print 18 (the current file count).
```

#### Acceptance Criteria

- [ ] All 4 baseline files exist with non-empty content.
- [ ] `dist-tree.txt` confirms no per-component dist dirs exist pre-fix.

#### DoD

- [ ] T0.1 complete; baseline committed.

---

## Phase 1: Auto-glob tsup entries

### T1.1 — Refactor `tsup.config.ts` with auto-discovery + splitting

#### Objective
Emit one bundle per primitive folder and one per composite folder,
with shared chunks for cn / themes / forwardRef wrappers.

#### Evidence
- 87 primitive folders + 27 composite folders × 1 `index.ts` each.
- The brief proposes auto-glob; the project's prior plans use the
  same pattern for whiteboard / slide / slide-deck (manually).
- Composites import primitives via barrel `index.js` — confirmed via
  `grep -rEn 'from "../../primitives/'` returning ~25 files.

#### Files to edit

```
tsup.config.ts  (MODIFY) — entry function + splitting:true
```

#### Deep file dependency analysis

- `tsup.config.ts` is the only build config. Changing it cascades
  through every `dist/*` artifact.
- The existing 11 entries (`index`, 6 slide-related, `slide-deck/index`, `whiteboard/index`, `vite-plugin`, `preset-v3-legacy`) STAY. Auto-glob ADDS to them.
- Exclude list `["whiteboard", "slide", "slide-deck"]` so auto-glob doesn't collide with the manual entries.
- `splitting: true` makes tsup emit `_chunks/` (shared code). External array stays as-is — `react`, `react-dom`, lucide-react, Radix, etc. are never bundled.

#### Deep Dives

**Auto-glob helper:**

```ts
import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";

function discoverComponentEntries(
  baseDir: string,
  prefix: "primitives" | "composites",
  exclude: ReadonlySet<string>,
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const dirent of readdirSync(baseDir, { withFileTypes: true })) {
    if (!dirent.isDirectory()) continue;
    if (exclude.has(dirent.name)) continue;
    const indexTs = join(baseDir, dirent.name, "index.ts");
    try {
      const stat = statSync(indexTs);
      if (!stat.isFile()) continue;
    } catch {
      continue; // no index.ts — skip
    }
    out[`${prefix}/${dirent.name}/index`] = indexTs;
  }
  return out;
}

const EXCLUDE = new Set(["whiteboard", "slide", "slide-deck"]);
const primitiveEntries = discoverComponentEntries(
  "src/components/primitives",
  "primitives",
  EXCLUDE,
);
const compositeEntries = discoverComponentEntries(
  "src/components/composites",
  "composites",
  EXCLUDE,
);
```

**Updated `entry` map (merge auto-glob with existing manual):**

```ts
entry: {
  index: "src/index.ts",
  // Existing isolated bundles (unchanged):
  "whiteboard/index": "src/components/primitives/whiteboard/index.ts",
  "slide/index": "src/components/primitives/slide/index.ts",
  "slide/plugins/shiki/index": "src/components/primitives/slide/plugins/shiki/index.ts",
  "slide/plugins/math/index": "src/components/primitives/slide/plugins/math/index.ts",
  "slide/plugins/mermaid/index": "src/components/primitives/slide/plugins/mermaid/index.tsx",
  "slide/plugins/emoji/index": "src/components/primitives/slide/plugins/emoji/index.ts",
  "slide-deck/index": "src/components/composites/slide-deck/index.ts",
  "vite-plugin": "src/vite-plugin.ts",
  "preset-v3-legacy": "src/preset-v3-legacy.ts",
  // NEW: auto-discovered per-component entries
  ...primitiveEntries,
  ...compositeEntries,
},
splitting: true,  // CHANGED from false
// EC-1 fix: deterministic chunk names. Default tsup uses content-hash
// (e.g. `_chunks/abc123.js`) which causes the bundle-size baseline gate
// to flag every PR with "missing on disk" once the hash changes. For
// an npm package, hashes give no cache-busting benefit (chunks resolve
// at install time, not via CDN). Stable names keep the baseline diff
// readable and the gate honest.
esbuildOptions(options) {
  options.chunkNames = "_chunks/[name]";
},
```

**Why `splitting: true` is safe:**

- `external: ["react", "react-dom", ...]` prevents framework code from leaking into shared chunks.
- Lucide-react icons are external (peer-dep) — never duplicated.
- `cn` (lib/cn.js) becomes a shared chunk used by every per-component bundle.
- ThemeProvider context stays in barrel + reused via shared chunk from any component that needs it.

**Build-time risk mitigation:**

- Measure baseline build time in T0.1.
- If post-fix build time > 3 min, escalate D5: restrict `dts` to barrel + isolated subpaths only.

#### Tasks

1. Read current `tsup.config.ts` to preserve all existing comments + external list verbatim.
2. Add `import { readdirSync, statSync } from "node:fs"` + `import { join } from "node:path"`.
3. Add the `discoverComponentEntries` helper function above the `defineConfig` call.
4. Compute `primitiveEntries` + `compositeEntries` with EXCLUDE set.
5. Merge into the `entry` map.
6. Flip `splitting: false` → `splitting: true`.
7. Run `pnpm build` and verify `dist/primitives/<name>/index.{js,d.ts}` exists for every primitive folder.
8. Verify `dist/index.js` STILL exists and STILL contains the barrel exports.

#### TDD

```
RED: smoke_dist_alert_exists           — after pnpm build, dist/primitives/alert/index.js exists
RED: smoke_dist_alert_dts_exists       — dist/primitives/alert/index.d.ts exists
RED: smoke_dist_barrel_intact          — dist/index.js exports Alert, Pagination, Table, etc.
RED: smoke_dist_excluded_unchanged     — dist/whiteboard/, dist/slide/, dist/slide-deck/ unchanged shape
RED: smoke_dist_per_primitive_count    — find dist/primitives -maxdepth 1 -type d | wc -l >= 84 (87 minus 3 excluded)
RED: smoke_dist_per_composite_count    — find dist/composites -maxdepth 1 -type d | wc -l >= 26 (27 minus 1 excluded — slide-deck)
RED: smoke_dist_no_react_in_chunks     — grep -L "react/jsx-runtime" dist/primitives/alert/index.js (jsx must come from external import)
RED: smoke_supports_index_tsx          — (EC-5) helper finds both index.ts AND index.tsx (forward-compat for future JSX-only entries)
RED: smoke_composite_subpath_small     — (EC-10) wc -c dist/composites/code-block/index.js < 5000 (CodeBlock should reference CopyButton via shared chunk, not vendor inline)
RED: smoke_chunk_names_stable          — (EC-1) ls dist/_chunks/ shows no content-hash suffixes (`/^_chunks\/[a-z-]+\.js$/` only)
GREEN: implement tsup.config.ts changes
REFACTOR: None expected
VERIFY:
  pnpm build && find dist/primitives -maxdepth 2 -name "index.js" | wc -l
  # Expect: >= 84
```

#### Acceptance Criteria

- [ ] `pnpm build` exits 0
- [ ] `dist/primitives/<name>/index.js` exists for every primitive folder except whiteboard + slide
- [ ] `dist/composites/<name>/index.js` exists for every composite folder except slide-deck
- [ ] `dist/index.js` still exports the full barrel surface (smoke `node -e "console.log(Object.keys(require('./dist/index.cjs') || (await import('./dist/index.js'))))"` includes Alert, Pagination, Table, ProjectCard, etc.)
- [ ] No `react` or `react-dom` symbols vendored into per-component bundles (`grep -L "function useState" dist/primitives/alert/index.js` succeeds)
- [ ] Build time documented (post vs pre from T0.1)

#### DoD

- [ ] T1.1 complete; tsup.config.ts changes committed but NOT pushed yet
- [ ] Pre/post build-time measured and noted

---

## Phase 2: Regenerate `package.json#exports`

### T2.1 — Write `scripts/regen-subpath-exports.ts`

#### Objective
Replace the ~100 cosmetic subpath entries in `package.json#exports`
with entries pointing at the new per-component dist files. Wire the
script into `package.json#scripts.build` so the map regenerates
automatically.

#### Evidence
- Current `scripts/sync-exports.ts` exists but builds the map from
  the *source* tree (`src/components/<layer>/<name>/`), with all
  entries pointing at the barrel. We replace it (or write a new
  script — see T2.2) so the map points at `dist/<layer>/<name>/`.
- `scripts/build-registry.ts` already reads from `dist/`-shape, so
  the codebase pattern is established.

#### Files to edit

```
scripts/regen-subpath-exports.ts  (NEW or modify existing sync-exports.ts)
package.json                      (REGENERATED by the script)
```

#### Deep file dependency analysis

- The existing `scripts/sync-exports.ts` reads the source tree and
  writes `package.json#exports` from a hard-coded "every entry
  points at `./dist/index.js`" pattern. **This is the source of the
  cosmetic-subpath defect** — it was correct at the time it was
  written but obsolete after this plan.
- Two options:
  - **(A)** Rewrite `scripts/sync-exports.ts` to also discover dist
    structure (post-build) and emit correct targets.
  - **(B)** Add a new `scripts/regen-subpath-exports.ts` that runs
    *after* `tsup` and reads `dist/`. Leave `sync-exports.ts` alone
    (or delete it).
- Choose **(B)** — clear separation: `sync-exports` knows the SOURCE
  tree (used to validate new components are wired into the barrel);
  `regen-subpath-exports` knows the DIST tree (the build artifact).

#### Deep Dives

**Script outline:**

```ts
// scripts/regen-subpath-exports.ts
import { readdirSync, readFileSync, writeFileSync, statSync } from "node:fs";
import { join } from "node:path";

const pkgPath = "package.json";
const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));

// Preserve these special entries verbatim (CSS, theme files, isolated bundles).
const PRESERVE_KEYS = new Set([
  ".",
  "./styles.css",
  "./styles-v3-legacy.css",
  "./components.css",
  "./tokens.css",
  "./tokens-v4.css",
  "./preset.css",
  "./preset",
  "./fonts.css",
  "./fonts-cdn.css",
  "./slide/themes/default.css",
  "./slide/themes/violet-forge.css",
  "./whiteboard",
  "./slide",
  "./slide/plugins/shiki",
  "./slide/plugins/math",
  "./slide/plugins/mermaid",
  "./slide/plugins/emoji",
  "./slide-deck",
  "./vite-plugin",
  "./preset-v3-legacy",
]);

const oldExports = pkg.exports as Record<string, unknown>;
const newExports: Record<string, unknown> = {};

// Step 1: preserve special entries verbatim.
for (const k of PRESERVE_KEYS) {
  if (k in oldExports) newExports[k] = oldExports[k];
}

// Step 2: for every per-component dist file, emit a real subpath.
for (const layer of ["primitives", "composites"] as const) {
  const base = `dist/${layer}`;
  try {
    for (const dirent of readdirSync(base, { withFileTypes: true })) {
      if (!dirent.isDirectory()) continue;
      const jsFile = join(base, dirent.name, "index.js");
      const dtsFile = join(base, dirent.name, "index.d.ts");
      // Guard against partial builds
      try { statSync(jsFile); statSync(dtsFile); } catch { continue; }
      const key = `./${dirent.name}`;
      newExports[key] = {
        types: `./dist/${layer}/${dirent.name}/index.d.ts`,
        import: `./dist/${layer}/${dirent.name}/index.js`,
      };
    }
  } catch (e) {
    console.warn(`Skipping ${base}: ${(e as Error).message}`);
  }
}

// Step 3: validate — no key in newExports points at ./dist/index.js
//                    except the root "." entry.
const stragglers = Object.entries(newExports).filter(
  ([k, v]) => k !== "." && typeof v === "object" && v !== null &&
              (v as { import?: string }).import === "./dist/index.js",
);
if (stragglers.length > 0) {
  console.error(
    `regen-subpath-exports: ${stragglers.length} entries still point at the barrel:`,
    stragglers.map(([k]) => k),
  );
  process.exit(1);
}

// Step 3.5 (EC-2 fix): silent-skip guard. Compare source folders against
// emitted entries. If tsup emitted a partial build (e.g. .js without
// .d.ts), step 2 above silently skipped that folder. That would leave
// the consumer with `import { X } from "@theokit/ui/x"` returning
// ERR_PACKAGE_PATH_NOT_EXPORTED at runtime. Fail loud here instead.
const EXCLUDE = new Set(["whiteboard", "slide", "slide-deck"]);
const expectedSlugs = new Set<string>();
for (const layer of ["primitives", "composites"] as const) {
  for (const d of readdirSync(`src/components/${layer}`, { withFileTypes: true })) {
    if (d.isDirectory() && !EXCLUDE.has(d.name)) expectedSlugs.add(d.name);
  }
}
const gotSlugs = new Set(
  Object.keys(newExports)
    .filter((k) => k.startsWith("./") && !PRESERVE_KEYS.has(k))
    .map((k) => k.slice(2))
);
const missing = [...expectedSlugs].filter((s) => !gotSlugs.has(s));
if (missing.length > 0) {
  console.error(
    `regen-subpath-exports: ${missing.length} components missing dist entries (partial build?):`,
    missing.sort(),
  );
  process.exit(1);
}

// Step 4: sort keys alphabetically (within each section)
const sorted = Object.fromEntries(
  Object.entries(newExports).sort(([a], [b]) => a.localeCompare(b)),
);

pkg.exports = sorted;
writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n");
console.log(
  `regen-subpath-exports: wrote ${Object.keys(sorted).length} entries.`,
);
```

**Wire into build:**

```diff
-   "build": "tsup",
+   "build": "tsup && pnpm tsx scripts/regen-subpath-exports.ts",
```

**Validation step inside the script** — refuses to write if any
non-root entry still points at `./dist/index.js`. This is the
permanent guard against the defect coming back.

#### Tasks

1. Write `scripts/regen-subpath-exports.ts` with the outline above.
2. Update `package.json#scripts.build` to run the script after tsup.
3. Run `pnpm build` end-to-end.
4. Inspect `package.json#exports` and verify:
   - `./alert` now points at `./dist/primitives/alert/index.js`
   - `./pagination` now points at `./dist/primitives/pagination/index.js`
   - `./account-menu` now points at `./dist/composites/account-menu/index.js`
   - `./code-block` now points at `./dist/composites/code-block/index.js`
   - `./whiteboard`, `./slide`, `./slide-deck` UNCHANGED
   - `./styles.css` etc. UNCHANGED
   - Root `"."` UNCHANGED
5. Confirm validation step works by deliberately introducing a
   straggler (manually edit one entry to `./dist/index.js`) and
   verifying the script exits 1.

#### TDD

```
RED: test_subpath_alert_points_at_primitive_dist  — package.json#exports["./alert"].import === "./dist/primitives/alert/index.js"
RED: test_subpath_code_block_points_at_composite_dist  — package.json#exports["./code-block"].import === "./dist/composites/code-block/index.js"
RED: test_no_stragglers_pointing_at_barrel        — no entry except "." has import === "./dist/index.js"
RED: test_no_missing_source_components            — (EC-2) every src/components/{primitives,composites}/<name>/ except EXCLUDE has a matching entry; script exits 1 if any missing
RED: test_preserve_keys_cover_all_non_kebab       — (EC-6) every non-kebab-simple key (css files, slide/themes/*, isolated engines) in old exports is in PRESERVE_KEYS
RED: test_whiteboard_unchanged                    — package.json#exports["./whiteboard"].import === "./dist/whiteboard/index.js"
RED: test_styles_css_unchanged                    — package.json#exports["./styles.css"] === "./dist/styles.css"
GREEN: implement regen-subpath-exports.ts
VERIFY: pnpm build && node --input-type=module -e "
  import { readFileSync } from 'node:fs';
  const p = JSON.parse(readFileSync('package.json', 'utf-8'));
  const stragglers = Object.entries(p.exports).filter(([k, v]) =>
    k !== '.' && v?.import === './dist/index.js');
  if (stragglers.length) { console.error('stragglers:', stragglers); process.exit(1); }
  console.log('OK', Object.keys(p.exports).length, 'entries');
"
```

#### Acceptance Criteria

- [ ] `pnpm build` exits 0 (tsup + regen-subpath-exports both succeed)
- [ ] `package.json#exports` has zero non-root entries pointing at `./dist/index.js`
- [ ] All 87-3=84 primitive subpaths + 27-1=26 composite subpaths present
- [ ] Existing CSS / theme / isolated-engine entries preserved verbatim

#### DoD

- [ ] T2.1 complete; `scripts/regen-subpath-exports.ts` committed
- [ ] `package.json#scripts.build` updated to chain the regen step

---

## Phase 3: Bundle baseline rebaseline + verify CSS unchanged

### T3.1 — Rebaseline `scripts/baselines/bundle-sizes.json`

#### Objective
Update the bundle baseline to include the ~110 new per-component
dist files so the quality:bundle gate doesn't flag them as
"unknown files".

#### Evidence
- Current baseline tracks 18 files.
- Post-Phase-1 dist will have 18 + ~110 = ~128 files.
- The baseline format already supports adding entries (used in 0.8 rebaseline).

#### Files to edit

```
scripts/baselines/bundle-sizes.json  (REGENERATED via --update)
```

#### Deep file dependency analysis

- `scripts/validate-bundle-size.ts` reads the JSON and compares
  current file sizes against baseline ±5%. Adding new entries to the
  baseline is the standard `--update` workflow.

#### Deep Dives

**Run:**

```bash
pnpm quality:bundle:update
```

Then `git diff scripts/baselines/bundle-sizes.json` should show:

- Existing 18 file sizes mostly unchanged (`dist/index.js` may shrink
  slightly due to better splitting, but stays barrel-shaped).
- ~110 new entries for `dist/primitives/<name>/index.js` (a few KB
  each) + `dist/primitives/<name>/index.d.ts` + `dist/composites/...`.
- New shared chunks under `dist/_chunks/` or similar (tsup naming).

**Sanity checks:**

- `dist/components.css` size unchanged (D4 — CSS stays barrel).
- `dist/styles.css` size unchanged.
- `dist/index.js` — may shrink by 5-10% (some code now lives in shared chunks instead of inlined).

#### Tasks

1. After Phases 1 + 2 build successfully, run `pnpm quality:bundle:update`.
2. `git diff scripts/baselines/bundle-sizes.json` — verify the CSS entries are unchanged.
3. Confirm `dist/index.js` size in the new baseline is ≤ old size (no regression to the barrel).
4. Confirm new per-component entries exist with reasonable sizes (1-5 KB minified each on average).

#### TDD

```
RED: bundle_css_unchanged       — dist/components.css size == previous baseline
RED: bundle_styles_unchanged    — dist/styles.css size == previous baseline
RED: bundle_barrel_not_larger   — dist/index.js size <= previous baseline
RED: bundle_new_entries_present — bundle-sizes.json has entries for dist/primitives/alert/index.js, dist/composites/code-block/index.js
RED: bundle_small_file_tolerance — (EC-11) for files < 5 KB, ±5% may be too tight (±51 bytes). Validate determinism by running `pnpm build && pnpm quality:bundle && pnpm build && pnpm quality:bundle` and confirming the second run does NOT flag any per-component file.
GREEN: pnpm quality:bundle:update; validate manually
VERIFY: pnpm quality:bundle (must pass — all files within ±5% of new baseline)
```

#### Acceptance Criteria

- [ ] `pnpm quality:bundle` exits 0 with the new baseline
- [ ] `dist/components.css` size unchanged (CSS invariant verified)
- [ ] `dist/styles.css` size unchanged
- [ ] `dist/index.js` size not larger than previous baseline (barrel didn't bloat)

#### DoD

- [ ] T3.1 complete; baseline JSON committed

---

## Phase 4: ADR + smoke tests for non-component entries

### T4.1 — Write the ADR

#### Objective
Document the decision in `.claude/knowledge-base/decisions/` (the
canonical ADR location in this repo, per CLAUDE.md and prior ADRs).

#### Files to edit

```
.claude/knowledge-base/decisions/subpath-exports-per-component.md  (NEW)
```

#### Deep Dives

**ADR content (MADR 3.0 style):**

- **Title:** Subpath exports must point at per-component dist files (not the barrel)
- **Status:** Accepted (2026-05-25)
- **Context:** Reference Brief #4 + TheoCloud measurement evidence.
- **Decision:** Auto-glob primitives + composites in `tsup.config.ts`; regenerate `package.json#exports` after each build via `scripts/regen-subpath-exports.ts`; barrel + isolated engines (whiteboard / slide / slide-deck) keep their existing shape.
- **Alternatives rejected:**
  - **Hand-maintained per-component entries** — drift inevitable; the cosmetic-subpath defect is exactly this failure mode.
  - **Single barrel only (revert all subpaths)** — fails Brief #4's bundle-delta goal; we'd be removing surface, not adding savings.
  - **Pre-bundled UMD** — incompatible with our ESM-only stance + Tailwind v4 + the registry's shadcn-style copy-paste path.
  - **Per-component CSS** — explodes the HTTP waterfall; CSS stays barrel.
- **Trade-offs:**
  - Tarball grows ~50-100 KB compressed. Acceptable.
  - Build time goes up (DTS over 116 entries). Documented; mitigation path (D5) exists.
  - Bundle baseline JSON grows from 18 to ~128 entries.
- **Validation methodology:** TheoCloud `cd cloud/dashboard && pnpm link <theo-ui> && npm run size` produces deterministic bundle measurements. Acceptance gate: ≥10 KB brotli savings on the `@theokit/ui` chunk after migrating its top 10 imports.

### T4.2 — Smoke test `vite-plugin` + `preset-v3-legacy` after `splitting: true`

#### Objective
Verify the non-component entries (consumed by Vite tooling, not
browsers) still work as standalone files after the splitting change.

#### Evidence
- These two entries are loaded by `vite.config.ts` in consumer
  projects — they MUST resolve without React or jsx-runtime as
  side-effects.
- `splitting: true` could leak shared imports into them.

#### Tasks

1. After Phases 1 + 2 build, run:
   ```bash
   node --input-type=module -e "
     const m = await import('./dist/vite-plugin.js');
     console.log('vite-plugin exports:', Object.keys(m));
   "
   node --input-type=module -e "
     const m = await import('./dist/preset-v3-legacy.js');
     console.log('preset-v3-legacy exports:', Object.keys(m));
   "
   ```
2. Both should print the expected exports without throwing.
3. Verify the files don't `import` anything from `_chunks/` that isn't tooling-safe.

#### Acceptance Criteria

- [ ] Both smoke tests print valid exports
- [ ] No React / jsx-runtime imports leak into the standalone tool bundles

#### DoD

- [ ] T4.1 ADR committed
- [ ] T4.2 smoke tests captured into the ADR or a baseline file

---

## Phase 5: Quality gates + Ladle build + barrel verification

### T5.1 — Full `pnpm quality:gates`

#### Objective
Run the existing 11-step chain end-to-end. Zero regressions in any
gate.

#### Tasks

1. `pnpm format:check`
2. `pnpm lint:ci`
3. `pnpm typecheck`
4. `pnpm test` — expect 1577+ passing (EC-7: no regression from Brief #3 state. Tests use source paths, NOT dist, so splitting:true should not affect them — but confirm via execution.)
5. `pnpm build` — runs tsup + regen-subpath-exports
6. `pnpm registry:build && pnpm registry:validate`
7. `pnpm quality:structure` — taxonomy + README drift gates
8. `pnpm quality:bundle` — new baseline must pass
9. `pnpm quality:a11y` — 237+ Ladle axe tests
10. `pnpm ladle:build` — (EC-8) Ladle stories must still resolve all `@theokit/ui` imports. Ladle uses Vite which reads source paths, so splitting:true in tsup should not impact — but confirm `pnpm ladle:build` exits 0 AND inspect `.ladle/build/` for at least one preview HTML mentioning "Alert" or another component.

### T5.2 — Smoke test the barrel from a real install path

#### Objective
Prove `import { X } from "@theokit/ui"` (barrel) still works
identically AND `import { X } from "@theokit/ui/x"` (subpath) now
resolves to a different (smaller) file.

#### Tasks

1. `pnpm pack --pack-destination /tmp/usetheo-ui-pre-publish`
2. `cd /tmp && rm -rf smoke && mkdir smoke && cd smoke && echo '{"name":"smoke","type":"module"}' > package.json && npm install /tmp/usetheo-ui-pre-publish/*.tgz react@18 react-dom@18 lucide-react`
3. Verify (EC-3 fix — behavioral equivalence, NOT reference equality):
   ```bash
   node --input-type=module -e "
     import { Alert } from '@theokit/ui';
     import { Alert as AlertSub } from '@theokit/ui/alert';
     import { renderToString } from 'react-dom/server';
     import React from 'react';
     console.log('barrel:', Alert.displayName, '/ subpath:', AltAlert.displayName);
     const renderBarrel = renderToString(React.createElement(Alert, { intent: 'warning', title: 'x' }));
     const renderSubpath = renderToString(React.createElement(AlertSub, { intent: 'warning', title: 'x' }));
     console.log('same render output?', renderBarrel === renderSubpath);
     console.log('reference equal? (expected false — per-component dist is separate file):', Alert === AlertSub);
   "
   ```
4. `same render output?` MUST print `true`. `reference equal?` is **expected to be `false`** — per-component dist files are separate compiled modules, each defining their own `forwardRef(...)`. A `true` reference equality here would mean the subpath is re-exporting from the barrel (defeats tree-shaking).

#### Acceptance Criteria

- [ ] All 10 sub-gates green
- [ ] Barrel smoke: `Alert.displayName === "Alert"` from both import paths
- [ ] Subpath dist file (`dist/primitives/alert/index.js`) is measurably smaller than barrel

#### DoD

- [ ] T5.1, T5.2 complete

---

## Phase 6: CHANGELOG + bump + publish

### T6.1 — CHANGELOG entry

#### Files to edit

```
CHANGELOG.md  (MODIFY) — add [0.10.0-next.0] - 2026-05-25 entry above [0.9.0-next.0]
package.json  (MODIFY) — version 0.9.0-next.0 → 0.10.0-next.0
```

#### Deep Dives

CHANGELOG entry includes:

- The defect description (cosmetic subpath exports)
- The fix (auto-glob tsup + regen-subpath-exports)
- The bundle-delta numbers from Phase 8 (filled in after measurement)
- Zero breaking change reminder
- ADR reference

**EC-9 gate:** before merge, run
`grep -E '<TBD>|<placeholder>|FIXME|XXX' CHANGELOG.md` — must return
zero matches. The Phase 8 evidence step is responsible for replacing
all placeholders with measured numbers.

### T6.2 — npm publish

#### Tasks

1. Pre-check: `curl -s https://registry.npmjs.org/-/whoami -H "Authorization: Bearer $(...)"` returns `usetheodev`
2. `pnpm publish --access public --tag next --no-git-checks`
3. `npm view @theokit/ui@0.10.0-next.0 version` returns `0.10.0-next.0`
4. Smoke install from npm: `npm install @theokit/ui@0.10.0-next.0 ...` and verify the new `dist/primitives/alert/index.js` is included in `node_modules`

#### Acceptance Criteria

- [ ] `npm view @theokit/ui@0.10.0-next.0` returns version
- [ ] Fresh install includes `node_modules/@theokit/ui/dist/primitives/alert/index.js`
- [ ] Subpath import from npm install resolves to the per-component dist

#### DoD

- [ ] T6.1 + T6.2 complete

---

## Phase 7: theo-opendocs bump + llms.txt update

### T7.1 — Bump theo-opendocs dep

#### Files to edit

```
/home/paulo/Projetos/usetheo/theo-opendocs/package.json  (MODIFY) — @theokit/ui: 0.9.0 → 0.10.0
```

### T7.2 — Update llms.txt

#### Files to edit

```
/home/paulo/Projetos/usetheo/theo-ui/llms.txt  (MODIFY)
/home/paulo/Projetos/usetheo/theo-opendocs/public/llms.txt  (REGEN from theo-ui)
/home/paulo/Projetos/usetheo/theo-opendocs/public/theoui/llms.txt  (REGEN from theo-ui)
```

#### Tasks

1. Bump version line in llms.txt: 0.9.0 → 0.10.0
2. Add "Subpath imports (NEW 0.10) — every component now ships its
   own dist file at `@theokit/ui/<kebab-name>`. Bundle-delta evidence
   in the 0.10.0 CHANGELOG entry." paragraph in the "Import path
   canonical form" section.
3. Copy updated llms.txt to opendocs public/ paths.
4. Rebuild + wrangler deploy.

#### Acceptance Criteria

- [ ] llms.txt mentions 0.10.0 and the subpath capability
- [ ] `https://docs.usetheo.dev/llms.txt` returns the updated content
- [ ] No docs page regressions

#### DoD

- [ ] T7.1, T7.2 complete; opendocs deployed

---

## Phase 8: Bundle-delta evidence (TheoCloud canary)

### T8.1 — Link + migrate top 10 imports + measure

#### Objective
Produce the empirical evidence that the fix achieves the acceptance
goal: ≥10 KB brotli savings on the `@theokit/ui` chunk in TheoCloud
dashboard after migrating its top 10 imports to subpath form.

#### Evidence
- Brief #4 § "Phase 3 — Bundle-delta evidence" specifies the workflow
- TheoCloud `cloud/dashboard/package.json#size-limit` produces deterministic measurements
- Brief lists the 30-component usage inventory

#### Files to edit

```
.claude/knowledge-base/baselines/2026-05-25-post-subpath/theocloud-bundle-delta.txt  (NEW)
```

#### Deep Dives

**Workflow:**

```bash
# 1. Build theo-ui with all changes
cd /home/paulo/Projetos/usetheo/theo-ui
pnpm build

# 2. Capture pre-state in cloud/dashboard
cd /home/paulo/Projetos/usetheo/theo/cloud/dashboard
pnpm install
pnpm run build
# Note the @theokit/ui chunk size from the bundle report (current: ~43 KB brotli)

# 3. Link the development theo-ui into the consumer
pnpm link /home/paulo/Projetos/usetheo/theo-ui

# 4. Migrate top 10 imports to subpath form. EC-4 fix: do NOT use
# sed — the brief's example shows multi-component imports like
# `import { Card, Button, Avatar, Alert, ... } from "@theokit/ui"`
# which sed `s|import { X } from "@theokit/ui"|...|g` does NOT match.
# Sed migration would silently affect ~0 files and produce false-zero
# bundle delta.
#
# Instead, do the migration MANUALLY in ~13 TheoCloud dashboard files:
#   - In each .tsx that imports from "@theokit/ui", split the import
#     line so each of the top 10 components has its own line:
#       BEFORE:  import { Card, Button, Alert, OtherX, OtherY } from "@theokit/ui";
#       AFTER:   import { OtherX, OtherY } from "@theokit/ui";
#                import { Card } from "@theokit/ui/card";
#                import { Button } from "@theokit/ui/button";
#                import { Alert } from "@theokit/ui/alert";
#
# Top 10 (from brief inventory): Avatar, Badge, Alert, Button, Card,
# CodeBlock, ConfirmDialog, CopyButton, DangerZone, EmptyState.
#
# Estimated effort: ~30 min careful manual edit across ~13 files. A
# jscodeshift codemod is an acceptable alternative if available. Sed
# may be used only when an import line contains EXACTLY ONE of the
# top 10 components — verify the line first.

# 5. Build + measure
pnpm run build
pnpm run size  # produces size-limit report
```

**Acceptance threshold:** the `@theokit/ui` chunk in the size-limit
report must drop from ~43 KB brotli to ≤33 KB brotli (≥10 KB savings).

**Capture the report into:**

```
.claude/knowledge-base/baselines/2026-05-25-post-subpath/theocloud-bundle-delta.txt
```

**If savings < 8 KB brotli — STOP and investigate** (defective primitives with side-effects, missing externals, etc.).

#### Tasks

1. Build theo-ui with all changes.
2. Link into TheoCloud dashboard.
3. Migrate top 10 imports.
4. Run `pnpm run size` and capture the report.
5. Compute delta: `<pre> - <post> = <savings>` in KB brotli.
6. Write the delta into the baselines file.
7. Update the CHANGELOG entry (T6.1) with the actual numbers (it was filled with placeholders earlier).
8. Restore the consumer to barrel imports (`git restore` in `cloud/dashboard`) — the migration is the consumer's PR, not part of this plan.

#### TDD

```
RED: theocloud_bundle_chunk_under_33kb  — size-limit report: @theokit/ui chunk < 33 KB brotli
RED: theocloud_total_under_240kb        — size-limit report: total initial JS < 240 KB brotli (no regression elsewhere)
GREEN: link theo-ui → cloud/dashboard, migrate top 10, measure
VERIFY: cat .claude/knowledge-base/baselines/2026-05-25-post-subpath/theocloud-bundle-delta.txt
```

#### Acceptance Criteria

- [ ] `@theokit/ui` chunk savings ≥ 10 KB brotli (HARD GATE for merge)
- [ ] Total initial JS unchanged or smaller (no regression elsewhere)
- [ ] Evidence file committed to `.claude/knowledge-base/baselines/2026-05-25-post-subpath/`
- [ ] CHANGELOG updated with the actual delta numbers

#### DoD

- [ ] T8.1 complete; bundle-delta documented; CHANGELOG finalized

---

## Phase 9: Dogfood QA (MANDATORY)

> This phase runs AFTER all implementation phases. The plan is NOT
> complete until dogfood passes.

### T9.1 — End-to-end verification

#### Objective
Validate that the implemented changes work as a real consumer would
experience them.

#### Tasks

1. Install `@theokit/ui@0.10.0-next.0` from npm in a fresh smoke
   project.
2. Verify both import styles work:
   ```ts
   import { Alert } from "@theokit/ui";              // barrel
   import { Alert as AltAlert } from "@theokit/ui/alert";  // subpath
   ```
3. Verify SSR renders identically for both:
   ```ts
   renderToString(<Alert intent="warning" title="x" />)
   renderToString(<AltAlert intent="warning" title="x" />)
   ```
4. Pull up the live docs pages — `/theoui/primitives/alert`,
   `/theoui/primitives/pagination`, etc. — still 200.
5. Verify llms.txt mentions 0.10.0 + the subpath import capability.
6. Confirm the TheoCloud canary report from T8.1 is on file.

#### Acceptance Criteria

- [ ] Both import styles return the same component (identity equality optional, but render-equivalence required)
- [ ] All 116+ docs pages still 200
- [ ] llms.txt at `docs.usetheo.dev/llms.txt` mentions 0.10
- [ ] Bundle-delta evidence file present in repo

#### DoD

- [ ] T9.1 complete

---

## Coverage Matrix

| # | Requirement (Brief #4) | Task(s) | Resolution |
|---|---|---|---|
| 1 | `tsup.config.ts` emits per-primitive + per-composite dist files | T1.1 | Auto-glob helper + manual exclude list for whiteboard/slide/slide-deck |
| 2 | `dist/primitives/<name>/index.js` exists for every primitive folder | T1.1, T5.1 | Verified via `find dist/primitives` + smoke tests |
| 3 | `dist/composites/<name>/index.js` exists for every composite folder | T1.1, T5.1 | Same |
| 4 | `package.json#exports` entries point to per-component dist files | T2.1 | regen-subpath-exports.ts + validation step + sorted output |
| 5 | NO duplicates pointing to `./dist/index.js` | T2.1 | Validation step in regen script refuses to write if stragglers found |
| 6 | `import { X } from '@theokit/ui'` (barrel) still works identically | T5.2 | Smoke install + identity check |
| 7 | `import { X } from '@theokit/ui/<x>'` works and resolves to smaller dist | T5.2, T8.1 | Smoke + canary |
| 8 | **Bundle-delta evidence**: TheoCloud drops ≥10 KB brotli | T8.1 | TheoCloud canary; HARD merge gate |
| 9 | `pnpm test` passes — no test regressions | T5.1 | Full suite |
| 10 | `pnpm typecheck` passes — types still resolve via subpath | T5.1, T5.2 | tsup `dts: true` per entry + smoke import |
| 11 | `pnpm ladle build` passes | T5.1 | Part of quality:gates |
| 12 | CHANGELOG entry under `[0.10.0-next.0]` | T6.1 | With bundle-delta numbers from T8.1 |
| 13 | ADR `subpath-exports-per-component` | T4.1 | MADR-style ADR with alternatives + trade-offs |
| 14 | CSS stays barrel-level | T3.1 (verified unchanged) | D4 + sanity check |
| 15 | `react`/`react-dom`/`jsx-runtime` stay external | T1.1 (smoke), T4.2 | Verified via grep + smoke import |
| 16 | Build time pre/post documented | T0.1, T1.1 | Captured in baselines |
| 17 | `pnpm pack` tarball size pre/post documented | T0.1, T6.2 | Captured in baselines |
| 18 | npm published 0.10.0-next.0 --tag next | T6.2 | Standard publish |
| 19 | theo-opendocs bumped + llms.txt updated + redeployed | T7.1, T7.2 | Standard docs flow |
| 20 | `vite-plugin` + `preset-v3-legacy` smoke after splitting:true | T4.2 | Standalone import test |

**Coverage: 20/20 (100%)**

---

## Global Definition of Done

- [ ] All 10 phases (T0.1 through T9.1) completed
- [ ] All tests passing (`pnpm test`)
- [ ] Zero typecheck / lint warnings
- [ ] `pnpm quality:gates` 100% green with new baseline
- [ ] Barrel `import { X } from "@theokit/ui"` works identically (no breaking change)
- [ ] Subpath `import { X } from "@theokit/ui/x"` resolves to a real per-component dist file
- [ ] ADR `subpath-exports-per-component.md` committed
- [ ] CHANGELOG `[0.10.0-next.0]` entry with bundle-delta numbers
- [ ] `package.json` version = `0.10.0-next.0`
- [ ] npm published `@theokit/ui@0.10.0-next.0 --tag next`
- [ ] **Bundle-delta gate (HARD)**: TheoCloud `@theokit/ui` chunk drops ≥10 KB brotli after top 10 subpath migration
- [ ] theo-opendocs redeploy verified; llms.txt at `docs.usetheo.dev/llms.txt` mentions 0.10
- [ ] **Dogfood QA PASS** — T9.1 verifies both import styles, docs live, llms.txt updated, canary evidence on file
- [ ] **Runtime-metric proof** — bundle delta measured against a real consumer build (TheoCloud), not estimated

## Final Phase: Dogfood QA (MANDATORY)

(Phase 9 above.)

---

## Risk register

| Risk | Severity | Mitigation |
|---|---|---|
| DTS build time blows up (>5 min) with 116 entries | Medium | T0.1 measures baseline; T1.1 measures post; D5 escalation path documented |
| Auto-glob picks up directories without `index.ts` | Low | Helper checks `statSync(indexTs).isFile()` before adding |
| Auto-glob collides with manual whiteboard/slide entries | Medium | Exclude list `["whiteboard","slide","slide-deck"]` |
| `splitting: true` leaks shared imports into vite-plugin | Medium | T4.2 smoke test |
| `splitting: true` vendors React into shared chunks | High | T1.1 acceptance verifies grep -L "function useState" passes |
| Bundle-delta savings < 10 KB brotli | High (blocks merge) | T8.1 investigates: probably side-effects in primitive `index.ts`; fix or document in ADR before merging |
| Consumer breaks because composite expects barrel-shaped imports | Low | Composites import via `../../primitives/X/index.js` (verified); barrel still ships |
| `package.json` indentation/key-order drift after regen | Low | regen script uses `JSON.stringify(_, null, 2)` + sorted keys |
| `pnpm pack` tarball too large for npm | Very Low | npm limit is 500 MB; we're at 1.1 MB |
| Stale entries left in `package.json#exports` after a deleted component | Low | regen runs on every build; deletion propagates next build |
| Cross-platform path separators (Linux/macOS only) | Very Low | EC-12 — CLAUDE.md declares Linux/macOS support; Windows is out of scope |
| Kebab-case naming convention assumed by auto-glob | Very Low | EC-13 — `validate-quality-gates.ts` already enforces kebab-case at source level |
| `readdirSync` non-deterministic order across filesystems | Very Low | EC-14 — `regen-subpath-exports.ts` sorts keys alphabetically before writing |
| GNU sed vs BSD sed in canary migration | Very Low | EC-15 — plan uses `sed -i.bak` which works on both; manual migration (EC-4 fix) bypasses sed entirely |
| `pnpm link` may have edge cases on macOS with shared chunks | Low | EC-16 — fallback is `pnpm pack` + `pnpm install /path/to.tgz` if link fails |

---

## Open questions (to resolve before/during implementation)

1. **Should `scripts/sync-exports.ts` be deleted?** It's now obsolete
   — its only job (write subpath exports pointing at the barrel) is
   the source of the cosmetic-subpath defect. Recommend: delete in
   the same PR, ensure no script in `package.json` calls it.

2. **Does the registry need updating?** `registry/r/*.json` files
   reference components by name, not by dist path — they should be
   unaffected. Verify in T5.1 by running `pnpm registry:validate`.

3. **Does `validate-quality-gates.ts` need updating?** It enforces
   primitive-vs-composite taxonomy at the source level — also
   unaffected. Verify in T5.1.

4. **Is the bundle-delta canary repeatable in CI?** The TheoCloud
   measurement is manual today. Future plan (out-of-scope here)
   could automate it via a downstream-canary CI job.

5. **Should we publish a separate `@theokit/ui-subpath-test` as a
   smoke-validation package?** No — overengineering. The smoke
   install in T5.2 + T9.1 covers this.
