import { Activity, GitBranch, GitCommit } from "lucide-react";
import { forwardRef } from "react";
import type { HTMLAttributes, ReactNode, Ref } from "react";
import { cn } from "../../../lib/cn.js";
import { safeHref } from "../../../lib/safe-href.js";
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

export interface Project {
  id: string;
  name: string;
  description?: string;
  framework?: string;
  branch: string;
  commitSha: string;
  commitMessage?: string;
  status: DeploymentStatus;
  url?: string;
  region?: string;
  lastDeployedAt: string;
}

interface ProjectCardProps extends HTMLAttributes<HTMLAnchorElement | HTMLDivElement> {
  project: Project;
  href?: string;
  actions?: ReactNode;
  /**
   * Show the project description and commit message. Default true.
   */
  detailed?: boolean;
}

/**
 * ProjectCard — surface for a project in a project listing.
 *
 * Light hover lift (no shadow inflation), violet ring on focus,
 * status badge with optional pulse, framework + region in muted footer.
 */
const ProjectCard = forwardRef<HTMLElement, ProjectCardProps>(
  ({ className, project, href, actions, detailed = true, ...props }, ref) => {
    // T3.3 (SEC-003): defang javascript:/vbscript:/data:text/html before
    // rendering as <a href>. Consumers passing user-controlled URLs are
    // protected from XSS via dangerous protocols.
    const sanitizedHref = safeHref(href);
    const isLink = sanitizedHref !== undefined;
    const Tag = isLink ? "a" : "div";
    const isAnimated =
      project.status === "building" ||
      project.status === "deploying" ||
      project.status === "queued";

    const content = (
      <>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate font-display text-title-md tracking-tight">{project.name}</h3>
            {project.framework ? (
              <p className="mt-0.5 font-mono text-label-caps text-muted-foreground uppercase">
                {project.framework}
              </p>
            ) : null}
          </div>
          <Badge variant={statusToVariant[project.status]}>
            <Badge.Dot tone={statusToDotTone[project.status]} pulse={isAnimated} />
            {project.status === "live"
              ? "Live"
              : project.status === "building"
                ? "Building"
                : project.status === "deploying"
                  ? "Deploying"
                  : project.status === "queued"
                    ? "Queued"
                    : project.status === "failed"
                      ? "Failed"
                      : "Cancelled"}
          </Badge>
        </div>

        {detailed && project.description ? (
          <p className="line-clamp-2 text-body-sm text-muted-foreground">{project.description}</p>
        ) : null}

        {detailed && project.commitMessage ? (
          <p className="line-clamp-1 font-mono text-code-sm text-foreground/80">
            {project.commitMessage}
          </p>
        ) : null}

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-code-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <GitBranch className="size-3" /> {project.branch}
          </span>
          <span className="inline-flex items-center gap-1">
            <GitCommit className="size-3" /> {project.commitSha.slice(0, 7)}
          </span>
          {project.region ? (
            <span className="inline-flex items-center gap-1">
              <Activity className="size-3" /> {project.region}
            </span>
          ) : null}
          <span aria-hidden="true">·</span>
          <span>{project.lastDeployedAt}</span>
        </div>

        {actions ? <div className="flex items-center gap-2 pt-2">{actions}</div> : null}
      </>
    );

    return (
      <Tag
        ref={ref as Ref<HTMLAnchorElement & HTMLDivElement>}
        href={sanitizedHref}
        className={cn(
          "group relative flex flex-col gap-3 rounded-xl border bg-card p-5 shadow-sm",
          "transition-[box-shadow,transform,border-color] duration-base ease-out-soft",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          isLink && "hover:-translate-y-px cursor-pointer hover:border-primary/50 hover:shadow-md",
          className,
        )}
        {...(props as HTMLAttributes<HTMLAnchorElement> & HTMLAttributes<HTMLDivElement>)}
      >
        {content}
      </Tag>
    );
  },
);
ProjectCard.displayName = "ProjectCard";

export { ProjectCard };
