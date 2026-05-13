import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import tailwindcss from "tailwindcss";
import autoprefixer from "autoprefixer";
import { defineConfig } from "vite";

const rootDir = fileURLToPath(new URL("./", import.meta.url));

export default defineConfig({
  root: rootDir,
  plugins: [react()],
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
