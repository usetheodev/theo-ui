import { fileURLToPath } from "node:url";

const srcPath = fileURLToPath(new URL("../src", import.meta.url));

export default {
  resolve: {
    alias: {
      "~": srcPath,
    },
  },
  plugins: [
    {
      // Ladle injects vite-tsconfig-paths by default and that scans reference
      // repositories under ./referencia. This explicit plugin prevents that
      // injection while keeping our local alias above.
      name: "vite:tsconfig-paths",
    },
  ],
};
