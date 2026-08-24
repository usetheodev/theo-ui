import type { TextElement } from "../schema.js";

const FONT_STACKS: Record<NonNullable<TextElement["fontFamily"]>, string> = {
  sans: "ui-sans-serif, system-ui, sans-serif",
  serif: "ui-serif, Georgia, serif",
  mono: "ui-monospace, SFMono-Regular, Menlo, monospace",
  hand: '"Virgil", "Caveat", "Comic Sans MS", cursive',
};

function textAnchor(align: TextElement["align"]): "start" | "middle" | "end" {
  if (align === "center") return "middle";
  if (align === "right") return "end";
  return "start";
}

export function renderText(el: TextElement): React.ReactNode {
  const fontSize = el.fontSize ?? 18;
  const fontFamily = FONT_STACKS[el.fontFamily ?? "hand"];
  const anchor = textAnchor(el.align);
  const lines = el.text.split("\n");
  // dy: first tspan at 0, subsequent at fontSize * 1.2 line-height.
  return (
    <g opacity={el.opacity ?? 1}>
      <text
        x={el.x}
        y={el.y}
        textAnchor={anchor}
        dominantBaseline="hanging"
        fontSize={fontSize}
        fontFamily={fontFamily}
        fill={el.stroke ?? "currentColor"}
      >
        {lines.map((line, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: text is split deterministically on '\n' so the line index is the most stable key.
          <tspan key={i} x={el.x} dy={i === 0 ? 0 : fontSize * 1.2}>
            {line}
          </tspan>
        ))}
      </text>
    </g>
  );
}
