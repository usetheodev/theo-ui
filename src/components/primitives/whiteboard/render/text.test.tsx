import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderText } from "./text.js";

function renderToSvg(node: React.ReactNode) {
  return render(
    <svg aria-label="test">
      <title>test</title>
      {node}
    </svg>,
  );
}

describe("renderText", () => {
  it("renders a single line text", () => {
    const { container } = renderToSvg(renderText({ type: "text", x: 10, y: 20, text: "Hello" }));
    const text = container.querySelector("text");
    expect(text?.textContent).toBe("Hello");
  });

  it("respects fontSize", () => {
    const { container } = renderToSvg(
      renderText({ type: "text", x: 10, y: 20, text: "Hi", fontSize: 32 }),
    );
    expect(container.querySelector("text")?.getAttribute("font-size")).toBe("32");
  });

  it("uses multiple <tspan> for multi-line text", () => {
    const { container } = renderToSvg(
      renderText({ type: "text", x: 10, y: 20, text: "line1\nline2\nline3" }),
    );
    const tspans = container.querySelectorAll("tspan");
    expect(tspans.length).toBe(3);
    expect(tspans[0]?.textContent).toBe("line1");
    expect(tspans[1]?.textContent).toBe("line2");
    expect(tspans[2]?.textContent).toBe("line3");
  });

  it("each <tspan> sets x attribute (EC-9: required for center align to work)", () => {
    const { container } = renderToSvg(
      renderText({
        type: "text",
        x: 100,
        y: 20,
        text: "a\nb\nc",
        align: "center",
      }),
    );
    for (const tspan of container.querySelectorAll("tspan")) {
      expect(tspan.getAttribute("x")).toBe("100");
    }
  });

  it("align=center sets text-anchor=middle", () => {
    const { container } = renderToSvg(
      renderText({ type: "text", x: 10, y: 20, text: "Hi", align: "center" }),
    );
    expect(container.querySelector("text")?.getAttribute("text-anchor")).toBe("middle");
  });

  it("align=right sets text-anchor=end", () => {
    const { container } = renderToSvg(
      renderText({ type: "text", x: 10, y: 20, text: "Hi", align: "right" }),
    );
    expect(container.querySelector("text")?.getAttribute("text-anchor")).toBe("end");
  });

  it("escapes HTML via React (XSS smoke)", () => {
    const { container } = renderToSvg(
      renderText({
        type: "text",
        x: 0,
        y: 0,
        text: "<script>alert('x')</script>",
      }),
    );
    // The script tag must not be parsed as a real element.
    expect(container.querySelector("script")).toBeNull();
    expect(container.querySelector("text")?.textContent).toBe("<script>alert('x')</script>");
  });
});
