/**
 * Zod schema for the Slide YAML frontmatter (`SlideFrontmatter`) and the
 * composed `SlideInput` (frontmatter + body).
 *
 * Design (see RFC 0002 and the plan in
 * `.claude/knowledge-base/plans/slide-view-primitive-plan.md` §16.3 and ADRs D4 / D14):
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

const cssColor = z.string().max(64);
// BCP-47 language tag — loose validation, just sanity to reject obvious junk.
const langTag = z
  .string()
  .regex(/^[a-z]{2,3}(-[A-Za-z0-9]{2,8})*$/, "Expected BCP-47 language tag")
  .max(35);

/** YAML frontmatter accepted by `<Slide>` in v0.1. */
export const slideFrontmatter = z
  .object({
    theme: slideTheme.optional(),
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
  | "INVALID_ASPECT_RATIO";

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
