import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

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

  // Regression: usetheokit/theokit-ui#7 — the Tooltip rendered a white box with white text
  // because `cn()` dropped `text-background`. Vanilla tailwind-merge groups every `text-*`
  // class into one bucket, so a colour and a typescale size collided and the later one won.
  // The symptom was invisible text on an inverted surface, which is an accessibility defect
  // on every popover and tooltip in the library.
  it("keeps an inverted text colour alongside a typescale size", () => {
    // Given the exact class list the Tooltip composes,
    // When cn() merges it,
    // Then BOTH the colour and the size must survive — they are independent dimensions.
    const merged = cn("bg-foreground px-2.5 py-1.5", "text-background text-body-sm shadow-md");

    expect(merged).toContain("text-background");
    expect(merged).toContain("text-body-sm");
  });

  it("still resolves two sizes, and two colours, against each other", () => {
    // The fix must not go too far: within one dimension, last still wins.
    expect(cn("text-body-sm", "text-body-lg")).toBe("text-body-lg");
    expect(cn("text-background", "text-foreground")).toBe("text-foreground");
  });

  // The guard that keeps #7 from coming back.
  //
  // `cn()` hand-lists the typescale in its `font-size` class group. That list and the
  // `--text-*` tokens in tokens-v4.css have to agree, and nothing makes them move together:
  // adding `--text-body-xs` to the CSS without touching cn.ts silently reintroduces the exact
  // collision above, on whichever component adopts the new size first. The failure is a
  // colour vanishing at runtime, which no type checker and no linter can see.
  //
  // So the CSS is the source of truth and this test is the mechanism holding cn.ts to it —
  // the same arrangement theme-boot-agreement.test.tsx uses for the script/provider pair.
  //
  // It asserts BEHAVIOUR, not list equality: every declared size must survive alongside a
  // colour. A list comparison would pass on a token that was added to both files and still
  // merged wrongly.
  it("keeps every typescale size in tokens-v4.css independent from colour", () => {
    const cssPath = join(dirname(fileURLToPath(import.meta.url)), "../styles/tokens-v4.css");
    const css = readFileSync(cssPath, "utf-8");

    // `--text-body-md: …` is a size; `--text-body-md--line-height: …` is one of its
    // sub-properties. The `--` inside the name is what separates them.
    const sizes = [
      ...new Set(
        [...css.matchAll(/--text-([a-z0-9-]+)\s*:/g)]
          .map((m) => m[1] as string)
          .filter((name) => !name.includes("--")),
      ),
    ].sort();

    // Fail on an empty sweep rather than pass it: a moved file or a changed token syntax
    // would otherwise make this test assert nothing while reporting green.
    expect(sizes.length).toBeGreaterThan(5);

    const collapsed = sizes.filter(
      (size) => !cn("text-foreground", `text-${size}`).includes("text-foreground"),
    );

    expect(collapsed).toEqual([]);
  });

  // TODO: when a component needs `shadow-glow` vs `shadow-md` to resolve as a conflict,
  // configure tailwind-merge with extendTailwindMerge to teach it our custom shadow scale.
  // For now, design-system custom utilities (shadow-glow, shadow-glow-strong, bg-dotted-violet)
  // are composable with standard shadows — explicit by design.
});
