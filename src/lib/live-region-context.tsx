import { createContext, useContext } from "react";

/**
 * LiveRegionContext — coordinates `aria-live` declarations across nested
 * components so screen readers don't announce content twice.
 *
 * T4.1 (MF-4, edge-case review). Problem: a container component that
 * declares `role="log" aria-live="polite"` (e.g. `ChatThread`,
 * `AgentStream`) may render a child component that ALSO declares its own
 * `role="status" aria-live="polite"` (e.g. `AgentStreaming`,
 * `AgentErrorCard`). NVDA/JAWS/VoiceOver treat each live region as an
 * independent announcement source, so updates to the child trigger TWO
 * announcements — once from the inner status, once because the outer
 * log observes the DOM mutation. Result: stutter on every streaming
 * token, every new toast, every skeleton mount inside a log.
 *
 * Solution: container components wrap their content with
 * `<LiveRegionProvider value={true}>`. Child components call
 * `useInLiveRegion()` and omit their own `aria-live` / `role` when the
 * context is true. The outer region remains the single announcement
 * source.
 *
 * Default is `false` so standalone components (e.g., a single
 * `AgentStreaming` placed directly in a page) keep their original
 * announcement semantics with zero migration cost.
 *
 * @example
 *   // Container declares the live region
 *   <LiveRegionProvider value={true}>
 *     <div role="log" aria-live="polite">
 *       {children}
 *     </div>
 *   </LiveRegionProvider>
 *
 *   // Child reads context to decide its own ARIA attrs
 *   const inLiveRegion = useInLiveRegion();
 *   return (
 *     <div
 *       role={inLiveRegion ? undefined : "status"}
 *       aria-live={inLiveRegion ? undefined : "polite"}
 *     >
 *       ...
 *     </div>
 *   );
 */

const LiveRegionContext = createContext<boolean>(false);

export const LiveRegionProvider = LiveRegionContext.Provider;

export function useInLiveRegion(): boolean {
  return useContext(LiveRegionContext);
}
