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
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { resolveTailwindCliBinary, resolveUsetheoUiDist } from "./build-precompiled-css.js";

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

describe("resolveUsetheoUiDist (icon Button width regression)", () => {
  /**
   * Regression for the squished-icon-Button bug: `@theokit/ui/styles.css`
   * shipped `h-[var(--theo-control-h,2.25rem)]` (used by this repo's own
   * inputs) but NOT the `w-[…]` twin, which lives ONLY in @usetheo/ui's icon
   * Button. The precompile now @source-scans @usetheo/ui's real dist, so the
   * width utility materializes. This test pins that the scan target exists and
   * actually contains the class literal — if it does, Tailwind will emit it.
   */
  it("resolves to an existing @usetheo/ui dist directory", () => {
    const dist = resolveUsetheoUiDist();
    expect(existsSync(dist)).toBe(true);
    expect(dist.endsWith("dist")).toBe(true);
  });

  it("scan target contains the icon Button width literal Tailwind must emit", () => {
    const dist = resolveUsetheoUiDist();
    // The compiled dist preserves the CVA class string literal. Scan every
    // compiled JS entry for the icon Button's width class.
    const found = readdirSync(dist)
      .filter((f) => f.endsWith(".js"))
      .some((f) => readFileSync(join(dist, f), "utf-8").includes("w-[var(--theo-control-h,2.25rem)]"));
    expect(found).toBe(true);
  });
});
