/**
 * Zod schema for `<SlideDeck>` input.
 *
 * Two shapes accepted (ADR D4):
 *   - `string` — full markdown, split internally by `splitDeck` (top-level
 *     `thematicBreak`, see ADR D3 / D12 of Slide).
 *   - `SlideDeckSlide[]` — pre-parsed array (CMS/DB consumers).
 *
 * See `wiki/rfcs/0003-slide-deck.md`.
 */
import { z } from "zod";

export const slideDeckSlide = z.object({
  /** Markdown content of this slide. Capped at 50 KB (same as Slide body). */
  markdown: z.string().max(50_000),
  /** Optional id for hash routing (defaults to numeric index, 1-based). */
  id: z
    .string()
    .regex(/^[a-z0-9-]+$/, "id must be lowercase kebab-case")
    .max(64)
    .optional(),
  /** Speaker notes (plain text extracted from <!-- notes: ... --> comments). */
  notes: z.string().max(5_000).optional(),
});

/** Composed input — `slides` prop accepts either form. */
export const slideDeckInput = z.union([z.string().max(500_000), z.array(slideDeckSlide).max(500)]);

export type SlideDeckSlide = z.infer<typeof slideDeckSlide>;
export type SlideDeckInput = z.infer<typeof slideDeckInput>;

/** Transition presets. ADR D8. */
export const slideDeckTransition = z.enum(["none", "fade", "slide"]);
export type SlideDeckTransition = z.infer<typeof slideDeckTransition>;
