import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Button } from "./button.js";

describe("Button", () => {
  it("renders children", () => {
    render(<Button>Deploy</Button>);
    expect(screen.getByRole("button", { name: "Deploy" })).toBeInTheDocument();
  });

  it("defaults to type=button to prevent form submission", () => {
    render(<Button>Deploy</Button>);
    expect(screen.getByRole("button")).toHaveAttribute("type", "button");
  });

  it("respects explicit type=submit when provided", () => {
    render(<Button type="submit">Submit</Button>);
    expect(screen.getByRole("button")).toHaveAttribute("type", "submit");
  });

  it("applies the primary variant by default", () => {
    render(<Button>Primary</Button>);
    expect(screen.getByRole("button").className).toContain("bg-primary");
  });

  it("applies the accent variant when requested (burnt sienna)", () => {
    render(<Button variant="accent">Celebrate</Button>);
    expect(screen.getByRole("button").className).toContain("bg-accent");
  });

  it("fires onClick when activated", async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Run</Button>);
    await user.click(screen.getByRole("button"));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("does not fire onClick when disabled", async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();
    render(
      <Button onClick={handleClick} disabled>
        Run
      </Button>,
    );
    await user.click(screen.getByRole("button"));
    expect(handleClick).not.toHaveBeenCalled();
  });

  it("composes className with variant classes", () => {
    render(<Button className="custom-class">x</Button>);
    expect(screen.getByRole("button").className).toContain("custom-class");
  });

  it("forwards ref", () => {
    const ref = { current: null as HTMLButtonElement | null };
    render(<Button ref={ref}>Ref</Button>);
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  });

  it("renders as link when asChild + anchor", () => {
    render(
      <Button asChild>
        <a href="/deploy">Deploy</a>
      </Button>,
    );
    const link = screen.getByRole("link", { name: "Deploy" });
    expect(link).toHaveAttribute("href", "/deploy");
    expect(link.className).toContain("bg-primary");
  });
});
