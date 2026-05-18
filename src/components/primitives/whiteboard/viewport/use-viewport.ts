/**
 * Viewport state and helpers — pan via (x, y) and zoom via a scalar.
 *
 * Coordinate system:
 *   - World space: where elements are defined (the JSON `x`, `y` etc.).
 *   - Screen space: the rendered SVG bounding box on the page.
 *   - viewBox: `${x} ${y} ${width/zoom} ${height/zoom}`. Increasing zoom
 *     SHRINKS the viewBox dimensions, magnifying the rendered content.
 *
 * `zoomAt(screenX, screenY, delta, viewportSize)` keeps the world point under
 * the cursor stable while zooming (see test for invariant).
 */
import { useCallback, useMemo, useState } from "react";

export const MIN_ZOOM = 0.1;
export const MAX_ZOOM = 8;

export interface ViewportState {
  x: number;
  y: number;
  zoom: number;
}

export interface ViewportSize {
  width: number;
  height: number;
}

export interface ViewportBounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export interface UseViewportOptions {
  width: number;
  height: number;
  initialZoom?: number;
  initialCenter?: [number, number];
}

export interface ViewportControls {
  state: ViewportState;
  pan: (dx: number, dy: number) => void;
  setZoom: (zoom: number) => void;
  zoomAt: (screenX: number, screenY: number, delta: number, size: ViewportSize) => void;
  reset: () => void;
  fitTo: (bounds: ViewportBounds, size: ViewportSize) => void;
  viewBox: (size: ViewportSize) => string;
}

function clampZoom(z: number): number {
  if (!Number.isFinite(z)) return 1;
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z));
}

export function useViewport(opts: UseViewportOptions): ViewportControls {
  const initial: ViewportState = useMemo(() => {
    const zoom = clampZoom(opts.initialZoom ?? 1);
    if (opts.initialCenter) {
      // Position viewBox so initialCenter sits at the visual center.
      const [cx, cy] = opts.initialCenter;
      return {
        x: cx - opts.width / (2 * zoom),
        y: cy - opts.height / (2 * zoom),
        zoom,
      };
    }
    return { x: 0, y: 0, zoom };
  }, [opts.initialCenter, opts.initialZoom, opts.width, opts.height]);

  const [state, setState] = useState<ViewportState>(initial);

  const pan = useCallback((dx: number, dy: number) => {
    setState((prev) => ({ ...prev, x: prev.x - dx / prev.zoom, y: prev.y - dy / prev.zoom }));
  }, []);

  const setZoom = useCallback((zoom: number) => {
    setState((prev) => ({ ...prev, zoom: clampZoom(zoom) }));
  }, []);

  const zoomAt = useCallback(
    (screenX: number, screenY: number, delta: number, _size: ViewportSize) => {
      setState((prev) => {
        const oldZoom = prev.zoom;
        const newZoom = clampZoom(prev.zoom * Math.exp(delta));
        if (newZoom === oldZoom) return prev;
        // World coordinate currently under cursor.
        const worldX = prev.x + screenX / oldZoom;
        const worldY = prev.y + screenY / oldZoom;
        // After zoom, we want the same screen point to map to the same world point.
        // viewBox.x + (screenX / newZoom) === worldX  →  x = worldX - screenX/newZoom.
        return {
          x: worldX - screenX / newZoom,
          y: worldY - screenY / newZoom,
          zoom: newZoom,
        };
      });
    },
    [],
  );

  const reset = useCallback(() => setState(initial), [initial]);

  const fitTo = useCallback((bounds: ViewportBounds, size: ViewportSize) => {
    const bboxWidth = Math.max(1, bounds.maxX - bounds.minX);
    const bboxHeight = Math.max(1, bounds.maxY - bounds.minY);
    const zoomX = size.width / bboxWidth;
    const zoomY = size.height / bboxHeight;
    const zoom = clampZoom(Math.min(zoomX, zoomY));
    const cx = (bounds.minX + bounds.maxX) / 2;
    const cy = (bounds.minY + bounds.maxY) / 2;
    setState({
      x: cx - size.width / (2 * zoom),
      y: cy - size.height / (2 * zoom),
      zoom,
    });
  }, []);

  const viewBox = useCallback(
    (size: ViewportSize) =>
      `${state.x} ${state.y} ${size.width / state.zoom} ${size.height / state.zoom}`,
    [state],
  );

  return { state, pan, setZoom, zoomAt, reset, fitTo, viewBox };
}
