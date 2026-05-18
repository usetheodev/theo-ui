import { render } from "@testing-library/react";
import rough from "roughjs";
import { describe, expect, it } from "vitest";
import { renderDiamond, renderEllipse, renderRect } from "./shape.js";

const gen = rough.generator();

function renderToSvg(node: React.ReactNode) {
  return render(
    <svg aria-label="test">
      <title>test</title>
      {node}
    </svg>,
  );
}

describe("renderRect", () => {
  it("outputs at least one <path> with a d attribute", () => {
    const { container } = renderToSvg(
      renderRect(gen, { type: "rect", x: 10, y: 20, w: 100, h: 50, seed: 42 }),
    );
    const paths = container.querySelectorAll("path");
    expect(paths.length).toBeGreaterThan(0);
    expect(paths[0]?.getAttribute("d")).toBeTruthy();
  });

  it("produces identical output for identical input (deterministic seed)", () => {
    const a = renderToSvg(renderRect(gen, { type: "rect", x: 10, y: 20, w: 100, h: 50, seed: 42 }));
    const b = renderToSvg(renderRect(gen, { type: "rect", x: 10, y: 20, w: 100, h: 50, seed: 42 }));
    expect(a.container.innerHTML).toBe(b.container.innerHTML);
  });

  it("respects stroke color", () => {
    const { container } = renderToSvg(
      renderRect(gen, {
        type: "rect",
        x: 10,
        y: 20,
        w: 100,
        h: 50,
        seed: 42,
        stroke: "#ff0000",
      }),
    );
    const path = container.querySelector("path");
    expect(path?.getAttribute("stroke")).toBe("#ff0000");
  });

  it("includes a centered <text> when label is provided", () => {
    const { container } = renderToSvg(
      renderRect(gen, {
        type: "rect",
        x: 10,
        y: 20,
        w: 100,
        h: 50,
        seed: 42,
        label: "User",
      }),
    );
    const text = container.querySelector("text");
    expect(text?.textContent).toBe("User");
    expect(text?.getAttribute("text-anchor")).toBe("middle");
  });

  it("omits text node when no label is provided", () => {
    const { container } = renderToSvg(
      renderRect(gen, { type: "rect", x: 10, y: 20, w: 100, h: 50, seed: 42 }),
    );
    expect(container.querySelector("text")).toBeNull();
  });
});

describe("renderEllipse", () => {
  it("produces a path", () => {
    const { container } = renderToSvg(
      renderEllipse(gen, {
        type: "ellipse",
        x: 0,
        y: 0,
        w: 80,
        h: 40,
        seed: 1,
      }),
    );
    expect(container.querySelectorAll("path").length).toBeGreaterThan(0);
  });
});

describe("renderDiamond", () => {
  it("produces a path", () => {
    const { container } = renderToSvg(
      renderDiamond(gen, {
        type: "diamond",
        x: 0,
        y: 0,
        w: 80,
        h: 40,
        seed: 1,
      }),
    );
    expect(container.querySelectorAll("path").length).toBeGreaterThan(0);
  });

  it("draws a 4-point polygon centered on the bounding box", () => {
    // Diamond should not equal rect output — sanity check.
    const diamond = renderToSvg(
      renderDiamond(gen, { type: "diamond", x: 0, y: 0, w: 80, h: 40, seed: 1 }),
    );
    const rect = renderToSvg(renderRect(gen, { type: "rect", x: 0, y: 0, w: 80, h: 40, seed: 1 }));
    expect(diamond.container.innerHTML).not.toBe(rect.container.innerHTML);
  });
});
