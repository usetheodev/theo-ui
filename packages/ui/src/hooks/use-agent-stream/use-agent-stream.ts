/**
 * `useAgentStream` (M5 UI ↔ Harness) — consume an SDK agent stream and expose
 * render state for `<AgentStream items={…} />`. Transport-agnostic: pass a
 * `Run.stream()` async iterable (local) or a `subscribe()` iterable (browser,
 * reconnect + `lastEventId` resume shipped SDK-side). theo-ui keeps ZERO runtime
 * coupling to `@theokit/sdk` — the input is the structural {@link SdkStreamMessage}
 * (the SDK's real output is structurally assignable). See M5 ADR-1/ADR-2.
 *
 * The heavy lifting is the pure {@link agentStreamReducer}; this hook only wires
 * the async iterator into a React lifecycle and cancels it on unmount (calls the
 * iterator's `return()` so the underlying generator / connection is torn down).
 */
import { useEffect, useReducer } from "react";
import {
  type AgentStreamState,
  agentStreamReducer,
  initialAgentStreamState,
} from "./agent-stream-reducer.js";
import type { SdkStreamMessage } from "./types.js";

export function useAgentStream(
  stream: AsyncIterable<SdkStreamMessage> | undefined,
): AgentStreamState {
  const [state, dispatch] = useReducer(agentStreamReducer, initialAgentStreamState);

  useEffect(() => {
    if (stream === undefined) return;
    const iterator = stream[Symbol.asyncIterator]();
    let cancelled = false;

    void (async () => {
      try {
        while (true) {
          const { value, done } = await iterator.next();
          if (cancelled) return;
          if (done) {
            dispatch({ type: "done" });
            return;
          }
          dispatch(value);
        }
      } catch (cause) {
        if (cancelled) return;
        const message = cause instanceof Error ? cause.message : String(cause);
        dispatch({ type: "error", error: message });
      }
    })();

    return () => {
      cancelled = true;
      // Tear down the source generator / connection promptly on unmount.
      void iterator.return?.(undefined);
    };
  }, [stream]);

  return state;
}
