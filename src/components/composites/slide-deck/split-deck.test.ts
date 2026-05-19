import { describe, expect, it } from "vitest";
import { splitDeck } from "./split-deck.js";

describe("splitDeck", () => {
  it("returns [] for empty string", async () => {
    expect(await splitDeck("")).toEqual([]);
  });

  it("returns [] for whitespace-only string", async () => {
    expect(await splitDeck("   \n\n\t  ")).toEqual([]);
  });

  it("returns 1 slide for single-slide markdown", async () => {
    const md = "# heading\n\nbody";
    const slides = await splitDeck(md);
    expect(slides).toHaveLength(1);
    expect(slides[0]?.markdown).toContain("# heading");
    expect(slides[0]?.markdown).toContain("body");
  });

  it("splits on top-level ---", async () => {
    const md = "# slide one\n\nbody one\n\n---\n\n# slide two\n\nbody two";
    const slides = await splitDeck(md);
    expect(slides).toHaveLength(2);
    expect(slides[0]?.markdown).toContain("slide one");
    expect(slides[1]?.markdown).toContain("slide two");
  });

  it("ignores --- inside fenced code blocks (D3 / EC-5 of Slide)", async () => {
    const md = "# heading\n\n```yaml\n---\ntheme: default\n---\n```\n\ndone";
    const slides = await splitDeck(md);
    expect(slides).toHaveLength(1);
    expect(slides[0]?.markdown).toContain("```yaml");
  });

  it("strips global frontmatter first (D15 / EC-1)", async () => {
    const md =
      "---\ntheme: violet-forge\nlang: en-US\n---\n\n# Slide 1\n\nBody 1\n\n---\n\n# Slide 2";
    const slides = await splitDeck(md);
    expect(slides).toHaveLength(2);
    expect(slides[0]?.markdown).toContain("Slide 1");
    expect(slides[1]?.markdown).toContain("Slide 2");
  });

  it("does NOT produce empty first slide when frontmatter is present (D15 / EC-1)", async () => {
    const md = "---\ntheme: default\n---\n\n# Real slide";
    const slides = await splitDeck(md);
    expect(slides).toHaveLength(1);
    expect(slides[0]?.markdown).toContain("Real slide");
  });

  it("attaches notes extracted from each chunk", async () => {
    const md =
      "# Slide A\n\n<!-- notes: speaker note A -->\n\n---\n\n# Slide B\n\n<!-- note: B note -->";
    const slides = await splitDeck(md);
    expect(slides).toHaveLength(2);
    expect(slides[0]?.notes).toBe("speaker note A");
    expect(slides[1]?.notes).toBe("B note");
  });

  it("skips empty chunks (trailing ---)", async () => {
    const md = "# Slide A\n\n---\n";
    const slides = await splitDeck(md);
    expect(slides).toHaveLength(1);
    expect(slides[0]?.markdown).toContain("Slide A");
  });

  it("preserves order of slides", async () => {
    const md = "# A\n\n---\n\n# B\n\n---\n\n# C";
    const slides = await splitDeck(md);
    expect(slides.map((s) => s.markdown.split("\n")[0])).toEqual(["# A", "# B", "# C"]);
  });

  it("handles multiple thematic breaks in sequence", async () => {
    const md = "# A\n\n---\n\n# B\n\n---\n\n---\n\n# C";
    const slides = await splitDeck(md);
    // Empty chunk between `---\n---` is skipped.
    expect(slides.length).toBeGreaterThanOrEqual(3);
  });
});
