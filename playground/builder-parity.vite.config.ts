// Dedicated Vite config for the Builder parity demo. It reuses the playground's
// aliases (so `@theokit/ui` resolves to the live src tree) but scopes the dep
// scan + build input to `builder-parity.html` only — so the pre-pivot
// `catalog.tsx` (which imports components moved to `@usetheo/ui` and no longer
// in the barrel) never loads. Run via `pnpm playground:builder`.
import { fileURLToPath } from "node:url";
import { mergeConfig } from "vite";
import base from "./vite.config.js";

export default mergeConfig(base, {
  optimizeDeps: { entries: ["builder-parity.html"] },
  server: { open: "/builder-parity.html", port: 5181 },
  build: {
    rollupOptions: {
      input: fileURLToPath(new URL("./builder-parity.html", import.meta.url)),
    },
  },
});
