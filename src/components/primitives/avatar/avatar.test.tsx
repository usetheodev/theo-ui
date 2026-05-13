import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Avatar } from "./avatar.js";

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
});
