/**
 * Contract: the barrel root re-exports the generic primitives that `@theokit/*`
 * packages consume.
 *
 * Why this gate exists — measured, not hypothetical:
 *
 * `@usetheo/ui` is the non-AI foundation of this package (see both packages'
 * descriptions) and holds the generic primitives; this package holds the
 * agent-specific ones. Consumers inside the `@theokit/*` scope should not have
 * to know that split — they import from `@theokit/ui` and get a button.
 *
 * Up to 0.19.0 the barrel re-exported them. 1.0.0 stopped, and nothing caught
 * it: `validate-exports.mjs` checks the export MAP shape (does the subpath
 * resolve, does it import at runtime) and never which SYMBOLS the barrel
 * carries, so five releases shipped without a Button.
 *
 * The cost landed on the consumer: `@theokit/plugin-canvas` and
 * `@theokit/plugin-forms` import these seven symbols from `@theokit/ui` and had
 * `typecheck` (10 × TS2305), `build` (DTS error) and 4 test suites red, with
 * both packages already published broken.
 * See usetheokit/theokit-plugins#9 and usetheokit/theokit-ui#40.
 *
 * The list below is the set those two plugins actually import — the measured
 * consumer contract, not a wishlist. Adding a primitive here is a deliberate
 * widening of the public API; removing one is a breaking change.
 */
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { beforeAll, describe, expect, it } from "vitest";
import { assertDistPresent } from "../support/dist-gate.js";

const PKG_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const DIST_INDEX = join(PKG_ROOT, "dist", "index.js");

/**
 * Generic primitives the `@theokit/*` packages import from this barrel.
 * `DiffViewer` is deliberately absent — it is this package's own primitive and
 * is covered by the ordinary export surface.
 */
const CONSUMED_PRIMITIVES = [
  "Alert",
  "Button",
  "CodeBlock",
  "CopyButton",
  "DropdownMenu",
  "FormField",
  "Tooltip",
] as const;

// Same guard as the sibling contract suite: this validates the BUILT dist, so it
// skips cleanly before a build and turns that skip into a hard failure at the
// publish gate (`pnpm test:contract` sets THEOKIT_REQUIRE_DIST=1).
const distBuilt = existsSync(DIST_INDEX);
assertDistPresent(distBuilt, "dist/index.js");

describe.skipIf(!distBuilt)(
  "Contract: barrel root re-exports the consumed generic primitives",
  () => {
    // Loaded once, here, rather than inside each case. Both assertions inspect the same
    // module, and the expensive part is not the assertion — it is the dynamic import of a
    // whole compiled React component library.
    //
    // That import is why this suite flaked (usetheokit/theokit-ui#124). Under vitest's 20s
    // default it timed out four times, every occurrence on `workspace` — the branch with the
    // most concurrent pushes and so the most contended runners — while `main` and `develop`
    // passed. One run reported `environment 21.22s`: the environment alone outlasted the
    // per-test budget.
    //
    // The 60s here is sized for what this does, not for a unit test. It is deliberately not
    // a fix for slowness: if this import ever genuinely takes a minute that is a real defect
    // and the ceiling should catch it. What it stops is a gate failing for a reason other
    // than the one it measures — the message read "Test timed out", which sounds like
    // infrastructure and invites a re-run, and a gate people learn to re-run is a gate that
    // has stopped gating. This one measures something real: a missing symbol here is a
    // consumer whose build is already broken.
    let mod: Record<string, unknown>;

    beforeAll(async () => {
      mod = (await import(pathToFileURL(DIST_INDEX).href)) as Record<string, unknown>;
    }, 60_000);

    it("exports every primitive the @theokit/* packages import", () => {
      // Given the plugins import these seven symbols from '@theokit/ui',
      // When we import the built barrel,
      // Then each one must be present — a missing name is a broken consumer.
      const missing = CONSUMED_PRIMITIVES.filter((name) => mod[name] === undefined);

      expect(missing).toEqual([]);
    });

    it("exports them as renderable values, not types erased at build time", () => {
      // Given a `export type { Button }` would satisfy the check above at the type
      // level while leaving nothing at runtime,
      // When we inspect each export,
      // Then every one must be a function or object (React component / namespace).
      const notRenderable = CONSUMED_PRIMITIVES.filter((name) => {
        const value = mod[name];
        return typeof value !== "function" && typeof value !== "object";
      });

      expect(notRenderable).toEqual([]);
    });
  },
);
