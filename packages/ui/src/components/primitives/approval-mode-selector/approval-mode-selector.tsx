"use client";

import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Check, ChevronDown, Hand } from "lucide-react";
import { forwardRef } from "react";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "../../../lib/cn.js";

export type ApprovalMode = "ask" | "auto-edits" | "readonly";

interface ApprovalModeSelectorProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onChange" | "value"> {
  value: ApprovalMode;
  onChange: (value: ApprovalMode) => void;
}

const MODES: { value: ApprovalMode; label: string }[] = [
  { value: "ask", label: "Ask for approval" },
  { value: "auto-edits", label: "Auto-approve edits" },
  { value: "readonly", label: "Read-only" },
];

/**
 * ApprovalModeSelector — the composer's inline approval-mode control for a coding agent:
 * a Hand-icon chip that toggles between "Ask for approval", "Auto-approve edits", and
 * "Read-only". Controlled: the caller owns `value` and handles `onChange`.
 */
const ApprovalModeSelector = forwardRef<HTMLButtonElement, ApprovalModeSelectorProps>(
  ({ className, value, onChange, ...props }, ref) => {
    const current = MODES.find((m) => m.value === value) ?? MODES[0];
    return (
      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <button
            data-slot="approval-mode-selector"
            ref={ref}
            type="button"
            aria-label="Approval mode"
            className={cn(
              "inline-flex h-6 items-center gap-1 rounded-md px-1",
              "text-muted-foreground text-xs",
              "transition-colors hover:text-foreground",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              className,
            )}
            {...props}
          >
            <Hand className="size-3.5" aria-hidden="true" />
            {current?.label}
            <ChevronDown className="size-3" aria-hidden="true" />
          </button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content
            sideOffset={6}
            align="start"
            className={cn(
              "z-50 min-w-[12rem] overflow-hidden rounded-lg border bg-popover p-1 text-popover-foreground shadow-md",
              "data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=open]:animate-in",
              "data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=closed]:animate-out",
            )}
          >
            {MODES.map((mode) => (
              <DropdownMenu.Item
                key={mode.value}
                onSelect={() => onChange(mode.value)}
                className={cn(
                  "flex cursor-pointer items-center justify-between gap-3 rounded-md px-2 py-1.5",
                  "text-body-sm",
                  "focus:bg-muted focus:outline-none data-[highlighted]:bg-muted",
                )}
              >
                {mode.label}
                {mode.value === value ? <Check className="size-3.5 text-primary" /> : null}
              </DropdownMenu.Item>
            ))}
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    );
  },
);
ApprovalModeSelector.displayName = "ApprovalModeSelector";

export { ApprovalModeSelector };
export type { ApprovalModeSelectorProps };
