import { describe, expect, it } from "vitest";
import {
  buildControlClassFallbackLayer,
  extractControlClasses,
  findUncoveredControlClasses,
} from "./control-class-coverage.js";

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

describe("buildControlClassFallbackLayer", () => {
  it("emits one attribute-substring rule per utility+variable pair", () => {
    const layer = buildControlClassFallbackLayer([
      "h-[var(--theo-control-h,2.25rem)]",
      "w-[var(--theo-control-h,2.25rem)]",
      "px-[var(--theo-control-px,0.875rem)]",
    ]);

    expect(layer).toContain(
      '[class*="h-[var(--theo-control-h"] { height: var(--theo-control-h, 2.25rem); }',
    );
    expect(layer).toContain(
      '[class*="w-[var(--theo-control-h"] { width: var(--theo-control-h, 2.25rem); }',
    );
    expect(layer).toContain(
      '[class*="px-[var(--theo-control-px"] { padding-inline: var(--theo-control-px, 0.875rem); }',
    );
  });

  it("declares the canonical layer order first", () => {
    // Opening `utilities` before Tailwind registers its layers would put preflight above
    // every utility — the regression from usetheokit/theokit-ui#20, by a different route.
    const layer = buildControlClassFallbackLayer(["h-[var(--theo-control-h,2rem)]"]);
    const statement = "@layer theme, base, components, utilities;";

    expect(layer).toContain(statement);
    expect(layer.indexOf(statement)).toBeLessThan(layer.indexOf("@layer utilities {"));
  });

  it("collapses variants of the same utility+variable into one rule", () => {
    // 0.22.0 and 0.35.1 differ only in the fallback; the net keys on what does not vary.
    const layer = buildControlClassFallbackLayer([
      "w-[var(--theo-control-h,2rem)]",
      "w-[var(--theo-control-h,2.25rem)]",
    ]);

    expect(layer.match(/\[class\*="w-/g)?.length).toBe(1);
  });

  it("ignores a utility prefix it has no property mapping for", () => {
    // Guessing a property from an unknown prefix would emit a rule that means nothing.
    expect(buildControlClassFallbackLayer(["zz-[var(--theo-control-h,2rem)]"])).toBe("");
  });

  it("returns empty when there is nothing to net", () => {
    expect(buildControlClassFallbackLayer([])).toBe("");
  });
});
