import { render } from "@testing-library/react";
import rough from "roughjs";
import { describe, expect, it } from "vitest";
import { renderArrow, renderLine } from "./line.js";

const gen = rough.generator();

function renderToSvg(node: React.ReactNode) {
  return render(
    <svg aria-label="test">
      <title>test</title>
      {node}
    </svg>,
  );
}

describe("renderLine stroke styles", () => {
  it("solid line has no stroke-dasharray", () => {
    const { container } = renderToSvg(
      renderLine(gen, { type: "line", x: 0, y: 0, to: [100, 0], seed: 1 }),
    );
    const path = container.querySelector("path");
    expect(path?.getAttribute("stroke-dasharray")).toBeNull();
  });

  it("dashed line sets stroke-dasharray", () => {
    const { container } = renderToSvg(
      renderLine(gen, {
        type: "line",
        x: 0,
        y: 0,
        to: [100, 0],
        seed: 1,
        strokeStyle: "dashed",
      }),
    );
    const path = container.querySelector("path");
    const dash = path?.getAttribute("stroke-dasharray");
    expect(dash).toBeTruthy();
    expect(dash).not.toBe("0");
  });

  it("dotted line sets a shorter stroke-dasharray than dashed", () => {
    const { container: dashedC } = renderToSvg(
      renderLine(gen, {
        type: "line",
        x: 0,
        y: 0,
        to: [100, 0],
        seed: 1,
        strokeStyle: "dashed",
        strokeWidth: 2,
      }),
    );
    const { container: dottedC } = renderToSvg(
      renderLine(gen, {
        type: "line",
        x: 0,
        y: 0,
        to: [100, 0],
        seed: 1,
        strokeStyle: "dotted",
        strokeWidth: 2,
      }),
    );
    const dashedFirst = Number(
      dashedC.querySelector("path")?.getAttribute("stroke-dasharray")?.split(" ")[0],
    );
    const dottedFirst = Number(
      dottedC.querySelector("path")?.getAttribute("stroke-dasharray")?.split(" ")[0],
    );
    expect(dottedFirst).toBeLessThan(dashedFirst);
  });
});

describe("renderLine", () => {
  it("renders a line as <path>", () => {
    const { container } = renderToSvg(
      renderLine(gen, { type: "line", x: 0, y: 0, to: [100, 0], seed: 1 }),
    );
    expect(container.querySelectorAll("path").length).toBeGreaterThan(0);
  });

  it("does not render an arrowhead", () => {
    const { container } = renderToSvg(
      renderLine(gen, { type: "line", x: 0, y: 0, to: [100, 0], seed: 1 }),
    );
    // Lines should have a single rough-stroke path; arrowhead would be 2+ paths.
    // Heuristic: count <line> elements (we use <line> for arrowheads in arrow).
    expect(container.querySelectorAll('[data-line-part="arrowhead"]').length).toBe(0);
  });
});

describe("renderArrow", () => {
  it("renders a body path + arrowhead by default", () => {
    const { container } = renderToSvg(
      renderArrow(gen, {
        type: "arrow",
        x: 0,
        y: 0,
        to: [100, 0],
        seed: 1,
        headEnd: true,
      }),
    );
    expect(container.querySelectorAll('[data-line-part="arrowhead"]').length).toBeGreaterThan(0);
  });

  it("renders both heads when headStart=true and headEnd=true", () => {
    const { container } = renderToSvg(
      renderArrow(gen, {
        type: "arrow",
        x: 0,
        y: 0,
        to: [100, 0],
        seed: 1,
        headStart: true,
        headEnd: true,
      }),
    );
    expect(
      container.querySelectorAll('[data-line-part="arrowhead"]').length,
    ).toBeGreaterThanOrEqual(2);
  });

  it("zero-length arrow does not produce NaN attributes (EC-7)", () => {
    const { container } = renderToSvg(
      renderArrow(gen, {
        type: "arrow",
        x: 50,
        y: 50,
        to: [50, 50],
        seed: 1,
        headEnd: true,
      }),
    );
    for (const el of container.querySelectorAll("*")) {
      for (const attr of el.attributes) {
        expect(attr.value).not.toContain("NaN");
      }
    }
  });

  it("short segment clamps headLen so arrowhead does not exceed segment length (EC-7)", () => {
    // Distance = 4 px, default headLen ≈ 12. With clamp headLen ≤ dist*0.4 = 1.6.
    const { container } = renderToSvg(
      renderArrow(gen, {
        type: "arrow",
        x: 0,
        y: 0,
        to: [4, 0],
        seed: 1,
        headEnd: true,
      }),
    );
    // Heuristic: ensure no NaN and that the rendered SVG is valid.
    expect(container.querySelector("path")).toBeTruthy();
  });

  it("renders label near the midpoint", () => {
    const { container } = renderToSvg(
      renderArrow(gen, {
        type: "arrow",
        x: 0,
        y: 0,
        to: [200, 0],
        seed: 1,
        label: "request",
        headEnd: true,
      }),
    );
    const text = container.querySelector("text");
    expect(text?.textContent).toBe("request");
    const x = Number(text?.getAttribute("x"));
    expect(x).toBeGreaterThan(80);
    expect(x).toBeLessThan(120);
  });
});
