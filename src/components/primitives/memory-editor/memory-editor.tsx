import { Brain, Folder, FolderOpen, User } from "lucide-react";
import { forwardRef } from "react";
import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "../../../lib/cn.js";
import type { IconComponent } from "../../../lib/types.js";

export type MemoryScope = "global" | "project" | "session";

export interface MemoryLayer {
  scope: MemoryScope;
  /** File path on disk for transparency. */
  path: string;
  /** Markdown content. */
  content: string;
  /** Last modified label, e.g. "2m ago". */
  modifiedAt?: string;
}

interface MemoryEditorProps extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  layers: MemoryLayer[];
  /** Currently active layer for editing. */
  activeScope: MemoryScope;
  onScopeChange: (scope: MemoryScope) => void;
  onContentChange: (scope: MemoryScope, next: string) => void;
  title?: ReactNode;
}

const SCOPE_META: Record<MemoryScope, { label: string; icon: IconComponent; hint: string }> = {
  global: { label: "Global", icon: User, hint: "Applies to every project for this user." },
  project: {
    label: "Project",
    icon: FolderOpen,
    hint: "Versioned with the project. Shared by team.",
  },
  session: { label: "Session", icon: Folder, hint: "This session only. Wiped on exit." },
};

/**
 * MemoryEditor — three-layer Markdown memory editor (global / project /
 * session) mirroring Claude Code's CLAUDE.md hierarchy.
 *
 * Each scope keeps its own file. Switching scopes via tab updates which
 * layer is being edited. Path is shown explicitly so users know where the
 * content lives on disk.
 */
const MemoryEditor = forwardRef<HTMLDivElement, MemoryEditorProps>(
  (
    { className, layers, activeScope, onScopeChange, onContentChange, title = "Memory", ...props },
    ref,
  ) => {
    const active = layers.find((l) => l.scope === activeScope);
    const ActiveIcon = active ? SCOPE_META[active.scope].icon : Brain;
    return (
      <section ref={ref} className={cn("rounded-xl border bg-card", className)} {...props}>
        <header className="flex items-center justify-between gap-3 border-border/40 border-b px-4 py-3">
          <div className="flex items-center gap-2">
            <Brain className="size-4 text-primary" aria-hidden />
            <h3 className="font-display text-title-md tracking-tight">{title}</h3>
          </div>
          <div className="inline-flex items-center rounded-lg border border-border/60 bg-muted p-0.5">
            {(["global", "project", "session"] as const).map((scope) => {
              const meta = SCOPE_META[scope];
              const Icon = meta.icon;
              const isActive = scope === activeScope;
              return (
                <button
                  key={scope}
                  type="button"
                  onClick={() => onScopeChange(scope)}
                  aria-pressed={isActive}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1",
                    "font-sans text-label transition-colors",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    isActive
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <Icon className="size-3" />
                  {meta.label}
                </button>
              );
            })}
          </div>
        </header>

        {active ? (
          <>
            <div className="flex items-center justify-between gap-3 border-border/40 border-b bg-muted/30 px-4 py-2">
              <div className="flex min-w-0 items-center gap-2">
                <ActiveIcon className="size-3 shrink-0 text-muted-foreground" aria-hidden />
                <span className="truncate font-mono text-code-sm text-foreground">
                  {active.path}
                </span>
                {active.modifiedAt ? (
                  <span className="shrink-0 font-mono text-label text-muted-foreground">
                    · {active.modifiedAt}
                  </span>
                ) : null}
              </div>
              <span className="font-sans text-label text-muted-foreground italic">
                {SCOPE_META[active.scope].hint}
              </span>
            </div>
            <textarea
              value={active.content}
              onChange={(e) => onContentChange(active.scope, e.target.value)}
              rows={12}
              className="w-full resize-y bg-transparent px-4 py-3 font-mono text-code-md text-foreground placeholder:text-muted-foreground focus:outline-none"
              placeholder={`# ${SCOPE_META[active.scope].label} notes\n\nWrite Markdown the agent should keep in context.`}
            />
          </>
        ) : null}
      </section>
    );
  },
);
MemoryEditor.displayName = "MemoryEditor";

export { MemoryEditor };
