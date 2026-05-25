import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { PageShell } from "./page-shell.js";

describe("PageShell — header", () => {
  it("renders title and description", () => {
    render(<PageShell title="Domains" description="Manage custom domains." />);
    expect(screen.getByRole("heading", { name: "Domains" })).toBeInTheDocument();
    expect(screen.getByText("Manage custom domains.")).toBeInTheDocument();
  });

  it("renders ActionBar when search or primaryAction provided", () => {
    render(
      <PageShell
        title="x"
        search={{ placeholder: "search…", value: "", onChange: () => undefined }}
      />,
    );
    expect(screen.getByPlaceholderText("search…")).toBeInTheDocument();
  });

  it("ActionBar omitted when no search/action/filter", () => {
    render(<PageShell title="x" />);
    expect(screen.queryByPlaceholderText(/search/)).toBeNull();
  });
});

describe("PageShell — content states", () => {
  it("loading renders default spinner", () => {
    const { container } = render(<PageShell title="x" loading />);
    expect(container.innerHTML).toContain("animate-spin");
    expect(screen.getByText("Loading…")).toBeInTheDocument();
  });

  it("loading uses loadingNode when provided", () => {
    render(
      <PageShell title="x" loading loadingNode={<div>CUSTOM-LOADING</div>}>
        <div>children</div>
      </PageShell>,
    );
    expect(screen.getByText("CUSTOM-LOADING")).toBeInTheDocument();
    expect(screen.queryByText("children")).toBeNull();
  });

  it("error renders message and retry button", () => {
    const onRetry = vi.fn();
    render(
      <PageShell title="x" error={{ message: "Network failed", onRetry }}>
        <div>children</div>
      </PageShell>,
    );
    expect(screen.getByText("Network failed")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(onRetry).toHaveBeenCalled();
    expect(screen.queryByText("children")).toBeNull();
  });

  it("error renders docs link when provided", () => {
    render(
      <PageShell title="x" error={{ message: "Issue", docsHref: "https://docs.usetheo.dev" }} />,
    );
    expect(screen.getByRole("link", { name: "View docs" })).toHaveAttribute(
      "href",
      "https://docs.usetheo.dev",
    );
  });

  it("empty renders EmptyState", () => {
    render(
      <PageShell title="x" empty={{ title: "No data", description: "Add one to start." }}>
        <div>children</div>
      </PageShell>,
    );
    expect(screen.getByText("No data")).toBeInTheDocument();
    expect(screen.queryByText("children")).toBeNull();
  });

  it("children render when no state set", () => {
    render(
      <PageShell title="x">
        <div>CHILDREN-MARKER</div>
      </PageShell>,
    );
    expect(screen.getByText("CHILDREN-MARKER")).toBeInTheDocument();
  });

  it("state precedence: loading > error > empty > children", () => {
    render(
      <PageShell
        title="x"
        loading
        error={{ message: "ERR-MARKER" }}
        empty={{ title: "EMPTY-MARKER" }}
      >
        <div>CHILDREN-MARKER</div>
      </PageShell>,
    );
    // Only loading should render
    expect(screen.getByText("Loading…")).toBeInTheDocument();
    expect(screen.queryByText("ERR-MARKER")).toBeNull();
    expect(screen.queryByText("EMPTY-MARKER")).toBeNull();
    expect(screen.queryByText("CHILDREN-MARKER")).toBeNull();
  });
});

describe("PageShell — a11y + callbacks", () => {
  // EC-12: aria-busy on <main> when loading
  it("aria-busy on main when loading=true", () => {
    render(<PageShell title="x" loading />);
    expect(screen.getByRole("main")).toHaveAttribute("aria-busy", "true");
  });

  it("no aria-busy when not loading", () => {
    render(<PageShell title="x" />);
    expect(screen.getByRole("main")).not.toHaveAttribute("aria-busy");
  });

  // EC-13: onTitleChange identity stability
  it("onTitleChange fires once per title change (dedupe by value)", () => {
    const spy = vi.fn();
    const { rerender } = render(<PageShell title="A" onTitleChange={spy} />);
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenLastCalledWith("A");
    // Same title — should NOT re-fire
    rerender(<PageShell title="A" onTitleChange={spy} />);
    expect(spy).toHaveBeenCalledTimes(1);
    // Different title — fires
    rerender(<PageShell title="B" onTitleChange={spy} />);
    expect(spy).toHaveBeenCalledTimes(2);
    expect(spy).toHaveBeenLastCalledWith("B");
  });

  // EC-14: renders when children is null
  it("renders without crash when children is null", () => {
    expect(() => render(<PageShell title="x">{null}</PageShell>)).not.toThrow();
    expect(screen.getByRole("heading", { name: "x" })).toBeInTheDocument();
  });

  it("has no axe violations (full featured)", async () => {
    const { container } = render(
      <PageShell
        title="Domains"
        description="Manage custom domains."
        search={{ placeholder: "Search…", value: "", onChange: () => undefined }}
        primaryAction={{ label: "Add domain", onClick: () => undefined }}
      >
        <div>content</div>
      </PageShell>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
