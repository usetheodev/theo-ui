import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Select } from "./select.js";

import { expectNoA11yViolations } from "../../../test/a11y.js";
function Example({ onValueChange }: { onValueChange?: (v: string) => void }) {
  return (
    <Select onValueChange={onValueChange}>
      <Select.Trigger aria-label="Region">
        <Select.Value placeholder="Pick a region" />
      </Select.Trigger>
      <Select.Content>
        <Select.Item value="iad1">Washington (iad1)</Select.Item>
        <Select.Item value="gru1">São Paulo (gru1)</Select.Item>
      </Select.Content>
    </Select>
  );
}

describe("Select", () => {
  it("renders placeholder when no value", () => {
    render(<Example />);
    expect(screen.getByText("Pick a region")).toBeInTheDocument();
  });

  it("opens the menu on trigger click", async () => {
    const user = userEvent.setup();
    render(<Example />);
    await user.click(screen.getByLabelText("Region"));
    expect(screen.getByRole("option", { name: /Washington/ })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: /São Paulo/ })).toBeInTheDocument();
  });

  it("calls onValueChange when an option is selected", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<Example onValueChange={onValueChange} />);
    await user.click(screen.getByLabelText("Region"));
    await user.click(screen.getByRole("option", { name: /São Paulo/ }));
    expect(onValueChange).toHaveBeenCalledWith("gru1");
  });

  it("has no a11y violations", async () => {
    await expectNoA11yViolations(<Example />);
  });

  // T1.9 — size prop on Select.Trigger (theming-and-sizes plan)
  it("Trigger applies h-8 + text-body-sm when size='sm'", () => {
    render(
      <Select>
        <Select.Trigger aria-label="s" size="sm">
          <Select.Value placeholder="x" />
        </Select.Trigger>
      </Select>,
    );
    const trigger = screen.getByLabelText("s");
    expect(trigger.className).toContain("h-8");
    expect(trigger.className).toContain("text-body-sm");
  });

  it("Trigger md (default) reads height from --theo-control-h var + text-body-sm (FAANG density)", () => {
    render(
      <Select>
        <Select.Trigger aria-label="m">
          <Select.Value placeholder="x" />
        </Select.Trigger>
      </Select>,
    );
    const trigger = screen.getByLabelText("m");
    expect(trigger.className).toContain("h-[var(--theo-control-h,2.25rem)]");
    expect(trigger.className).toContain("text-body-sm");
  });

  it("Trigger applies h-11 + text-body-md when size='lg' (FAANG-density)", () => {
    render(
      <Select>
        <Select.Trigger aria-label="l" size="lg">
          <Select.Value placeholder="x" />
        </Select.Trigger>
      </Select>,
    );
    const trigger = screen.getByLabelText("l");
    expect(trigger.className).toContain("h-11");
    expect(trigger.className).toContain("text-body-md");
  });

  it("Items inside Content stay invariant regardless of Trigger size", async () => {
    const user = userEvent.setup();
    const { unmount } = render(
      <Select>
        <Select.Trigger aria-label="r-sm" size="sm">
          <Select.Value placeholder="x" />
        </Select.Trigger>
        <Select.Content>
          <Select.Item value="a">A</Select.Item>
        </Select.Content>
      </Select>,
    );
    await user.click(screen.getByLabelText("r-sm"));
    const smClasses = screen.getByRole("option", { name: "A" }).className;
    unmount();
    render(
      <Select>
        <Select.Trigger aria-label="r-lg" size="lg">
          <Select.Value placeholder="x" />
        </Select.Trigger>
        <Select.Content>
          <Select.Item value="a">A</Select.Item>
        </Select.Content>
      </Select>,
    );
    await user.click(screen.getByLabelText("r-lg"));
    const lgClasses = screen.getByRole("option", { name: "A" }).className;
    // Item markup is identical — trigger size does NOT propagate to items.
    expect(smClasses).toBe(lgClasses);
  });

  it("has no a11y violations in each size", async () => {
    for (const size of ["sm", "md", "lg"] as const) {
      await expectNoA11yViolations(
        <Select>
          <Select.Trigger aria-label={size} size={size}>
            <Select.Value placeholder="x" />
          </Select.Trigger>
        </Select>,
      );
    }
  });
});
