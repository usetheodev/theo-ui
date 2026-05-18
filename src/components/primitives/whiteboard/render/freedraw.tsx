import { getStroke } from "perfect-freehand";
import type { FreedrawElement } from "../schema.js";

const DEFAULT_STROKE_OPTIONS = {
  size: 8,
  thinning: 0.5,
  smoothing: 0.5,
  streamline: 0.5,
};

function fmt(n: number | undefined): string {
  return typeof n === "number" && Number.isFinite(n) ? n.toFixed(2) : "0";
}

function svgPathFromStroke(points: number[][]): string {
  if (points.length === 0) return "";
  const first = points[0] ?? [];
  let d = `M ${fmt(first[0])} ${fmt(first[1])}`;
  for (let i = 1; i < points.length; i++) {
    const p = points[i] ?? [];
    d += ` L ${fmt(p[0])} ${fmt(p[1])}`;
  }
  d += " Z";
  return d;
}

export function renderFreedraw(el: FreedrawElement): React.ReactNode {
  const size = (el.strokeWidth ?? 1.5) * 5;
  const inputPoints = el.points.map(([x, y, pressure]) => {
    const tx = el.x + x;
    const ty = el.y + y;
    return pressure === undefined ? [tx, ty] : [tx, ty, pressure];
  });
  const stroke = getStroke(inputPoints, {
    ...DEFAULT_STROKE_OPTIONS,
    size,
  });
  const d = svgPathFromStroke(stroke as number[][]);
  return (
    <g opacity={el.opacity ?? 1}>
      <path d={d} fill={el.stroke ?? "currentColor"} stroke="none" />
    </g>
  );
}
