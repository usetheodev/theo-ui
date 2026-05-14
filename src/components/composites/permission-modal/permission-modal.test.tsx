import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { PermissionRequest } from "../../../types/permission.js";
import { PermissionModal } from "./permission-modal.js";

const request: PermissionRequest = {
  path: "/work/secret.env",
  operations: ["read", "write"],
};

describe("PermissionModal", () => {
  it("renders default title with operations and path", () => {
    render(
      <PermissionModal
        open
        onOpenChange={() => undefined}
        request={request}
        onDecide={() => undefined}
      />,
    );
    expect(screen.getByText(/Allow Theo to/)).toBeInTheDocument();
    expect(screen.getAllByText(/\/work\/secret\.env/).length).toBeGreaterThanOrEqual(1);
  });

  it("fires onDecide with the right decision for each button", async () => {
    const user = userEvent.setup();
    const onDecide = vi.fn();
    render(
      <PermissionModal open onOpenChange={() => undefined} request={request} onDecide={onDecide} />,
    );
    await user.click(screen.getByRole("button", { name: /Allow once/i }));
    expect(onDecide).toHaveBeenCalledWith("allowed_once");
    await user.click(screen.getByRole("button", { name: /Always allow/i }));
    expect(onDecide).toHaveBeenCalledWith("always_allowed");
    await user.click(screen.getByRole("button", { name: /Cancel/i }));
    expect(onDecide).toHaveBeenCalledWith("denied");
  });

  it("respects label overrides", () => {
    render(
      <PermissionModal
        open
        onOpenChange={() => undefined}
        request={request}
        onDecide={() => undefined}
        labels={{ allow: "Yes, permitir" }}
      />,
    );
    expect(screen.getByRole("button", { name: /Yes, permitir/ })).toBeInTheDocument();
  });
});
