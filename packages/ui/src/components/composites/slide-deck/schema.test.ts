import { describe, expect, it } from "vitest";
import { slideDeckInput, slideDeckSlide, slideDeckTransition } from "./schema.js";

describe("slideDeckSlide", () => {
  it("accepts minimal slide with just markdown", () => {
    expect(slideDeckSlide.safeParse({ markdown: "# t" }).success).toBe(true);
  });

  it("rejects markdown > 50KB", () => {
    expect(slideDeckSlide.safeParse({ markdown: "x".repeat(50_001) }).success).toBe(false);
  });

  it("accepts kebab-case id", () => {
    expect(slideDeckSlide.safeParse({ markdown: "# t", id: "intro-slide" }).success).toBe(true);
  });

  it("rejects id with uppercase", () => {
    expect(slideDeckSlide.safeParse({ markdown: "# t", id: "IntroSlide" }).success).toBe(false);
  });

  it("rejects id with spaces", () => {
    expect(slideDeckSlide.safeParse({ markdown: "# t", id: "intro slide" }).success).toBe(false);
  });

  it("accepts notes up to 5KB", () => {
    expect(slideDeckSlide.safeParse({ markdown: "# t", notes: "n".repeat(5_000) }).success).toBe(
      true,
    );
  });

  it("rejects notes > 5KB", () => {
    expect(slideDeckSlide.safeParse({ markdown: "# t", notes: "n".repeat(5_001) }).success).toBe(
      false,
    );
  });
});

describe("slideDeckInput", () => {
  it("accepts string markdown", () => {
    expect(slideDeckInput.safeParse("# slide one\n\n---\n\n# slide two").success).toBe(true);
  });

  it("accepts array of SlideDeckSlide", () => {
    expect(slideDeckInput.safeParse([{ markdown: "# a" }, { markdown: "# b" }]).success).toBe(true);
  });

  it("rejects string > 500KB", () => {
    expect(slideDeckInput.safeParse("x".repeat(500_001)).success).toBe(false);
  });

  it("rejects array > 500 slides", () => {
    const big = Array(501).fill({ markdown: "# t" });
    expect(slideDeckInput.safeParse(big).success).toBe(false);
  });
});

describe("slideDeckTransition", () => {
  it("accepts 'none', 'fade', 'slide'", () => {
    expect(slideDeckTransition.safeParse("none").success).toBe(true);
    expect(slideDeckTransition.safeParse("fade").success).toBe(true);
    expect(slideDeckTransition.safeParse("slide").success).toBe(true);
  });

  it("rejects unknown transition", () => {
    expect(slideDeckTransition.safeParse("zoom").success).toBe(false);
  });
});
