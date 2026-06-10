import { forwardRef } from "react";

import { cn } from "../../../lib/cn.js";
import { isDev } from "../../../lib/env.js";

/**
 * ThinkingLevelSelector — multi-state combobox for LLM reasoning budget.
 *
 * Mirrors the OpenClaw Control UI thinking selector. Values follow the SDK's
 * `Agent.thinking` parameter ("minimal" | "low" | "medium" | "high" | "xhigh")
 * plus a sentinel "off" and the special "inherited" mode that means "use the
 * value resolved by the parent agent/session".
 *
 * Pure UI primitive. No backend dependency. Consumer wires `value` from agent
 * state and persists `onChange` selections wherever it pleases.
 *
 * Phase 1 of `theokit-ui-parity-plan.md` (T1.1).
 */

export type ThinkingLevel = "off" | "minimal" | "low" | "medium" | "high" | "xhigh";

export type ThinkingLevelOrInherited = ThinkingLevel | "inherited";

export interface ThinkingLevelSelectorProps {
  value: ThinkingLevelOrInherited;
  inheritedValue?: ThinkingLevel;
  onChange: (value: ThinkingLevelOrInherited) => void;
  disabled?: boolean;
  className?: string;
  "data-testid"?: string;
}

const OVERRIDE_OPTIONS: ThinkingLevel[] = ["off", "minimal", "low", "medium", "high", "xhigh"];

function inheritedLabel(inheritedValue: ThinkingLevel | undefined): string {
  if (inheritedValue === undefined) return "Inherited";
  return `Inherited: ${inheritedValue}`;
}

function overrideLabel(level: ThinkingLevel): string {
  if (level === "off") return "Off";
  return `Override: ${level}`;
}

export const ThinkingLevelSelector = forwardRef<HTMLSelectElement, ThinkingLevelSelectorProps>(
  (
    { value, inheritedValue, onChange, disabled = false, className, "data-testid": dataTestId },
    ref,
  ) => {
    if (
      isDev() &&
      value === "inherited" &&
      inheritedValue === undefined
    ) {
      // biome-ignore lint/suspicious/noConsole: dev-only warning when caller passes value="inherited" without inheritedValue
      console.warn(
        '[ThinkingLevelSelector] value="inherited" but no inheritedValue prop — rendering as "Inherited: ?".',
      );
    }
    return (
      <select
        ref={ref}
        aria-label="Thinking level"
        className={cn(
          "rounded-md border border-border bg-background px-2 py-1 text-sm",
          "focus:outline-none focus:ring-2 focus:ring-primary",
          disabled && "cursor-not-allowed opacity-50",
          className,
        )}
        disabled={disabled}
        value={value}
        onChange={(e) => onChange(e.target.value as ThinkingLevelOrInherited)}
        data-testid={dataTestId ?? "thinking-level-selector"}
      >
        <option value="inherited">{inheritedLabel(inheritedValue)}</option>
        {OVERRIDE_OPTIONS.map((level) => (
          <option key={level} value={level}>
            {overrideLabel(level)}
          </option>
        ))}
      </select>
    );
  },
);
ThinkingLevelSelector.displayName = "ThinkingLevelSelector";
