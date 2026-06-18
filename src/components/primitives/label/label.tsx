import * as LabelPrimitive from "@radix-ui/react-label";
import { forwardRef } from "react";
import type { ComponentPropsWithoutRef, ElementRef } from "react";
import { cn } from "../../../lib/cn.js";

/**
 * Label — form field label built on Radix Label.
 *
 * Behaviors:
 *   - Clicking the label focuses the associated `htmlFor` input.
 *   - Adds a small red asterisk when `required` is set.
 *   - Inherits disabled visuals from the wrapper (`peer-disabled`).
 */
interface LabelProps extends ComponentPropsWithoutRef<typeof LabelPrimitive.Root> {
  required?: boolean;
}

const Label = forwardRef<ElementRef<typeof LabelPrimitive.Root>, LabelProps>(
  ({ className, required, children, ...props }, ref) => (
    <LabelPrimitive.Root
      data-slot="label"
      ref={ref}
      className={cn(
        "inline-flex items-center gap-1 font-medium font-sans text-body-sm text-foreground",
        "peer-disabled:cursor-not-allowed peer-disabled:opacity-60",
        className,
      )}
      {...props}
    >
      {children}
      {required ? (
        <span className="text-destructive" aria-hidden="true">
          *
        </span>
      ) : null}
    </LabelPrimitive.Root>
  ),
);
Label.displayName = "Label";

export { Label };
