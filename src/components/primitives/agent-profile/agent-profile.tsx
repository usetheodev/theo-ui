import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Check, ChevronDown, Sparkles } from "lucide-react";
import { forwardRef } from "react";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "../../../lib/cn.js";

export interface AgentProfileDescriptor {
  id: string;
  /** Display name, e.g. "Coder", "Planner", "Reviewer". */
  name: string;
  /** Avatar initials (2 chars max). Falls back to first 2 letters of name. */
  initials?: string;
  /** Optional short description for tooltips and the dropdown. */
  description?: ReactNode;
  /**
   * Identity tone — colors the avatar so users tell agents apart at a glance.
   */
  tone?: "primary" | "accent" | "success" | "warning" | "info" | "muted";
  /** Optional badge text (e.g. "experimental"). */
  badge?: ReactNode;
}

const TONE_CLASS: Record<NonNullable<AgentProfileDescriptor["tone"]>, string> = {
  primary: "bg-primary text-primary-foreground",
  accent: "bg-accent text-accent-foreground",
  success: "bg-success text-success-foreground",
  warning: "bg-warning text-warning-foreground",
  info: "bg-info text-info-foreground",
  muted: "bg-muted text-foreground",
};

interface AgentProfileProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onChange"> {
  agents: AgentProfileDescriptor[];
  activeId: string;
  onChange?: (id: string) => void;
}

/**
 * AgentProfile — switcher between multiple agent profiles (coder, planner,
 * reviewer, etc.). Each profile gets its own tone so the user can spot at a
 * glance which "persona" is currently driving the session.
 */
const AgentProfile = forwardRef<HTMLButtonElement, AgentProfileProps>(
  ({ className, agents, activeId, onChange, ...props }, ref) => {
    const active = agents.find((a) => a.id === activeId) ?? agents[0];
    if (!active) return null;
    const initials = active.initials ?? active.name.slice(0, 2).toUpperCase();
    return (
      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <button
            ref={ref}
            type="button"
            className={cn(
              "inline-flex h-9 items-center gap-2 rounded-full border border-border/60 bg-card pr-3 pl-1",
              "transition-colors hover:bg-muted",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
              className,
            )}
            {...props}
          >
            <span
              className={cn(
                "grid size-7 place-items-center rounded-full font-bold font-mono text-label",
                TONE_CLASS[active.tone ?? "primary"],
              )}
              aria-hidden
            >
              {initials}
            </span>
            <span className="font-medium font-sans text-body-sm text-foreground">
              {active.name}
            </span>
            <ChevronDown className="size-3 text-muted-foreground" aria-hidden />
          </button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content
            align="start"
            sideOffset={6}
            className={cn(
              "z-50 min-w-[18rem] overflow-hidden rounded-lg border bg-popover p-1 text-popover-foreground shadow-md",
              "data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=open]:animate-in",
              "data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=closed]:animate-out",
            )}
          >
            <DropdownMenu.Label className="px-2 py-1.5 font-mono text-label-caps text-muted-foreground uppercase tracking-wider">
              Switch agent
            </DropdownMenu.Label>
            {agents.map((agent) => {
              const inits = agent.initials ?? agent.name.slice(0, 2).toUpperCase();
              const isActive = agent.id === activeId;
              return (
                <DropdownMenu.Item
                  key={agent.id}
                  onSelect={() => onChange?.(agent.id)}
                  className={cn(
                    "flex cursor-pointer items-start gap-3 rounded-md px-2 py-2",
                    "focus:bg-muted focus:outline-none data-[highlighted]:bg-muted",
                  )}
                >
                  <span
                    className={cn(
                      "mt-0.5 grid size-8 place-items-center rounded-full font-bold font-mono text-label",
                      TONE_CLASS[agent.tone ?? "muted"],
                    )}
                    aria-hidden
                  >
                    {inits}
                  </span>
                  <div className="grid min-w-0 flex-1 gap-0.5">
                    <span className="flex items-center gap-2">
                      <span className="font-medium text-body-sm">{agent.name}</span>
                      {agent.badge ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-accent/15 px-1.5 py-0 font-mono text-accent text-label uppercase">
                          <Sparkles className="size-2.5" aria-hidden />
                          {agent.badge}
                        </span>
                      ) : null}
                    </span>
                    {agent.description ? (
                      <span className="text-body-sm text-muted-foreground">
                        {agent.description}
                      </span>
                    ) : null}
                  </div>
                  {isActive ? (
                    <Check className="mt-1 size-4 shrink-0 text-primary" aria-hidden />
                  ) : null}
                </DropdownMenu.Item>
              );
            })}
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    );
  },
);
AgentProfile.displayName = "AgentProfile";

export { AgentProfile };
