import { render, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import { Slide } from "./slide.js";

describe("<Slide> accessibility", () => {
  it("has zero axe violations on default rendering", async () => {
    const { container } = render(<Slide markdown="# Heading\n\nBody paragraph." />);
    await waitFor(
      () => {
        expect(container.querySelector("h1")).toBeTruthy();
      },
      { timeout: 5000 },
    );
    const result = await axe(container);
    expect(result).toHaveNoViolations();
  });

  it("has zero axe violations with custom aria-label", async () => {
    const { container } = render(
      <Slide markdown="# Heading" aria-label="Quarterly summary slide" />,
    );
    await waitFor(
      () => {
        expect(container.querySelector("h1")).toBeTruthy();
      },
      { timeout: 5000 },
    );
    const result = await axe(container);
    expect(result).toHaveNoViolations();
  });

  it("has zero axe violations on violet-forge theme", async () => {
    const { container } = render(
      <Slide markdown="# Heading\n\n- item 1\n- item 2" theme="violet-forge" />,
    );
    await waitFor(
      () => {
        expect(container.querySelector("h1")).toBeTruthy();
      },
      { timeout: 5000 },
    );
    const result = await axe(container);
    expect(result).toHaveNoViolations();
  });

  it("section carries proper region semantics (role + roledescription + label)", () => {
    const { getByRole } = render(<Slide markdown="# t" aria-label="my slide" />);
    const region = getByRole("region", { name: "my slide" });
    expect(region.getAttribute("aria-roledescription")).toBe("slide");
  });
});
