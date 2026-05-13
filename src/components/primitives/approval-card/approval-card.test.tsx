import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ApprovalCard } from "./approval-card.js";

describe("ApprovalCard", () => {
  it("renders title and request", () => {
    render(
      <ApprovalCard
        title="Run destructive command?"
        request="rm -rf node_modules"
        onApprove={() => undefined}
        onDeny={() => undefined}
      />,
    );
    expect(screen.getByText("Run destructive command?")).toBeInTheDocument();
    expect(screen.getByText("rm -rf node_modules")).toBeInTheDocument();
  });

  it("does not render buttons when no callbacks are provided", () => {
    render(<ApprovalCard title="x" request="y" />);
    expect(screen.queryByRole("button", { name: /approve/i })).toBeNull();
    expect(screen.queryByRole("button", { name: /deny/i })).toBeNull();
  });

  it("calls onApprove and onDeny", async () => {
    const user = userEvent.setup();
    const onApprove = vi.fn();
    const onDeny = vi.fn();
    render(<ApprovalCard title="x" request="y" onApprove={onApprove} onDeny={onDeny} />);
    await user.click(screen.getByRole("button", { name: /deny/i }));
    await user.click(screen.getByRole("button", { name: /approve/i }));
    expect(onDeny).toHaveBeenCalledTimes(1);
    expect(onApprove).toHaveBeenCalledTimes(1);
  });

  it("renders Always-allow only when callback provided", () => {
    const { rerender } = render(<ApprovalCard title="x" request="y" />);
    expect(screen.queryByRole("button", { name: /always/i })).toBeNull();
    rerender(<ApprovalCard title="x" request="y" onAlways={() => undefined} />);
    expect(screen.getByRole("button", { name: /always/i })).toBeInTheDocument();
  });

  it("uses destructive variant role styling for severity=destructive", () => {
    render(
      <ApprovalCard
        severity="destructive"
        title="Delete folder?"
        request="rm -rf src"
        onApprove={() => undefined}
      />,
    );
    expect(screen.getByRole("alertdialog", { name: "Delete folder?" })).toBeInTheDocument();
  });
});
