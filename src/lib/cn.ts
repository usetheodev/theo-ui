import { type ClassValue, clsx } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

/**
 * Custom tailwind-merge instance taught about the Violet Forge typescale.
 *
 * Vanilla `tailwind-merge` groups every `text-*` class together — so
 * `text-label` (a font-size from the typescale) and `text-accent`
 * (a foreground color) clash and the last wins. With cva variants that
 * keep size + color on independent dimensions, this collapsed one of
 * them. Extending the `font-size` group with the typescale tokens
 * declared in `src/styles/tailwind-preset.ts` keeps size + color
 * independent during merge.
 */
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [
        { text: ["display-2xl", "display-xl", "display-lg", "display-md"] },
        { text: ["headline", "title-lg", "title-md"] },
        { text: ["body-lg", "body-md", "body-sm"] },
        { text: ["label", "label-caps"] },
        { text: ["code-md", "code-sm"] },
      ],
    },
  },
});

/**
 * Merge Tailwind classes with conflict resolution.
 * Standard utility across all @theokit/ui components.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
