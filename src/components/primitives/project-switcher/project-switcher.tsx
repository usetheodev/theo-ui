import { ChevronsUpDown, GitBranch } from "lucide-react";
import { forwardRef } from "react";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "../../../lib/cn.js";

/**
 * ProjectSwitcher — sidebar header for a code agent app.
 *
 * Shows the active workspace (folder name) + branch + status dot + a tiny
 * `ChevronsUpDown` hint when clickable. Used in Sidebar.Header to anchor the
 * current project context for the session list below.
 *
 *   <Sidebar.Header className="p-0">
 *     <ProjectSwitcher
 *       workspace="acme-web"
 *       branch="claude/alignment-grid"
 *       status="running"
 *       onClick={openProjectPicker}
 *     />
 *   </Sidebar.Header>
 *
 * If `onClick` is omitted, renders as a static `<div>` (no chevron, not focusable).
 */

export type ProjectStatus = "idle" | "running" | "error" | "offline";

const STATUS_CLASS: Record<ProjectStatus, string> = {
  idle: "bg-muted-foreground/40",
  running: "bg-success animate-pulse",
  error: "bg-destructive",
  offline: "bg-muted-foreground/20",
};

const STATUS_LABEL: Record<ProjectStatus, string> = {
  idle: "Idle",
  running: "Agent running",
  error: "Error",
  offline: "Offline",
};

interface ProjectSwitcherProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "type" | "children"> {
  /** Workspace / folder name (e.g. "acme-web"). */
  workspace: ReactNode;
  /** Optional git branch. Renders inline with a GitBranch icon. */
  branch?: ReactNode;
  /** Optional status dot. Defaults to "idle". */
  status?: ProjectStatus;
  /** Brand letter / icon shown in the violet tile. Default: first char of workspace if string. */
  brand?: ReactNode;
}

const ProjectSwitcher = forwardRef<HTMLButtonElement, ProjectSwitcherProps>(
  ({ className, workspace, branch, status = "idle", brand, onClick, disabled, ...props }, ref) => {
    const isInteractive = !!onClick;
    const inferredBrand =
      brand ?? (typeof workspace === "string" ? workspace.charAt(0).toUpperCase() : "·");
    const content = (
      <>
        <span
          className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary font-black font-display text-primary-foreground"
          aria-hidden
        >
          {inferredBrand}
        </span>
        <div className="grid min-w-0 flex-1 text-left">
          <div className="flex min-w-0 items-center gap-1.5">
            <span className="truncate font-display text-title-md leading-none">{workspace}</span>
            <span
              className={cn("size-1.5 shrink-0 rounded-full", STATUS_CLASS[status])}
              aria-label={STATUS_LABEL[status]}
              role="img"
            />
          </div>
          {branch ? (
            <span className="mt-1 inline-flex items-center gap-1 truncate font-mono text-label text-muted-foreground">
              <GitBranch className="size-3 shrink-0" aria-hidden /> {branch}
            </span>
          ) : null}
        </div>
        {isInteractive ? (
          <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground" aria-hidden />
        ) : null}
      </>
    );

    if (!isInteractive) {
      return (
        <div
          className={cn("flex w-full items-center gap-3 px-5 py-3 text-card-foreground", className)}
          aria-disabled={disabled || undefined}
        >
          {content}
        </div>
      );
    }

    return (
      <button
        ref={ref}
        type="button"
        onClick={onClick}
        disabled={disabled}
        className={cn(
          "flex w-full items-center gap-3 px-5 py-3 text-card-foreground",
          "transition-colors hover:bg-muted/40",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
          "disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        {...props}
      >
        {content}
      </button>
    );
  },
);
ProjectSwitcher.displayName = "ProjectSwitcher";

export { ProjectSwitcher };
