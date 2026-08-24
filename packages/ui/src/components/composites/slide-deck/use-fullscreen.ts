/**
 * Cross-browser fullscreen hook (ADR D6 area / EC-8).
 *
 * Wraps `Element.requestFullscreen()` + Safari `webkit*` prefix. Listens
 * `fullscreenchange` (+ webkit) to sync state when user presses Esc via the
 * native UI.
 *
 * EC-8: iOS Safari < 16 doesn't expose fullscreen on arbitrary elements (only
 * `<video>`). Feature-detect — when unavailable, hook is a no-op and `toggle`
 * is safe to call.
 */
import { type RefObject, useCallback, useEffect, useState } from "react";

interface VendoredElement extends HTMLElement {
  webkitRequestFullscreen?: () => Promise<void>;
}

interface VendoredDocument extends Document {
  webkitFullscreenElement?: Element | null;
  webkitExitFullscreen?: () => Promise<void>;
}

function isFullscreenSupported(): boolean {
  if (typeof document === "undefined") return false;
  const doc = document as VendoredDocument;
  const el = document.documentElement as VendoredElement;
  return (
    Boolean(el.requestFullscreen ?? el.webkitRequestFullscreen) &&
    Boolean(doc.exitFullscreen ?? doc.webkitExitFullscreen)
  );
}

function currentFullscreenElement(): Element | null {
  if (typeof document === "undefined") return null;
  const doc = document as VendoredDocument;
  return document.fullscreenElement ?? doc.webkitFullscreenElement ?? null;
}

export interface UseFullscreenResult {
  isFullscreen: boolean;
  toggle: () => Promise<void>;
  isSupported: boolean;
}

export function useFullscreen(ref: RefObject<HTMLElement | null>): UseFullscreenResult {
  const supported = isFullscreenSupported();
  const [isFullscreen, setFullscreen] = useState(false);

  useEffect(() => {
    if (!supported) return;
    const handler = (): void => {
      setFullscreen(currentFullscreenElement() !== null);
    };
    document.addEventListener("fullscreenchange", handler);
    document.addEventListener("webkitfullscreenchange", handler);
    return () => {
      document.removeEventListener("fullscreenchange", handler);
      document.removeEventListener("webkitfullscreenchange", handler);
    };
  }, [supported]);

  const toggle = useCallback(async (): Promise<void> => {
    if (!supported) return;
    const el = ref.current as VendoredElement | null;
    if (!el) return;
    const doc = document as VendoredDocument;
    try {
      if (currentFullscreenElement()) {
        await (doc.exitFullscreen?.() ?? doc.webkitExitFullscreen?.());
      } else {
        await (el.requestFullscreen?.() ?? el.webkitRequestFullscreen?.());
      }
    } catch {
      // User denied or API unavailable — silent fallback. Defensive: never throw.
    }
  }, [ref, supported]);

  return { isFullscreen, toggle, isSupported: supported };
}
