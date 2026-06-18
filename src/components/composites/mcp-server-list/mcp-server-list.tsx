"use client";

import { Plus } from "lucide-react";
import { forwardRef, useMemo, useState } from "react";
import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "../../../lib/cn.js";
import {
  type MCPServer,
  MCPServerCard,
  type MCPServerStatus,
} from "../../primitives/mcp-server-card/index.js";

interface MCPServerListProps extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  servers: MCPServer[];
  title?: ReactNode;
  onAdd?: () => void;
  onRestart?: (id: string) => void;
  onDisconnect?: (id: string) => void;
}

const STATUS_ORDER: MCPServerStatus[] = ["connected", "starting", "degraded", "disconnected"];

/**
 * MCPServerList — grouped MCP server inventory with status filter chips.
 * Surfaces degraded/disconnected servers prominently so the user can act.
 */
const MCPServerList = forwardRef<HTMLDivElement, MCPServerListProps>(
  (
    { className, servers, title = "MCP servers", onAdd, onRestart, onDisconnect, ...props },
    ref,
  ) => {
    const [filter, setFilter] = useState<MCPServerStatus | null>(null);

    const counts = useMemo(() => {
      const result: Record<MCPServerStatus, number> = {
        connected: 0,
        starting: 0,
        degraded: 0,
        disconnected: 0,
      };
      for (const s of servers) result[s.status]++;
      return result;
    }, [servers]);

    const filtered = useMemo(
      () => (filter ? servers.filter((s) => s.status === filter) : servers),
      [servers, filter],
    );

    return (
      <section
        ref={ref}
        className={cn("grid gap-3", className)}
        aria-label="MCP servers"
        {...props}
        data-slot="mcp-server-list"
      >
        <header className="flex flex-wrap items-center justify-between gap-3">
          {title ? (
            <h3 className="font-display text-title-md tracking-tight">{title}</h3>
          ) : (
            <span />
          )}
          <div className="flex items-center gap-2">
            <div className="inline-flex rounded-lg border border-border/60 bg-muted p-0.5">
              <button
                type="button"
                onClick={() => setFilter(null)}
                aria-pressed={filter === null}
                className={cn(
                  "rounded-md px-2.5 py-1 font-mono text-label",
                  filter === null ? "bg-card text-foreground shadow-sm" : "text-muted-foreground",
                )}
              >
                All · {servers.length}
              </button>
              {STATUS_ORDER.map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setFilter(status)}
                  aria-pressed={filter === status}
                  disabled={counts[status] === 0}
                  className={cn(
                    "rounded-md px-2.5 py-1 font-mono text-label uppercase",
                    filter === status
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground",
                    "disabled:opacity-40",
                  )}
                >
                  {status} · {counts[status]}
                </button>
              ))}
            </div>
            {onAdd ? (
              <button
                type="button"
                onClick={onAdd}
                className="inline-flex items-center gap-1 rounded-md bg-primary px-2.5 py-1 font-sans text-label text-primary-foreground hover:shadow-glow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Plus className="size-3.5" /> Add server
              </button>
            ) : null}
          </div>
        </header>

        {filtered.length === 0 ? (
          <p className="rounded-xl border border-border/60 border-dashed bg-muted/30 px-4 py-8 text-center font-sans text-body-sm text-muted-foreground">
            No servers in this state.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {filtered.map((server) => (
              <MCPServerCard
                key={server.id}
                server={server}
                {...(onRestart ? { onRestart } : {})}
                {...(onDisconnect ? { onDisconnect } : {})}
              />
            ))}
          </div>
        )}
      </section>
    );
  },
);
MCPServerList.displayName = "MCPServerList";

export { MCPServerList };
