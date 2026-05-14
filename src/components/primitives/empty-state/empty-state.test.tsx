import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Inbox, Rocket } from "lucide-react";
import { describe, expect, it, vi } from "vitest";
import { Button } from "../button/button.js";
import { EmptyState } from "./empty-state.js";

import { expectNoA11yViolations } from "../../../test/a11y.js";
describe("EmptyState", () => {
  it("renders title (required)", () => {
    render(<EmptyState title="No projects yet" />);
    expect(screen.getByText("No projects yet")).toBeInTheDocument();
  });

  it("renders description when provided", () => {
    render(<EmptyState title="No projects" description="Create one to start." />);
    expect(screen.getByText("Create one to start.")).toBeInTheDocument();
  });

  it("renders eyebrow when provided", () => {
    render(<EmptyState eyebrow="No data" title="Yet" />);
    expect(screen.getByText("No data")).toBeInTheDocument();
  });

  it("renders icon node when provided", () => {
    const { container } = render(<EmptyState icon={Rocket} title="Deploy" />);
    expect(container.querySelector("svg")).not.toBeNull();
  });

  it("fires action callback via action slot", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <EmptyState icon={Inbox} title="Start" action={<Button onClick={onClick}>New</Button>} />,
    );
    await user.click(screen.getByRole("button", { name: "New" }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("has no a11y violations", async () => {
    await expectNoA11yViolations(<EmptyState title="No projects yet" />);
  });
});
