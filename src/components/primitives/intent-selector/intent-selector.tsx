import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Check, ChevronDown, Pencil } from "lucide-react";
import { forwardRef } from "react";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "../../../lib/cn.js";
import type { IconComponent } from "../../../lib/types.js";

export interface IntentOption {
  id: string;
  label: string;
  /** Optional one-liner shown below the label in the menu. */
  description?: string;
  /** Optional icon — defaults to a pencil for the trigger if none. */
  icon?: IconComponent;
}

interface IntentSelectorProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onChange"> {
  value: string;
  options: IntentOption[];
  onChange?: (id: string) => void;
}

/**
 * IntentSelector — chip dropdown for picking the agent's intent for the next
 * turn (e.g. edit / plan / review). Mirrors ModelSelector: pill trigger +
 * Radix DropdownMenu of options with description and a check on the active.
 */
const IntentSelector = forwardRef<HTMLButtonElement, IntentSelectorProps>(
  ({ className, value, options, onChange, ...props }, ref) => {
    const current = options.find((o) => o.id === value) ?? options[0];
    const Icon = current?.icon ?? Pencil;
    return (
      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <button
            data-slot="intent-selector"
            ref={ref}
            type="button"
            className={cn(
              "inline-flex h-8 items-center gap-2 rounded-full border border-border/60 bg-card px-3",
              "font-medium font-sans text-body-sm text-foreground",
              "transition-colors duration-base ease-out-soft",
              "hover:bg-muted",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
              className,
            )}
            {...props}
          >
            <Icon className="size-3.5 text-primary" aria-hidden="true" />
            {current?.label ?? "Select intent"}
            <ChevronDown className="size-3 text-muted-foreground" aria-hidden="true" />
          </button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content
            sideOffset={6}
            align="start"
            className={cn(
              "z-50 min-w-[16rem] overflow-hidden rounded-lg border bg-popover p-1 text-popover-foreground shadow-md",
              "data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=open]:animate-in",
              "data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=closed]:animate-out",
            )}
          >
            {options.map((opt) => {
              const OptIcon = opt.icon ?? Pencil;
              return (
                <DropdownMenu.Item
                  key={opt.id}
                  onSelect={() => onChange?.(opt.id)}
                  className={cn(
                    "flex cursor-pointer items-start gap-3 rounded-md px-2 py-2",
                    "text-body-sm",
                    "focus:bg-muted focus:outline-none",
                    "data-[highlighted]:bg-muted",
                  )}
                >
                  <OptIcon className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                  <span className="flex flex-1 flex-col">
                    <span className="font-medium">{opt.label}</span>
                    {opt.description ? (
                      <span className="text-label text-muted-foreground">{opt.description}</span>
                    ) : null}
                  </span>
                  {opt.id === value ? (
                    <Check className="mt-0.5 size-3.5 shrink-0 text-primary" />
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
IntentSelector.displayName = "IntentSelector";

export { IntentSelector };
