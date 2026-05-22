import { cva, type VariantProps } from "class-variance-authority";
import { forwardRef } from "react";
import type { TextareaHTMLAttributes } from "react";
import { cn } from "../../../lib/cn.js";

/**
 * Textarea — multi-line input mirror of Input.
 *
 * Matches Input visuals (violet focus ring, --input border, --card bg).
 * The `size` prop accepts `"sm" | "md" | "lg"`. Default `md` preserves the
 * 80px (5rem) min-height + body-md text from before this prop existed.
 *
 * Note: `TextareaHTMLAttributes<HTMLTextAreaElement>` does NOT declare a
 * native `size` attribute (textareas use `rows` / `cols`), so no Omit is
 * needed — contrast with `<Input>` which had EC-1 collision.
 */
const textareaVariants = cva(
  [
    "flex w-full resize-y rounded-md border border-input bg-card",
    "text-foreground placeholder:text-muted-foreground",
    "transition-[box-shadow,border-color] duration-base ease-out-soft",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
    "focus-visible:border-primary",
    "disabled:cursor-not-allowed disabled:opacity-50",
  ],
  {
    variants: {
      size: {
        sm: "min-h-[64px] px-2.5 py-1.5 text-body-sm",
        md: "min-h-[6rem] px-3 py-2 text-body-md",
        lg: "min-h-[128px] px-4 py-3 text-body-lg",
      },
    },
    defaultVariants: { size: "md" },
  },
);

export interface TextareaProps
  extends TextareaHTMLAttributes<HTMLTextAreaElement>,
    VariantProps<typeof textareaVariants> {}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, rows = 3, size, ...props }, ref) => (
    <textarea
      ref={ref}
      rows={rows}
      className={cn(textareaVariants({ size }), className)}
      {...props}
    />
  ),
);
Textarea.displayName = "Textarea";

export { Textarea, textareaVariants };
