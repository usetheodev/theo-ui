/**
 * Maps a `WhiteboardElement` style props onto rough.js `Options`.
 */
import type { Options } from "roughjs/bin/core.js";

interface StyleSource {
  stroke?: string;
  strokeWidth?: number;
  strokeStyle?: "solid" | "dashed" | "dotted";
  fill?: string;
  fillStyle?: "hachure" | "solid" | "cross-hatch" | "zigzag";
  opacity?: number;
  roughness?: number;
}

const DEFAULT_STROKE = "currentColor";

export function buildOptions(src: StyleSource, seed: number): Options {
  const o: Options = {
    seed,
    stroke: src.stroke ?? DEFAULT_STROKE,
    strokeWidth: src.strokeWidth ?? 1.5,
    roughness: src.roughness ?? 1.2,
  };
  if (src.strokeStyle === "dashed") o.strokeLineDash = [10, 6];
  else if (src.strokeStyle === "dotted") o.strokeLineDash = [2, 4];
  if (src.fill) o.fill = src.fill;
  if (src.fillStyle) o.fillStyle = src.fillStyle;
  return o;
}

/**
 * SVG `stroke-dasharray` value for a logical strokeStyle. rough.js's
 * `RoughGenerator.toPaths()` does NOT propagate `strokeLineDash` into the
 * returned `PathInfo` — only the canvas / direct-SVG backends apply it. We
 * must set the attribute ourselves on the rendered `<path>`. Returns
 * `undefined` for `solid` and any unknown value.
 */
export function strokeDashArray(
  strokeStyle: StyleSource["strokeStyle"],
  strokeWidth: number,
): string | undefined {
  if (strokeStyle === "dashed") {
    const dash = Math.max(8, strokeWidth * 6);
    const gap = Math.max(5, strokeWidth * 4);
    return `${dash} ${gap}`;
  }
  if (strokeStyle === "dotted") {
    // 1×strokeWidth dot, ~2×strokeWidth gap. Round end caps make these look
    // like dots instead of squares.
    return `${strokeWidth} ${strokeWidth * 2.5}`;
  }
  return undefined;
}

export { DEFAULT_STROKE };
