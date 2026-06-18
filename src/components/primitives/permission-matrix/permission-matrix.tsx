"use client";

import { Check, Lock, Plus, ShieldQuestion, Trash2 } from "lucide-react";
import { forwardRef, useState } from "react";
import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "../../../lib/cn.js";

export type PermissionDecisionKind = "allow" | "ask" | "deny";

export interface PermissionRule {
  id: string;
  /** Tool the rule applies to. Use "*" for any. */
  tool: string;
  /** Glob path it applies to. Use "*" for any. */
  path: string;
  decision: PermissionDecisionKind;
  /** Optional rationale shown as helper text. */
  note?: string;
}

interface PermissionMatrixProps extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  rules: PermissionRule[];
  title?: ReactNode;
  /**
   * Available tools shown in the add form. Pass `undefined` (or omit) — or an
   * empty array — to hide the add form entirely. The form only renders when
   * `onAdd` is provided AND `toolOptions` has at least one entry.
   */
  toolOptions?: string[];
  onAdd?: (rule: Omit<PermissionRule, "id">) => void;
  onRemove?: (id: string) => void;
  onDecisionChange?: (id: string, decision: PermissionDecisionKind) => void;
}

const DECISION_CLASS: Record<PermissionDecisionKind, string> = {
  allow: "bg-success/15 text-success border-success/40",
  ask: "bg-warning/15 text-warning border-warning/40",
  deny: "bg-destructive/15 text-destructive border-destructive/40",
};

const DECISION_ICON: Record<PermissionDecisionKind, ReactNode> = {
  allow: <Check className="size-3" aria-hidden="true" />,
  ask: <ShieldQuestion className="size-3" aria-hidden="true" />,
  deny: <Lock className="size-3" aria-hidden="true" />,
};

const cycle = (cur: PermissionDecisionKind): PermissionDecisionKind =>
  cur === "allow" ? "ask" : cur === "ask" ? "deny" : "allow";

/**
 * PermissionMatrix — tool × path × decision grid for fine-grained access
 * control. Used as the "permissions" tab in the agent settings.
 *
 * One PermissionRule per row. Click the decision pill to cycle Allow → Ask → Deny.
 *
 * Design decision (2026-05-14): PermissionMatrix stays in `primitives/`
 * — not `composites/` — even though it renders inputs and a select. The native
 * `<input>` / `<select>` elements use Theo design tokens directly (border-input,
 * ring, font-mono) so visual parity with `Input` / `Select` primitives is
 * preserved. Reason for keeping it primitive: a consumer installing
 * `permission-matrix` from the registry gets a single self-contained file with
 * no transitive Theo dependencies — opposite trade-off from `EnvVarEditor`
 * which is intentionally a composite. Both shapes are valid; we ship one of
 * each so consumers can pick the dependency profile that fits their app.
 */
const PermissionMatrix = forwardRef<HTMLDivElement, PermissionMatrixProps>(
  (
    {
      className,
      rules,
      title = "Permissions",
      toolOptions,
      onAdd,
      onRemove,
      onDecisionChange,
      ...props
    },
    ref,
  ) => {
    const [newTool, setNewTool] = useState(toolOptions?.[0] ?? "*");
    const [newPath, setNewPath] = useState("");
    const [newDecision, setNewDecision] = useState<PermissionDecisionKind>("ask");

    const submit = () => {
      if (!newPath.trim()) return;
      onAdd?.({ tool: newTool, path: newPath.trim(), decision: newDecision });
      setNewPath("");
    };

    return (
      <section
        ref={ref}
        className={cn("rounded-xl border bg-card", className)}
        {...props}
        data-slot="permission-matrix"
      >
        {title ? (
          <header className="flex items-baseline justify-between border-border/40 border-b px-4 py-3">
            <h3 className="font-display text-title-md tracking-tight">{title}</h3>
            <span className="font-mono text-label text-muted-foreground">
              {rules.length} {rules.length === 1 ? "rule" : "rules"}
            </span>
          </header>
        ) : null}

        {onAdd && toolOptions && toolOptions.length > 0 ? (
          <form
            className="grid grid-cols-[1fr_2fr_auto_auto] gap-2 border-border/40 border-b p-3"
            onSubmit={(e) => {
              e.preventDefault();
              submit();
            }}
          >
            <select
              value={newTool}
              onChange={(e) => setNewTool(e.target.value)}
              aria-label="Tool"
              className="h-9 rounded-md border border-input bg-card px-2 font-mono text-code-sm"
            >
              <option value="*">* (any tool)</option>
              {toolOptions.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            <input
              type="text"
              value={newPath}
              onChange={(e) => setNewPath(e.target.value)}
              placeholder="path glob (e.g. src/**/*.ts)"
              aria-label="Path"
              className="h-9 rounded-md border border-input bg-card px-2 font-mono text-code-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <select
              value={newDecision}
              onChange={(e) => setNewDecision(e.target.value as PermissionDecisionKind)}
              aria-label="Decision"
              className="h-9 rounded-md border border-input bg-card px-2 font-mono text-code-sm uppercase"
            >
              <option value="allow">allow</option>
              <option value="ask">ask</option>
              <option value="deny">deny</option>
            </select>
            <button
              type="submit"
              className="inline-flex h-9 items-center gap-1 rounded-md bg-primary px-3 font-sans text-label text-primary-foreground hover:shadow-glow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Plus className="size-3.5" /> Add
            </button>
          </form>
        ) : null}

        <ul className="divide-y divide-border/30">
          {rules.map((rule) => (
            <li
              key={rule.id}
              className="grid grid-cols-[1fr_2fr_auto_auto] items-center gap-3 px-4 py-2.5"
            >
              <span className="truncate font-mono text-code-sm text-foreground">{rule.tool}</span>
              <span className="truncate font-mono text-code-sm text-muted-foreground">
                {rule.path}
              </span>
              <button
                type="button"
                onClick={() => onDecisionChange?.(rule.id, cycle(rule.decision))}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1",
                  "font-mono text-label uppercase tracking-wider transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  DECISION_CLASS[rule.decision],
                  !onDecisionChange && "pointer-events-none",
                )}
              >
                {DECISION_ICON[rule.decision]}
                {rule.decision}
              </button>
              {onRemove ? (
                <button
                  type="button"
                  onClick={() => onRemove(rule.id)}
                  aria-label={`Remove rule ${rule.tool} ${rule.path}`}
                  className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <Trash2 className="size-3.5" />
                </button>
              ) : null}
            </li>
          ))}
          {rules.length === 0 ? (
            <li className="px-4 py-8 text-center font-sans text-body-sm text-muted-foreground">
              No permission rules configured. The agent will fall back to default policy.
            </li>
          ) : null}
        </ul>
      </section>
    );
  },
);
PermissionMatrix.displayName = "PermissionMatrix";

export { PermissionMatrix };
