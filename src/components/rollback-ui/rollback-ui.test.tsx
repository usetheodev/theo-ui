import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { type RollbackTarget, RollbackUI } from "./rollback-ui.js";

const history: RollbackTarget[] = [
  {
    id: "v3",
    version: "v1.2.0",
    commitSha: "1f3b8e2",
    commitMessage: "feat: deploy command",
    deployedAt: "2m ago",
    duration: "24s",
    isCurrent: true,
  },
  {
    id: "v2",
    version: "v1.1.0",
    commitSha: "8d9c204",
    commitMessage: "fix: env var leak",
    deployedAt: "1h ago",
    duration: "22s",
  },
  {
    id: "v1",
    version: "v1.0.0",
    commitSha: "a2e9301",
    commitMessage: "initial release",
    deployedAt: "1d ago",
    duration: "31s",
  },
];

describe("RollbackUI", () => {
  it("marks the current deploy with Current badge", () => {
    render(<RollbackUI history={history} />);
    expect(screen.getByText("Current")).toBeInTheDocument();
  });

  it("shows Roll back button on non-current deploys", () => {
    render(<RollbackUI history={history} />);
    expect(screen.getAllByRole("button", { name: /Roll back/ })).toHaveLength(2);
  });

  it("does not show Roll back on current deploy", () => {
    render(<RollbackUI history={[history[0] as never]} />);
    expect(screen.queryByRole("button", { name: /Roll back/ })).not.toBeInTheDocument();
  });

  it("requires confirm step before firing onRollback", async () => {
    const user = userEvent.setup();
    const onRollback = vi.fn();
    render(<RollbackUI history={history} onRollback={onRollback} />);

    // first click → enters confirm state, does NOT fire
    await user.click(screen.getAllByRole("button", { name: /Roll back/ })[0] as HTMLElement);
    expect(onRollback).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: /Confirm rollback/ })).toBeInTheDocument();

    // confirm click → fires
    await user.click(screen.getByRole("button", { name: /Confirm rollback/ }));
    expect(onRollback).toHaveBeenCalledWith("v2");
  });

  it("cancel exits confirm state", async () => {
    const user = userEvent.setup();
    render(<RollbackUI history={history} />);
    await user.click(screen.getAllByRole("button", { name: /Roll back/ })[0] as HTMLElement);
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.queryByRole("button", { name: /Confirm rollback/ })).not.toBeInTheDocument();
  });
});
