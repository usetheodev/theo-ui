import { describe, expect, it } from "vitest";
import { validateSlide } from "./validate.js";

describe("validateSlide (async — D11)", () => {
  it("returns a Promise (D11)", () => {
    const ret = validateSlide("# heading");
    expect(ret).toBeInstanceOf(Promise);
  });

  it("returns ok for markdown without frontmatter", async () => {
    const result = await validateSlide("# heading\n\nbody");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.input.frontmatter).toEqual({});
      expect(result.input.body).toBe("# heading\n\nbody");
      expect(result.errors).toEqual([]);
    }
  });

  it("returns ok with parsed frontmatter", async () => {
    const result = await validateSlide("---\ntheme: violet-forge\nlang: pt-BR\n---\n# slide");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.input.frontmatter).toEqual({ theme: "violet-forge", lang: "pt-BR" });
      expect(result.input.body).toBe("# slide");
    }
  });

  it("returns INVALID_FRONTMATTER for malformed YAML", async () => {
    const result = await validateSlide("---\ntheme: : :\n---\n# body");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors[0]?.code).toBe("INVALID_FRONTMATTER");
    }
  });

  it("returns INVALID_FRONTMATTER for unknown key with path", async () => {
    const result = await validateSlide("---\ntotallyUnknownKey: true\n---\n# body");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.some((e) => e.code === "INVALID_FRONTMATTER")).toBe(true);
    }
  });

  it("returns INVALID_FRONTMATTER for theme not in enum", async () => {
    const result = await validateSlide("---\ntheme: nope\n---\n# body");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      const themeErr = result.errors.find((e) => e.path.includes("theme"));
      expect(themeErr).toBeDefined();
      expect(themeErr?.code).toBe("INVALID_FRONTMATTER");
    }
  });

  it("returns FRONTMATTER_TOO_LARGE for raw frontmatter > 10KB (D14)", async () => {
    const huge = `key: ${"x".repeat(11_000)}`;
    const result = await validateSlide(`---\n${huge}\n---\n# body`);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors[0]?.code).toBe("FRONTMATTER_TOO_LARGE");
    }
  });

  it("returns CONTENT_TOO_LARGE for body > 50KB", async () => {
    const huge = "a".repeat(50_001);
    const result = await validateSlide(huge);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors[0]?.code).toBe("CONTENT_TOO_LARGE");
    }
  });

  it("returns MULTIPLE_SLIDES for body containing top-level thematic break (D12)", async () => {
    const md = "# Slide A\n\nBody A.\n\n---\n\n# Slide B";
    const result = await validateSlide(md);
    expect(result.ok).toBe(true); // still ok=true, but errors[] contains MULTIPLE_SLIDES
    if (result.ok) {
      expect(result.errors.some((e) => e.code === "MULTIPLE_SLIDES")).toBe(true);
      // Body was truncated to first slide.
      expect(result.input.body.includes("Slide B")).toBe(false);
      expect(result.input.body.includes("Slide A")).toBe(true);
    }
  });

  it("does NOT return MULTIPLE_SLIDES for --- inside fenced code block (EC-5 / D12)", async () => {
    const md = "# How to write frontmatter\n\n```yaml\n---\ntheme: default\n---\n```\n\nDone.";
    const result = await validateSlide(md);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.errors.some((e) => e.code === "MULTIPLE_SLIDES")).toBe(false);
    }
  });

  it("attaches 'got' field for type mismatches", async () => {
    const result = await validateSlide("---\ntheme: 42\n---\n# body");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      const themeErr = result.errors.find((e) => e.path.includes("theme"));
      expect(themeErr?.got).toBeDefined();
    }
  });

  it("treats empty frontmatter (---\\n\\n---) as {}", async () => {
    const result = await validateSlide("---\n\n---\n# body");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.input.frontmatter).toEqual({});
    }
  });

  it("rejects array-shaped frontmatter (YAML list at root)", async () => {
    const result = await validateSlide("---\n- one\n- two\n---\n# body");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors[0]?.code).toBe("INVALID_FRONTMATTER");
    }
  });
});
