import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { Input } from "./input.js";

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
});
