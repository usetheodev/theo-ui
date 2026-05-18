import { render } from "@testing-library/react";
import rough from "roughjs";
import { describe, expect, it } from "vitest";
import type { WhiteboardScene } from "../schema.js";
import { renderScene } from "./scene.js";

const gen = rough.generator();

function renderToSvg(node: React.ReactNode) {
  return render(
    <svg aria-label="test">
      <title>test</title>
      {node}
    </svg>,
  );
}

describe("renderScene", () => {
  it("renders all 7 element types in one scene", () => {
    const scene: WhiteboardScene = {
      version: 1,
      width: 400,
      height: 400,
      elements: [
        { type: "rect", x: 10, y: 10, w: 40, h: 30 },
        { type: "ellipse", x: 60, y: 10, w: 40, h: 30 },
        { type: "diamond", x: 110, y: 10, w: 40, h: 30 },
        { type: "line", x: 0, y: 60, to: [200, 60] },
        { type: "arrow", x: 0, y: 80, to: [200, 80], headEnd: true },
        { type: "text", x: 10, y: 120, text: "Hello" },
        {
          type: "freedraw",
          x: 0,
          y: 0,
          points: [
            [0, 200],
            [100, 220],
          ],
        },
      ],
    };
    const { container } = renderToSvg(renderScene(scene, gen));
    expect(container.querySelectorAll('[data-element-type="rect"]').length).toBe(1);
    expect(container.querySelectorAll('[data-element-type="ellipse"]').length).toBe(1);
    expect(container.querySelectorAll('[data-element-type="diamond"]').length).toBe(1);
    expect(container.querySelectorAll('[data-element-type="line"]').length).toBe(1);
    expect(container.querySelectorAll('[data-element-type="arrow"]').length).toBe(1);
    expect(container.querySelectorAll('[data-element-type="text"]').length).toBe(1);
    expect(container.querySelectorAll('[data-element-type="freedraw"]').length).toBe(1);
  });

  it("preserves z-order (later elements appear after earlier in DOM)", () => {
    const scene: WhiteboardScene = {
      version: 1,
      width: 100,
      height: 100,
      elements: [
        { type: "rect", x: 0, y: 0, w: 50, h: 50, id: "bottom" },
        { type: "rect", x: 25, y: 25, w: 50, h: 50, id: "top" },
      ],
    };
    const { container } = renderToSvg(renderScene(scene, gen));
    const groups = container.querySelectorAll('[data-element-type="rect"]');
    expect(groups[0]?.getAttribute("data-element-id")).toBe("bottom");
    expect(groups[1]?.getAttribute("data-element-id")).toBe("top");
  });

  it("uses derived seed when element has no explicit seed", () => {
    // Without explicit seed, two scenes with same geometry should look identical.
    const scene: WhiteboardScene = {
      version: 1,
      width: 100,
      height: 100,
      elements: [{ type: "rect", x: 10, y: 20, w: 30, h: 40 }],
    };
    const a = renderToSvg(renderScene(scene, gen));
    const b = renderToSvg(renderScene(scene, gen));
    expect(a.container.innerHTML).toBe(b.container.innerHTML);
  });

  it("uses element index as data-element-id fallback when id absent", () => {
    const scene: WhiteboardScene = {
      version: 1,
      width: 100,
      height: 100,
      elements: [{ type: "rect", x: 0, y: 0, w: 10, h: 10 }],
    };
    const { container } = renderToSvg(renderScene(scene, gen));
    const group = container.querySelector('[data-element-type="rect"]');
    expect(group?.getAttribute("data-element-id")).toBe("0");
  });
});
