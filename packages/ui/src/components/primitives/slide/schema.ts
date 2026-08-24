/**
 * Zod schema for the Slide YAML frontmatter (`SlideFrontmatter`) and the
 * composed `SlideInput` (frontmatter + body).
 *
 * Design (see RFC 0002 and the plan in
 * `wiki/rfcs/0002-slide.md`, ADRs D4 / D14):
 *
 * - **`.strict()`** on frontmatter — unknown keys produce `INVALID_FRONTMATTER`
 *   with a precise path, so an LLM can self-correct.
 * - Numeric values are `.finite()` to reject `NaN` / `Infinity`. (Currently no
 *   numeric directives ship; keep the helper for future fields.)
 * - String values capped to defensible sizes to reject DoS-shaped inputs.
 * - `body` capped to 50 KB (≈30 slides' worth of text) per the sanity rule.
 * - `theme` is the canonical enum of built-in themes. Custom themes are not
 *   registered via frontmatter in v0.1 — caller wraps `<Slide>` with their
 *   own CSS overrides.
 */
import { z } from "zod";

/** Built-in slide themes. Adding a theme means landing a CSS file in `themes/`. */
export const slideTheme = z.enum(["default", "violet-forge"]);
export type SlideTheme = z.infer<typeof slideTheme>;

/** Built-in slide layouts (rich-content plan T2.1). */
export const slideLayout = z.enum([
  "default",
  "title",
  "two-column",
  "image-right",
  "image-left",
  "code-output",
  "section",
]);
export type SlideLayout = z.infer<typeof slideLayout>;

const cssColor = z.string().max(64);
// BCP-47 language tag — loose validation, just sanity to reject obvious junk.
const langTag = z
  .string()
  .regex(/^[a-z]{2,3}(-[A-Za-z0-9]{2,8})*$/, "Expected BCP-47 language tag")
  .max(35);

// EC-7 / rich-content T3.1 helpers.
const SAFE_URL_SCHEMES = ["http://", "https://"];

/**
 * Sanitize a `backgroundImage` URL.
 *
 * Allowed: `http(s)://...` URLs (validated via `URL` constructor).
 * Rejected: `javascript:`, `vbscript:`, all `data:` URLs (EC-7 — perf + DoS).
 * Accepts a bare URL or a `url(...)` wrapper. Returns the unwrapped URL on
 * success, `null` on rejection.
 */
export function sanitizeBgUrl(input: string): string | null {
  try {
    const trimmed = input.trim();
    const url = trimmed.startsWith("url(")
      ? trimmed.replace(/^url\(\s*['"]?/, "").replace(/['"]?\s*\)$/, "")
      : trimmed;
    const lower = url.toLowerCase();
    if (lower.startsWith("javascript:") || lower.startsWith("vbscript:")) return null;
    // EC-7: reject ALL data: URLs (including data:image/*) — slides inflate the
    // markdown payload and shifts loading cost. Consumer should host images.
    if (lower.startsWith("data:")) return null;
    if (!SAFE_URL_SCHEMES.some((s) => lower.startsWith(s))) return null;
    new URL(url); // throws on malformed
    return url;
  } catch {
    return null;
  }
}

/** YAML frontmatter accepted by `<Slide>`. */
export const slideFrontmatter = z
  .object({
    theme: slideTheme.optional(),
    /** Rich-content T2: built-in layout (CSS grid). */
    layout: slideLayout.optional(),
    /** Rich-content T3: background URL (sanitized: http(s) only). */
    backgroundImage: z
      .string()
      .max(500_000)
      .transform((v) => {
        if (!v) return undefined;
        const sanitized = sanitizeBgUrl(v);
        return sanitized ?? undefined;
      })
      .optional(),
    /** Rich-content T3: CSS gradient string (validated by prefix). */
    backgroundGradient: z
      .string()
      .max(500)
      .regex(
        /^(linear|radial|conic)-gradient\(/i,
        "Must start with linear-/radial-/conic-gradient(",
      )
      .optional(),
    /** Rich-content T5: header overlay text (plain, ≤ 200 chars). */
    header: z.string().max(200).optional(),
    /** Rich-content T5: footer overlay text (plain, ≤ 200 chars). */
    footer: z.string().max(200).optional(),
    /** Rich-content T5: pagination — `true` shows page number, `"skip"` hides. */
    paginate: z.union([z.boolean(), z.literal("skip"), z.literal("hold")]).optional(),
    lang: langTag.optional(),
    color: cssColor.optional(),
    backgroundColor: cssColor.optional(),
  })
  .strict();
export type SlideFrontmatter = z.infer<typeof slideFrontmatter>;

/** Composed input: validated frontmatter object + raw markdown body string. */
export const slideInput = z.object({
  frontmatter: slideFrontmatter,
  body: z.string().max(50_000),
});
export type SlideInput = z.infer<typeof slideInput>;

/** Discrete validation-error codes — kept centralized so consumers can pattern-match safely. */
export type SlideValidationErrorCode =
  | "INVALID_FRONTMATTER"
  | "FRONTMATTER_TOO_LARGE"
  | "MULTIPLE_SLIDES"
  | "CONTENT_TOO_LARGE"
  | "BANNED_TAG"
  | "BANNED_ATTRIBUTE"
  | "INVALID_ASPECT_RATIO"
  // Rich-content plan (Tier 1 + Tier 2 plugins):
  | "PLUGIN_ERROR" // D16: a plugin's mdast/hast transform threw — pipeline continued
  | "PLUGIN_PEER_DEP_MISSING" // EC-2: dynamic import of a plugin's peer-dep failed
  | "MARPIT_BG_UNSAFE_URL"; // D18/EC-5: Marpit ![bg](url) rejected by URL sanitizer

export interface SlideValidationError {
  /** Path inside the input (frontmatter key, ['body'], or []). */
  path: (string | number)[];
  /** Human-readable explanation. */
  message: string;
  /** Discriminator for consumers. */
  code: SlideValidationErrorCode;
  /** Offending value when extractable from Zod's `received` or by walking the input. */
  got?: unknown;
}
