import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LoginSplit } from "./login-split.js";

describe("LoginSplit", () => {
  it("renders both panes and the optional footer", () => {
    render(
      <LoginSplit
        left={<div>Form</div>}
        right={<div>Illustration</div>}
        footer={<div>© Theo</div>}
      />,
    );
    expect(screen.getByText("Form")).toBeInTheDocument();
    expect(screen.getByText("Illustration")).toBeInTheDocument();
    expect(screen.getByText("© Theo")).toBeInTheDocument();
  });

  it("applies reverse modifier when set", () => {
    const { container } = render(<LoginSplit left={<div>L</div>} right={<div>R</div>} reverse />);
    const grid = container.querySelector(".grid");
    expect(grid?.className ?? "").toMatch(/lg:\[&>\*:first-child\]:order-2/);
  });
});
