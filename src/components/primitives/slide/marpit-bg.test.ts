import type { Root } from "mdast";
import { describe, expect, it } from "vitest";
import { extractMarpitBackgrounds } from "./marpit-bg.js";
import { parseBody } from "./parse.js";

async function md(input: string): Promise<Root> {
  return parseBody(input);
}

describe("extractMarpitBackgrounds (T4.1)", () => {
  it("extracts ![bg](url) and drops the paragraph", async () => {
    const tree = await md("![bg](https://example.com/a.png)\n\n# title");
    const { tree: result, background } = extractMarpitBackgrounds(tree);
    expect(background).toEqual({ url: "https://example.com/a.png", modifier: undefined });
    // First paragraph (the bg image) removed; heading remains.
    expect(result.children.some((c) => c.type === "heading")).toBe(true);
    expect(
      result.children.some(
        (c) => c.type === "paragraph" && JSON.stringify(c).includes("example.com/a.png"),
      ),
    ).toBe(false);
  });

  it("extracts ![bg cover](url) with modifier", async () => {
    const tree = await md("![bg cover](https://example.com/b.png)");
    const { background } = extractMarpitBackgrounds(tree);
    expect(background?.modifier).toBe("cover");
  });

  it("extracts ![bg fit](url)", async () => {
    const tree = await md("![bg fit](https://example.com/c.png)");
    const { background } = extractMarpitBackgrounds(tree);
    expect(background?.modifier).toBe("fit");
  });

  it("extracts ![bg left](url) and ![bg right](url)", async () => {
    const left = extractMarpitBackgrounds(await md("![bg left](https://e.test/l.png)"));
    expect(left.background?.modifier).toBe("left");
    const right = extractMarpitBackgrounds(await md("![bg right](https://e.test/r.png)"));
    expect(right.background?.modifier).toBe("right");
  });

  it("ignores ![not-bg](url) — alt does not start with 'bg'", async () => {
    const tree = await md("![photo](https://example.com/p.png)");
    const { tree: result, background } = extractMarpitBackgrounds(tree);
    expect(background).toBeUndefined();
    // The image paragraph stays in the tree.
    expect(JSON.stringify(result)).toContain("example.com/p.png");
  });

  it("ignores paragraph with mixed content (image + text)", async () => {
    const tree = await md("text before ![bg](https://e.test/x.png) text after");
    const { tree: result, background } = extractMarpitBackgrounds(tree);
    expect(background).toBeUndefined();
    expect(JSON.stringify(result)).toContain("e.test/x.png");
  });

  it("first bg wins when multiple ![bg]() in the same slide", async () => {
    const tree = await md(
      "![bg](https://example.com/first.png)\n\n![bg](https://example.com/second.png)\n\n# t",
    );
    const { tree: result, background } = extractMarpitBackgrounds(tree);
    expect(background?.url).toBe("https://example.com/first.png");
    // Both image paragraphs are dropped so they don't render twice.
    expect(JSON.stringify(result)).not.toContain("example.com/first.png");
    expect(JSON.stringify(result)).not.toContain("example.com/second.png");
    expect(result.children.some((c) => c.type === "heading")).toBe(true);
  });

  it("invalid modifier is treated as undefined (only valid 4 are kept)", async () => {
    const tree = await md("![bg totallyUnknownModifier](https://e.test/x.png)");
    const { background } = extractMarpitBackgrounds(tree);
    expect(background?.url).toBe("https://e.test/x.png");
    expect(background?.modifier).toBeUndefined();
  });

  it("no bg → tree unchanged, background undefined", async () => {
    const tree = await md("# only heading");
    const { tree: result, background } = extractMarpitBackgrounds(tree);
    expect(background).toBeUndefined();
    expect(result.children.length).toBe(1);
    expect(result.children[0]?.type).toBe("heading");
  });
});
