import { copyFile, mkdir, readdir } from "node:fs/promises";
import { join } from "node:path";
import { defineConfig } from "tsup";

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
  },
  format: ["esm"],
  dts: true,
  sourcemap: true,
  clean: true,
  splitting: false,
  treeshake: true,
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
    // via `@import "@usetheo/ui/preset.css"`).
    await copyFile("src/styles/preset.css", "dist/preset.css");
    // Geist woff2 assets — self-hosted by default per HIGH-002 / D6.
    // dist/fonts/ mirrors src/styles/fonts/ so the relative URLs in
    // fonts.css (`./fonts/geist-400.woff2`) resolve correctly inside the
    // consumer's node_modules/@usetheo/ui/dist/ tree.
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
    // dist/slide/themes/ so consumers can `import "@usetheo/ui/slide/themes/default.css"`.
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
