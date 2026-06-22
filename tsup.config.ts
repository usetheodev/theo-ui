import { readdirSync, statSync } from "node:fs";
import { copyFile, mkdir, readdir } from "node:fs/promises";
import { join } from "node:path";
import { defineConfig } from "tsup";

/**
 * Auto-discover primitive + composite folders that ship `index.ts`
 * (or `index.tsx`). Skips folders without an entry file and any name
 * in the exclude list (used to avoid colliding with the manual
 * isolated bundles for whiteboard / slide / slide-deck).
 *
 * Subpath tree-shaking plan D1 — Brief #4 / 2026-05-25.
 */
function discoverComponentEntries(
  baseDir: string,
  prefix: "primitives" | "composites",
  exclude: ReadonlySet<string>,
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const dirent of readdirSync(baseDir, { withFileTypes: true })) {
    if (!dirent.isDirectory()) continue;
    if (exclude.has(dirent.name)) continue;
    // EC-5 fix: try both index.ts and index.tsx (forward-compat for
    // future JSX-only entries; currently only slide/plugins/mermaid uses
    // .tsx but that's already a manual entry).
    for (const ext of ["index.ts", "index.tsx"] as const) {
      const candidate = join(baseDir, dirent.name, ext);
      try {
        const stat = statSync(candidate);
        if (stat.isFile()) {
          out[`${prefix}/${dirent.name}/index`] = candidate;
          break;
        }
      } catch {
        // not present — try next extension
      }
    }
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

export default defineConfig({
  entry: {
    index: "src/index.ts",
    // Engine bundle: must NOT vendor roughjs / perfect-freehand into the main
    // barrel. See ADR D3 in `.claude/knowledge-base/plans/whiteboard-view-primitive-plan.md`.
    "whiteboard/index": "src/components/primitives/whiteboard/index.ts",
    // Slide engine: must NOT vendor markdown/mdast/hast stack into the main
    // barrel. See ADR D3 in `.claude/knowledge-base/plans/slide-view-primitive-plan.md`.
    "slide/index": "src/components/primitives/slide/index.ts",
    // Slide rich-content plugins (Tier 2): each plugin owns its own bundle.
    // peer-deps for each plugin stay external — see external[] below.
    "slide/plugins/shiki/index": "src/components/primitives/slide/plugins/shiki/index.ts",
    "slide/plugins/math/index": "src/components/primitives/slide/plugins/math/index.ts",
    "slide/plugins/mermaid/index": "src/components/primitives/slide/plugins/mermaid/index.tsx",
    "slide/plugins/emoji/index": "src/components/primitives/slide/plugins/emoji/index.ts",
    // SlideDeck composite engine: orchestrates Slide primitives with deck-level
    // chrome. Subpath isolated per ADR D1 in
    // `.claude/knowledge-base/plans/slide-deck-composite-plan.md`.
    "slide-deck/index": "src/components/composites/slide-deck/index.ts",
    // RFC 0008 — TheoKit zero-config integration. Both entries must keep
    // `vite`, `@tailwindcss/vite`, `tailwindcss`, and `tailwindcss-animate`
    // EXTERNAL (see the `external` array below) so the consumer's installed
    // peers are used and the barrel is never inflated by them.
    "vite-plugin": "src/vite-plugin.ts",
    // RFC 0008 follow-up — `./preset` is now a CSS file (Tailwind v4 dropped
    // JS presets). The legacy v3 JS preset stays available under
    // `./preset-v3-legacy` for any tailwindcss@^3 consumer.
    "preset-v3-legacy": "src/preset-v3-legacy.ts",
    // M5-4 — pure sdk-tools result→props adapters. Lives in src/lib/ (utility,
    // not a component), so it needs a manual entry (the auto-glob only scans
    // src/components/). Imports nothing from @theokit/sdk-tools at runtime.
    "lib/sdk-tools-adapters/index": "src/lib/sdk-tools-adapters/index.ts",
    // Per-component entries (auto-discovered) — Brief #4 subpath
    // tree-shaking plan. The map is built from src/components/{primitives,
    // composites}/<name>/index.ts at config-load time so new components
    // ship subpath-shaped without manual entry maintenance.
    ...primitiveEntries,
    ...compositeEntries,
  },
  format: ["esm"],
  // D5 escalation — restrict `dts` to the barrel + isolated engines.
  // Generating .d.ts for all 114 per-component entries via tsup's worker
  // pool OOMs (ERR_WORKER_OUT_OF_MEMORY) because rollup-plugin-dts
  // aggregates the full type graph in memory and worker --max-old-space
  // does not propagate. Per-component types resolve via `index.d.ts`
  // (the barrel) — TypeScript still finds `Alert`/`AlertProps` from
  // `import { Alert } from "@theokit/ui/alert"` because regen-subpath-
  // exports.ts points the `types` field at the barrel for entries
  // lacking a sibling .d.ts. Trade-off: slightly larger types resolved
  // per subpath import, but build completes and the JS dist (where
  // tree-shaking actually happens) is correct.
  // Per-subpath `.d.ts` (community-standard-componentization T3.1) is emitted
  // SEPARATELY by `tsc --emitDeclarationOnly` (see `scripts/emit-dts.ts`,
  // wired into `package.json#build`). tsup's rollup-plugin-dts OOMs at 130+
  // entries (ERR_WORKER_OUT_OF_MEMORY — the worker pool does not inherit
  // --max-old-space; confirmed with `resolve:false` + 8 GB heap), so the
  // declaration build is delegated to tsc which scales fine. tsup itself
  // emits ONLY the JS here. `dts: false` keeps tsup off the type graph.
  dts: false,
  sourcemap: true,
  clean: true,
  // Brief #4 D3 — flip splitting on so shared utilities (cn, themes,
  // forwardRef wrappers, lucide imports) dedupe into _chunks/ instead
  // of inlining into every per-component bundle.
  splitting: true,
  treeshake: true,
  // RSC: `"use client"` preservation is handled POST-build by
  // `scripts/inject-use-client.ts` (wired into onSuccess below). esbuild strips
  // module-level directives during its own bundle pass when `splitting: true`
  // ("Module level directives cause errors when bundled ... was ignored"), so a
  // load-time plugin cannot win — the directive must be re-injected into the
  // output shims + component chunks after esbuild finishes. See plan ADR D2.
  // EC-1 fix (revised) — keep esbuild's default chunk naming (`chunk-
  // <hash>.js`). The first attempt at `_chunks/[name]` collided because
  // esbuild assigns the same auto-name "chunk" to many shared chunks
  // (two outputs share the same path → build error). The correct
  // mitigation for the bundle-size gate is to exclude `dist/_chunks/`
  // and any tsup-emitted shared chunks (`chunk-*.js`, `plugin-*.d.ts`)
  // from the baseline JSON entirely — they're internal implementation
  // artifacts, not consumer-facing files. Per-component dist files
  // (`dist/primitives/<name>/index.js`) are the consumer-facing
  // surfaces and DO go into the baseline.
  // `roughjs` exposes submodule imports (`roughjs/bin/svg`, `roughjs/bin/generator`)
  // that must also stay external for the isolated bundle to remain small.
  external: [
    "react",
    "react-dom",
    // Whiteboard peer-deps (D2 of whiteboard plan)
    "roughjs",
    /^roughjs\//,
    "perfect-freehand",
    // Slide peer-deps (D2 of slide plan) — markdown/mdast/hast stack stays external
    // so the isolated bundle imports them at runtime from the consumer's installed
    // peer-deps, never vendored.
    "mdast-util-from-markdown",
    "mdast-util-gfm",
    "micromark-extension-gfm",
    "mdast-util-to-hast",
    "hast-util-sanitize",
    "hast-util-to-jsx-runtime",
    "hast-util-from-html",
    "unist-util-visit",
    "unist-util-visit-parents",
    "yaml",
    /^react\/jsx-runtime/,
    // Tier 2 plugin peer-deps — must stay external so the main slide bundle
    // and individual plugin bundles do not vendor them.
    "shiki",
    /^shiki\//,
    "katex",
    /^katex\//,
    "micromark-extension-math",
    "mdast-util-math",
    "mermaid",
    /^mermaid\//,
    // RFC 0008 peer-deps for the `vite-plugin` + `preset` subpaths. All
    // optional in package.json — the entry bundle must NOT vendor them.
    "vite",
    "@tailwindcss/vite",
    "tailwindcss",
    "tailwindcss-animate",
  ],
  // Portable: Node fs APIs work on Linux, macOS, and Windows (the previous `cp`
  // shell invocation broke under Windows native shells).
  onSuccess: async () => {
    await copyFile("src/styles/tokens.css", "dist/tokens.css");
    await copyFile("src/styles/fonts.css", "dist/fonts.css");
    await copyFile("src/styles/fonts-cdn.css", "dist/fonts-cdn.css");
    // RFC 0008 follow-up — `dist/styles.css` IS the Tailwind v4 entry now
    // (`@import "tailwindcss"` + tokens + preset + @layer base). The v3
    // variant (legacy `@tailwind base/components/utilities`) lives at
    // `dist/styles-v3-legacy.css` for any remaining v3 consumer.
    await copyFile("src/styles/global-v4.css", "dist/styles.css");
    await copyFile("src/styles/global.css", "dist/styles-v3-legacy.css");
    // v4 @theme aliases (`--color-*`, `--text-*`, `--radius-*`, …) Tailwind
    // v4 needs to actually emit `.bg-primary`, `.text-body-md`, etc.
    await copyFile("src/styles/tokens-v4.css", "dist/tokens-v4.css");
    // CSS preset for consumers running their own Tailwind v4 build (chain
    // via `@import "@theokit/ui/preset.css"`).
    await copyFile("src/styles/preset.css", "dist/preset.css");
    // Geist woff2 assets — self-hosted by default per HIGH-002 / D6.
    // dist/fonts/ mirrors src/styles/fonts/ so the relative URLs in
    // fonts.css (`./fonts/geist-400.woff2`) resolve correctly inside the
    // consumer's node_modules/@theokit/ui/dist/ tree.
    await mkdir("dist/fonts", { recursive: true });
    for (const entry of await readdir("src/styles/fonts")) {
      await copyFile(join("src/styles/fonts", entry), join("dist/fonts", entry));
    }
    // RFC 0008 follow-up #2 (0.6.1-next.0) — pre-compile utility CSS at
    // library build time so consumers never depend on Tailwind v4
    // `@source` scanning the library's `node_modules` tree (which breaks
    // under pnpm symlinks). The script runs `@tailwindcss/cli` against
    // `src/styles/components-entry.css`, emits `dist/components.css` with
    // the materialized utility rules (hover/focus/active/data-state
    // variants included), and appends `@import "./components.css"` to
    // `dist/styles.css`. Idempotent — re-running is safe.
    const { spawnSync } = await import("node:child_process");
    const precompile = spawnSync("pnpm", ["tsx", "scripts/build-precompiled-css.ts"], {
      stdio: "inherit",
      encoding: "utf-8",
    });
    if (precompile.status !== 0) {
      throw new Error(
        `[tsup onSuccess] pre-compile utility CSS failed (exit ${precompile.status})`,
      );
    }

    // Slide theme CSS (D7 / T3.2 of the slide plan). Mirror src/themes/ to
    // dist/slide/themes/ so consumers can `import "@theokit/ui/slide/themes/default.css"`.
    await mkdir("dist/slide/themes", { recursive: true });
    for (const entry of await readdir("src/components/primitives/slide/themes")) {
      if (entry.endsWith(".css")) {
        await copyFile(
          join("src/components/primitives/slide/themes", entry),
          join("dist/slide/themes", entry),
        );
      }
    }
  },
});
