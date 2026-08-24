import { describe, expect, it } from "vitest";
import { countFragmentsInMarkdown } from "./fragments.js";

describe("countFragmentsInMarkdown", () => {
  it("returns 0 when no '*' lists", () => {
    expect(countFragmentsInMarkdown("# heading\n\n- item one\n- item two")).toBe(0);
  });

  it("returns N for N '*' items", () => {
    const md = "# heading\n\n* one\n* two\n* three";
    expect(countFragmentsInMarkdown(md)).toBe(3);
  });

  it("fragments via '-' marker NOT counted", () => {
    expect(countFragmentsInMarkdown("- one\n- two\n- three")).toBe(0);
  });

  it("fragments via '+' marker NOT counted", () => {
    expect(countFragmentsInMarkdown("+ one\n+ two")).toBe(0);
  });

  it("does NOT count **bold** or *italic*", () => {
    const md = "Some **bold** and *italic* text.";
    expect(countFragmentsInMarkdown(md)).toBe(0);
  });

  it("does NOT count `*` inside fenced code blocks", () => {
    const md = "# heading\n\n```js\n// * not a fragment\n```\n\n* real fragment";
    expect(countFragmentsInMarkdown(md)).toBe(1);
  });

  it("nested fragment items count each level", () => {
    const md = "* one\n  * one-a\n  * one-b\n* two";
    expect(countFragmentsInMarkdown(md)).toBe(4);
  });

  it("returns 0 for empty/whitespace input", () => {
    expect(countFragmentsInMarkdown("")).toBe(0);
    expect(countFragmentsInMarkdown("   \n\n  ")).toBe(0);
  });

  it("mixed * and - markers — counts only * items (EC-9 documented behavior)", () => {
    const md = "* first\n- not a fragment\n* third";
    expect(countFragmentsInMarkdown(md)).toBe(2);
  });
});
