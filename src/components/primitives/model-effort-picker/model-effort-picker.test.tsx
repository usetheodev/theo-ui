import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { expectNoA11yViolations } from "../../../test/a11y.js";
import { ModelEffortPicker } from "./model-effort-picker.js";

const models = [
  { id: "claude-fable-5", name: "Fable 5", blurb: "Deepest reasoning" },
  { id: "claude-opus-4-8", name: "Opus 4.8", blurb: "Strong all-round" },
];

function setup(overrides = {}) {
  const onModelChange = vi.fn();
  const onEffortChange = vi.fn();
  render(
    <ModelEffortPicker
      models={models}
      model="claude-fable-5"
      onModelChange={onModelChange}
      effort="Medium"
      onEffortChange={onEffortChange}
      {...overrides}
    />,
  );
  return { onModelChange, onEffortChange };
}

describe("ModelEffortPicker", () => {
  it("shows the active model name and effort in the trigger", () => {
    setup();
    const trigger = screen.getByRole("button");
    expect(trigger).toHaveTextContent("Fable 5");
    expect(trigger).toHaveTextContent("Medium");
  });

  it("emits onModelChange when a model is picked", async () => {
    const user = userEvent.setup();
    const { onModelChange } = setup();
    await user.click(screen.getByRole("button"));
    await user.click(screen.getByRole("menuitemradio", { name: /Opus 4.8/ }));
    expect(onModelChange).toHaveBeenCalledWith("claude-opus-4-8");
  });

  it("emits onEffortChange when an effort is picked", async () => {
    const user = userEvent.setup();
    const { onEffortChange } = setup();
    await user.click(screen.getByRole("button"));
    await user.click(screen.getByRole("menuitemradio", { name: "High" }));
    expect(onEffortChange).toHaveBeenCalledWith("High");
  });

  it("exposes a data-slot", () => {
    const { container } = render(
      <ModelEffortPicker
        models={models}
        model="claude-fable-5"
        onModelChange={() => {}}
        effort="Low"
        onEffortChange={() => {}}
      />,
    );
    expect(container.querySelector('[data-slot="model-effort-picker"]')).not.toBeNull();
  });

  it("has no a11y violations", async () => {
    await expectNoA11yViolations(
      <ModelEffortPicker
        models={models}
        model="claude-fable-5"
        onModelChange={() => {}}
        effort="Low"
        onEffortChange={() => {}}
      />,
    );
  });
});
