/**
 * Density has to reach a control, not only the document.
 *
 * `useDensity` set `data-density` on `<html>` and injected `--theo-control-h` / `--theo-control-px`
 * under each value, and `density.ts` documented form-control variants reading them. No component
 * did — a grep for those variables across `src/components` returned nothing. The switch worked, the
 * CSS was correct, the tests asserted the injection, and the UI did not move: a control that
 * controls nothing.
 *
 * These assert the wiring at the class level, because jsdom applies no stylesheet and computes no
 * layout — the CSS behind the variable is covered by `density.test.tsx`, and what was missing was
 * anything reading it.
 */
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { HookConfig } from "../components/primitives/hook-config/hook-config.js";
import { QuickActionChips } from "../components/primitives/quick-action-chips/quick-action-chips.js";

describe("md-tier controls read the density variables", () => {
  it("HookConfig's fields and button do", () => {
    const { container } = render(<HookConfig hooks={[]} onAdd={() => undefined} />);

    // `onAdd` because the add-row fields only render when there is somewhere for a new hook to go —
    // without it the component is a list and has no controls to be dense about.
    const controls = [...container.querySelectorAll("input, select, button")];
    const aware = controls.filter((el) => el.className.includes("--theo-control-h"));

    expect(controls.length, "the component rendered no controls at all").toBeGreaterThan(0);
    expect(aware.length, "no control reads the density variable").toBeGreaterThan(0);
  });

  it("QuickActionChips does", () => {
    render(<QuickActionChips actions={[{ id: "a", label: "One" }]} onSelect={() => undefined} />);

    expect(screen.getByRole("button", { name: /One/ }).className).toContain("--theo-control-h");
  });

  it("keeps a fallback, so a control still has a height without the provider", () => {
    // The variable is only defined under `[data-density=...]`. Rendered outside a ThemeProvider —
    // which the registry's copy-paste path allows — the fallback is what stops the control
    // collapsing to auto height.
    render(<QuickActionChips actions={[{ id: "a", label: "One" }]} onSelect={() => undefined} />);

    expect(screen.getByRole("button", { name: /One/ }).className).toContain("2.25rem");
  });
});
