/**
 * RSC smoke test — asserts the `"use client"` directive is preserved in the
 * built artifact so `@theokit/ui` works in Next.js App Router (Server
 * Components) when consumed via npm.
 *
 * Background: esbuild strips module-level directives under `splitting: true`.
 * `scripts/inject-use-client.ts` re-injects them post-build into client entry
 * shims + their component chunks. This test is the regression guard for that
 * fix (plan T1.1, ADR D2).
 *
 * The test reads the real `dist/` output. It is skipped gracefully when `dist/`
 * is absent (pre-build) so it never blocks a source-only test run; the
 * `quality:gates` chain always builds before testing.
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const DIST = join(process.cwd(), "dist");
const hasDist = existsSync(DIST);

function head(file: string): string {
  return readFileSync(join(DIST, file), "utf8").slice(0, 14);
}

function firstChunkReexport(shimRel: string): string | null {
  const txt = readFileSync(join(DIST, shimRel), "utf8");
  // Chunks are emitted at the dist root; capture just the basename.
  const m = txt.match(/export\s+(?:\*|\{[^}]*\})\s+from\s+['"][^'"]*?(chunk-[A-Z0-9]+\.js)['"]/);
  return m ? m[1] : null;
}

describe.skipIf(!hasDist)("RSC: use client preserved in dist", () => {
  it("client component entry shim starts with the directive", () => {
    // agent-event uses hooks → must carry the directive at its subpath entry.
    expect(head("primitives/agent-event/index.js")).toMatch(/^"use client"/);
  });

  it("the component chunk a client shim re-exports also carries the directive", () => {
    // Barrel path correctness: `@theokit/ui` re-exports from the same chunk.
    const chunk = firstChunkReexport("primitives/agent-event/index.js");
    expect(chunk).toBeTruthy();
    expect(head(chunk as string)).toMatch(/^"use client"/);
  });

  it("server-safe primitive (no hooks) does NOT carry the directive", () => {
    // Button has no hooks; tainting it client would force the whole barrel client.
    const buttonHead = head("primitives/button/index.js");
    expect(buttonHead.startsWith('"use client"')).toBe(false);
  });

  it("the barrel entry is NOT globally marked client", () => {
    const barrelHead = head("index.js");
    expect(barrelHead.startsWith('"use client"')).toBe(false);
  });

  it("every barrel-referenced client chunk carries the directive (no orphan)", () => {
    const barrel = readFileSync(join(DIST, "index.js"), "utf8");
    const chunks = [...barrel.matchAll(/from '\.\/(chunk-[A-Z0-9]+\.js)'/g)].map((m) => m[1]);
    const hookRe =
      /\b(useState|useEffect|useRef|useContext|useReducer|useId|useLayoutEffect|createContext)\b/;
    const orphans = chunks.filter((c) => {
      const txt = readFileSync(join(DIST, c), "utf8");
      const isClient = hookRe.test(txt);
      const hasDirective = txt.slice(0, 14).startsWith('"use client"');
      return isClient && !hasDirective;
    });
    expect(orphans).toEqual([]);
  });
});
