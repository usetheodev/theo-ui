"use client";

import { RotateCcw, Sparkles } from "lucide-react";
import { forwardRef, useState } from "react";
import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "../../../lib/cn.js";

interface SystemPromptEditorProps extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  /** Vendor / default system prompt (read-only). */
  defaultPrompt: string;
  /** Current override; pass empty string for "use default". */
  override: string;
  onOverrideChange: (next: string) => void;
  /** Approximate token count for the active prompt. */
  tokenEstimate?: number;
  title?: ReactNode;
}

/**
 * SystemPromptEditor — surface the agent's system prompt with a clear
 * "vendor default" vs "user override" toggle.
 *
 * Behavior:
 *   - When override is empty, the textarea shows the default (greyed out,
 *     editable starts blank).
 *   - When user types, override takes effect.
 *   - "Reset to default" wipes the override.
 *
 * Critical for transparency: a user must be able to see and edit the prompt.
 */
const SystemPromptEditor = forwardRef<HTMLDivElement, SystemPromptEditorProps>(
  (
    {
      className,
      defaultPrompt,
      override,
      onOverrideChange,
      tokenEstimate,
      title = "System prompt",
      ...props
    },
    ref,
  ) => {
    const usingOverride = override.length > 0;
    const [showDefault, setShowDefault] = useState(false);

    return (
      <section
        data-slot="system-prompt-editor"
        ref={ref}
        className={cn("rounded-xl border bg-card", className)}
        {...props}
      >
        <header className="flex items-center justify-between gap-3 border-border/40 border-b px-4 py-3">
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-primary" aria-hidden="true" />
            <h3 className="font-display text-title-md tracking-tight">{title}</h3>
            <span
              className={cn(
                "inline-flex items-center rounded-full border px-2 py-0.5 font-mono text-label uppercase tracking-wider",
                usingOverride
                  ? "border-primary/40 bg-primary/10 text-primary"
                  : "border-border/40 bg-muted text-muted-foreground",
              )}
            >
              {usingOverride ? "Override active" : "Vendor default"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {tokenEstimate !== undefined ? (
              <span className="font-mono text-label text-muted-foreground tabular-nums">
                ~{tokenEstimate.toLocaleString()} tokens
              </span>
            ) : null}
            <button
              type="button"
              onClick={() => setShowDefault((v) => !v)}
              className="rounded-md px-2 py-1 font-mono text-label text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {showDefault ? "Hide" : "Show"} default
            </button>
            {usingOverride ? (
              <button
                type="button"
                onClick={() => onOverrideChange("")}
                className="inline-flex items-center gap-1 rounded-md px-2 py-1 font-mono text-label text-muted-foreground hover:bg-muted hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <RotateCcw className="size-3" /> Reset
              </button>
            ) : null}
          </div>
        </header>

        {showDefault ? (
          <pre className="max-h-48 overflow-auto border-border/40 border-b bg-muted/40 px-4 py-3 font-mono text-code-sm text-muted-foreground">
            {defaultPrompt}
          </pre>
        ) : null}

        <textarea
          value={override}
          onChange={(e) => onOverrideChange(e.target.value)}
          placeholder={
            usingOverride ? "" : "Leave empty to use the vendor default. Type here to override."
          }
          rows={8}
          className={cn(
            "w-full resize-y bg-transparent px-4 py-3 font-mono text-code-md text-foreground",
            "placeholder:text-muted-foreground",
            "focus:outline-none",
          )}
        />
      </section>
    );
  },
);
SystemPromptEditor.displayName = "SystemPromptEditor";

export { SystemPromptEditor };
