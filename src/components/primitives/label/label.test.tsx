import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Label } from "./label.js";

describe("Label", () => {
  it("renders children", () => {
    render(<Label htmlFor="name">Project name</Label>);
    expect(screen.getByText("Project name")).toBeInTheDocument();
  });

  it("associates with control via htmlFor", () => {
    render(<Label htmlFor="email">Email</Label>);
    expect(screen.getByText("Email").closest("label")).toHaveAttribute("for", "email");
  });

  it("renders asterisk when required is set", () => {
    render(
      <Label htmlFor="token" required>
        API token
      </Label>,
    );
    expect(screen.getByText("*")).toBeInTheDocument();
  });

  it("does not render asterisk by default", () => {
    render(<Label htmlFor="email">Email</Label>);
    expect(screen.queryByText("*")).not.toBeInTheDocument();
  });
});
