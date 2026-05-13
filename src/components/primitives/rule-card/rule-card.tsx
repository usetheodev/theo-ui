import { Globe, Pencil, Trash2 } from "lucide-react";
import { forwardRef } from "react";
import type { HTMLAttributes } from "react";
import { cn } from "../../../lib/cn.js";
import type { Rule, RuleScope, RuleState } from "../../../types/rule.js";

/**
 * RuleCard — single Rule row in the Rules list. Renders title, scope/state
 * badges, optional tag chips, a truncated body preview, and edit/toggle/delete
 * actions in the corner.
 */

const SCOPE_LABEL: Record<RuleScope, string> = {
  global: "Global",
  project: "Project",
};

const SCOPE_CLASS: Record<RuleScope, string> = {
  global: "bg-primary/15 text-primary",
  project: "bg-accent/15 text-accent",
};

interface RuleCardProps extends Omit<HTMLAttributes<HTMLElement>, "title" | "onSelect"> {
  rule: Rule;
  /** Click on the card body — typically opens detail/edit view. */
  onSelect?: (id: string) => void;
  /** Click on the edit pencil. Defaults to onSelect if omitted. */
  onEdit?: (id: string) => void;
  /** Click on the trash icon. Renders the icon only when provided. */
  onDelete?: (id: string) => void;
  /** Toggle enabled/disabled. Renders the switch-like dot only when provided. */
  onToggle?: (id: string, next: RuleState) => void;
}

const RuleCard = forwardRef<HTMLElement, RuleCardProps>(
  ({ className, rule, onSelect, onEdit, onDelete, onToggle, ...props }, ref) => {
    const handleEdit = (e: React.MouseEvent) => {
      e.stopPropagation();
      (onEdit ?? onSelect)?.(rule.id);
    };
    const handleDelete = (e: React.MouseEvent) => {
      e.stopPropagation();
      onDelete?.(rule.id);
    };
    const handleToggle = (e: React.MouseEvent) => {
      e.stopPropagation();
      onToggle?.(rule.id, rule.state === "enabled" ? "disabled" : "enabled");
    };
    return (
      <article
        ref={ref}
        className={cn(
          "grid gap-2 rounded-lg border border-border/40 bg-card/40 p-3",
          "transition-colors duration-base ease-out-soft",
          onSelect && "cursor-pointer hover:border-border hover:bg-card/70",
          rule.state === "disabled" && "opacity-60",
          className,
        )}
        onClick={onSelect ? () => onSelect(rule.id) : undefined}
        {...props}
      >
        <header className="flex items-start gap-2">
          <h4 className="flex-1 truncate font-display text-foreground text-title-md tracking-tight">
            {rule.title}
          </h4>
          <span
            className={cn(
              "inline-flex h-5 shrink-0 items-center gap-1 rounded-md px-2 font-medium font-mono text-label tracking-tight",
              SCOPE_CLASS[rule.scope],
            )}
          >
            <Globe className="size-3" aria-hidden /> {SCOPE_LABEL[rule.scope]}
          </span>
        </header>
        <p className="line-clamp-2 text-body-sm text-muted-foreground">{rule.body}</p>
        <footer className="flex items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1">
            {rule.tags?.map((t) => (
              <span
                key={t}
                className="inline-flex h-4 items-center rounded bg-muted px-1.5 font-mono text-label-caps text-muted-foreground uppercase tracking-wider"
              >
                {t}
              </span>
            ))}
            {rule.updatedAt ? (
              <span className="font-mono text-label text-muted-foreground tabular-nums">
                · {rule.updatedAt}
              </span>
            ) : null}
          </div>
          <div className="flex items-center gap-1">
            {onToggle ? (
              <button
                type="button"
                onClick={handleToggle}
                aria-label={rule.state === "enabled" ? "Disable rule" : "Enable rule"}
                className={cn(
                  "inline-flex h-6 items-center rounded-full px-2 font-mono text-label",
                  rule.state === "enabled"
                    ? "bg-success/15 text-success"
                    : "bg-muted text-muted-foreground",
                )}
              >
                {rule.state === "enabled" ? "Enabled" : "Disabled"}
              </button>
            ) : null}
            <button
              type="button"
              onClick={handleEdit}
              aria-label="Edit rule"
              className="grid size-6 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <Pencil className="size-3.5" />
            </button>
            {onDelete ? (
              <button
                type="button"
                onClick={handleDelete}
                aria-label="Delete rule"
                className="grid size-6 place-items-center rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
              >
                <Trash2 className="size-3.5" />
              </button>
            ) : null}
          </div>
        </footer>
      </article>
    );
  },
);
RuleCard.displayName = "RuleCard";

export { RuleCard };
