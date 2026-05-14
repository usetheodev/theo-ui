import * as ScrollAreaPrimitive from "@radix-ui/react-scroll-area";
import { forwardRef } from "react";
import type { ComponentPropsWithoutRef, ElementRef } from "react";
import { cn } from "../../../lib/cn.js";

/**
 * ScrollArea — custom scroller with Violet Forge styling.
 *
 * Built on Radix ScrollArea so the native scrollbar is always hidden and the
 * custom thumb stays consistent across Chrome/Firefox/Safari/macOS-trackpad.
 *
 * Visual:
 *   - track is transparent, only the thumb is visible.
 *   - thumb is `--primary` at 25% opacity by default; on hover, 45% with violet glow.
 *   - active drag bumps to 60%.
 *   - the rounded full pill thumb plays well with the brutalist border language
 *     but stays subtle (1.5px wide on rest, 3px on hover).
 *
 * Modes (via `type`):
 *   - "hover" (default)  — scrollbar fades in on hover/focus, otherwise hidden.
 *   - "always"           — scrollbar always visible.
 *   - "auto"             — scrollbar visible only when content overflows.
 *   - "scroll"           — Radix-managed: visible only while scrolling.
 */

interface ScrollAreaProps extends ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.Root> {
  /**
   * Optional override for which scrollbar(s) to render.
   * Defaults: vertical only. Set to "both" for grids/tables with overflow-x.
   */
  orientation?: "vertical" | "horizontal" | "both";
  /**
   * Thickness of the scrollbar. Default "thin" (2.5px → 3.5px on hover).
   * Use "regular" (8px) for content where the scrollbar should be a more prominent target.
   */
  size?: "thin" | "regular";
}

const ScrollAreaRoot = forwardRef<ElementRef<typeof ScrollAreaPrimitive.Root>, ScrollAreaProps>(
  (
    { className, children, orientation = "vertical", size = "thin", type = "hover", ...props },
    ref,
  ) => (
    <ScrollAreaPrimitive.Root
      ref={ref}
      type={type}
      className={cn("relative overflow-hidden", className)}
      {...props}
    >
      <ScrollAreaPrimitive.Viewport
        className={cn(
          "h-full w-full rounded-[inherit]",
          // Smooth scroll-behavior + masked overflow inheriting any inner radius
          "[&>div]:!block",
        )}
      >
        {children}
      </ScrollAreaPrimitive.Viewport>
      {orientation === "vertical" || orientation === "both" ? (
        <ScrollBar orientation="vertical" size={size} />
      ) : null}
      {orientation === "horizontal" || orientation === "both" ? (
        <ScrollBar orientation="horizontal" size={size} />
      ) : null}
      <ScrollAreaPrimitive.Corner className="bg-transparent" />
    </ScrollAreaPrimitive.Root>
  ),
);
ScrollAreaRoot.displayName = "ScrollArea";

interface ScrollBarProps
  extends ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar> {
  size?: "thin" | "regular";
}

const ScrollBar = forwardRef<
  ElementRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>,
  ScrollBarProps
>(({ className, orientation = "vertical", size = "thin", ...props }, ref) => (
  <ScrollAreaPrimitive.ScrollAreaScrollbar
    ref={ref}
    orientation={orientation}
    className={cn(
      "z-10 flex touch-none select-none p-0.5 transition-[width,height,background-color] duration-base ease-out-soft",
      // hover state slightly lifts the track with a near-invisible violet wash
      "hover:bg-primary/5",
      orientation === "vertical" &&
        (size === "thin"
          ? "h-full w-2.5 border-l border-l-transparent"
          : "h-full w-3 border-l border-l-transparent"),
      orientation === "horizontal" &&
        (size === "thin"
          ? "h-2.5 w-full flex-col border-t border-t-transparent"
          : "h-3 w-full flex-col border-t border-t-transparent"),
      className,
    )}
    {...props}
  >
    <ScrollAreaPrimitive.ScrollAreaThumb
      className={cn(
        "relative flex-1 rounded-full bg-primary/30",
        "transition-[background-color,box-shadow] duration-fast ease-out-soft",
        // Theme-aware: glow uses --primary (recolors when theme switches)
        "hover:bg-primary/55 hover:shadow-[0_0_8px_hsl(var(--primary)/0.35)]",
        // Drag state uses Radix data-state="visible" + :active
        "active:bg-primary/75 data-[state=visible]:bg-primary/45",
      )}
    />
  </ScrollAreaPrimitive.ScrollAreaScrollbar>
));
ScrollBar.displayName = "ScrollArea.Bar";

// Compound assembly (T7.1 / MEDIUM-007). `ScrollArea.Bar` is the canonical
// surface; the legacy `ScrollBar` standalone export stays as a deprecated
// alias until the next major release.
const ScrollArea = /*#__PURE__*/ Object.assign(ScrollAreaRoot, { Bar: ScrollBar });

/**
 * @deprecated Use `ScrollArea.Bar` instead. Will be removed in the next
 * major version. Kept as a name re-export to preserve registry consumers
 * who depend on the standalone import; will be dropped in 1.0.
 */
export { ScrollArea, ScrollBar };
