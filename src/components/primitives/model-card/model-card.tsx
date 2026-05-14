import { CalendarDays, Eye, GitBranch, Image, Sparkles, Wrench } from "lucide-react";
import { forwardRef } from "react";
import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "../../../lib/cn.js";
import type { IconComponent } from "../../../lib/types.js";

export interface ModelCapabilityFlag {
  id: string;
  label: string;
  icon?: IconComponent;
  enabled: boolean;
}

export interface ModelInfo {
  id: string;
  /** Display name (e.g. "Opus 4.7"). */
  name: string;
  /** Vendor (Anthropic, OpenAI, …). */
  vendor: string;
  /** Optional tag (default, fast, smart, beta). */
  tag?: ReactNode;
  /** Total context window in tokens. */
  contextWindow: number;
  /** Max output tokens per turn. */
  maxOutput: number;
  /** USD per million input tokens. */
  pricePerMInput?: number;
  /** USD per million output tokens. */
  pricePerMOutput?: number;
  /** Knowledge cutoff date label (e.g. "Jan 2026"). */
  cutoff?: string;
  /** Capability flags shown as chips. */
  capabilities?: ModelCapabilityFlag[];
  /** Short description / positioning. */
  description?: ReactNode;
}

const formatTokens = (n: number) => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(0)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}k`;
  return `${n}`;
};

const formatUsd = (n: number) =>
  n >= 100 ? `$${n.toFixed(0)}` : n >= 1 ? `$${n.toFixed(2)}` : `$${n.toFixed(3)}`;

interface ModelCardProps extends Omit<HTMLAttributes<HTMLElement>, "onSelect"> {
  model: ModelInfo;
  /** Render as the currently-selected variant (violet ring). */
  selected?: boolean;
  /** Fires when user clicks to select. */
  onSelect?: (id: string) => void;
}

/**
 * ModelCard — full info on a model: vendor, context, output cap, pricing,
 * capabilities, knowledge cutoff. Used in the "switch model" surface.
 */
const ModelCard = forwardRef<HTMLElement, ModelCardProps>(
  ({ className, model, selected, onSelect, ...props }, ref) => {
    const Tag = onSelect ? "button" : "article";
    return (
      <Tag
        ref={ref as never}
        type={onSelect ? "button" : undefined}
        onClick={onSelect ? () => onSelect(model.id) : undefined}
        className={cn(
          "grid gap-3 rounded-xl border bg-card p-4 text-left",
          "transition-[border-color,box-shadow] duration-base ease-out-soft",
          selected
            ? "border-primary shadow-glow"
            : onSelect
              ? "hover:border-primary/40 hover:shadow-sm"
              : "",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          className,
        )}
        aria-pressed={onSelect ? !!selected : undefined}
        {...(props as HTMLAttributes<HTMLElement>)}
      >
        <header className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h4 className="font-display text-title-md tracking-tight">{model.name}</h4>
            <p className="font-mono text-label-caps text-muted-foreground uppercase tracking-wider">
              {model.vendor}
            </p>
          </div>
          {model.tag ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-accent/15 px-2 py-0.5 font-mono text-accent text-label uppercase">
              {typeof model.tag === "string" && model.tag.toLowerCase() === "smart" ? (
                <Sparkles className="size-3" />
              ) : null}
              {model.tag}
            </span>
          ) : null}
        </header>

        {model.description ? (
          <p className="text-body-sm text-muted-foreground">{model.description}</p>
        ) : null}

        <dl className="grid grid-cols-2 gap-3 border-border/30 border-t pt-3 font-mono">
          <div className="grid gap-0.5">
            <dt className="text-label-caps text-muted-foreground uppercase tracking-wider">
              Context
            </dt>
            <dd className="font-medium text-body-sm tabular-nums">
              {formatTokens(model.contextWindow)} tok
            </dd>
          </div>
          <div className="grid gap-0.5">
            <dt className="text-label-caps text-muted-foreground uppercase tracking-wider">
              Max output
            </dt>
            <dd className="font-medium text-body-sm tabular-nums">
              {formatTokens(model.maxOutput)} tok
            </dd>
          </div>
          {model.pricePerMInput !== undefined ? (
            <div className="grid gap-0.5">
              <dt className="text-label-caps text-muted-foreground uppercase tracking-wider">
                Input
              </dt>
              <dd className="font-medium text-body-sm tabular-nums">
                {formatUsd(model.pricePerMInput)} <span className="text-muted-foreground">/M</span>
              </dd>
            </div>
          ) : null}
          {model.pricePerMOutput !== undefined ? (
            <div className="grid gap-0.5">
              <dt className="text-label-caps text-muted-foreground uppercase tracking-wider">
                Output
              </dt>
              <dd className="font-medium text-body-sm tabular-nums">
                {formatUsd(model.pricePerMOutput)} <span className="text-muted-foreground">/M</span>
              </dd>
            </div>
          ) : null}
        </dl>

        {model.capabilities && model.capabilities.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {model.capabilities.map((cap) => {
              const Icon = cap.icon ?? Wrench;
              return (
                <span
                  key={cap.id}
                  className={cn(
                    "inline-flex items-center gap-1 rounded-md px-2 py-0.5 font-mono text-label",
                    cap.enabled
                      ? "bg-success/15 text-success"
                      : "bg-muted text-muted-foreground line-through",
                  )}
                >
                  <Icon className="size-3" aria-hidden="true" />
                  {cap.label}
                </span>
              );
            })}
          </div>
        ) : null}

        {model.cutoff ? (
          <p className="inline-flex items-center gap-1 font-mono text-label text-muted-foreground">
            <CalendarDays className="size-3" aria-hidden="true" /> Knowledge cutoff · {model.cutoff}
          </p>
        ) : null}
      </Tag>
    );
  },
);
ModelCard.displayName = "ModelCard";

/** Pre-canned capability flags. */
export const modelCapabilityPresets = {
  vision: { id: "vision", label: "Vision", icon: Image as IconComponent } as const,
  tools: { id: "tools", label: "Tool use", icon: Wrench } as const,
  reasoning: { id: "reasoning", label: "Reasoning", icon: Sparkles } as const,
  fineTuning: { id: "ft", label: "Fine-tuning", icon: GitBranch } as const,
  multimodal: { id: "multimodal", label: "Multimodal", icon: Eye } as const,
};

export { ModelCard };
