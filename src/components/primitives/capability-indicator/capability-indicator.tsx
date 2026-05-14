import {
  AlertCircle,
  Eye,
  Network,
  Pencil,
  Rocket,
  Sparkles,
  Terminal,
  Trash2,
} from "lucide-react";
import { forwardRef } from "react";
import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "../../../lib/cn.js";
import type { IconComponent } from "../../../lib/types.js";

export type CapabilityState = "enabled" | "disabled" | "blocked" | "active";

export interface Capability {
  id: string;
  /** Visible label. */
  label: ReactNode;
  /** Optional icon override. */
  icon?: IconComponent;
  /** Default state. */
  state?: CapabilityState;
  /** Tooltip / longer description. */
  hint?: ReactNode;
}

interface CapabilityIndicatorProps extends HTMLAttributes<HTMLDivElement> {
  capabilities: Capability[];
}

/**
 * CapabilityIndicator — row of chips showing what the agent can currently do.
 *
 * Critical for transparency: the user should always see (e.g. in a top bar)
 * whether the agent has read/write/exec/network access enabled. The "active"
 * state pulses when a capability is in use.
 */
const stateClasses: Record<CapabilityState, string> = {
  enabled: "border-success/40 bg-success/10 text-success",
  active: "border-primary/50 bg-primary/15 text-primary",
  disabled: "border-border/40 bg-muted text-muted-foreground line-through",
  blocked: "border-destructive/40 bg-destructive/10 text-destructive",
};

const CapabilityIndicator = forwardRef<HTMLUListElement, CapabilityIndicatorProps>(
  ({ className, capabilities, ...props }, ref) => (
    <ul
      ref={ref}
      aria-label="Agent capabilities"
      className={cn("flex flex-wrap items-center gap-1.5", className)}
      {...(props as HTMLAttributes<HTMLUListElement>)}
    >
      {capabilities.map((c) => {
        const Icon = c.icon ?? AlertCircle;
        const state = c.state ?? "enabled";
        return (
          <li
            key={c.id}
            title={typeof c.hint === "string" ? c.hint : undefined}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5",
              "font-sans text-label",
              "transition-colors",
              stateClasses[state],
            )}
          >
            <Icon
              aria-hidden="true"
              className={cn("size-3 shrink-0", state === "active" && "animate-pulse")}
            />
            {c.label}
          </li>
        );
      })}
    </ul>
  ),
);
CapabilityIndicator.displayName = "CapabilityIndicator";

/** Common capability presets — re-use these so apps don't reinvent labels. */
export const capabilityPresets = {
  read: { id: "read", label: "Read files", icon: Eye } as const,
  write: { id: "write", label: "Write files", icon: Pencil } as const,
  delete: { id: "delete", label: "Delete files", icon: Trash2 } as const,
  bash: { id: "bash", label: "Run shell", icon: Terminal } as const,
  network: { id: "network", label: "Network", icon: Network } as const,
  deploy: { id: "deploy", label: "Deploy", icon: Rocket } as const,
  llm: { id: "llm", label: "Sub-agents", icon: Sparkles } as const,
};

export { CapabilityIndicator };
