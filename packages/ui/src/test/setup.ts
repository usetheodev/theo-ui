import "@testing-library/jest-dom/vitest";
import { cleanup, configure } from "@testing-library/react";
import { afterEach, beforeAll, expect, vi } from "vitest";
import * as axeMatchers from "vitest-axe/matchers";

expect.extend(axeMatchers);

/**
 * Give `waitFor` a budget proportionate to the one the test itself has.
 *
 * `vitest.config.ts` allows a test 20s; Testing Library gives every `waitFor` 1s and no
 * test file here overrides it. So a test with 19 seconds of budget left would abandon a
 * pending assertion after one — which is not a deadline anyone chose, it is a default
 * nobody noticed.
 *
 * That gap makes any assertion behind real async work load-sensitive rather than
 * deterministic. `<SlideDeck>` with string markdown is the clearest case: it dynamically
 * imports the whole markdown stack and parses before the slide count can render, and its
 * tests passed on an idle machine and failed under load — twice, on a box that was running
 * the full gate suite in parallel, and not once since. A test that depends on how busy the
 * machine is is flaky, and `rules/testing.md` is explicit that a flaky test is a bug.
 *
 * 5s is well inside the 20s per-test ceiling and far outside the tens of milliseconds real
 * work needs, so a genuine hang still fails the test rather than hanging the suite.
 */
configure({ asyncUtilTimeout: 5_000 });

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
