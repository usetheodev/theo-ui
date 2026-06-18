"use client";

import { Plus, Trash2, Zap } from "lucide-react";
import { forwardRef, useState } from "react";
import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "../../../lib/cn.js";

export type HookEvent =
  | "PreToolUse"
  | "PostToolUse"
  | "UserPromptSubmit"
  | "Stop"
  | "SessionStart"
  | "SessionEnd";

export interface HookEntry {
  id: string;
  event: HookEvent;
  /** Tool matcher (e.g. "Bash", "Write", "*"). */
  matcher: string;
  /** Shell command to run. */
  command: string;
  enabled?: boolean;
}

const HOOK_EVENTS: HookEvent[] = [
  "PreToolUse",
  "PostToolUse",
  "UserPromptSubmit",
  "Stop",
  "SessionStart",
  "SessionEnd",
];

interface HookConfigProps extends Omit<HTMLAttributes<HTMLDivElement>, "title" | "onToggle"> {
  hooks: HookEntry[];
  onAdd?: (hook: Omit<HookEntry, "id">) => void;
  onRemove?: (id: string) => void;
  onToggle?: (id: string, enabled: boolean) => void;
  title?: ReactNode;
}

/**
 * HookConfig — editor for lifecycle hooks (PreToolUse, PostToolUse, Stop…).
 *
 * Mirrors Claude Code's settings.json hooks but visual. Each row is an
 * { event × matcher × command } triple with on/off toggle.
 */
const HookConfig = forwardRef<HTMLDivElement, HookConfigProps>(
  ({ className, hooks, onAdd, onRemove, onToggle, title = "Hooks", ...props }, ref) => {
    const [event, setEvent] = useState<HookEvent>("PreToolUse");
    const [matcher, setMatcher] = useState("*");
    const [command, setCommand] = useState("");

    const submit = () => {
      if (!command.trim()) return;
      onAdd?.({ event, matcher: matcher.trim() || "*", command: command.trim() });
      setCommand("");
    };

    return (
      <section ref={ref} className={cn("rounded-xl border bg-card", className)} {...props}>
        <header className="flex items-baseline justify-between border-border/40 border-b px-4 py-3">
          <div className="flex items-center gap-2">
            <Zap className="size-4 text-primary" aria-hidden="true" />
            <h3 className="font-display text-title-md tracking-tight">{title}</h3>
          </div>
          <span className="font-mono text-label text-muted-foreground">
            {hooks.length} {hooks.length === 1 ? "hook" : "hooks"}
          </span>
        </header>

        {onAdd ? (
          <form
            className="grid grid-cols-[140px_140px_1fr_auto] items-center gap-2 border-border/40 border-b p-3"
            onSubmit={(e) => {
              e.preventDefault();
              submit();
            }}
          >
            <select
              value={event}
              onChange={(e) => setEvent(e.target.value as HookEvent)}
              aria-label="Event"
              className="h-9 rounded-md border border-input bg-card px-2 font-mono text-code-sm"
            >
              {HOOK_EVENTS.map((evt) => (
                <option key={evt} value={evt}>
                  {evt}
                </option>
              ))}
            </select>
            <input
              type="text"
              value={matcher}
              onChange={(e) => setMatcher(e.target.value)}
              placeholder="matcher (Bash, Write, *)"
              aria-label="Matcher"
              className="h-9 rounded-md border border-input bg-card px-2 font-mono text-code-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <input
              type="text"
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              placeholder='command (e.g. "./scripts/audit.sh")'
              aria-label="Command"
              className="h-9 rounded-md border border-input bg-card px-2 font-mono text-code-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <button
              type="submit"
              className="inline-flex h-9 items-center gap-1 rounded-md bg-primary px-3 font-sans text-label text-primary-foreground hover:shadow-glow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Plus className="size-3.5" /> Add
            </button>
          </form>
        ) : null}

        <ul className="divide-y divide-border/30">
          {hooks.map((hook) => {
            const enabled = hook.enabled ?? true;
            return (
              <li
                key={hook.id}
                className={cn(
                  "grid grid-cols-[140px_140px_1fr_auto_auto] items-center gap-3 px-4 py-2.5",
                  !enabled && "opacity-50",
                )}
              >
                <span className="font-mono text-code-sm text-primary">{hook.event}</span>
                <span className="font-mono text-code-sm text-muted-foreground">{hook.matcher}</span>
                <span className="truncate font-mono text-code-sm text-foreground">
                  {hook.command}
                </span>
                {onToggle ? (
                  <button
                    type="button"
                    onClick={() => onToggle(hook.id, !enabled)}
                    aria-pressed={enabled}
                    className={cn(
                      "rounded-full border px-2.5 py-0.5 font-mono text-label uppercase",
                      enabled
                        ? "border-success/40 bg-success/15 text-success"
                        : "border-border/40 bg-muted text-muted-foreground",
                    )}
                  >
                    {enabled ? "On" : "Off"}
                  </button>
                ) : (
                  <span />
                )}
                {onRemove ? (
                  <button
                    type="button"
                    onClick={() => onRemove(hook.id)}
                    aria-label={`Remove hook ${hook.event} ${hook.matcher}`}
                    className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                ) : (
                  <span />
                )}
              </li>
            );
          })}
          {hooks.length === 0 ? (
            <li className="px-4 py-8 text-center font-sans text-body-sm text-muted-foreground">
              No hooks configured.
            </li>
          ) : null}
        </ul>
      </section>
    );
  },
);
HookConfig.displayName = "HookConfig";

export { HookConfig, HOOK_EVENTS };
