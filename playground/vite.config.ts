import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import autoprefixer from "autoprefixer";
import tailwindcss from "tailwindcss";
import { defineConfig } from "vite";

const rootDir = fileURLToPath(new URL("./", import.meta.url));

// Alias `@usetheo/ui` to the live src tree so the playground consumes the
// library exactly like an external consumer would (via the public barrel)
// while still hot-reloading during development.
const libEntry = fileURLToPath(new URL("../src/index.ts", import.meta.url));
const libStyles = fileURLToPath(new URL("../src/styles/global.css", import.meta.url));
const libTokens = fileURLToPath(new URL("../src/styles/tokens.css", import.meta.url));
const libFonts = fileURLToPath(new URL("../src/styles/fonts.css", import.meta.url));

export default defineConfig({
  root: rootDir,
  plugins: [react()],
  resolve: {
    alias: [
      { find: /^@usetheo\/ui\/styles\.css$/, replacement: libStyles },
      { find: /^@usetheo\/ui\/tokens\.css$/, replacement: libTokens },
      { find: /^@usetheo\/ui\/fonts\.css$/, replacement: libFonts },
      { find: /^@usetheo\/ui$/, replacement: libEntry },
    ],
  },
  css: {
    postcss: {
      plugins: [
        tailwindcss({
          config: fileURLToPath(new URL("../tailwind.config.ts", import.meta.url)),
        }),
        autoprefixer(),
      ],
    },
  },
  server: {
    port: 5180,
    open: true,
    strictPort: false,
  },
  build: {
    outDir: fileURLToPath(new URL("./dist", import.meta.url)),
    emptyOutDir: true,
  },
});
