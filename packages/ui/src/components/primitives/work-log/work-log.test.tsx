import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { expectNoA11yViolations } from "../../../test/a11y.js";
import { WorkLog } from "./work-log.js";

const steps = ["Read the file tree", "Edited agents/support-agent.ts", "Ran the test suite"];

describe("WorkLog", () => {
  it("shows the worked-for label", () => {
    render(<WorkLog workedFor="2m 30s" steps={steps} />);
    expect(screen.getByText(/Worked for 2m 30s/)).toBeInTheDocument();
  });

  it("is collapsed by default — steps hidden, aria-expanded false", () => {
    render(<WorkLog workedFor="2m 30s" steps={steps} />);
    expect(screen.getByRole("button")).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByText("Read the file tree")).not.toBeInTheDocument();
  });

  it("reveals the steps when toggled", async () => {
    const user = userEvent.setup();
    render(<WorkLog workedFor="2m 30s" steps={steps} />);
    await user.click(screen.getByRole("button"));
    expect(screen.getByRole("button")).toHaveAttribute("aria-expanded", "true");
    for (const step of steps) {
      expect(screen.getByText(step)).toBeInTheDocument();
    }
  });

  it("respects defaultOpen", () => {
    render(<WorkLog workedFor="1m" steps={steps} defaultOpen />);
    expect(screen.getByRole("button")).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("Read the file tree")).toBeInTheDocument();
  });

  it("exposes a data-slot", () => {
    const { container } = render(<WorkLog workedFor="1m" steps={steps} />);
    expect(container.querySelector('[data-slot="work-log"]')).not.toBeNull();
  });

  it("has no a11y violations", async () => {
    await expectNoA11yViolations(<WorkLog workedFor="2m 30s" steps={steps} defaultOpen />);
  });
});
