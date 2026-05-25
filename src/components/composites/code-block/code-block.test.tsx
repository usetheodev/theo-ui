import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { CodeBlock } from "./code-block.js";

function stubClipboard() {
  const writeText = vi.fn(() => Promise.resolve());
  vi.stubGlobal("navigator", { clipboard: { writeText } });
  return writeText;
}

describe("CodeBlock", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("renders code inside a <pre>", () => {
    const { container } = render(<CodeBlock code="hello world" />);
    const pre = container.querySelector("pre");
    expect(pre).not.toBeNull();
    expect(pre?.textContent).toContain("hello world");
  });

  it("adds '$ ' prefix per visible line when terminal=true", () => {
    const { container } = render(<CodeBlock code={"theo deploy\ntheo status"} terminal />);
    const prefixSpans = container.querySelectorAll("span.select-none");
    expect(prefixSpans.length).toBeGreaterThanOrEqual(2);
    for (const span of prefixSpans) {
      expect(span.textContent).toBe("$ ");
    }
  });

  it("renders CopyButton when copyable=true", () => {
    stubClipboard();
    render(<CodeBlock code="theo deploy" copyable />);
    expect(screen.getByRole("button", { name: /copy code/i })).toBeInTheDocument();
  });

  it("copy uses raw code (no terminal '$ ' prefix in clipboard value)", async () => {
    const writeText = stubClipboard();
    render(<CodeBlock code="theo deploy" terminal copyable />);
    fireEvent.click(screen.getByRole("button", { name: /copy code/i }));
    await waitFor(() => expect(writeText).toHaveBeenCalledWith("theo deploy"));
  });

  it("preserves long line with horizontal scroll", () => {
    const { container } = render(<CodeBlock code={"x".repeat(200)} />);
    const pre = container.querySelector("pre");
    expect(pre?.className).toContain("overflow-x-auto");
  });

  it("renders caption above pre when provided", () => {
    const { container } = render(<CodeBlock code="A=1" caption=".env.local" />);
    expect(screen.getByText(".env.local")).toBeInTheDocument();
    const captionEl = screen.getByText(".env.local");
    const pre = container.querySelector("pre");
    expect(captionEl.compareDocumentPosition(pre as Node) & Node.DOCUMENT_POSITION_FOLLOWING).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
  });

  it("has no axe violations", async () => {
    stubClipboard();
    const { container } = render(<CodeBlock code="theo deploy" terminal copyable caption=".cmd" />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
