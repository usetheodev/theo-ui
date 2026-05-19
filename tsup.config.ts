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
  ],
  // Portable: Node fs APIs work on Linux, macOS, and Windows (the previous `cp`
  // shell invocation broke under Windows native shells).
  onSuccess: async () => {
    await copyFile("src/styles/tokens.css", "dist/tokens.css");
    await copyFile("src/styles/fonts.css", "dist/fonts.css");
    await copyFile("src/styles/fonts-cdn.css", "dist/fonts-cdn.css");
    await copyFile("src/styles/global.css", "dist/styles.css");
    // Geist woff2 assets — self-hosted by default per HIGH-002 / D6.
    // dist/fonts/ mirrors src/styles/fonts/ so the relative URLs in
    // fonts.css (`./fonts/geist-400.woff2`) resolve correctly inside the
    // consumer's node_modules/@usetheo/ui/dist/ tree.
    await mkdir("dist/fonts", { recursive: true });
    for (const entry of await readdir("src/styles/fonts")) {
      await copyFile(join("src/styles/fonts", entry), join("dist/fonts", entry));
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
