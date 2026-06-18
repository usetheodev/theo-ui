import { AlertCircle, CheckCircle2, Info, TriangleAlert, X } from "lucide-react";
import { forwardRef } from "react";
import type { ElementType, HTMLAttributes, ReactNode } from "react";
import { cn } from "../../../lib/cn.js";

/**
 * Alert — persistent inline notice. Distinct from `Toast` (transient,
 * corner-positioned, multiple stackable) and `EmptyState` (centered card
 * for no-data affordances). Full-width-of-section banner that stays
 * visible until the user acts.
 *
 * `intent` drives icon + color tokens. `destructive` intent renders
 * `role="alert"` for assertive screen-reader announcement; the other
 * three intents render `role="status"` (polite). `onDismiss`, when
 * provided, renders a trailing `X` button. `action` slot accepts any
 * ReactNode (typically a `<Button>` or anchor).
 *
 * @example
 *   <Alert
 *     intent="warning"
 *     title="Verify your email"
 *     description="We sent a link to your email."
 *     action={<Button size="sm" onClick={resend}>Resend</Button>}
 *   />
 */
export type AlertIntent = "info" | "success" | "warning" | "destructive";

export interface AlertProps extends Omit<HTMLAttributes<HTMLDivElement>, "title" | "role"> {
  intent?: AlertIntent;
  title?: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  onDismiss?: () => void;
}

const INTENT: Record<
  AlertIntent,
  { icon: ElementType; border: string; bg: string; iconColor: string }
> = {
  info: {
    icon: Info,
    border: "border-primary/30",
    bg: "bg-primary/[0.04]",
    iconColor: "text-primary",
  },
  success: {
    icon: CheckCircle2,
    border: "border-success/30",
    bg: "bg-success/[0.04]",
    iconColor: "text-success",
  },
  warning: {
    icon: TriangleAlert,
    border: "border-warning/30",
    bg: "bg-warning/[0.04]",
    iconColor: "text-warning",
  },
  destructive: {
    icon: AlertCircle,
    border: "border-destructive/30",
    bg: "bg-destructive/[0.04]",
    iconColor: "text-destructive",
  },
};

const Alert = forwardRef<HTMLDivElement, AlertProps>(
  ({ className, intent = "info", title, description, action, onDismiss, ...props }, ref) => {
    const config = INTENT[intent];
    const Icon = config.icon;
    const hasTitle = title !== undefined && title !== null;
    const hasDescription = description !== undefined && description !== null;
    const role = intent === "destructive" ? "alert" : "status";

    return (
      <div
        ref={ref}
        role={role}
        className={cn(
          "rounded-lg border",
          config.border,
          config.bg,
          hasTitle && hasDescription ? "p-4" : "p-3",
          className,
        )}
        {...props}
        data-slot="alert"
      >
        <div className="flex items-start gap-3">
          <Icon aria-hidden="true" className={cn("mt-0.5 size-4 shrink-0", config.iconColor)} />
          <div className="min-w-0 flex-1">
            {hasTitle ? (
              <div className="font-medium font-sans text-body-sm text-foreground">{title}</div>
            ) : null}
            {hasDescription ? (
              <div
                className={cn("font-sans text-body-sm text-muted-foreground", hasTitle && "mt-0.5")}
              >
                {description}
              </div>
            ) : null}
          </div>
          {action !== undefined ? <div className="ml-auto shrink-0">{action}</div> : null}
          {onDismiss !== undefined ? (
            <button
              type="button"
              onClick={onDismiss}
              aria-label="Dismiss"
              className={cn(
                "shrink-0 rounded p-0.5 text-muted-foreground transition-colors",
                "hover:text-foreground",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              )}
            >
              <X aria-hidden="true" className="size-4" />
            </button>
          ) : null}
        </div>
      </div>
    );
  },
);
Alert.displayName = "Alert";

export { Alert };
