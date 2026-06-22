import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "happy-dom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    css: false,
    // Barrel-wiring smoke tests use `await import("./index.js")`. Under the
    // worker-pool contention of the full suite (and on cold CI runners) a cold
    // dynamic import of a heavy barrel can momentarily exceed vitest's 5s
    // default and flake (observed: 5078ms). 20s is a generous ceiling that
    // still hard-fails a genuinely hung test without masking logic slowness.
    testTimeout: 20000,
    include: [
      "src/**/*.{test,spec}.{ts,tsx}",
      "scripts/**/*.{test,spec}.ts",
      "tests/**/*.{test,spec}.ts",
    ],
    // tests/visual/ are Playwright specs (run via `pnpm quality:visual`).
    // Excluded from vitest to avoid duplicate runs and `expect` API mismatch.
    exclude: ["**/node_modules/**", "**/dist/**", "tests/visual/**"],
    coverage: {
      provider: "v8",
      include: ["src/**/*.{ts,tsx}"],
      // Stories are visual demos exercised by `pnpm ladle:build` + `pnpm quality:a11y`,
      // not unit tests. Barrel `index.ts` files just re-export — excluding them keeps
      // the coverage signal focused on actual implementation files.
      exclude: [
        "**/*.stories.tsx",
        "**/*.test.{ts,tsx}",
        "**/*.spec.{ts,tsx}",
        "**/index.ts",
        "src/test/**",
        "src/types/**",
        "referencia/**",
        "playground/**",
        ".ladle/**",
      ],
    },
  },
  resolve: {
    alias: {
      "~": new URL("./src", import.meta.url).pathname,
    },
  },
});
