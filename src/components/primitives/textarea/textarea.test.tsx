import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Textarea } from "./textarea.js";

describe("Textarea", () => {
  it("renders a textarea with the provided rows", () => {
    render(<Textarea aria-label="Notes" rows={5} />);
    const el = screen.getByRole("textbox", { name: "Notes" });
    expect(el).toBeInTheDocument();
    expect(el).toHaveAttribute("rows", "5");
  });

  it("falls back to 3 rows by default", () => {
    render(<Textarea aria-label="Notes" />);
    expect(screen.getByRole("textbox", { name: "Notes" })).toHaveAttribute("rows", "3");
  });

  it("forwards typed input to the change handler", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Textarea aria-label="Notes" onChange={onChange} />);
    await user.type(screen.getByRole("textbox", { name: "Notes" }), "hi");
    expect(onChange).toHaveBeenCalled();
  });

  it("respects the disabled attribute", () => {
    render(<Textarea aria-label="Notes" disabled />);
    expect(screen.getByRole("textbox", { name: "Notes" })).toBeDisabled();
  });
});
