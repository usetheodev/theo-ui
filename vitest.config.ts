import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "happy-dom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    css: false,
    // Barrel-wiring smoke tests use `await import("./index.js")`. Under the worker-pool
    // contention of the full suite (and on cold CI runners) a cold dynamic import of a heavy
    // barrel can momentarily exceed vitest's 5s default and flake.
    //
    // "observed: 5078ms" is what this said, and it is badly out of date. Re-measured
    // 2026-08-21 on a saturated machine: `agent-stream barrel` took 47750ms and
    // `MermaidDiagram error fallback` 33096ms, against 253-591ms when their own file runs
    // alone. That is 60-100x, not a momentary overshoot, and 20s does not cover it.
    //
    // The ceiling is NOT raised to chase those numbers — a barrel import taking 47s is a
    // performance problem, and a timeout that always passes stops being a hung-test guard.
    // Tracked with the measurements in usetheokit/theokit-ui#51.
    //
    // What was fixed is the inverse: two tests carried their OWN budgets BELOW this one
    // (10s and 3s), so the ceiling meant to absorb exactly this never applied to them.
    testTimeout: 20000,
    include: [
      "src/**/*.{test,spec}.{ts,tsx}",
      "scripts/**/*.{test,spec}.ts",
      // `.tsx` as well as `.ts`: a component test placed under tests/ was silently not
      // collected, and vitest reports "No test files found" only when a filter matches
      // nothing — a file added to the tree just never runs.
      "tests/**/*.{test,spec}.{ts,tsx}",
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
