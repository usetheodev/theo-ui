/**
 * Zod schema for the Whiteboard JSON v1 (`WhiteboardScene`).
 *
 * Design goals (see RFC 0001 §4 and ADR D4 in the plan):
 *   - LLM-friendly: minimal fields per element.
 *   - Discriminated union by `type` for exhaustive typing in TS.
 *   - Defensive against LLM mistakes:
 *     - EC-3: `.finite()` everywhere — rejects NaN / Infinity.
 *     - EC-4: `.max()` on dimensions to cap absurd values from the model.
 */
import { z } from "zod";

const finiteNumber = z.number().finite();
const finitePositive = finiteNumber.positive();

const strokeStyle = z.enum(["solid", "dashed", "dotted"]);
const fillStyle = z.enum(["hachure", "solid", "cross-hatch", "zigzag"]);
const align = z.enum(["left", "center", "right"]);
const fontFamily = z.enum(["sans", "serif", "mono", "hand"]);
const roundness = z.enum(["sharp", "round"]);

const baseElement = z.object({
  id: z.string().max(120).optional(),
  x: finiteNumber,
  y: finiteNumber,
  stroke: z.string().max(64).optional(),
  strokeWidth: finitePositive.max(50).optional(),
  strokeStyle: strokeStyle.optional(),
  fill: z.string().max(64).optional(),
  fillStyle: fillStyle.optional(),
  opacity: finiteNumber.min(0).max(1).optional(),
  roughness: finiteNumber.min(0).max(3).optional(),
  seed: z.number().int().finite().optional(),
});

const dim = finitePositive.max(20000);
const labelText = z.string().max(500);

const rectElement = baseElement.extend({
  type: z.literal("rect"),
  w: dim,
  h: dim,
  label: labelText.optional(),
  roundness: roundness.optional(),
});

const ellipseElement = baseElement.extend({
  type: z.literal("ellipse"),
  w: dim,
  h: dim,
  label: labelText.optional(),
});

const diamondElement = baseElement.extend({
  type: z.literal("diamond"),
  w: dim,
  h: dim,
  label: labelText.optional(),
});

const point2 = z.tuple([finiteNumber, finiteNumber]);

const lineElement = baseElement.extend({
  type: z.literal("line"),
  to: point2,
});

const arrowElement = baseElement.extend({
  type: z.literal("arrow"),
  to: point2,
  label: labelText.optional(),
  headStart: z.boolean().optional(),
  headEnd: z.boolean().default(true),
});

const textElement = baseElement.extend({
  type: z.literal("text"),
  text: z.string().max(5000),
  fontSize: finitePositive.max(500).optional(),
  align: align.optional(),
  fontFamily: fontFamily.optional(),
});

const freedrawPoint = z.tuple([finiteNumber, finiteNumber, finiteNumber.optional()]);

const freedrawElement = baseElement.extend({
  type: z.literal("freedraw"),
  points: z.array(freedrawPoint).min(2).max(5000),
});

export const whiteboardElement = z.discriminatedUnion("type", [
  rectElement,
  ellipseElement,
  diamondElement,
  lineElement,
  arrowElement,
  textElement,
  freedrawElement,
]);

export const whiteboardScene = z.object({
  version: z.literal(1),
  width: dim, // EC-4: clamped 1..20000
  height: dim, // EC-4: clamped 1..20000
  background: z.string().max(64).optional(),
  elements: z.array(whiteboardElement).max(5000),
});

// Internal "parsed" types (defaults applied) — used inside the renderer.
export type WhiteboardElement = z.output<typeof whiteboardElement>;
export type WhiteboardScene = z.output<typeof whiteboardScene>;
export type RectElement = z.output<typeof rectElement>;
export type EllipseElement = z.output<typeof ellipseElement>;
export type DiamondElement = z.output<typeof diamondElement>;
export type LineElement = z.output<typeof lineElement>;
export type ArrowElement = z.output<typeof arrowElement>;
export type TextElement = z.output<typeof textElement>;
export type FreedrawElement = z.output<typeof freedrawElement>;

// Public "input" types (defaults optional) — used by consumers passing data.
export type WhiteboardElementInput = z.input<typeof whiteboardElement>;
export type WhiteboardSceneInput = z.input<typeof whiteboardScene>;
