import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import autoprefixer from "autoprefixer";
import tailwindcss from "tailwindcss";
import { defineConfig } from "vite";

const rootDir = fileURLToPath(new URL("./", import.meta.url));

// Alias `@theokit/ui` to the live src tree so the playground consumes the
// library exactly like an external consumer would (via the public barrel)
// while still hot-reloading during development.
const libEntry = fileURLToPath(new URL("../src/index.ts", import.meta.url));
const libStyles = fileURLToPath(new URL("../src/styles/global.css", import.meta.url));
const libTokens = fileURLToPath(new URL("../src/styles/tokens.css", import.meta.url));
const libFonts = fileURLToPath(new URL("../src/styles/fonts.css", import.meta.url));
const libWhiteboard = fileURLToPath(
  new URL("../src/components/primitives/whiteboard/index.ts", import.meta.url),
);
const libSlide = fileURLToPath(
  new URL("../src/components/primitives/slide/index.ts", import.meta.url),
);
const libSlideThemeDefault = fileURLToPath(
  new URL("../src/components/primitives/slide/themes/default.css", import.meta.url),
);
const libSlideThemeVioletForge = fileURLToPath(
  new URL("../src/components/primitives/slide/themes/violet-forge.css", import.meta.url),
);
const libSlideDeck = fileURLToPath(
  new URL("../src/components/composites/slide-deck/index.ts", import.meta.url),
);
const libSlideShiki = fileURLToPath(
  new URL("../src/components/primitives/slide/plugins/shiki/index.ts", import.meta.url),
);
const libSlideMath = fileURLToPath(
  new URL("../src/components/primitives/slide/plugins/math/index.ts", import.meta.url),
);
const libSlideMermaid = fileURLToPath(
  new URL("../src/components/primitives/slide/plugins/mermaid/index.tsx", import.meta.url),
);
const libSlideEmoji = fileURLToPath(
  new URL("../src/components/primitives/slide/plugins/emoji/index.ts", import.meta.url),
);

export default defineConfig({
  root: rootDir,
  plugins: [react()],
  resolve: {
    alias: [
      { find: /^@theokit\/ui\/styles\.css$/, replacement: libStyles },
      { find: /^@theokit\/ui\/tokens\.css$/, replacement: libTokens },
      { find: /^@theokit\/ui\/fonts\.css$/, replacement: libFonts },
      { find: /^@theokit\/ui\/whiteboard$/, replacement: libWhiteboard },
      { find: /^@theokit\/ui\/slide\/themes\/default\.css$/, replacement: libSlideThemeDefault },
      {
        find: /^@theokit\/ui\/slide\/themes\/violet-forge\.css$/,
        replacement: libSlideThemeVioletForge,
      },
      { find: /^@theokit\/ui\/slide-deck$/, replacement: libSlideDeck },
      { find: /^@theokit\/ui\/slide\/plugins\/shiki$/, replacement: libSlideShiki },
      { find: /^@theokit\/ui\/slide\/plugins\/math$/, replacement: libSlideMath },
      { find: /^@theokit\/ui\/slide\/plugins\/mermaid$/, replacement: libSlideMermaid },
      { find: /^@theokit\/ui\/slide\/plugins\/emoji$/, replacement: libSlideEmoji },
      { find: /^@theokit\/ui\/slide$/, replacement: libSlide },
      { find: /^@theokit\/ui$/, replacement: libEntry },
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
