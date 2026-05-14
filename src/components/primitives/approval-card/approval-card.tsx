import { type VariantProps, cva } from "class-variance-authority";
import { AlertTriangle, Lock, ShieldCheck } from "lucide-react";
import { forwardRef } from "react";
import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "../../../lib/cn.js";
import type { IconComponent } from "../../../lib/types.js";
import { Button } from "../button/button.js";

/**
 * ApprovalCard — inline pause-and-ask card for an agent stream.
 *
 * Used when the agent wants to perform an action that requires the user's
 * consent (run a destructive command, use a new tool, edit outside the
 * sandbox, etc.). Renders as a bordered card inside the conversation stream,
 * pauses the visual flow, and exposes Deny / Approve / Always-allow actions.
 */

const cardVariants = cva(
  "grid w-full gap-3 rounded-xl border p-4 transition-colors duration-base ease-out-soft",
  {
    variants: {
      severity: {
        info: "border-info/40 bg-info/5",
        warning: "border-warning/40 bg-warning/5",
        destructive: "border-destructive/40 bg-destructive/5",
      },
    },
    defaultVariants: { severity: "warning" },
  },
);

const ICON_FOR_SEVERITY: Record<NonNullable<ApprovalSeverity>, IconComponent> = {
  info: ShieldCheck,
  warning: AlertTriangle,
  destructive: Lock,
};

const ICON_TONE: Record<NonNullable<ApprovalSeverity>, string> = {
  info: "text-info",
  warning: "text-warning",
  destructive: "text-destructive",
};

type ApprovalSeverity = NonNullable<VariantProps<typeof cardVariants>["severity"]>;

interface ApprovalCardProps
  extends Omit<HTMLAttributes<HTMLElement>, "title">,
    VariantProps<typeof cardVariants> {
  /** Short headline ("Run destructive command?"). */
  title: ReactNode;
  /** What is being requested (command, file path, tool name…). Renders monospace. */
  request: ReactNode;
  /** Optional explanation line under the request. */
  description?: ReactNode;
  /** Optional expandable details (e.g. full command, file diff). */
  details?: ReactNode;
  /** Pressing the primary "Approve" button. */
  onApprove?: () => void;
  /** Pressing "Deny". */
  onDeny?: () => void;
  /** Pressing "Always allow" — optional tertiary action. */
  onAlways?: () => void;
  /** Customise the icon shown in the corner. */
  icon?: IconComponent;
}

const ApprovalCard = forwardRef<HTMLElement, ApprovalCardProps>(
  (
    {
      className,
      severity = "warning",
      title,
      request,
      description,
      details,
      onApprove,
      onDeny,
      onAlways,
      icon,
      ...props
    },
    ref,
  ) => {
    const resolvedSeverity: ApprovalSeverity = severity ?? "warning";
    const Icon = icon ?? ICON_FOR_SEVERITY[resolvedSeverity];
    return (
      <section
        ref={ref}
        role="alertdialog"
        aria-label={typeof title === "string" ? title : "Approval required"}
        className={cn(cardVariants({ severity: resolvedSeverity }), className)}
        {...props}
      >
        <header className="flex items-start gap-3">
          <span
            className={cn("mt-0.5 inline-flex shrink-0", ICON_TONE[resolvedSeverity])}
            aria-hidden="true"
          >
            <Icon className="size-4" />
          </span>
          <div className="grid min-w-0 flex-1 gap-1">
            <h4 className="font-display text-foreground text-title-md tracking-tight">{title}</h4>
            <code className="overflow-hidden break-words font-mono text-code-md text-muted-foreground">
              {request}
            </code>
            {description ? (
              <p className="text-body-sm text-muted-foreground">{description}</p>
            ) : null}
          </div>
        </header>
        {details ? (
          <details className="rounded-md border border-border/40 bg-background/40 px-3 py-2 text-body-sm">
            <summary className="cursor-pointer select-none font-mono text-label text-muted-foreground">
              Show details
            </summary>
            <div className="mt-2 break-words">{details}</div>
          </details>
        ) : null}
        <footer className="flex flex-wrap items-center justify-end gap-2">
          {onAlways ? (
            <Button size="sm" variant="ghost" onClick={onAlways}>
              Always allow
            </Button>
          ) : null}
          {onDeny ? (
            <Button size="sm" variant="secondary" onClick={onDeny}>
              Deny
            </Button>
          ) : null}
          {onApprove ? (
            <Button
              size="sm"
              variant={resolvedSeverity === "destructive" ? "destructive" : "primary"}
              onClick={onApprove}
            >
              Approve
            </Button>
          ) : null}
        </footer>
      </section>
    );
  },
);
ApprovalCard.displayName = "ApprovalCard";

export { ApprovalCard, type ApprovalSeverity };
