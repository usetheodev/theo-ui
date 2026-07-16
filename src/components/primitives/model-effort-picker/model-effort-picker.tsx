"use client";

import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { ChevronDown, Sparkles } from "lucide-react";
import { forwardRef } from "react";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "../../../lib/cn.js";

export interface ModelEffortOption {
  id: string;
  name: string;
  /** Short one-line description shown under the name. */
  blurb?: string;
}

interface ModelEffortPickerProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onChange"> {
  models: ModelEffortOption[];
  model: string;
  onModelChange: (id: string) => void;
  effort: string;
  effortOptions?: string[];
  onEffortChange: (effort: string) => void;
}

const DEFAULT_EFFORTS = ["Low", "Medium", "High"];

/**
 * ModelEffortPicker — the composer's single combined dropdown for a coding agent: pick the
 * model (name + blurb + id) and the reasoning effort in one control. The trigger shows the
 * active model and effort; the menu is two Radix radio groups separated by a rule.
 */
const ModelEffortPicker = forwardRef<HTMLButtonElement, ModelEffortPickerProps>(
  (
    { className, models, model, onModelChange, effort, effortOptions, onEffortChange, ...props },
    ref,
  ) => {
    const active = models.find((m) => m.id === model) ?? models[0];
    const efforts = effortOptions ?? DEFAULT_EFFORTS;
    return (
      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <button
            data-slot="model-effort-picker"
            ref={ref}
            type="button"
            aria-label={`Model picker — ${active?.name ?? "model"}, ${effort} effort`}
            className={cn(
              "group inline-flex items-center gap-1.5 rounded-lg border border-border/60 bg-background px-2 py-1 text-xs",
              "transition-colors hover:border-primary/40",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              className,
            )}
            {...props}
          >
            <span className="flex size-4 items-center justify-center rounded bg-primary/15 text-primary">
              <Sparkles className="size-3" aria-hidden="true" />
            </span>
            <span className="font-medium text-foreground">{active?.name}</span>
            <span className="text-muted-foreground/60" aria-hidden="true">
              ·
            </span>
            <span className="text-muted-foreground">{effort}</span>
            <ChevronDown
              className="size-3 text-muted-foreground transition-transform group-data-[state=open]:rotate-180"
              aria-hidden="true"
            />
          </button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content
            sideOffset={6}
            align="end"
            className={cn(
              "z-50 w-72 overflow-hidden rounded-lg border bg-popover p-1 text-popover-foreground shadow-md",
              "data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=open]:animate-in",
              "data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=closed]:animate-out",
            )}
          >
            <DropdownMenu.Label className="px-2 py-1.5 text-muted-foreground text-xs uppercase tracking-wide">
              Model
            </DropdownMenu.Label>
            <DropdownMenu.RadioGroup value={model} onValueChange={onModelChange}>
              {models.map((option) => (
                <DropdownMenu.RadioItem
                  key={option.id}
                  value={option.id}
                  className={cn(
                    "flex cursor-pointer items-start rounded-md px-2 py-2",
                    "focus:bg-muted focus:outline-none data-[highlighted]:bg-muted",
                  )}
                >
                  <span className="flex min-w-0 flex-col gap-0.5">
                    <span className="font-medium text-foreground text-sm leading-none">
                      {option.name}
                    </span>
                    {option.blurb ? (
                      <span className="text-muted-foreground text-xs">{option.blurb}</span>
                    ) : null}
                    <span className="font-mono text-[10px] text-muted-foreground/60">
                      {option.id}
                    </span>
                  </span>
                </DropdownMenu.RadioItem>
              ))}
            </DropdownMenu.RadioGroup>
            <DropdownMenu.Separator className="my-1 h-px bg-border/60" />
            <DropdownMenu.Label className="px-2 py-1.5 text-muted-foreground text-xs uppercase tracking-wide">
              Reasoning effort
            </DropdownMenu.Label>
            <DropdownMenu.RadioGroup value={effort} onValueChange={onEffortChange}>
              {efforts.map((option) => (
                <DropdownMenu.RadioItem
                  key={option}
                  value={option}
                  className={cn(
                    "cursor-pointer rounded-md px-2 py-1.5 text-body-sm",
                    "focus:bg-muted focus:outline-none data-[highlighted]:bg-muted",
                  )}
                >
                  {option}
                </DropdownMenu.RadioItem>
              ))}
            </DropdownMenu.RadioGroup>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    );
  },
);
ModelEffortPicker.displayName = "ModelEffortPicker";

export { ModelEffortPicker };
export type { ModelEffortPickerProps };
