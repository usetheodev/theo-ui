import { describe, expect, it } from "vitest";
import { parseSlide } from "../../parse.js";
import { mathPlugin } from "./index.js";

describe("mathPlugin (T7.1)", () => {
  it("returns plugin object with name 'math'", () => {
    const plugin = mathPlugin();
    expect(plugin.name).toBe("math");
    expect(typeof plugin.hastTransform).toBe("function");
  });

  it("sanitizeSchemaExtension covers ≥30 MathML tags (EC-4)", () => {
    const plugin = mathPlugin();
    const ext = plugin.sanitizeSchemaExtension;
    expect(ext?.tagNames?.length ?? 0).toBeGreaterThanOrEqual(30);
    for (const tag of [
      "math",
      "mfrac",
      "msqrt",
      "msup",
      "msub",
      "msubsup",
      "munder",
      "mover",
      "mtable",
      "mtr",
      "mtd",
      "mphantom",
      "mstyle",
      "annotation",
    ]) {
      expect(ext?.tagNames).toContain(tag);
    }
  });

  it("sanitizeSchemaExtension declares math/annotation attributes (EC-4)", () => {
    const plugin = mathPlugin();
    const ext = plugin.sanitizeSchemaExtension;
    expect(ext?.attributes?.math).toContain("xmlns");
    expect(ext?.attributes?.math).toContain("display");
    expect(ext?.attributes?.annotation).toContain("encoding");
  });

  it("renders inline $E=mc^2$ via real KaTeX", async () => {
    // Peer-dep `katex` is installed (auto-install-peers). Real render.
    const plugin = mathPlugin();
    const md = "Inline: $E=mc^2$ formula.";
    const result = await parseSlide(md, { plugins: [plugin] });
    expect(result.errors.filter((e) => e.code === "PLUGIN_ERROR")).toHaveLength(0);
    const json = JSON.stringify(result.tree);
    // KaTeX emits a `katex` className and a <span> with the math markup.
    expect(json).toContain("katex");
  });

  it("renders block $$..$$ as displayMode KaTeX", async () => {
    const plugin = mathPlugin();
    const md = "Block:\n\n$$E = mc^2$$";
    const result = await parseSlide(md, { plugins: [plugin] });
    const json = JSON.stringify(result.tree);
    expect(json).toContain("katex");
    // Display mode adds an additional class `katex-display`.
    expect(json).toContain("katex-display");
  });

  it("non-math text unchanged", async () => {
    const plugin = mathPlugin();
    const result = await parseSlide("Plain text without dollars.", { plugins: [plugin] });
    expect(result.errors.filter((e) => e.code === "PLUGIN_ERROR")).toHaveLength(0);
    const json = JSON.stringify(result.tree);
    expect(json).not.toContain("katex");
  });

  it("math inside <code> is NOT rendered (skipped by ancestor check)", async () => {
    const plugin = mathPlugin();
    const md = "Sample: `$E=mc^2$` literal";
    const result = await parseSlide(md, { plugins: [plugin] });
    const json = JSON.stringify(result.tree);
    // The math inside the code span should remain as plain `$E=mc^2$` text.
    expect(json).toContain("$E=mc^2$");
    // No KaTeX class should appear since the only match is inside <code>.
    expect(json).not.toContain("katex");
  });
});
