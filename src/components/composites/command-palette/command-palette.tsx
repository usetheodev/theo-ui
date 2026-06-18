"use client";

import { Command as CommandPrimitive } from "cmdk";
import { ChevronRight, Search } from "lucide-react";
import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { cn } from "../../../lib/cn.js";
import type { IconComponent } from "../../../lib/types.js";
import { Dialog } from "../../primitives/dialog/index.js";

export interface CommandItem {
  id: string;
  label: ReactNode;
  /** Optional secondary line (path, hint, shortcut). */
  hint?: ReactNode;
  /** Optional group name. Items with the same group are visually grouped. */
  group?: string;
  /** Optional icon. */
  icon?: IconComponent;
  /** Optional searchable plain-text used by the cmdk ranker. Falls back to `label` when string. */
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
   * Optional custom filter score (0 = no match, > 0 = match). Receives the
   * `value` (the item's searchable text) and the current `search` query.
   * Defaults to cmdk's built-in fuzzy ranker which prioritizes substring +
   * word-boundary + consecutive matches.
   */
  filter?: (value: string, search: string) => number;
}

const defaultEmpty = "No results.";

/**
 * CommandPalette — Cmd+K-style global launcher with full keyboard navigation.
 *
 * Built on `cmdk` (the de-facto shadcn pattern) + Theo Dialog. Provides
 * out-of-the-box: ArrowUp/ArrowDown navigation, Enter selection, Escape close,
 * Home/End, active-item highlight via `data-selected`, and fuzzy ranking.
 *
 * Stateless: caller owns `open` / `onOpenChange` / `items`. Selecting an item
 * fires `onSelect(id)` and closes the dialog.
 */
function CommandPalette({
  open,
  onOpenChange,
  items,
  onSelect,
  placeholder = "Type a command or search…",
  emptyMessage = defaultEmpty,
  filter,
}: CommandPaletteProps) {
  const [search, setSearch] = useState("");

  const groups = useMemo(() => {
    const map = new Map<string, CommandItem[]>();
    for (const item of items) {
      const key = item.group ?? "";
      if (!map.has(key)) map.set(key, []);
      map.get(key)?.push(item);
    }
    return Array.from(map.entries());
  }, [items]);

  const handleSelect = (id: string) => {
    onSelect(id);
    onOpenChange(false);
    setSearch("");
  };

  return (
    <Dialog data-slot="command-palette" open={open} onOpenChange={onOpenChange}>
      <Dialog.Content className="max-w-xl p-0" hideCloseButton>
        <Dialog.Title className="sr-only">Command palette</Dialog.Title>
        <Dialog.Description className="sr-only">
          Type to search commands. Use arrow keys to navigate, Enter to select, Escape to close.
        </Dialog.Description>
        <CommandPrimitive label="Command palette" shouldFilter {...(filter ? { filter } : {})}>
          <div className="flex items-center gap-2 border-border/40 border-b px-4 py-3">
            <Search className="size-4 text-muted-foreground" aria-hidden="true" />
            <CommandPrimitive.Input
              value={search}
              onValueChange={setSearch}
              placeholder={placeholder}
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
          <CommandPrimitive.List className="max-h-[420px] overflow-y-auto p-1">
            <CommandPrimitive.Empty className="px-3 py-6 text-center text-body-sm text-muted-foreground">
              {emptyMessage}
            </CommandPrimitive.Empty>
            {groups.map(([groupName, list]) => (
              <CommandPrimitive.Group
                key={groupName || "default"}
                heading={groupName || undefined}
                className={cn(
                  "[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:pt-2 [&_[cmdk-group-heading]]:pb-1",
                  "[&_[cmdk-group-heading]]:font-sans [&_[cmdk-group-heading]]:text-label-caps",
                  "[&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider",
                )}
              >
                {list.map((item) => {
                  const Icon = item.icon;
                  const value =
                    item.searchable ?? (typeof item.label === "string" ? item.label : item.id);
                  return (
                    <CommandPrimitive.Item
                      key={item.id}
                      value={value}
                      onSelect={() => handleSelect(item.id)}
                      className={cn(
                        "flex w-full cursor-pointer items-center gap-3 rounded-md px-3 py-2 text-left",
                        "transition-colors hover:bg-muted",
                        "data-[selected=true]:bg-muted",
                        "focus-visible:outline-none",
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
                      <ChevronRight className="size-3 text-muted-foreground" aria-hidden="true" />
                    </CommandPrimitive.Item>
                  );
                })}
              </CommandPrimitive.Group>
            ))}
          </CommandPrimitive.List>
        </CommandPrimitive>
      </Dialog.Content>
    </Dialog>
  );
}

export { CommandPalette };
