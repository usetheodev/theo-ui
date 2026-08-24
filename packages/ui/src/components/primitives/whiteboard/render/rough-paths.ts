/**
 * Thin adapter over `roughjs` — converts a `Drawable` into the array of
 * `<path>` descriptors we render in SVG. The actual `rough.generator()`
 * instance is created once per scene and reused across elements.
 */
import type { Drawable, Options } from "roughjs/bin/core.js";
import type { RoughGenerator } from "roughjs/bin/generator.js";

export interface RoughPath {
  d: string;
  stroke: string;
  strokeWidth: number;
  fill?: string;
}

export type RoughOptions = Options;

/** Convert a rough.js Drawable into renderable SVG path descriptors. */
export function toRoughPaths(generator: RoughGenerator, drawable: Drawable): RoughPath[] {
  const paths = generator.toPaths(drawable);
  return paths.map((p) => ({
    d: p.d,
    stroke: p.stroke,
    strokeWidth: p.strokeWidth,
    fill: p.fill,
  }));
}
