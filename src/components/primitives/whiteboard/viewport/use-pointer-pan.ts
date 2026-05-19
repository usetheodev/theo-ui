import { useCallback, useEffect, useRef } from "react";
import type { ViewportControls } from "./use-viewport.js";

interface DragState {
  pointerId: number;
  lastX: number;
  lastY: number;
}

/** Attaches pan + zoom listeners to an SVG element. */
export function usePointerPan(
  ref: React.RefObject<SVGSVGElement | null>,
  viewport: ViewportControls,
  size: { width: number; height: number },
): {
  onPointerDown: (e: React.PointerEvent<SVGSVGElement>) => void;
  onPointerMove: (e: React.PointerEvent<SVGSVGElement>) => void;
  onPointerUp: (e: React.PointerEvent<SVGSVGElement>) => void;
  onPointerCancel: (e: React.PointerEvent<SVGSVGElement>) => void;
} {
  const dragRef = useRef<DragState | null>(null);
  const spaceHeldRef = useRef(false);

  // EC-2: wheel events on React's JSX onWheel are passive — `preventDefault`
  // does nothing, which causes the page to scroll while the user tries to
  // zoom. We must attach the wheel handler imperatively with `{passive:false}`.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const handler = (e: WheelEvent) => {
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      const localX = e.clientX - rect.left;
      const localY = e.clientY - rect.top;
      // Map screen-px → viewBox coords by ratio of rect to size.
      const scaleX = size.width / rect.width;
      const scaleY = size.height / rect.height;
      viewport.zoomAt(localX * scaleX, localY * scaleY, -e.deltaY * 0.001, size);
    };
    el.addEventListener("wheel", handler, { passive: false });
    return () => el.removeEventListener("wheel", handler);
  }, [ref, viewport, size]);

  // Track Space key for pan-with-any-button (Excalidraw "hand" mode).
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.code === "Space") spaceHeldRef.current = true;
    };
    const up = (e: KeyboardEvent) => {
      if (e.code === "Space") spaceHeldRef.current = false;
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, []);

  const onPointerDown = useCallback((e: React.PointerEvent<SVGSVGElement>) => {
    // EC-10: only start drag when the down event is on our SVG, not on a
    // child rendered via portal/etc. event.currentTarget guarantees this.
    if (e.target instanceof Element && !e.currentTarget.contains(e.target)) return;
    // Left button (0) or middle (1) or Space-held pan.
    const isMouseButton = e.button === 0 || e.button === 1;
    if (!isMouseButton && e.pointerType === "mouse") return;
    if (e.pointerType === "mouse" && e.button !== 1 && !spaceHeldRef.current && e.button !== 0) {
      return;
    }
    dragRef.current = { pointerId: e.pointerId, lastX: e.clientX, lastY: e.clientY };
    e.currentTarget.setPointerCapture(e.pointerId);
  }, []);

  const onPointerMove = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      const drag = dragRef.current;
      if (!drag || drag.pointerId !== e.pointerId) return;
      const dx = e.clientX - drag.lastX;
      const dy = e.clientY - drag.lastY;
      drag.lastX = e.clientX;
      drag.lastY = e.clientY;
      const el = ref.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const scaleX = size.width / rect.width;
      const scaleY = size.height / rect.height;
      viewport.pan(dx * scaleX, dy * scaleY);
    },
    [ref, viewport, size],
  );

  const releaseDrag = useCallback((e: React.PointerEvent<SVGSVGElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // Already released — ignore.
    }
    dragRef.current = null;
  }, []);

  return {
    onPointerDown,
    onPointerMove,
    onPointerUp: releaseDrag,
    onPointerCancel: releaseDrag,
  };
}
