import { copyFile } from "node:fs/promises";
import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  dts: true,
  sourcemap: true,
  clean: true,
  splitting: false,
  treeshake: true,
  external: ["react", "react-dom"],
  // Portable: Node fs APIs work on Linux, macOS, and Windows (the previous `cp`
  // shell invocation broke under Windows native shells).
  onSuccess: async () => {
    await copyFile("src/styles/tokens.css", "dist/tokens.css");
    await copyFile("src/styles/fonts.css", "dist/fonts.css");
    await copyFile("src/styles/global.css", "dist/styles.css");
  },
});
