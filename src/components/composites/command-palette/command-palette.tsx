import { ChevronRight, Search } from "lucide-react";
import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { cn } from "../../../lib/cn.js";
import type { IconComponent } from "../../../lib/types.js";
import { Dialog } from "../../primitives/dialog/dialog.js";

export interface CommandItem {
  id: string;
  label: ReactNode;
  /** Optional secondary line (path, hint, shortcut). */
  hint?: ReactNode;
  /** Optional group name. Items with the same group are visually grouped. */
  group?: string;
  /** Optional icon. */
  icon?: IconComponent;
  /** Optional searchable plain-text (used by the default fuzzy matcher). */
  searchable?: string;
}

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: CommandItem[];
  onSelect: (id: string) => void;
  placeholder?: string;
  emptyMessage?: ReactNode;
  /**
   * Optional custom filter. Receives the query + the searchable string; returns boolean.
   * Defaults to simple case-insensitive substring match.
   */
  filter?: (query: string, item: CommandItem) => boolean;
}

const defaultFilter = (query: string, item: CommandItem): boolean => {
  if (!query) return true;
  const target = (
    item.searchable ?? (typeof item.label === "string" ? item.label : "")
  ).toLowerCase();
  return target.includes(query.toLowerCase());
};

/**
 * CommandPalette — Cmd+K-style global launcher.
 *
 * Built on Dialog ✅. Stateless filter logic (default substring; consumer can override).
 * No cmdk dependency to keep footprint small.
 */
function CommandPalette({
  open,
  onOpenChange,
  items,
  onSelect,
  placeholder = "Type a command or search…",
  emptyMessage = "No results.",
  filter = defaultFilter,
}: CommandPaletteProps) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => items.filter((i) => filter(query, i)), [items, query, filter]);

  const groups = useMemo(() => {
    const map = new Map<string, CommandItem[]>();
    for (const item of filtered) {
      const key = item.group ?? "";
      if (!map.has(key)) map.set(key, []);
      map.get(key)?.push(item);
    }
    return Array.from(map.entries());
  }, [filtered]);

  const handleSelect = (id: string) => {
    onSelect(id);
    onOpenChange(false);
    setQuery("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <Dialog.Content className="max-w-xl p-0" hideCloseButton>
        <div className="flex items-center gap-2 border-border/40 border-b px-4 py-3">
          <Search className="size-4 text-muted-foreground" aria-hidden />
          <input
            type="text"
            // biome-ignore lint/a11y/noAutofocus: Command palette is opt-in and explicitly invoked
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={placeholder}
            aria-label="Command palette query"
            className={cn(
              "flex-1 bg-transparent",
              "font-sans text-body-md text-foreground placeholder:text-muted-foreground",
              "focus:outline-none",
            )}
          />
          <span className="rounded-md bg-muted px-1.5 py-0.5 font-mono text-label text-muted-foreground">
            ⌘K
          </span>
        </div>
        <div className="max-h-[420px] overflow-y-auto p-1">
          {filtered.length === 0 ? (
            <p className="px-3 py-6 text-center text-body-sm text-muted-foreground">
              {emptyMessage}
            </p>
          ) : (
            groups.map(([group, list]) => (
              <div key={group || "default"}>
                {group ? (
                  <p className="px-3 pt-2 pb-1 font-sans text-label-caps text-muted-foreground uppercase tracking-wider">
                    {group}
                  </p>
                ) : null}
                <ul>
                  {list.map((item) => {
                    const Icon = item.icon;
                    return (
                      <li key={item.id}>
                        <button
                          type="button"
                          onClick={() => handleSelect(item.id)}
                          className={cn(
                            "flex w-full items-center gap-3 rounded-md px-3 py-2 text-left",
                            "transition-colors hover:bg-muted focus-visible:bg-muted focus-visible:outline-none",
                          )}
                        >
                          {Icon ? <Icon className="size-4 text-primary" /> : null}
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-body-sm text-foreground">{item.label}</p>
                            {item.hint ? (
                              <p className="truncate font-mono text-label text-muted-foreground">
                                {item.hint}
                              </p>
                            ) : null}
                          </div>
                          <ChevronRight className="size-3 text-muted-foreground" aria-hidden />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))
          )}
        </div>
      </Dialog.Content>
    </Dialog>
  );
}

export { CommandPalette };
