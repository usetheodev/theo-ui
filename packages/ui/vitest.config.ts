import { cpus } from "node:os";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "happy-dom",
    globals: true,
    // vitest defaults maxForks to os.availableParallelism() — 12 here — and each fork boots a
    // full happy-dom. A single `vitest run` therefore claims every core, and two pools at once
    // (a `run` from `quality:gates` plus a stray `list --json`) put 24 CPU-bound forks on 12
    // cores. Measured 2026-08-21: load average 33.89, CPU pressure 69%, desktop unusable.
    //
    // The cap is not only about politeness to the desktop. This machine throttles hard — the
    // package sits at 99-100 C and the governor pins all cores to ~900 MHz against a 5.0 GHz
    // ceiling. Saturating 12 cores is what triggers that collapse, so fewer forks running at
    // full clock finish sooner than twelve forks running at 18% clock. The 60-100x per-test
    // blowups recorded in the testTimeout comment below were measured under exactly that
    // collapse, not under normal contention.
    //
    // `maxWorkers` is top-level on purpose: vitest 4 removed `test.poolOptions`, and the old
    // `poolOptions.forks.maxForks` spelling is accepted-then-ignored — it only emits a
    // DEPRECATED line and still spawns 12 forks. Verified here before trusting it.
    //
    // The value is a formula, not the measured 4: 4 was right for the machine it was
    // measured on, and hard-coding one host's core count into a repo that also runs on
    // CI runners of every size is how a cap becomes a bottleneck. Leaving 4 cores free
    // scales; on the 12-thread machine above it resolves to 8, and the 4-vs-12 result
    // showed the gain in that range was already noise.
    maxWorkers: Math.max(2, cpus().length - 4),
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
