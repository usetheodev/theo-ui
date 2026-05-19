import { describe, expect, it } from "vitest";
import { slideFrontmatter, slideInput, slideTheme } from "./schema.js";

describe("slideFrontmatter", () => {
  it("accepts empty object (no directives)", () => {
    const result = slideFrontmatter.safeParse({});
    expect(result.success).toBe(true);
  });

  it("accepts theme: 'default'", () => {
    const result = slideFrontmatter.safeParse({ theme: "default" });
    expect(result.success).toBe(true);
  });

  it("accepts theme: 'violet-forge'", () => {
    const result = slideFrontmatter.safeParse({ theme: "violet-forge" });
    expect(result.success).toBe(true);
  });

  it("rejects theme not in enum", () => {
    const result = slideFrontmatter.safeParse({ theme: "nonexistent" });
    expect(result.success).toBe(false);
  });

  it("rejects unknown top-level keys via strict()", () => {
    const result = slideFrontmatter.safeParse({ paginate: true });
    expect(result.success).toBe(false);
  });

  it("accepts BCP-47 lang tags", () => {
    expect(slideFrontmatter.safeParse({ lang: "en" }).success).toBe(true);
    expect(slideFrontmatter.safeParse({ lang: "en-US" }).success).toBe(true);
    expect(slideFrontmatter.safeParse({ lang: "pt-BR" }).success).toBe(true);
  });

  it("rejects malformed lang tags", () => {
    expect(slideFrontmatter.safeParse({ lang: "EN_US" }).success).toBe(false);
    expect(slideFrontmatter.safeParse({ lang: "english" }).success).toBe(false);
  });

  it("accepts CSS color strings up to 64 chars", () => {
    expect(slideFrontmatter.safeParse({ color: "#000" }).success).toBe(true);
    expect(slideFrontmatter.safeParse({ color: "rgb(0,0,0)" }).success).toBe(true);
    expect(slideFrontmatter.safeParse({ color: "x".repeat(64) }).success).toBe(true);
    expect(slideFrontmatter.safeParse({ color: "x".repeat(65) }).success).toBe(false);
  });

  it("accepts backgroundColor + color combined", () => {
    const result = slideFrontmatter.safeParse({
      color: "#fff",
      backgroundColor: "#000",
    });
    expect(result.success).toBe(true);
  });

  it("rejects nested objects (strict on top level catches non-enum)", () => {
    const result = slideFrontmatter.safeParse({ theme: { name: "default" } });
    expect(result.success).toBe(false);
  });
});

describe("slideInput", () => {
  it("composes frontmatter + body", () => {
    const result = slideInput.safeParse({ frontmatter: {}, body: "# heading" });
    expect(result.success).toBe(true);
  });

  it("accepts empty body", () => {
    const result = slideInput.safeParse({ frontmatter: {}, body: "" });
    expect(result.success).toBe(true);
  });

  it("rejects body > 50000 chars", () => {
    const result = slideInput.safeParse({
      frontmatter: {},
      body: "x".repeat(50_001),
    });
    expect(result.success).toBe(false);
  });
});

describe("slideTheme", () => {
  it("includes 'default' and 'violet-forge'", () => {
    expect(slideTheme.safeParse("default").success).toBe(true);
    expect(slideTheme.safeParse("violet-forge").success).toBe(true);
  });
});
