import { Plug, RotateCcw, Server } from "lucide-react";
import { forwardRef } from "react";
import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "../../../lib/cn.js";

export type MCPServerStatus = "connected" | "degraded" | "disconnected" | "starting";

export interface MCPServer {
  id: string;
  /** Friendly name, e.g. "postgres". */
  name: string;
  /** Transport endpoint (stdio command or URL). */
  endpoint: string;
  status: MCPServerStatus;
  /** Tools exposed by the server. */
  tools: string[];
  /** Optional resources exposed. */
  resources?: string[];
  /** Diagnostic message when degraded/disconnected. */
  message?: ReactNode;
  /** Auto-restart toggle hint. */
  autoRestart?: boolean;
}

const STATUS_CONFIG: Record<MCPServerStatus, { label: string; class: string }> = {
  connected: { label: "Connected", class: "border-success/40 bg-success/15 text-success" },
  starting: {
    label: "Starting",
    class: "border-primary/40 bg-primary/15 text-primary animate-pulse",
  },
  degraded: { label: "Degraded", class: "border-warning/40 bg-warning/15 text-warning" },
  disconnected: {
    label: "Disconnected",
    class: "border-destructive/40 bg-destructive/15 text-destructive",
  },
};

interface MCPServerCardProps extends HTMLAttributes<HTMLElement> {
  server: MCPServer;
  onRestart?: (id: string) => void;
  onDisconnect?: (id: string) => void;
}

/**
 * MCPServerCard — one MCP server entry showing connection status, the tools
 * it exposes, and inline controls (restart, disconnect).
 *
 * Pairs with claw-code's "degraded startup reporting" — failed servers can
 * still appear here with a recovery message.
 */
const MCPServerCard = forwardRef<HTMLElement, MCPServerCardProps>(
  ({ className, server, onRestart, onDisconnect, ...props }, ref) => {
    const cfg = STATUS_CONFIG[server.status];
    return (
      <article
        ref={ref}
        className={cn("grid gap-3 rounded-xl border bg-card p-4", className)}
        {...props}
      >
        <header className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <Server className="size-4 shrink-0 text-primary" aria-hidden />
            <div className="min-w-0">
              <h4 className="font-medium font-mono text-body-sm text-foreground">{server.name}</h4>
              <p className="truncate font-mono text-label text-muted-foreground">
                {server.endpoint}
              </p>
            </div>
          </div>
          <span
            className={cn(
              "inline-flex shrink-0 items-center rounded-full border px-2.5 py-0.5",
              "font-mono text-label uppercase tracking-wider",
              cfg.class,
            )}
          >
            {cfg.label}
          </span>
        </header>

        {server.message ? (
          <p className="rounded-md border border-warning/30 bg-warning/10 px-3 py-2 font-mono text-code-sm text-warning">
            {server.message}
          </p>
        ) : null}

        {server.tools.length > 0 ? (
          <div className="grid gap-1.5">
            <span className="font-mono text-label-caps text-muted-foreground uppercase tracking-wider">
              {server.tools.length} tools
            </span>
            <div className="flex flex-wrap gap-1.5">
              {server.tools.map((tool) => (
                <span
                  key={tool}
                  className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 font-mono text-foreground text-label"
                >
                  {tool}
                </span>
              ))}
            </div>
          </div>
        ) : null}

        {server.resources && server.resources.length > 0 ? (
          <div className="grid gap-1.5">
            <span className="font-mono text-label-caps text-muted-foreground uppercase tracking-wider">
              {server.resources.length} resources
            </span>
            <div className="flex flex-wrap gap-1.5">
              {server.resources.map((r) => (
                <span
                  key={r}
                  className="inline-flex items-center rounded-md bg-accent/10 px-2 py-0.5 font-mono text-accent text-label"
                >
                  {r}
                </span>
              ))}
            </div>
          </div>
        ) : null}

        <footer className="flex items-center justify-end gap-1.5">
          {onRestart ? (
            <button
              type="button"
              onClick={() => onRestart(server.id)}
              className="inline-flex items-center gap-1.5 rounded-md border border-border/60 bg-card px-2.5 py-1 font-mono text-label hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <RotateCcw className="size-3" /> Restart
            </button>
          ) : null}
          {onDisconnect ? (
            <button
              type="button"
              onClick={() => onDisconnect(server.id)}
              className="inline-flex items-center gap-1.5 rounded-md border border-border/60 bg-card px-2.5 py-1 font-mono text-label hover:bg-muted hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Plug className="size-3" /> Disconnect
            </button>
          ) : null}
        </footer>
      </article>
    );
  },
);
MCPServerCard.displayName = "MCPServerCard";

export { MCPServerCard };
