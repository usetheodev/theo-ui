/**
 * M5 T5.1 — reconnect/resume (DoD #2). The SDK `subscribe()` ships reconnect +
 * opaque `lastEventId` resume (tested Harness-side); `useAgentStream` is
 * transport-agnostic and consumes whatever the iterable yields. This test proves
 * the HOOK's half of the contract: when the underlying stream DROPS mid-flight
 * and RESUMES from `lastEventId` (exactly what `subscribe()` does internally), the
 * hook renders every event once — no loss, no duplication.
 */
import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { SdkStreamMessage } from "./types.js";
import { useAgentStream } from "./use-agent-stream.js";

/**
 * A stream that mimics `subscribe()`'s reconnect: it emits ids 0..N-1, but the
 * FIRST connection attempt drops after `dropAfter` events; the resume attempt
 * continues from the tracked `lastEventId + 1` (never re-yielding a seen id).
 */
function resumingStream(deltas: string[], dropAfter: number): AsyncIterable<SdkStreamMessage> {
  return {
    async *[Symbol.asyncIterator]() {
      let lastEventId = -1;
      let firstAttempt = true;
      while (lastEventId < deltas.length - 1) {
        const start = lastEventId + 1;
        let emittedThisAttempt = 0;
        for (let i = start; i < deltas.length; i += 1) {
          if (firstAttempt && emittedThisAttempt >= dropAfter) {
            // Connection drops: stop WITHOUT advancing lastEventId past the last
            // acked event. subscribe() would reconnect with `lastEventId` here.
            break;
          }
          yield { type: "text_delta", text: deltas[i] } as SdkStreamMessage;
          lastEventId = i;
          emittedThisAttempt += 1;
        }
        firstAttempt = false;
      }
    },
  };
}

describe("useAgentStream — reconnect/resume across a dropped connection (M5 DoD #2)", () => {
  it("renders every event exactly once after a mid-stream drop + lastEventId resume", async () => {
    const deltas = ["a", "b", "c", "d", "e"];
    const stream = resumingStream(deltas, /* dropAfter */ 2);
    const { result } = renderHook(() => useAgentStream(stream));

    await waitFor(() => expect(result.current.status).toBe("done"), { timeout: 5000 });

    const msg = result.current.items.find((i) => i.kind === "message") as
      | { message: { parts: Array<{ text?: string }> } }
      | undefined;
    // Continuous render: all five deltas, in order, each exactly once (no dup of
    // the pre-drop "a","b"; no loss of the post-resume "c","d","e").
    expect(msg?.message.parts[0]?.text).toBe("abcde");
  });
});
