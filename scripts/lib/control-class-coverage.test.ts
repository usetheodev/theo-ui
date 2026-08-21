import { describe, expect, it } from "vitest";
import { extractControlClasses, findUncoveredControlClasses } from "./control-class-coverage.js";

// The three classes @usetheo/ui@0.22.0 actually renders, and the CSS we emit for them.
const PEER_022 = [
  'x({icon:"h-[var(--theo-control-h,2.25rem)] w-[var(--theo-control-h,2.25rem)]"})',
];
const CSS_022 =
  ".h-\\[var\\(--theo-control-h\\,2\\.25rem\\)\\]{height:var(--theo-control-h,2.25rem)}" +
  ".w-\\[var\\(--theo-control-h\\,2\\.25rem\\)\\]{width:var(--theo-control-h,2.25rem)}";

describe("extractControlClasses", () => {
  it("finds design-system control classes in compiled sources", () => {
    expect(extractControlClasses(PEER_022)).toEqual([
      "h-[var(--theo-control-h,2.25rem)]",
      "w-[var(--theo-control-h,2.25rem)]",
    ]);
  });

  it("ignores arbitrary-value classes that are not design-system controls", () => {
    expect(extractControlClasses(['"w-[32px] text-[#fff]"'])).toEqual([]);
  });
});

describe("findUncoveredControlClasses", () => {
  it("reports nothing when the stylesheet was built against this peer", () => {
    expect(findUncoveredControlClasses(PEER_022, CSS_022)).toEqual([]);
  });

  it("reports the drift when the peer's default value moved", () => {
    // The measured 0.22.0 -> 0.35.1 change: 2.25rem became 2rem. Our selectors are
    // exact-match on the whole arbitrary value, so both classes lose their rule.
    const peer035 = ['x({icon:"h-[var(--theo-control-h,2rem)] w-[var(--theo-control-h,2rem)]"})'];

    expect(findUncoveredControlClasses(peer035, CSS_022)).toEqual([
      "h-[var(--theo-control-h,2rem)]",
      "w-[var(--theo-control-h,2rem)]",
    ]);
  });

  it("matches through the selector escaping Tailwind emits", () => {
    // `.w-\[var\(--theo-control-h\,2\.25rem\)\]` must count as covering the plain class.
    expect(findUncoveredControlClasses(['"w-[var(--theo-control-h,2.25rem)]"'], CSS_022)).toEqual(
      [],
    );
  });
});
