import { forwardRef } from "react";
import type { InputHTMLAttributes } from "react";
import { cn } from "../../lib/cn.js";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {}

/**
 * Input — text input primitive.
 *
 * Violet Forge specifics:
 *   - height 40px (h-10) matching default Button md.
 *   - rounded-md (6px) — slightly less than buttons to differentiate.
 *   - focus uses violet ring (--ring).
 *   - placeholder uses --muted-foreground.
 */
const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", ...props }, ref) => (
    <input
      ref={ref}
      type={type}
      className={cn(
        "flex h-10 w-full rounded-md border border-input bg-card px-3 py-2",
        "text-body-md text-foreground placeholder:text-muted-foreground",
        "transition-[box-shadow,border-color] duration-base ease-out-soft",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        "focus-visible:border-primary",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "file:border-0 file:bg-transparent file:font-medium file:text-body-sm",
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = "Input";

export { Input };
