import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderFreedraw } from "./freedraw.js";

function renderToSvg(node: React.ReactNode) {
  return render(
    <svg aria-label="test">
      <title>test</title>
      {node}
    </svg>,
  );
}

describe("renderFreedraw", () => {
  it("renders a path", () => {
    const { container } = renderToSvg(
      renderFreedraw({
        type: "freedraw",
        x: 0,
        y: 0,
        points: [
          [0, 0],
          [10, 0],
          [20, 10],
          [30, 30],
        ],
      }),
    );
    const path = container.querySelector("path");
    expect(path).toBeTruthy();
    expect(path?.getAttribute("d")).toBeTruthy();
  });

  it("renders even with the minimum 2 points (EC-8)", () => {
    const { container } = renderToSvg(
      renderFreedraw({
        type: "freedraw",
        x: 0,
        y: 0,
        points: [
          [0, 0],
          [100, 0],
        ],
      }),
    );
    const path = container.querySelector("path");
    expect(path).toBeTruthy();
    const d = path?.getAttribute("d") ?? "";
    expect(d).not.toContain("NaN");
    expect(d.length).toBeGreaterThan(0);
  });

  it("accepts points with pressure", () => {
    const { container } = renderToSvg(
      renderFreedraw({
        type: "freedraw",
        x: 0,
        y: 0,
        points: [
          [0, 0, 0.5],
          [10, 10, 0.8],
          [20, 20, 1],
        ],
      }),
    );
    expect(container.querySelector("path")).toBeTruthy();
  });

  it("produces stable output for the same input (snapshot smoke)", () => {
    const points: Array<[number, number]> = [
      [0, 0],
      [10, 5],
      [20, 15],
      [30, 20],
    ];
    const a = renderToSvg(renderFreedraw({ type: "freedraw", x: 0, y: 0, points }));
    const b = renderToSvg(renderFreedraw({ type: "freedraw", x: 0, y: 0, points }));
    expect(a.container.innerHTML).toBe(b.container.innerHTML);
  });
});
