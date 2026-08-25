import { describe, expect, it } from "vitest";
import { resolveCandidates, stripComments } from "./validate-packaged-imports.js";

/**
 * The gate that would have caught the `1.4.1` publish — usetheokit/theokit-ui#79.
 *
 * These cover the two decisions that make it trustworthy rather than merely green. Both were
 * wrong in the first draft, and both failed loudly: without the `.d.ts` mapping the gate reported
 * 327 present files as missing, and without comment stripping it reported a JSDoc usage example.
 * A gate that cries wolf is worse than no gate, because it is the one people learn to skip.
 */
describe("resolveCandidates", () => {
  it("accepts a .d.ts satisfying a .js specifier, which is how NodeNext declarations import", () => {
    const candidates = resolveCandidates(
      "dist/components/chat-message/index.d.ts",
      "./parts/reasoning-part.js",
    );

    expect(candidates).toContain("dist/components/chat-message/parts/reasoning-part.d.ts");
  });

  it("does NOT accept a .d.ts for a .js specifier inside runtime JavaScript", () => {
    const candidates = resolveCandidates("dist/index.js", "./chunk-UOMT6K3N.js");

    expect(candidates).toEqual(["dist/chunk-UOMT6K3N.js"]);
  });

  it("resolves a parent-relative specifier against the importing file's directory", () => {
    const candidates = resolveCandidates("dist/a/b/index.js", "../c/thing.js");

    expect(candidates).toEqual(["dist/a/c/thing.js"]);
  });

  it("tries index and extension forms for an extensionless specifier", () => {
    const candidates = resolveCandidates("dist/index.d.ts", "./themes");

    expect(candidates).toContain("dist/themes.d.ts");
    expect(candidates).toContain("dist/themes/index.d.ts");
  });
});

describe("stripComments", () => {
  it("drops an import that only appears inside a JSDoc example", () => {
    const source = `/**
 * import { theoUIPreset } from "./styles/tailwind-preset";
 */
export declare const theoUIPreset: unknown;`;

    expect(stripComments(source)).not.toContain("./styles/tailwind-preset");
  });

  it("drops a line comment", () => {
    expect(stripComments('// from "./gone.js"\nfrom "./kept.js"')).not.toContain("./gone.js");
  });

  it("keeps real imports", () => {
    expect(stripComments('import x from "./kept.js";')).toContain("./kept.js");
  });

  it("does not treat // inside a string as a comment — every URL contains one", () => {
    const source = 'const u = "https://example.com/x";\nimport y from "./kept.js";';

    expect(stripComments(source)).toContain("./kept.js");
    expect(stripComments(source)).toContain("https://example.com/x");
  });

  it("does not end a string at an escaped quote", () => {
    const source = 'const s = "a \\" // not a comment";\nimport y from "./kept.js";';

    expect(stripComments(source)).toContain("./kept.js");
  });

  it("leaves a separator so a comment cannot fuse two tokens", () => {
    expect(stripComments('a/*x*/from "./y.js"')).toContain('a from "./y.js"');
  });
});
