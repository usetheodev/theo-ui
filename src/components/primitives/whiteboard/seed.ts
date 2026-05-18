/**
 * Deterministic seed derivation for rough.js — see ADR D9.
 *
 * rough.js uses pseudo-randomness to produce the hand-drawn look. Without a
 * stable seed every render shifts the strokes slightly, breaking snapshot
 * tests, causing SSR hydration mismatches, and visible jitter when the parent
 * re-renders. FNV-1a 32-bit gives us a fast, dependency-free hash.
 */

const FNV_OFFSET_BASIS_32 = 0x811c9dc5;
const FNV_PRIME_32 = 0x01000193;

/** FNV-1a 32-bit hash. Returns a signed 32-bit integer. */
export function fnv1a32(input: string): number {
  let hash = FNV_OFFSET_BASIS_32;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    // Multiply by the FNV prime, but keep within 32-bit unsigned range.
    hash = Math.imul(hash, FNV_PRIME_32);
  }
  // Cast to signed 32-bit via `| 0`.
  return hash | 0;
}

interface SeedableShape {
  type: string;
  x: number;
  y: number;
  w?: number;
  h?: number;
  label?: string;
  seed?: number;
}

/** Return the element's explicit `seed` or derive a stable one from its props. */
export function deriveSeed(el: SeedableShape): number {
  if (typeof el.seed === "number" && Number.isFinite(el.seed)) {
    return el.seed | 0;
  }
  // Compose a key from the dimensions that visually define the shape. Other
  // fields (colors, opacity) don't change the underlying rough.js geometry.
  const key = `${el.type}|${el.x}|${el.y}|${el.w ?? ""}|${el.h ?? ""}|${el.label ?? ""}`;
  return fnv1a32(key);
}
