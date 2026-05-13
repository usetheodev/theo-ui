import { forwardRef } from "react";
import type { TextareaHTMLAttributes } from "react";
import { cn } from "../../../lib/cn.js";

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {}

/**
 * Textarea — multi-line input mirror of Input.
 *
 * Matches Input visuals (violet focus ring, --input border, --card bg).
 * Default minimum height of 96px; consumer can override via className.
 */
const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, rows = 3, ...props }, ref) => (
    <textarea
      ref={ref}
      rows={rows}
      className={cn(
        "flex min-h-[6rem] w-full resize-y rounded-md border border-input bg-card px-3 py-2",
        "text-body-md text-foreground placeholder:text-muted-foreground",
        "transition-[box-shadow,border-color] duration-base ease-out-soft",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        "focus-visible:border-primary",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  ),
);
Textarea.displayName = "Textarea";

export { Textarea };
