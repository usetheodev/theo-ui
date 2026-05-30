import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ThinkingLevelSelector } from "./thinking-level-selector.js";

describe("ThinkingLevelSelector", () => {
  it("renders inherited option with inheritedValue label", () => {
    render(<ThinkingLevelSelector value="inherited" inheritedValue="medium" onChange={() => {}} />);
    expect(screen.getByRole("combobox")).toBeInTheDocument();
    expect(screen.getByText("Inherited: medium")).toBeInTheDocument();
  });

  it("renders all override options", () => {
    render(<ThinkingLevelSelector value="inherited" inheritedValue="medium" onChange={() => {}} />);
    expect(screen.getByText("Off")).toBeInTheDocument();
    expect(screen.getByText("Override: minimal")).toBeInTheDocument();
    expect(screen.getByText("Override: low")).toBeInTheDocument();
    expect(screen.getByText("Override: medium")).toBeInTheDocument();
    expect(screen.getByText("Override: high")).toBeInTheDocument();
    expect(screen.getByText("Override: xhigh")).toBeInTheDocument();
  });

  it("fires onChange with the correct value when user selects an override", () => {
    const onChange = vi.fn();
    render(<ThinkingLevelSelector value="inherited" inheritedValue="medium" onChange={onChange} />);
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "high" } });
    expect(onChange).toHaveBeenCalledWith("high");
  });

  it("falls back to bare 'Inherited' label when inheritedValue is omitted", () => {
    render(<ThinkingLevelSelector value="inherited" onChange={() => {}} />);
    expect(screen.getByText("Inherited")).toBeInTheDocument();
  });

  it("disables the select when disabled prop is set", () => {
    render(
      <ThinkingLevelSelector value="medium" inheritedValue="medium" onChange={() => {}} disabled />,
    );
    expect(screen.getByRole("combobox")).toBeDisabled();
  });
});
