"use client";

import { forwardRef, useEffect, useRef } from "react";
import type { ClipboardEvent, HTMLAttributes, KeyboardEvent } from "react";
import { cn } from "../../../lib/cn.js";

/**
 * PinInput — multi-slot OTP / code input primitive.
 *
 * Renders N separate boxes (default 6) that auto-advance focus on
 * input. Paste handling fills all slots from clipboard (whitespace
 * stripped). Arrow keys navigate; backspace clears current slot
 * then moves focus back when empty.
 *
 * Industry-standard pattern for email verification codes (Apple,
 * Stripe, Clerk, Auth0, GitHub two-factor).
 *
 * @example
 *   <PinInput
 *     length={6}
 *     value={code}
 *     onChange={setCode}
 *     onComplete={(v) => verify(v)}
 *     inputMode="numeric"
 *     aria-label="Verification code"
 *   />
 *
 * Note: value is treated as controlled. If you pass a complete value
 * on mount, onComplete will NOT fire — onComplete fires only on
 * transitions from incomplete → complete.
 */
export interface PinInputProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "onChange" | "inputMode"> {
  length?: number;
  value?: string;
  onChange?: (value: string) => void;
  onComplete?: (value: string) => void;
  inputMode?: "numeric" | "alphanumeric";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  error?: boolean;
  "aria-label": string;
  autoFocus?: boolean;
  mask?: boolean;
}

const SIZE_CLASS: Record<NonNullable<PinInputProps["size"]>, string> = {
  sm: "size-8 text-body-sm",
  md: "size-10 text-body-md",
  lg: "size-12 text-title-sm",
};

function sanitize(raw: string, inputMode: "numeric" | "alphanumeric"): string {
  const noWhitespace = raw.replace(/\s/g, "");
  if (inputMode === "numeric") {
    return noWhitespace.replace(/\D/g, "");
  }
  return noWhitespace.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

const PinInput = forwardRef<HTMLDivElement, PinInputProps>(
  (
    {
      className,
      length = 6,
      value = "",
      onChange,
      onComplete,
      inputMode = "numeric",
      size = "md",
      disabled = false,
      error = false,
      autoFocus = false,
      mask = false,
      "aria-label": ariaLabel,
      ...props
    },
    ref,
  ) => {
    const inputRefs = useRef<Array<HTMLInputElement | null>>([]);
    const wasCompleteRef = useRef<boolean>(value.length === length);

    // Auto-focus first slot on mount (SSR-safe)
    useEffect(() => {
      if (!autoFocus) return;
      if (typeof window === "undefined") return;
      inputRefs.current[0]?.focus();
    }, [autoFocus]);

    // Fire onComplete on transitions from incomplete → complete
    useEffect(() => {
      const isComplete = value.length === length && value.length > 0;
      if (isComplete && !wasCompleteRef.current) {
        onComplete?.(value);
      }
      wasCompleteRef.current = isComplete;
    }, [value, length, onComplete]);

    function commit(next: string) {
      const sanitized = sanitize(next, inputMode).slice(0, length);
      onChange?.(sanitized);
    }

    function handleChange(slot: number, raw: string) {
      const sanitized = sanitize(raw, inputMode);
      if (sanitized.length === 0) {
        // Clear current slot
        const next = `${value.slice(0, slot)}${value.slice(slot + 1)}`;
        commit(next);
        return;
      }
      // Take the last character typed (handles browser autocomplete that fills multiple)
      const ch = sanitized[sanitized.length - 1] ?? "";
      const next = `${value.slice(0, slot)}${ch}${value.slice(slot + 1)}`;
      commit(next);
      // Advance focus
      if (slot < length - 1) {
        inputRefs.current[slot + 1]?.focus();
      }
    }

    function handleKeyDown(slot: number, e: KeyboardEvent<HTMLInputElement>) {
      if (disabled) return;
      const slotChar = value[slot] ?? "";

      if (e.key === "Backspace") {
        if (slotChar === "") {
          // Move focus back if current is empty
          if (slot > 0) {
            inputRefs.current[slot - 1]?.focus();
          }
        } else {
          // Clear current slot, stay focused
          const next = `${value.slice(0, slot)}${value.slice(slot + 1)}`;
          commit(next);
        }
        e.preventDefault();
      } else if (e.key === "ArrowLeft") {
        if (slot > 0) inputRefs.current[slot - 1]?.focus();
        e.preventDefault();
      } else if (e.key === "ArrowRight") {
        if (slot < length - 1) inputRefs.current[slot + 1]?.focus();
        e.preventDefault();
      }
    }

    function handlePaste(slot: number, e: ClipboardEvent<HTMLInputElement>) {
      if (disabled) return;
      e.preventDefault();
      const pasted = e.clipboardData.getData("text/plain");
      const sanitized = sanitize(pasted, inputMode);
      if (sanitized.length === 0) return;
      // Build slot-indexed array, then overwrite from `slot` onwards.
      // Previous string-concat approach didn't pad when value was shorter
      // than `slot`, which made paste-from-middle-when-empty fill from 0.
      const slotArr: string[] = Array.from({ length }, (_, i) => value[i] ?? "");
      const remaining = length - slot;
      const filled = sanitized.slice(0, remaining);
      for (let i = 0; i < filled.length; i++) {
        slotArr[slot + i] = filled[i] ?? "";
      }
      const next = slotArr.join("");
      commit(next);
      // Focus the slot after the last filled, or the last slot if completed
      const focusAt = Math.min(slot + filled.length, length - 1);
      requestAnimationFrame(() => inputRefs.current[focusAt]?.focus());
    }

    const slots = Array.from({ length }, (_, i) => i);

    return (
      <div
        data-slot="pin-input"
        ref={ref}
        // biome-ignore lint/a11y/useSemanticElements: <fieldset> would force a different visual layout (rectangular border by default) and is form-bound; we use a div with role="group" + aria-label for grouping semantics.
        role="group"
        aria-label={ariaLabel}
        className={cn("inline-flex items-center gap-2", className)}
        {...props}
      >
        {slots.map((i) => {
          const ch = value[i] ?? "";
          const display = mask && ch !== "" ? "•" : ch;
          return (
            <input
              key={i}
              ref={(el) => {
                inputRefs.current[i] = el;
              }}
              type="text"
              inputMode={inputMode === "numeric" ? "numeric" : "text"}
              pattern={inputMode === "numeric" ? "[0-9]*" : undefined}
              maxLength={1}
              autoComplete={i === 0 ? "one-time-code" : "off"}
              disabled={disabled}
              value={display}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              onPaste={(e) => handlePaste(i, e)}
              aria-label={`Digit ${i + 1} of ${length}`}
              className={cn(
                "rounded-md border bg-card text-center font-medium font-mono",
                "transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                "disabled:cursor-not-allowed disabled:opacity-50",
                SIZE_CLASS[size],
                error ? "border-destructive" : "border-border/60 hover:border-border",
              )}
            />
          );
        })}
      </div>
    );
  },
);
PinInput.displayName = "PinInput";

export { PinInput };
