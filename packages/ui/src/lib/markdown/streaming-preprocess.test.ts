import { describe, expect, it } from "vitest";
import { preprocessStreaming } from "./streaming-preprocess.js";

describe("preprocessStreaming — basic markers", () => {
  it("closes an unclosed **bold marker", () => {
    expect(preprocessStreaming("hello **world")).toBe("hello **world**");
  });

  it("leaves a properly-closed **bold** intact", () => {
    expect(preprocessStreaming("hello **world**")).toBe("hello **world**");
  });

  it("closes an unclosed *italic marker", () => {
    expect(preprocessStreaming("a *partial")).toBe("a *partial*");
  });

  it("closes an unclosed __bold marker", () => {
    expect(preprocessStreaming("__starting")).toBe("__starting__");
  });

  it("does NOT double-close ** as two stars", () => {
    // ** is a SINGLE compound marker — closing it = adding one **, not two *.
    expect(preprocessStreaming("**x")).toBe("**x**");
  });
});

describe("preprocessStreaming — inline code", () => {
  it("closes an unterminated `inline", () => {
    expect(preprocessStreaming("call `myFunc")).toBe("call `myFunc`");
  });

  it("leaves a balanced `a` `b` pair untouched", () => {
    expect(preprocessStreaming("`a` `b`")).toBe("`a` `b`");
  });
});

describe("preprocessStreaming — fenced code", () => {
  it("closes an unterminated ```fence (highest priority)", () => {
    const input = "```typescript\nconst x = 1;\n";
    const out = preprocessStreaming(input);
    expect(out.endsWith("```")).toBe(true);
    expect(out.startsWith("```typescript")).toBe(true);
  });

  it("inside an unclosed fence, does NOT also close stray ** markers", () => {
    // If we're mid-fence, the **inside** is code text, not emphasis.
    const input = "```js\nconst s = '**not bold';\n";
    const out = preprocessStreaming(input);
    expect(out.endsWith("```")).toBe(true);
    // No extra ** appended.
    expect(out.match(/\*\*/g)?.length).toBe(1);
  });

  it("leaves a fully-closed ```fence``` untouched", () => {
    const input = "```\nhello\n```";
    expect(preprocessStreaming(input)).toBe(input);
  });
});

describe("preprocessStreaming — math", () => {
  it("closes an unterminated $inline math", () => {
    expect(preprocessStreaming("the equation $x + y")).toBe("the equation $x + y$");
  });

  it("closes an unterminated $$block math (greedy)", () => {
    expect(preprocessStreaming("$$\\sum")).toBe("$$\\sum$$");
  });

  it("does not count $$ as two single $", () => {
    expect(preprocessStreaming("$$x$$")).toBe("$$x$$");
  });

  it("ignores escaped \\$", () => {
    expect(preprocessStreaming("price: \\$5")).toBe("price: \\$5");
  });
});

describe("preprocessStreaming — links", () => {
  it("closes an unterminated [link](url", () => {
    expect(preprocessStreaming("see [docs](https://example.com")).toBe(
      "see [docs](https://example.com)",
    );
  });

  it("leaves a closed [link](url) intact", () => {
    expect(preprocessStreaming("see [docs](https://example.com)")).toBe(
      "see [docs](https://example.com)",
    );
  });

  it("does not touch a lone `(` with no matching `[…]`", () => {
    expect(preprocessStreaming("(just parens")).toBe("(just parens");
  });
});

describe("preprocessStreaming — combined", () => {
  it("closes multiple incomplete tokens in order", () => {
    const input = "**bold and `code";
    const out = preprocessStreaming(input);
    // both markers closed
    expect(out).toContain("**bold and `code");
    expect(out.endsWith("`**") || out.endsWith("**`")).toBe(true);
  });

  it("isStreaming=false short-circuits — returns input verbatim", () => {
    expect(preprocessStreaming("**unclosed", false)).toBe("**unclosed");
  });
});
