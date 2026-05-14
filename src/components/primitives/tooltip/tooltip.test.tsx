import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { Button } from "../button/button.js";
import { Tooltip } from "./tooltip.js";

import { expectNoA11yViolations } from "../../../test/a11y.js";
describe("Tooltip", () => {
  it("does not render content initially", () => {
    render(
      <Tooltip label="Deploy to production">
        <Button>Deploy</Button>
      </Tooltip>,
    );
    expect(screen.queryByText("Deploy to production")).not.toBeInTheDocument();
  });

  it("shows tooltip on hover", async () => {
    const user = userEvent.setup();
    render(
      <Tooltip label="Deploy to production" delayDuration={0}>
        <Button>Deploy</Button>
      </Tooltip>,
    );
    await user.hover(screen.getByRole("button", { name: "Deploy" }));
    await waitFor(() =>
      expect(screen.getAllByText("Deploy to production").length).toBeGreaterThan(0),
    );
  });

  it("has no a11y violations", async () => {
    await expectNoA11yViolations(
      <Tooltip label="Deploy to production">
        <Button>Deploy</Button>
      </Tooltip>,
    );
  });
});
