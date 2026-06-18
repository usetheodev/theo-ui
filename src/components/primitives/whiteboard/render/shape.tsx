import type { RoughGenerator } from "roughjs/bin/generator.js";
import type { DiamondElement, EllipseElement, RectElement } from "../schema.js";
import { toRoughPaths } from "./rough-paths.js";
import { buildOptions, strokeDashArray } from "./style.js";

interface LabelProps {
  cx: number;
  cy: number;
  label: string;
  stroke?: string;
}

function Label({ cx, cy, label, stroke }: LabelProps) {
  return (
    <text
      data-slot="label"
      x={cx}
      y={cy}
      textAnchor="middle"
      dominantBaseline="central"
      fontSize={16}
      fontFamily="ui-sans-serif, system-ui, sans-serif"
      fill={stroke ?? "currentColor"}
      style={{ pointerEvents: "none" }}
    >
      {label}
    </text>
  );
}

function pathsToReactNodes(
  paths: ReturnType<typeof toRoughPaths>,
  keyPrefix: string,
  outlineStroke: string,
  dashArray?: string,
): React.ReactNode[] {
  return paths.map((p, i) => {
    // Apply stroke-dasharray only to paths whose stroke matches the outline
    // color — this avoids dashing hachure/cross-hatch fill lines (which are
    // stroked in the fill color, not the outline color) when a shape mixes
    // fillStyle with strokeStyle.
    const isOutline = p.stroke === outlineStroke;
    return (
      <path
        // biome-ignore lint/suspicious/noArrayIndexKey: rough.js path order is stable for a given (geometry, seed) tuple — index is the most precise key.
        key={`${keyPrefix}-${i}`}
        d={p.d}
        stroke={p.stroke}
        strokeWidth={p.strokeWidth}
        fill={p.fill ?? "none"}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={isOutline ? dashArray : undefined}
      />
    );
  });
}

export function renderRect(gen: RoughGenerator, el: RectElement): React.ReactNode {
  const opts = buildOptions(el, el.seed ?? 0);
  const drawable = gen.rectangle(el.x, el.y, el.w, el.h, opts);
  const paths = toRoughPaths(gen, drawable);
  const dash = strokeDashArray(el.strokeStyle, el.strokeWidth ?? 1.5);
  return (
    <g opacity={el.opacity ?? 1}>
      {pathsToReactNodes(paths, "rect", opts.stroke as string, dash)}
      {el.label ? (
        <Label cx={el.x + el.w / 2} cy={el.y + el.h / 2} label={el.label} stroke={el.stroke} />
      ) : null}
    </g>
  );
}

export function renderEllipse(gen: RoughGenerator, el: EllipseElement): React.ReactNode {
  const opts = buildOptions(el, el.seed ?? 0);
  // rough.js ellipse takes center + width + height.
  const drawable = gen.ellipse(el.x + el.w / 2, el.y + el.h / 2, el.w, el.h, opts);
  const paths = toRoughPaths(gen, drawable);
  const dash = strokeDashArray(el.strokeStyle, el.strokeWidth ?? 1.5);
  return (
    <g opacity={el.opacity ?? 1}>
      {pathsToReactNodes(paths, "ellipse", opts.stroke as string, dash)}
      {el.label ? (
        <Label cx={el.x + el.w / 2} cy={el.y + el.h / 2} label={el.label} stroke={el.stroke} />
      ) : null}
    </g>
  );
}

export function renderDiamond(gen: RoughGenerator, el: DiamondElement): React.ReactNode {
  const opts = buildOptions(el, el.seed ?? 0);
  const cx = el.x + el.w / 2;
  const cy = el.y + el.h / 2;
  const points: [number, number][] = [
    [cx, el.y], // top
    [el.x + el.w, cy], // right
    [cx, el.y + el.h], // bottom
    [el.x, cy], // left
  ];
  const drawable = gen.polygon(points, opts);
  const paths = toRoughPaths(gen, drawable);
  const dash = strokeDashArray(el.strokeStyle, el.strokeWidth ?? 1.5);
  return (
    <g opacity={el.opacity ?? 1}>
      {pathsToReactNodes(paths, "diamond", opts.stroke as string, dash)}
      {el.label ? <Label cx={cx} cy={cy} label={el.label} stroke={el.stroke} /> : null}
    </g>
  );
}
