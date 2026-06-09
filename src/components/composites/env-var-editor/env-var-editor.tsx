import { Copy, Eye, EyeOff, Lock, Plus, Trash2 } from "lucide-react";
import { forwardRef, useState } from "react";
import type { HTMLAttributes } from "react";
import { cn } from "../../../lib/cn.js";
import { isDev } from "../../../lib/env.js";
import { Badge } from "../../primitives/badge/index.js";
import { Button } from "../../primitives/button/index.js";
import { Input } from "../../primitives/input/index.js";

export type EnvScope = "production" | "staging" | "preview" | "all" | string;

export interface EnvVar {
  id: string;
  key: string;
  /**
   * Secret value. If `masked` is true, value is hidden by default.
   */
  value: string;
  masked?: boolean;
  scope?: EnvScope;
  /**
   * Read-only marker (e.g. system-managed vars like THEO_DEPLOY_ID).
   */
  readonly?: boolean;
}

interface EnvVarEditorProps extends HTMLAttributes<HTMLDivElement> {
  vars: EnvVar[];
  onAdd?: (entry: Omit<EnvVar, "id">) => void;
  onRemove?: (id: string) => void;
  /**
   * Available scope options for the add form. Defaults to a sensible PaaS set.
   */
  scopeOptions?: EnvScope[];
}

const DEFAULT_SCOPES: EnvScope[] = ["production", "staging", "preview", "all"];

/**
 * EnvVarEditor — table-like editor for environment variables.
 *
 * Mono font on keys/values, mask toggle on secret values, scope badge,
 * remove + copy actions. Add form sits above the list.
 *
 * Stateless: caller controls the list and reacts to onAdd / onRemove.
 */
const EnvVarEditor = forwardRef<HTMLDivElement, EnvVarEditorProps>(
  ({ className, vars, onAdd, onRemove, scopeOptions = DEFAULT_SCOPES, ...props }, ref) => {
    const [newKey, setNewKey] = useState("");
    const [newValue, setNewValue] = useState("");
    const [newScope, setNewScope] = useState<EnvScope>(scopeOptions[0] ?? "production");

    const submit = () => {
      const trimmedKey = newKey.trim();
      if (!trimmedKey) return;
      onAdd?.({ key: trimmedKey, value: newValue, scope: newScope, masked: true });
      setNewKey("");
      setNewValue("");
    };

    return (
      <div
        ref={ref}
        className={cn("rounded-xl border bg-card p-5 shadow-sm", className)}
        {...props}
      >
        <header className="mb-4 flex items-baseline justify-between gap-3">
          <div>
            <h3 className="font-display text-title-md tracking-tight">Environment variables</h3>
            <p className="text-body-sm text-muted-foreground">
              {vars.length} {vars.length === 1 ? "variable" : "variables"}
            </p>
          </div>
        </header>

        {onAdd ? (
          <form
            className="mb-4 grid grid-cols-[2fr_3fr_auto_auto] gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              submit();
            }}
          >
            <Input
              placeholder="DATABASE_URL"
              value={newKey}
              onChange={(e) => setNewKey(e.target.value)}
              className="font-mono"
              aria-label="Variable name"
            />
            <Input
              placeholder="postgresql://…"
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              className="font-mono"
              aria-label="Variable value"
            />
            <select
              value={newScope}
              onChange={(e) => setNewScope(e.target.value)}
              aria-label="Variable scope"
              className={cn(
                "h-10 rounded-md border border-input bg-card px-3",
                "font-sans text-body-sm",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card",
              )}
            >
              {scopeOptions.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <Button type="submit">
              <Plus /> Add
            </Button>
          </form>
        ) : null}

        <ul className="divide-y divide-border/30">
          {vars.map((v) => (
            <Row key={v.id} entry={v} {...(onRemove ? { onRemove } : {})} />
          ))}
          {vars.length === 0 ? (
            <li className="py-8 text-center text-body-sm text-muted-foreground">
              No environment variables yet.
            </li>
          ) : null}
        </ul>
      </div>
    );
  },
);
EnvVarEditor.displayName = "EnvVarEditor";

interface RowProps {
  entry: EnvVar;
  onRemove?: (id: string) => void;
}

function Row({ entry, onRemove }: RowProps) {
  const [revealed, setRevealed] = useState(!entry.masked);

  const value = revealed ? entry.value : "•".repeat(Math.min(entry.value.length, 12) || 8);

  const copy = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(entry.value).catch((err: unknown) => {
        // T7.6: dev-only warning so engineers see something when clipboard
        // fails (Safari/Firefox iframe sandbox, document not focused,
        // Permissions-Policy block). Production stays silent — behavior is
        // fail-safe (user can still copy manually).
        if (isDev()) {
          // biome-ignore lint/suspicious/noConsole: dev-only clipboard diagnostic (T7.6)
          console.warn("[@theokit/ui] EnvVarEditor clipboard write failed:", err);
        }
      });
    }
  };

  return (
    <li className="grid grid-cols-[2fr_3fr_auto_auto] items-center gap-3 py-3">
      <span className="truncate font-mono text-code-sm text-foreground">{entry.key}</span>
      <span className="flex items-center gap-2 truncate font-mono text-code-sm text-muted-foreground">
        {entry.readonly ? <Lock className="size-3" aria-hidden="true" /> : null}
        {value}
      </span>
      <Badge variant={entry.scope === "production" ? "primary" : "default"}>
        {entry.scope ?? "all"}
      </Badge>
      <div className="flex items-center gap-0.5">
        {entry.masked ? (
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setRevealed((r) => !r)}
            aria-label={revealed ? "Hide value" : "Reveal value"}
          >
            {revealed ? <EyeOff /> : <Eye />}
          </Button>
        ) : null}
        <Button size="icon" variant="ghost" onClick={copy} aria-label="Copy value">
          <Copy />
        </Button>
        {onRemove && !entry.readonly ? (
          <Button
            size="icon"
            variant="ghost"
            onClick={() => onRemove(entry.id)}
            aria-label={`Remove ${entry.key}`}
          >
            <Trash2 />
          </Button>
        ) : null}
      </div>
    </li>
  );
}

export { EnvVarEditor };
