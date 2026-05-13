import { Hash, type LucideIcon, Slash } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { cn } from "../../../lib/cn.js";
import type { IconComponent } from "../../../lib/types.js";

export interface MentionItem {
  id: string;
  /** Primary label shown on the row. */
  label: ReactNode;
  /** Secondary one-line description (optional). */
  description?: ReactNode;
  /** Optional per-row icon override. */
  icon?: IconComponent;
}

/** Trigger character — drives the default header + icon if not overridden. */
export type MentionTrigger = "/" | "@" | "#";

interface MentionMenuProps {
  /** Whether the panel is open. The consumer (composer) controls this. */
  open: boolean;
  /** Trigger character that opened the menu — used for default title + icon. */
  trigger: MentionTrigger;
  /** Items to display (already filtered by the consumer). */
  items: MentionItem[];
  /** Fires when the user selects an item via click or Enter. */
  onSelect: (item: MentionItem) => void;
  /** Fires when the user dismisses (Esc, click outside). */
  onClose: () => void;
  /** Title above the list. Defaults to the trigger's domain ("Commands", "Files", "Memories"). */
  title?: ReactNode;
  /** Empty-state message when items is empty. */
  emptyLabel?: ReactNode;
  /** Override the alignment relative to its anchor. Default: above-left. */
  className?: string;
}

const DEFAULT_TITLE: Record<MentionTrigger, string> = {
  "/": "Commands",
  "@": "Files",
  "#": "Memories",
};

const DEFAULT_ICON: Record<MentionTrigger, LucideIcon> = {
  "/": Slash,
  "@": Slash,
  "#": Hash,
};

/**
 * MentionMenu — keyboard-navigable popover for slash-command / @file / #memory
 * triggers inside an agent composer.
 *
 * Generic by design: the consumer decides what items appear for each trigger
 * (commands list, file search, memory lookup, …). MentionMenu owns the visual
 * presentation, selection highlight, Esc/Enter/Arrow keys.
 *
 * Position: absolute, anchored to the closest positioned ancestor — usually
 * the composer wrapper. Default `bottom-full left-0` (above the composer).
 */
export function MentionMenu({
  open,
  trigger,
  items,
  onSelect,
  onClose,
  title,
  emptyLabel = "No matches",
  className,
}: MentionMenuProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const listRef = useRef<HTMLUListElement>(null);

  const resolvedTitle = title ?? DEFAULT_TITLE[trigger];
  const TriggerIcon = DEFAULT_ICON[trigger];

  // Clamp the highlighted index whenever items change.
  useEffect(() => {
    if (activeIndex >= items.length) setActiveIndex(Math.max(0, items.length - 1));
  }, [items.length, activeIndex]);

  // Reset highlight when the menu opens / trigger changes.
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional reset on open/trigger
  useEffect(() => {
    if (open) setActiveIndex(0);
  }, [open, trigger]);

  // Global keyboard handler — Arrows / Enter / Esc. Captures while open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((i) => Math.min(items.length - 1, i + 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((i) => Math.max(0, i - 1));
      } else if (e.key === "Enter") {
        if (items.length === 0) return;
        e.preventDefault();
        const item = items[activeIndex];
        if (item) onSelect(item);
      } else if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [open, items, activeIndex, onSelect, onClose]);

  if (!open) return null;

  return (
    <div
      role="menu"
      aria-orientation="vertical"
      aria-label={typeof resolvedTitle === "string" ? resolvedTitle : "Mention menu"}
      tabIndex={-1}
      className={cn(
        "absolute bottom-full left-0 z-40 mb-2 w-[22rem] max-w-full",
        "overflow-hidden rounded-lg border bg-popover text-popover-foreground shadow-md",
        "data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=open]:animate-in",
        className,
      )}
      data-state="open"
    >
      <header className="flex items-center justify-between gap-2 border-border/40 border-b bg-muted/30 px-3 py-2">
        <span className="inline-flex items-center gap-1.5 font-mono text-label text-muted-foreground uppercase tracking-wider">
          <TriggerIcon className="size-3" aria-hidden />
          {resolvedTitle}
        </span>
        <span className="font-mono text-label text-muted-foreground tabular-nums">
          {items.length}
        </span>
      </header>
      {items.length === 0 ? (
        <div className="px-3 py-4 text-body-sm text-muted-foreground">{emptyLabel}</div>
      ) : (
        <ul ref={listRef} className="max-h-[18rem] overflow-y-auto py-1">
          {items.map((item, idx) => {
            const Icon = item.icon;
            const active = idx === activeIndex;
            return (
              <li key={item.id}>
                <button
                  type="button"
                  role="menuitem"
                  onMouseEnter={() => setActiveIndex(idx)}
                  // Prevent textarea from losing focus on click so the caret stays put.
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => onSelect(item)}
                  className={cn(
                    "flex w-full items-start gap-3 px-3 py-2 text-left",
                    "transition-colors duration-base ease-out-soft",
                    active ? "bg-muted" : "hover:bg-muted/60",
                  )}
                  data-active={active || undefined}
                >
                  {Icon ? (
                    <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
                  ) : null}
                  <span className="grid min-w-0 flex-1 gap-0.5">
                    <span className="truncate font-medium font-mono text-code-md">
                      {item.label}
                    </span>
                    {item.description ? (
                      <span className="truncate font-sans text-label text-muted-foreground">
                        {item.description}
                      </span>
                    ) : null}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
