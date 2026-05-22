import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Textarea } from "./textarea.js";

import { expectNoA11yViolations } from "../../../test/a11y.js";
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

  it("has no a11y violations", async () => {
    await expectNoA11yViolations(<Textarea aria-label="Notes" rows={5} />);
  });

  // T1.8 — size prop (theming-and-sizes plan)
  it("applies min-h-[64px] + text-body-sm when size='sm'", () => {
    render(<Textarea aria-label="s" size="sm" />);
    const el = screen.getByRole("textbox", { name: "s" });
    expect(el.className).toContain("min-h-[64px]");
    expect(el.className).toContain("text-body-sm");
  });

  it("applies min-h-[6rem] + text-body-md when size omitted (default md)", () => {
    render(<Textarea aria-label="m" />);
    const el = screen.getByRole("textbox", { name: "m" });
    expect(el.className).toContain("min-h-[6rem]");
    expect(el.className).toContain("text-body-md");
  });

  it("applies min-h-[128px] + text-body-lg when size='lg'", () => {
    render(<Textarea aria-label="l" size="lg" />);
    const el = screen.getByRole("textbox", { name: "l" });
    expect(el.className).toContain("min-h-[128px]");
    expect(el.className).toContain("text-body-lg");
  });

  it("forwards ref", () => {
    const ref = { current: null } as { current: HTMLTextAreaElement | null };
    render(<Textarea aria-label="r" ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLTextAreaElement);
  });
});
