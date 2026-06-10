import { useEffect, useMemo, useRef } from "react";
/**
 * `<Whiteboard>` — view-only primitive that turns a JSON scene into a
 * hand-drawn SVG. Lives in the isolated subpath `@theokit/ui/whiteboard`.
 *
 * See RFC 0001 (`docs/rfcs/0001-whiteboard.md`) and the plan in
 * `.claude/knowledge-base/plans/whiteboard-view-primitive-plan.md`.
 */
import rough from "roughjs";
import type { RoughGenerator } from "roughjs/bin/generator.js";
import { renderScene } from "./render/scene.js";
import type { WhiteboardScene, WhiteboardSceneInput } from "./schema.js";
import { type ValidationError, validateScene } from "./validate.js";
import { usePointerPan } from "./viewport/use-pointer-pan.js";
import { useViewport } from "./viewport/use-viewport.js";

/** Input type accepted by the component (defaults like `headEnd` are optional). */
export type WhiteboardData = WhiteboardSceneInput;
export type { ValidationError } from "./validate.js";

export interface WhiteboardProps {
  /** The scene to render. Validated with Zod on every change. */
  data: WhiteboardData | unknown;
  className?: string;
  /** Starting zoom level (clamped 0.1–8). Default 1. */
  initialZoom?: number;
  /** World coordinate centered in the viewport on first render. */
  initialCenter?: [number, number];
  /** When true, computes a bounding box of all elements and zooms to fit. */
  fitOnLoad?: boolean;
  /** Called once per validation failure with the list of errors (EC-6: in useEffect, not render). */
  onValidationError?: (errors: ValidationError[]) => void;
  /** Accessible label for the SVG (defaults to "Whiteboard diagram"). */
  "aria-label"?: string;
}

function computeBounds(scene: WhiteboardScene): {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
} | null {
  if (scene.elements.length === 0) return null;
  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;
  for (const el of scene.elements) {
    const x1 = el.x;
    const y1 = el.y;
    let x2 = el.x;
    let y2 = el.y;
    if (el.type === "rect" || el.type === "ellipse" || el.type === "diamond") {
      x2 = el.x + el.w;
      y2 = el.y + el.h;
    } else if (el.type === "line" || el.type === "arrow") {
      x2 = el.to[0];
      y2 = el.to[1];
    } else if (el.type === "freedraw") {
      for (const [px, py] of el.points) {
        const tx = el.x + px;
        const ty = el.y + py;
        if (tx < minX) minX = tx;
        if (ty < minY) minY = ty;
        if (tx > maxX) maxX = tx;
        if (ty > maxY) maxY = ty;
      }
      continue;
    }
    if (x1 < minX) minX = x1;
    if (y1 < minY) minY = y1;
    if (x2 < minX) minX = x2;
    if (y2 < minY) minY = y2;
    if (x1 > maxX) maxX = x1;
    if (y1 > maxY) maxY = y1;
    if (x2 > maxX) maxX = x2;
    if (y2 > maxY) maxY = y2;
  }
  if (!Number.isFinite(minX)) return null;
  return { minX, minY, maxX, maxY };
}

export function Whiteboard({
  data,
  className,
  initialZoom,
  initialCenter,
  fitOnLoad,
  onValidationError,
  "aria-label": ariaLabel,
}: WhiteboardProps) {
  const validation = useMemo(() => validateScene(data), [data]);
  const scene = validation.ok ? validation.scene : null;

  // EC-6: side effects only inside useEffect — never call user callbacks in render.
  useEffect(() => {
    if (!validation.ok && onValidationError) {
      onValidationError(validation.errors);
    }
  }, [validation, onValidationError]);

  // Stable rough.js generator across renders.
  const generator: RoughGenerator | null = useMemo(() => {
    if (typeof globalThis === "undefined") return null;
    try {
      return rough.generator();
    } catch {
      return null;
    }
  }, []);

  // Fallback dimensions for invalid scenes (still render a valid svg).
  const sceneWidth = scene?.width ?? 400;
  const sceneHeight = scene?.height ?? 300;
  const sceneBackground = scene?.background;

  const viewport = useViewport({
    width: sceneWidth,
    height: sceneHeight,
    initialZoom,
    initialCenter,
  });

  const svgRef = useRef<SVGSVGElement | null>(null);

  const fitTo = viewport.fitTo;
  // EC-14: fitOnLoad must run in useEffect (after mount), not during render.
  useEffect(() => {
    if (!fitOnLoad || !scene) return;
    const bounds = computeBounds(scene);
    if (!bounds) return;
    fitTo(bounds, { width: sceneWidth, height: sceneHeight });
  }, [fitOnLoad, scene, sceneWidth, sceneHeight, fitTo]);

  const handlers = usePointerPan(svgRef, viewport, {
    width: sceneWidth,
    height: sceneHeight,
  });

  const label = ariaLabel ?? "Whiteboard diagram";

  return (
    <svg
      ref={svgRef}
      viewBox={viewport.viewBox({ width: sceneWidth, height: sceneHeight })}
      width={sceneWidth}
      height={sceneHeight}
      className={className}
      role="img"
      aria-label={label}
      xmlns="http://www.w3.org/2000/svg"
      data-whiteboard-state={scene ? "ok" : "invalid"}
      style={{ touchAction: "none", userSelect: "none" }}
      {...handlers}
    >
      <title>{label}</title>
      {sceneBackground ? (
        <rect
          x={0}
          y={0}
          width={sceneWidth}
          height={sceneHeight}
          fill={sceneBackground}
          data-layer="background"
        />
      ) : null}
      {scene && generator ? renderScene(scene, generator) : null}
    </svg>
  );
}
