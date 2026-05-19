import type { RoughGenerator } from "roughjs/bin/generator.js";
import type { ArrowElement, LineElement } from "../schema.js";
import { toRoughPaths } from "./rough-paths.js";
import { buildOptions, strokeDashArray } from "./style.js";

const HEAD_BASE_PX = 12;
const HEAD_ANGLE_RAD = Math.PI / 7; // ~25°

interface HeadGeom {
  apexX: number;
  apexY: number;
  leftX: number;
  leftY: number;
  rightX: number;
  rightY: number;
}

function arrowHeadGeometry(
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  strokeWidth: number,
): HeadGeom | null {
  const dx = toX - fromX;
  const dy = toY - fromY;
  const dist = Math.sqrt(dx * dx + dy * dy);
  if (dist === 0) return null;
  const angle = Math.atan2(dy, dx);
  // EC-7: clamp head length so it never exceeds 40% of the segment.
  const headLen = Math.min(HEAD_BASE_PX + strokeWidth * 2, dist * 0.4);
  const leftX = toX - headLen * Math.cos(angle - HEAD_ANGLE_RAD);
  const leftY = toY - headLen * Math.sin(angle - HEAD_ANGLE_RAD);
  const rightX = toX - headLen * Math.cos(angle + HEAD_ANGLE_RAD);
  const rightY = toY - headLen * Math.sin(angle + HEAD_ANGLE_RAD);
  return { apexX: toX, apexY: toY, leftX, leftY, rightX, rightY };
}

function lineBody(
  gen: RoughGenerator,
  el: LineElement | ArrowElement,
  seed: number,
): React.ReactNode[] {
  const opts = buildOptions(el, seed);
  const drawable = gen.line(el.x, el.y, el.to[0], el.to[1], opts);
  const dash = strokeDashArray(el.strokeStyle, el.strokeWidth ?? 1.5);
  return toRoughPaths(gen, drawable).map((p, i) => (
    <path
      // biome-ignore lint/suspicious/noArrayIndexKey: stable rough.js path order
      key={`body-${i}`}
      d={p.d}
      stroke={p.stroke}
      strokeWidth={p.strokeWidth}
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeDasharray={dash}
    />
  ));
}

function arrowHead(
  gen: RoughGenerator,
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  seed: number,
  el: ArrowElement,
  side: "start" | "end",
): React.ReactNode[] {
  const geom = arrowHeadGeometry(fromX, fromY, toX, toY, el.strokeWidth ?? 1.5);
  if (!geom) return [];
  const opts = buildOptions(el, seed);
  // Two short rough-drawn segments forming the V.
  const leftDrawable = gen.line(geom.apexX, geom.apexY, geom.leftX, geom.leftY, opts);
  const rightDrawable = gen.line(geom.apexX, geom.apexY, geom.rightX, geom.rightY, opts);
  const leftPaths = toRoughPaths(gen, leftDrawable);
  const rightPaths = toRoughPaths(gen, rightDrawable);
  const nodes: React.ReactNode[] = [];
  for (const [i, p] of leftPaths.entries()) {
    nodes.push(
      <path
        key={`${side}-l-${i}`}
        d={p.d}
        stroke={p.stroke}
        strokeWidth={p.strokeWidth}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        data-line-part="arrowhead"
      />,
    );
  }
  for (const [i, p] of rightPaths.entries()) {
    nodes.push(
      <path
        key={`${side}-r-${i}`}
        d={p.d}
        stroke={p.stroke}
        strokeWidth={p.strokeWidth}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        data-line-part="arrowhead"
      />,
    );
  }
  return nodes;
}

export function renderLine(gen: RoughGenerator, el: LineElement): React.ReactNode {
  return <g opacity={el.opacity ?? 1}>{lineBody(gen, el, el.seed ?? 0)}</g>;
}

export function renderArrow(gen: RoughGenerator, el: ArrowElement): React.ReactNode {
  const seed = el.seed ?? 0;
  const nodes: React.ReactNode[] = [...lineBody(gen, el, seed)];
  if (el.headEnd !== false) {
    nodes.push(...arrowHead(gen, el.x, el.y, el.to[0], el.to[1], seed + 1, el, "end"));
  }
  if (el.headStart) {
    nodes.push(...arrowHead(gen, el.to[0], el.to[1], el.x, el.y, seed + 2, el, "start"));
  }
  let label: React.ReactNode = null;
  if (el.label) {
    const midX = (el.x + el.to[0]) / 2;
    const midY = (el.y + el.to[1]) / 2;
    // Offset perpendicular to the line so label doesn't sit on the stroke.
    const dx = el.to[0] - el.x;
    const dy = el.to[1] - el.y;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    const nx = -dy / dist;
    const ny = dx / dist;
    const offset = 12;
    label = (
      <text
        x={midX + nx * offset}
        y={midY + ny * offset}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={14}
        fontFamily="ui-sans-serif, system-ui, sans-serif"
        fill={el.stroke ?? "currentColor"}
        style={{ pointerEvents: "none" }}
      >
        {el.label}
      </text>
    );
  }
  return (
    <g opacity={el.opacity ?? 1}>
      {nodes}
      {label}
    </g>
  );
}
