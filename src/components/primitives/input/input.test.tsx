import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { Input } from "./input.js";

import { expectNoA11yViolations } from "../../../test/a11y.js";
describe("Input", () => {
  it("renders with placeholder", () => {
    render(<Input placeholder="acme-api" />);
    expect(screen.getByPlaceholderText("acme-api")).toBeInTheDocument();
  });

  it("defaults to type=text", () => {
    render(<Input data-testid="i" />);
    expect(screen.getByTestId("i")).toHaveAttribute("type", "text");
  });

  it("accepts other types (e.g. email, password)", () => {
    render(<Input type="email" data-testid="i" />);
    expect(screen.getByTestId("i")).toHaveAttribute("type", "email");
  });

  it("receives typed input", async () => {
    const user = userEvent.setup();
    render(<Input placeholder="x" />);
    const input = screen.getByPlaceholderText("x");
    await user.type(input, "hello");
    expect(input).toHaveValue("hello");
  });

  it("does not accept input when disabled", async () => {
    const user = userEvent.setup();
    render(<Input placeholder="x" disabled />);
    const input = screen.getByPlaceholderText("x");
    await user.type(input, "hello");
    expect(input).toHaveValue("");
  });

  it("has no a11y violations", async () => {
    await expectNoA11yViolations(<Input placeholder="acme-api" />);
  });

  // T1.1 — size prop (theming-and-sizes plan, EC-1 incorporated).
  it("applies h-8 + text-body-sm classes when size='sm'", () => {
    render(<Input data-testid="i" size="sm" />);
    const input = screen.getByTestId("i");
    expect(input.className).toContain("h-8");
    expect(input.className).toContain("text-body-sm");
  });

  it("applies h-10 + text-body-md classes when size is omitted (default md)", () => {
    render(<Input data-testid="i" />);
    const input = screen.getByTestId("i");
    expect(input.className).toContain("h-10");
    expect(input.className).toContain("text-body-md");
  });

  it("applies h-12 + text-body-lg classes when size='lg'", () => {
    render(<Input data-testid="i" size="lg" />);
    const input = screen.getByTestId("i");
    expect(input.className).toContain("h-12");
    expect(input.className).toContain("text-body-lg");
  });

  it("forwards ref and preserves extra className", () => {
    const ref = { current: null } as { current: HTMLInputElement | null };
    render(<Input ref={ref} className="custom-x" placeholder="r" />);
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
    expect(ref.current?.className).toContain("custom-x");
  });

  // EC-1: confirm TypeScript rejects the native HTML size attribute. The
  // assignment below would fail typecheck without @ts-expect-error.
  it("type-rejects the HTML size={number} attribute (EC-1)", () => {
    // @ts-expect-error — Input.size is now 'sm'|'md'|'lg', not number.
    const _bad = <Input size={20} />;
    expect(_bad).toBeTruthy();
  });
});
