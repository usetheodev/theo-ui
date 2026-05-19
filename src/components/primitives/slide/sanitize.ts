/**
 * Sanitize schema for slide body hast trees.
 *
 * ADR D8: `defaultSchema` from `hast-util-sanitize` is used WITHOUT extensions
 * in v0.1. The default schema:
 *   - Strips `<script>`, `<iframe>`, `<object>`, `<embed>`, `<form>`, `<input>`,
 *     `<style>`, `<link>` and other dangerous tags.
 *   - Keeps `clobberPrefix: "user-content-"` so user-supplied IDs cannot
 *     clobber DOM lookups.
 *   - Allows the standard CommonMark + GFM safe subset (h1-h6, p, ul, ol, li,
 *     blockquote, code, pre, a[href], img[src/alt], table family, em, strong,
 *     del, br, hr, etc.).
 *
 * A `looseSlideSanitizeSchema` (with `figure`/`figcaption`) is an explicit
 * opt-in for v0.2 — gated by security review.
 */
import type { Element, Root } from "hast";

let cachedSchema: import("hast-util-sanitize").Schema | undefined;

/**
 * Lazy accessor for the sanitize schema. We avoid a top-level import so the
 * `hast-util-sanitize` peer-dep stays lazy in the slide subpath bundle.
 */
export async function getSlideSanitizeSchema(): Promise<import("hast-util-sanitize").Schema> {
  if (cachedSchema) return cachedSchema;
  const { defaultSchema } = await import("hast-util-sanitize");
  cachedSchema = defaultSchema;
  return cachedSchema;
}

/** Count elements by tagName in a hast tree. Used for BANNED_TAG detection (ADR D13). */
export function collectTagCounts(tree: Root | Element): Map<string, number> {
  const counts = new Map<string, number>();
  const walk = (node: Root | Element | { type: string; children?: unknown[] }): void => {
    if (node.type === "element") {
      const tag = (node as Element).tagName;
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
    const children = (node as { children?: unknown[] }).children;
    if (Array.isArray(children)) {
      for (const child of children) {
        if (child && typeof child === "object" && "type" in child) {
          walk(child as Root | Element);
        }
      }
    }
  };
  walk(tree);
  return counts;
}
