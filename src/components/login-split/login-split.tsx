import { forwardRef } from "react";
import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "../../lib/cn.js";

interface LoginSplitProps extends HTMLAttributes<HTMLDivElement> {
  /** Left pane content — form, brand, etc. */
  left: ReactNode;
  /** Right pane content — illustration, marketing, social proof. */
  right: ReactNode;
  /**
   * Optional footer rendered below both panes.
   */
  footer?: ReactNode;
  /**
   * Reverse the split (form on the right). Default = form left.
   */
  reverse?: boolean;
}

/**
 * LoginSplit — 50/50 split layout shell.
 *
 * Used for the auth flow. Two slots (`left`, `right`); the right pane has a
 * subtle violet wash so the illustration sits inside Theo identity. Mobile
 * collapses to single column.
 */
const LoginSplit = forwardRef<HTMLDivElement, LoginSplitProps>(
  ({ className, left, right, footer, reverse, ...props }, ref) => (
    <div ref={ref} className={cn("flex min-h-screen flex-col bg-background", className)} {...props}>
      <div
        className={cn(
          "grid flex-1 grid-cols-1 lg:grid-cols-2",
          reverse && "lg:[&>*:first-child]:order-2",
        )}
      >
        <div className="flex items-center justify-center px-6 py-12 lg:px-12">
          <div className="w-full max-w-md">{left}</div>
        </div>
        <div
          className={cn(
            "relative flex items-center justify-center px-6 py-12 lg:px-12",
            "bg-dotted-violet bg-muted/60",
          )}
        >
          <div className="w-full max-w-lg">{right}</div>
        </div>
      </div>
      {footer ? (
        <footer className="border-border/40 border-t px-6 py-3 text-center text-body-sm text-muted-foreground">
          {footer}
        </footer>
      ) : null}
    </div>
  ),
);
LoginSplit.displayName = "LoginSplit";

export { LoginSplit };
