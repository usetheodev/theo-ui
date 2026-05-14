import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Avatar } from "./avatar.js";

import { expectNoA11yViolations } from "../../../test/a11y.js";
describe("Avatar", () => {
  it("renders fallback text", async () => {
    render(
      <Avatar>
        <Avatar.Fallback delayMs={0}>AA</Avatar.Fallback>
      </Avatar>,
    );
    expect(await screen.findByText("AA")).toBeInTheDocument();
  });

  it("applies size variant classes", () => {
    const { container } = render(
      <Avatar size="lg">
        <Avatar.Fallback>LG</Avatar.Fallback>
      </Avatar>,
    );
    expect(container.querySelector('[class*="size-12"]')).not.toBeNull();
  });

  it("applies tone variant classes", () => {
    const { container } = render(
      <Avatar tone="primary">
        <Avatar.Fallback>PR</Avatar.Fallback>
      </Avatar>,
    );
    expect(container.querySelector('[class*="bg-primary"]')).not.toBeNull();
  });

  it("has no a11y violations", async () => {
    await expectNoA11yViolations(
      <Avatar>
        <Avatar.Fallback delayMs={0}>AA</Avatar.Fallback>
      </Avatar>,
    );
  });

  // HIGH-009 / T6.2: compound displayName chain.
  it("exposes correct displayName on root + subparts", () => {
    expect(Avatar.displayName).toBe("Avatar");
    expect(Avatar.Image.displayName).toBe("Avatar.Image");
    expect(Avatar.Fallback.displayName).toBe("Avatar.Fallback");
  });
});
