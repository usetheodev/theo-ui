/**
 * Regression for the v0.17.0 release-build failure: `resolveTailwindCliBinary`
 * looked for a NESTED `@tailwindcss/cli/node_modules/.bin/tailwindcss` shim that
 * exists only in some local pnpm layouts. Under CI's `--frozen-lockfile` install
 * (different pnpm hoist) that path is absent, so `pnpm build` failed with
 * "tailwindcss binary not found" and the OIDC publish never ran.
 *
 * The fix resolves the CLI's own `bin` entry from its `package.json` (the
 * package-manager-agnostic contract) and runs it via `node`. This test pins
 * that the resolver returns an existing JS entry, never the brittle `.bin` shim.
 */
import { existsSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { resolveTailwindCliBinary } from "./build-precompiled-css.js";

describe("resolveTailwindCliBinary", () => {
  it("resolves to an existing file (package-manager-agnostic)", () => {
    const bin = resolveTailwindCliBinary();
    expect(existsSync(bin)).toBe(true);
  });

  it("returns the package's declared bin entry, not a nested .bin shim", () => {
    const bin = resolveTailwindCliBinary();
    // The brittle path that broke CI was `.../node_modules/.bin/tailwindcss`.
    expect(bin.includes(`${"node_modules"}/.bin/`)).toBe(false);
    // The real CLI entry is an ESM script run via node.
    expect(bin.endsWith(".mjs")).toBe(true);
  });
});
