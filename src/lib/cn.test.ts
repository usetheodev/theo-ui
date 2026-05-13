import { describe, expect, it } from "vitest";
import { cn } from "./cn.js";

describe("cn", () => {
  it("merges static class names", () => {
    expect(cn("text-body-md", "font-display")).toBe("text-body-md font-display");
  });

  it("resolves Tailwind conflicts (last wins)", () => {
    expect(cn("px-2", "px-4")).toBe("px-4");
  });

  it("filters falsy values", () => {
    expect(cn("base", false, null, undefined, "active")).toBe("base active");
  });

  it("accepts conditional object form", () => {
    expect(cn("base", { active: true, hidden: false })).toBe("base active");
  });

  it("resolves Tailwind color conflicts (last wins)", () => {
    expect(cn("bg-red-500", "bg-primary")).toBe("bg-primary");
  });

  // TODO: when a component needs `shadow-glow` vs `shadow-md` to resolve as a conflict,
  // configure tailwind-merge with extendTailwindMerge to teach it our custom shadow scale.
  // For now, design-system custom utilities (shadow-glow, shadow-glow-strong, bg-dotted-violet)
  // are composable with standard shadows — explicit by design.
});
