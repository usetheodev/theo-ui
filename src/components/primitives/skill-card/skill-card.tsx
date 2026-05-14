import { BookOpen, Sparkles, User, Users } from "lucide-react";
import { forwardRef } from "react";
import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "../../../lib/cn.js";
import type { IconComponent } from "../../../lib/types.js";
import type { Mode } from "../../../types/mode.js";

export type SkillSource = "builtin" | "project" | "user" | "plugin";
export type SkillState = "enabled" | "disabled";

const SOURCE_CONFIG: Record<SkillSource, { label: string; icon: IconComponent; tone: string }> = {
  builtin: { label: "Built-in", icon: Sparkles, tone: "text-primary" },
  project: { label: "Project", icon: BookOpen, tone: "text-accent" },
  user: { label: "User", icon: User, tone: "text-info" },
  plugin: { label: "Plugin", icon: Users, tone: "text-muted-foreground" },
};

export interface Skill {
  id: string;
  name: string;
  description?: ReactNode;
  /** Where the skill comes from. */
  source: SkillSource;
  /** Optional tools the skill is allowed to use (informational). */
  allowedTools?: string[];
  /** Optional trigger keywords / patterns for discovery. */
  triggers?: string[];
  state?: SkillState;
  /** Modes this skill is visible in. Omit / empty = global (all modes). */
  modes?: Mode[];
}

interface SkillCardProps extends HTMLAttributes<HTMLDivElement> {
  skill: Skill;
  onToggle?: (id: string, next: SkillState) => void;
}

/**
 * SkillCard — single skill entry showing what it does, where it came from,
 * and which tools it needs. Toggle to enable/disable for the current session.
 */
const SkillCard = forwardRef<HTMLDivElement, SkillCardProps>(
  ({ className, skill, onToggle, ...props }, ref) => {
    const config = SOURCE_CONFIG[skill.source];
    const Icon = config.icon;
    const state = skill.state ?? "enabled";
    const enabled = state === "enabled";
    return (
      <article
        ref={ref}
        className={cn(
          "grid gap-3 rounded-xl border bg-card p-4",
          !enabled && "opacity-60",
          className,
        )}
        {...props}
      >
        <header className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className={cn("grid size-8 place-items-center rounded-md bg-muted", config.tone)}>
              <Icon className="size-4" aria-hidden="true" />
            </span>
            <div className="grid">
              <h4 className="font-medium font-mono text-body-sm text-foreground">{skill.name}</h4>
              <span className="font-mono text-label-caps text-muted-foreground uppercase tracking-wider">
                {config.label}
              </span>
            </div>
          </div>
          {onToggle ? (
            <button
              type="button"
              onClick={() => onToggle(skill.id, enabled ? "disabled" : "enabled")}
              aria-pressed={enabled}
              className={cn(
                "inline-flex items-center rounded-full border px-2.5 py-0.5",
                "font-mono text-label uppercase tracking-wider transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                enabled
                  ? "border-success/40 bg-success/15 text-success"
                  : "border-border/40 bg-muted text-muted-foreground",
              )}
            >
              {enabled ? "Enabled" : "Disabled"}
            </button>
          ) : null}
        </header>
        {skill.description ? (
          <p className="text-body-sm text-muted-foreground">{skill.description}</p>
        ) : null}
        {skill.allowedTools && skill.allowedTools.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            <span className="font-mono text-label text-muted-foreground uppercase tracking-wider">
              tools:
            </span>
            {skill.allowedTools.map((tool) => (
              <span
                key={tool}
                className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 font-mono text-foreground text-label"
              >
                {tool}
              </span>
            ))}
          </div>
        ) : null}
        {skill.triggers && skill.triggers.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            <span className="font-mono text-label text-muted-foreground uppercase tracking-wider">
              triggers:
            </span>
            {skill.triggers.map((trigger) => (
              <span
                key={trigger}
                className="inline-flex items-center rounded-md bg-primary/10 px-2 py-0.5 font-mono text-label text-primary"
              >
                {trigger}
              </span>
            ))}
          </div>
        ) : null}
      </article>
    );
  },
);
SkillCard.displayName = "SkillCard";

export { SkillCard };
