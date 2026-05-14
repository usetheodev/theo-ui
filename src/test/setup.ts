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
  // Stub fetch unconditionally — happy-dom always provides one. Without this,
  // every render that touches ThemeProvider tries to fetch Google Fonts and
  // the test pool's teardown waits for those abort signals to resolve.
  vi.stubGlobal(
    "fetch",
    vi.fn(() =>
      Promise.resolve(new Response("", { status: 200, headers: { "content-type": "text/css" } })),
    ),
  );

  // Block link[rel="stylesheet"] external fetches. happy-dom resolves stylesheets
  // independently of `globalThis.fetch`, so we patch the prototype to no-op
  // `href` assignment for link elements.
  if (typeof HTMLLinkElement !== "undefined") {
    const proto = HTMLLinkElement.prototype as unknown as { href?: string };
    Object.defineProperty(proto, "href", {
      configurable: true,
      get() {
        return "";
      },
      set() {
        /* no-op in tests */
      },
    });
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
