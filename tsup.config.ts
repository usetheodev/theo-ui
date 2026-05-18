import { copyFile, mkdir, readdir } from "node:fs/promises";
import { join } from "node:path";
import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    // Engine bundle: must NOT vendor roughjs / perfect-freehand into the main
    // barrel. See ADR D3 in `.claude/knowledge-base/plans/whiteboard-view-primitive-plan.md`.
    "whiteboard/index": "src/components/primitives/whiteboard/index.ts",
  },
  format: ["esm"],
  dts: true,
  sourcemap: true,
  clean: true,
  splitting: false,
  treeshake: true,
  // `roughjs` exposes submodule imports (`roughjs/bin/svg`, `roughjs/bin/generator`)
  // that must also stay external for the isolated bundle to remain small.
  external: ["react", "react-dom", "roughjs", /^roughjs\//, "perfect-freehand"],
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
  },
});
