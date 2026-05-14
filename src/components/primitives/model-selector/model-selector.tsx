import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Check, ChevronDown, Sparkles } from "lucide-react";
import { forwardRef } from "react";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "../../../lib/cn.js";

export interface ModelOption {
  id: string;
  label: string;
  /** Optional vendor hint shown small below the label. */
  vendor?: string;
  /** Optional tag e.g. "default", "fast", "smart". */
  tag?: string;
}

interface ModelSelectorProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onChange"> {
  value: string;
  options: ModelOption[];
  onChange?: (id: string) => void;
}

/**
 * ModelSelector — chip dropdown for picking the active LLM.
 *
 * Visual: pill with violet dot + label + chevron. Dropdown uses Radix Menu.
 */
const ModelSelector = forwardRef<HTMLButtonElement, ModelSelectorProps>(
  ({ className, value, options, onChange, ...props }, ref) => {
    const current = options.find((o) => o.id === value) ?? options[0];
    return (
      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <button
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
            <span className="size-1.5 rounded-full bg-primary" aria-hidden="true" />
            {current?.label ?? "Select model"}
            <ChevronDown className="size-3 text-muted-foreground" aria-hidden="true" />
          </button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content
            sideOffset={6}
            align="end"
            className={cn(
              "z-50 min-w-[14rem] overflow-hidden rounded-lg border bg-popover p-1 text-popover-foreground shadow-md",
              "data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=open]:animate-in",
              "data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=closed]:animate-out",
            )}
          >
            {options.map((opt) => (
              <DropdownMenu.Item
                key={opt.id}
                onSelect={() => onChange?.(opt.id)}
                className={cn(
                  "flex cursor-pointer items-center justify-between gap-3 rounded-md px-2 py-2",
                  "text-body-sm",
                  "focus:bg-muted focus:outline-none",
                  "data-[highlighted]:bg-muted",
                )}
              >
                <span className="flex flex-col">
                  <span className="font-medium">{opt.label}</span>
                  {opt.vendor ? (
                    <span className="font-mono text-label text-muted-foreground">{opt.vendor}</span>
                  ) : null}
                </span>
                <span className="flex items-center gap-2">
                  {opt.tag ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-accent/15 px-2 py-0.5 font-mono text-accent text-label uppercase">
                      {opt.tag === "smart" ? <Sparkles className="size-3" /> : null}
                      {opt.tag}
                    </span>
                  ) : null}
                  {opt.id === value ? <Check className="size-3.5 text-primary" /> : null}
                </span>
              </DropdownMenu.Item>
            ))}
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    );
  },
);
ModelSelector.displayName = "ModelSelector";

export { ModelSelector };
