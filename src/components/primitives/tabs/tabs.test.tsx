import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { Tabs } from "./tabs.js";

import { expectNoA11yViolations } from "../../../test/a11y.js";
function Example() {
  return (
    <Tabs defaultValue="overview">
      <Tabs.List>
        <Tabs.Trigger value="overview">Overview</Tabs.Trigger>
        <Tabs.Trigger value="deployments">Deployments</Tabs.Trigger>
        <Tabs.Trigger value="settings">Settings</Tabs.Trigger>
      </Tabs.List>
      <Tabs.Content value="overview">Overview content</Tabs.Content>
      <Tabs.Content value="deployments">Deployments content</Tabs.Content>
      <Tabs.Content value="settings">Settings content</Tabs.Content>
    </Tabs>
  );
}

describe("Tabs", () => {
  it("shows the default tab content", () => {
    render(<Example />);
    expect(screen.getByText("Overview content")).toBeInTheDocument();
    expect(screen.queryByText("Deployments content")).not.toBeInTheDocument();
  });

  it("switches content on tab click", async () => {
    const user = userEvent.setup();
    render(<Example />);
    await user.click(screen.getByRole("tab", { name: "Deployments" }));
    expect(screen.getByText("Deployments content")).toBeInTheDocument();
    expect(screen.queryByText("Overview content")).not.toBeInTheDocument();
  });

  it("supports keyboard arrow navigation", async () => {
    const user = userEvent.setup();
    render(<Example />);
    const overview = screen.getByRole("tab", { name: "Overview" });
    overview.focus();
    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("tab", { name: "Deployments" })).toHaveFocus();
  });

  it("has no a11y violations", async () => {
    await expectNoA11yViolations(<Example />);
  });

  // HIGH-009 / T6.2: compound displayName chain.
  it("exposes correct displayName on subparts", () => {
    expect(Tabs.List.displayName).toBe("Tabs.List");
    expect(Tabs.Trigger.displayName).toBe("Tabs.Trigger");
    expect(Tabs.Content.displayName).toBe("Tabs.Content");
  });
});
