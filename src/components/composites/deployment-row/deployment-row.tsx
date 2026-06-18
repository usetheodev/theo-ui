import { GitCommit } from "lucide-react";
import { forwardRef } from "react";
import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "../../../lib/cn.js";
import { Badge } from "../../primitives/badge/index.js";

export type DeploymentStatus =
  | "queued"
  | "building"
  | "deploying"
  | "live"
  | "failed"
  | "cancelled";

const statusToVariant: Record<
  DeploymentStatus,
  "default" | "primary" | "success" | "warning" | "destructive"
> = {
  queued: "warning",
  building: "primary",
  deploying: "primary",
  live: "success",
  failed: "destructive",
  cancelled: "default",
};

const statusToDotTone: Record<
  DeploymentStatus,
  "primary" | "success" | "warning" | "destructive" | "muted"
> = {
  queued: "warning",
  building: "primary",
  deploying: "primary",
  live: "success",
  failed: "destructive",
  cancelled: "muted",
};

const statusLabels: Record<DeploymentStatus, string> = {
  queued: "Queued",
  building: "Building",
  deploying: "Deploying",
  live: "Live",
  failed: "Failed",
  cancelled: "Cancelled",
};

const isAnimated = (status: DeploymentStatus) =>
  status === "building" || status === "deploying" || status === "queued";

export interface Deployment {
  id: string;
  status: DeploymentStatus;
  environment: string;
  branch: string;
  commitSha: string;
  commitMessage: string;
  author?: { name: string; avatarUrl?: string };
  duration?: string;
  timeAgo: string;
}

interface DeploymentRowProps extends HTMLAttributes<HTMLDivElement> {
  deployment: Deployment;
  actions?: ReactNode;
}

/**
 * DeploymentRow — one row in a deployment list (table-ish layout).
 *
 * Inspired by Vercel/Railway deployment lists. Composes Badge + Badge.Dot for status,
 * mono font for SHA/branch, muted-foreground for metadata.
 */
const DeploymentRow = forwardRef<HTMLDivElement, DeploymentRowProps>(
  ({ className, deployment, actions, ...props }, ref) => {
    const variant = statusToVariant[deployment.status];
    const tone = statusToDotTone[deployment.status];
    return (
      <div
        ref={ref}
        className={cn(
          "grid grid-cols-[auto_1fr_auto] items-center gap-4 border-border/40 border-b px-4 py-3",
          "last:border-b-0",
          "transition-colors hover:bg-muted/40",
          className,
        )}
        {...props}
        data-slot="deployment-row"
      >
        <Badge variant={variant} className="min-w-[88px] justify-center">
          <Badge.Dot tone={tone} pulse={isAnimated(deployment.status)} />
          {statusLabels[deployment.status]}
        </Badge>

        <div className="min-w-0">
          <p className="truncate font-medium text-body-sm text-foreground">
            {deployment.commitMessage}
          </p>
          <p className="mt-0.5 flex flex-wrap items-center gap-2 text-body-sm text-muted-foreground">
            <span className="font-mono text-code-sm">{deployment.environment}</span>
            <span aria-hidden="true">·</span>
            <span className="inline-flex items-center gap-1 font-mono text-code-sm">
              <GitCommit className="size-3" /> {deployment.commitSha.slice(0, 7)}
            </span>
            <span aria-hidden="true">·</span>
            <span className="font-mono text-code-sm">{deployment.branch}</span>
            {deployment.author ? (
              <>
                <span aria-hidden="true">·</span>
                <span>by {deployment.author.name}</span>
              </>
            ) : null}
            {deployment.duration ? (
              <>
                <span aria-hidden="true">·</span>
                <span className="font-mono text-code-sm">{deployment.duration}</span>
              </>
            ) : null}
            <span aria-hidden="true">·</span>
            <span>{deployment.timeAgo}</span>
          </p>
        </div>

        {actions ? <div className="flex items-center gap-1">{actions}</div> : null}
      </div>
    );
  },
);
DeploymentRow.displayName = "DeploymentRow";

export { DeploymentRow };
