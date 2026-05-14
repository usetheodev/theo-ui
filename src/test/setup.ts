import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, beforeAll, expect, vi } from "vitest";
import * as axeMatchers from "vitest-axe/matchers";

expect.extend(axeMatchers);

// happy-dom otherwise attempts real network fetches when ThemeProvider injects
// `<link rel="stylesheet" href="https://fonts.googleapis.com/...">` for theme
// font loading. Stub fetch + restrict link injection side-effects in tests so
// the suite stays hermetic and fast (no minutes-long teardowns waiting for
// aborted fetches).
beforeAll(() => {
  if (typeof globalThis.fetch === "function") {
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve(new Response("", { status: 200, headers: { "content-type": "text/css" } })),
      ),
    );
  }
});

afterEach(() => {
  cleanup();
});

// happy-dom doesn't ship Pointer Capture or scrollIntoView; Radix relies on
// them. Polyfill once at setup so Select/Dialog/etc. behave under tests.
if (typeof Element !== "undefined") {
  const proto = Element.prototype as unknown as {
    hasPointerCapture?: (id: number) => boolean;
    setPointerCapture?: (id: number) => void;
    releasePointerCapture?: (id: number) => void;
    scrollIntoView?: (arg?: boolean | ScrollIntoViewOptions) => void;
  };
  if (!proto.hasPointerCapture) proto.hasPointerCapture = () => false;
  if (!proto.setPointerCapture) proto.setPointerCapture = () => {};
  if (!proto.releasePointerCapture) proto.releasePointerCapture = () => {};
  if (!proto.scrollIntoView) proto.scrollIntoView = () => {};
}
