import { ExternalLink, GitPullRequest, Server } from "lucide-react";
import { forwardRef } from "react";
import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "../../../lib/cn.js";
import { Badge } from "../../primitives/badge/index.js";
import type { DeploymentStatus } from "../deployment-row/deployment-row.js";

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
const statusToDot: Record<
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

export interface PreviewService {
  /** Service name e.g. "api", "web", "worker". */
  name: string;
  /** Live URL or null if not exposed (worker). */
  url?: string;
  status: DeploymentStatus;
}

export interface PreviewEnv {
  id: string;
  prNumber: number;
  prTitle: string;
  branch: string;
  author?: { name: string; avatarUrl?: string };
  services: PreviewService[];
  createdAt: string;
}

interface PreviewEnvCardProps extends HTMLAttributes<HTMLDivElement> {
  env: PreviewEnv;
  actions?: ReactNode;
}

/**
 * PreviewEnvCard — preview environment card surfacing all services from one PR.
 *
 * Theo's killer feature: full-stack preview environments. The card shows:
 *   - PR number + title at the top
 *   - branch + author in the metadata row
 *   - one badge per service with its own status + URL
 *   - bottom action row (Open, Promote, Delete)
 */
const PreviewEnvCard = forwardRef<HTMLDivElement, PreviewEnvCardProps>(
  ({ className, env, actions, ...props }, ref) => (
    <article
      ref={ref}
      className={cn(
        "rounded-xl border bg-card p-5 shadow-sm",
        "transition-[border-color,box-shadow] duration-base ease-out-soft",
        "hover:border-primary/40",
        className,
      )}
      {...(props as HTMLAttributes<HTMLDivElement>)}
    >
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="flex items-center gap-2 font-mono text-label-caps text-muted-foreground uppercase">
            <GitPullRequest className="size-3" /> PR #{env.prNumber}
          </p>
          <h3 className="mt-1 truncate font-display text-title-md tracking-tight">{env.prTitle}</h3>
          <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-body-sm text-muted-foreground">
            <span className="font-mono text-code-sm">{env.branch}</span>
            {env.author ? (
              <>
                <span aria-hidden="true">·</span>
                <span>by {env.author.name}</span>
              </>
            ) : null}
            <span aria-hidden="true">·</span>
            <span>opened {env.createdAt}</span>
          </p>
        </div>
        <Badge variant="primary">
          <Server className="size-3" /> {env.services.length} service
          {env.services.length === 1 ? "" : "s"}
        </Badge>
      </header>

      <ul className="mt-4 divide-y divide-border/30 rounded-lg border border-border/30">
        {env.services.map((s) => (
          <li key={s.name} className="flex items-center justify-between gap-3 px-3 py-2">
            <span className="font-mono text-code-sm text-foreground">{s.name}</span>
            <div className="flex items-center gap-2">
              {s.url ? (
                <a
                  href={s.url}
                  className="inline-flex items-center gap-1 font-mono text-code-sm text-primary hover:underline"
                  target="_blank"
                  rel="noreferrer"
                >
                  {s.url.replace(/^https?:\/\//, "")}
                  <ExternalLink className="size-3" />
                </a>
              ) : (
                <span className="font-mono text-code-sm text-muted-foreground">internal</span>
              )}
              <Badge variant={statusToVariant[s.status]}>
                <Badge.Dot
                  tone={statusToDot[s.status]}
                  pulse={
                    s.status === "building" || s.status === "deploying" || s.status === "queued"
                  }
                />
                {statusLabels[s.status]}
              </Badge>
            </div>
          </li>
        ))}
      </ul>

      {actions ? <div className="mt-4 flex items-center gap-2">{actions}</div> : null}
    </article>
  ),
);
PreviewEnvCard.displayName = "PreviewEnvCard";

export { PreviewEnvCard };
