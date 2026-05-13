import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Sidebar } from "./sidebar.js";

describe("Sidebar", () => {
  it("renders header, sections and items", () => {
    render(
      <Sidebar>
        <Sidebar.Header>theo-ui</Sidebar.Header>
        <Sidebar.Section title="Workspace">
          <Sidebar.Item>Overview</Sidebar.Item>
          <Sidebar.Item>Deployments</Sidebar.Item>
        </Sidebar.Section>
      </Sidebar>,
    );
    expect(screen.getByText("theo-ui")).toBeInTheDocument();
    expect(screen.getByText("Workspace")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Overview" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Deployments" })).toBeInTheDocument();
  });

  it("marks active item with aria-current=page", () => {
    render(
      <Sidebar>
        <Sidebar.Item active>Overview</Sidebar.Item>
        <Sidebar.Item>Settings</Sidebar.Item>
      </Sidebar>,
    );
    expect(screen.getByRole("button", { name: "Overview" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByRole("button", { name: "Settings" })).not.toHaveAttribute("aria-current");
  });

  it("renders as anchor when as='a' + href", () => {
    render(
      <Sidebar>
        <Sidebar.Item as="a" href="/deployments">
          Deployments
        </Sidebar.Item>
      </Sidebar>,
    );
    const link = screen.getByRole("link", { name: "Deployments" });
    expect(link).toHaveAttribute("href", "/deployments");
  });

  it("shows count badge when count is provided", () => {
    render(
      <Sidebar>
        <Sidebar.Item count={3}>Deployments</Sidebar.Item>
      </Sidebar>,
    );
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("fires onClick on item activation", async () => {
    const user = userEvent.setup();
    const handle = vi.fn();
    render(
      <Sidebar>
        <Sidebar.Item onClick={handle}>Overview</Sidebar.Item>
      </Sidebar>,
    );
    await user.click(screen.getByRole("button", { name: "Overview" }));
    expect(handle).toHaveBeenCalledTimes(1);
  });
});
