import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { UpdateBanner } from "./update-banner.js";

describe("UpdateBanner", () => {
  it("renders both versions", () => {
    render(<UpdateBanner currentVersion="1.0.0" latestVersion="2.0.0" onUpdate={() => {}} />);
    expect(screen.getByTestId("update-banner-current").textContent).toBe("v1.0.0");
    expect(screen.getByTestId("update-banner-latest").textContent).toBe("v2.0.0");
  });

  it("fires onUpdate when update button is clicked", () => {
    const onUpdate = vi.fn();
    render(<UpdateBanner currentVersion="1.0.0" latestVersion="2.0.0" onUpdate={onUpdate} />);
    fireEvent.click(screen.getByTestId("update-banner-update-button"));
    expect(onUpdate).toHaveBeenCalledOnce();
  });

  it("renders dismiss button only when onDismiss is provided", () => {
    const { rerender } = render(
      <UpdateBanner currentVersion="1.0.0" latestVersion="2.0.0" onUpdate={() => {}} />,
    );
    expect(screen.queryByTestId("update-banner-dismiss")).not.toBeInTheDocument();

    const onDismiss = vi.fn();
    rerender(
      <UpdateBanner
        currentVersion="1.0.0"
        latestVersion="2.0.0"
        onUpdate={() => {}}
        onDismiss={onDismiss}
      />,
    );
    fireEvent.click(screen.getByTestId("update-banner-dismiss"));
    expect(onDismiss).toHaveBeenCalledOnce();
  });

  it("applies warn severity styling", () => {
    render(
      <UpdateBanner
        currentVersion="1.0.0"
        latestVersion="2.0.0"
        severity="warn"
        onUpdate={() => {}}
      />,
    );
    expect(screen.getByTestId("update-banner")).toHaveAttribute("data-severity", "warn");
  });
});
