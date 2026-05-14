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
  onSuccess:
    "cp src/styles/tokens.css dist/tokens.css && cp src/styles/fonts.css dist/fonts.css && cp src/styles/global.css dist/styles.css",
});
