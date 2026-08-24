import type { RoughGenerator } from "roughjs/bin/generator.js";
import type { WhiteboardElement, WhiteboardScene } from "../schema.js";
import { deriveSeed } from "../seed.js";
import { renderFreedraw } from "./freedraw.js";
import { renderArrow, renderLine } from "./line.js";
import { renderDiamond, renderEllipse, renderRect } from "./shape.js";
import { renderText } from "./text.js";

function elementWithSeed<T extends WhiteboardElement>(el: T): T {
  if (typeof el.seed === "number") return el;
  return { ...el, seed: deriveSeed(el) } as T;
}

function renderElement(el: WhiteboardElement, gen: RoughGenerator): React.ReactNode {
  switch (el.type) {
    case "rect":
      return renderRect(gen, elementWithSeed(el));
    case "ellipse":
      return renderEllipse(gen, elementWithSeed(el));
    case "diamond":
      return renderDiamond(gen, elementWithSeed(el));
    case "line":
      return renderLine(gen, elementWithSeed(el));
    case "arrow":
      return renderArrow(gen, elementWithSeed(el));
    case "text":
      return renderText(elementWithSeed(el));
    case "freedraw":
      return renderFreedraw(elementWithSeed(el));
  }
}

export function renderScene(scene: WhiteboardScene, gen: RoughGenerator): React.ReactNode {
  return (
    <>
      {scene.elements.map((el, i) => (
        <g
          key={el.id ?? `__idx-${i}`}
          data-element-id={el.id ?? String(i)}
          data-element-type={el.type}
        >
          {renderElement(el, gen)}
        </g>
      ))}
    </>
  );
}
