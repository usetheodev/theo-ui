import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { TopNav } from "./topnav.js";

describe("TopNav", () => {
  it("renders left / center / right slots", () => {
    render(
      <TopNav>
        <TopNav.Left>L</TopNav.Left>
        <TopNav.Center>C</TopNav.Center>
        <TopNav.Right>R</TopNav.Right>
      </TopNav>,
    );
    expect(screen.getByText("L")).toBeInTheDocument();
    expect(screen.getByText("C")).toBeInTheDocument();
    expect(screen.getByText("R")).toBeInTheDocument();
  });

  describe("Breadcrumbs", () => {
    it("renders all items with the last marked aria-current=page", () => {
      render(
        <TopNav.Breadcrumbs
          items={[
            { label: "acme", href: "/acme" },
            { label: "api", href: "/acme/api" },
            { label: "deployments" },
          ]}
        />,
      );
      expect(screen.getByRole("link", { name: "acme" })).toHaveAttribute("href", "/acme");
      expect(screen.getByRole("link", { name: "api" })).toHaveAttribute("href", "/acme/api");
      const current = screen.getByText("deployments");
      expect(current).toHaveAttribute("aria-current", "page");
    });

    it("does not render link for the last item even if href is provided", () => {
      render(
        <TopNav.Breadcrumbs
          items={[
            { label: "acme", href: "/acme" },
            { label: "api", href: "/acme/api" },
          ]}
        />,
      );
      // 'api' is last → rendered as span, not link
      expect(screen.queryByRole("link", { name: "api" })).not.toBeInTheDocument();
      expect(screen.getByText("api")).toHaveAttribute("aria-current", "page");
    });
  });

  describe("ModeSwitcher", () => {
    const allOptions = [
      { value: "chat", label: "Chat" },
      { value: "infra", label: "Infra" },
      { value: "code", label: "Code" },
    ];

    it("renders as radiogroup with aria-checked on the active option", () => {
      render(<TopNav.ModeSwitcher value="infra" options={allOptions} />);
      expect(screen.getByRole("radiogroup", { name: "Mode" })).toBeInTheDocument();
      expect(screen.getByRole("radio", { name: "Infra" })).toHaveAttribute("aria-checked", "true");
      expect(screen.getByRole("radio", { name: "Chat" })).toHaveAttribute("aria-checked", "false");
    });

    it("uses roving tabIndex (only active option has tabIndex=0)", () => {
      render(<TopNav.ModeSwitcher value="infra" options={allOptions} />);
      expect(screen.getByRole("radio", { name: "Infra" })).toHaveAttribute("tabIndex", "0");
      expect(screen.getByRole("radio", { name: "Chat" })).toHaveAttribute("tabIndex", "-1");
      expect(screen.getByRole("radio", { name: "Code" })).toHaveAttribute("tabIndex", "-1");
    });

    it("fires onChange with the clicked option value", async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(<TopNav.ModeSwitcher value="chat" options={allOptions} onChange={onChange} />);
      await user.click(screen.getByRole("radio", { name: "Code" }));
      expect(onChange).toHaveBeenCalledWith("code");
    });

    it("navigates with ArrowRight", async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(<TopNav.ModeSwitcher value="chat" options={allOptions} onChange={onChange} />);
      const group = screen.getByRole("radiogroup", { name: "Mode" });
      group.focus();
      await user.keyboard("{ArrowRight}");
      expect(onChange).toHaveBeenCalledWith("infra");
    });

    it("navigates with ArrowLeft (wraps to last)", async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(<TopNav.ModeSwitcher value="chat" options={allOptions} onChange={onChange} />);
      const group = screen.getByRole("radiogroup", { name: "Mode" });
      group.focus();
      await user.keyboard("{ArrowLeft}");
      expect(onChange).toHaveBeenCalledWith("code"); // wraps to last
    });

    it("handles Home and End keys", async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(<TopNav.ModeSwitcher value="infra" options={allOptions} onChange={onChange} />);
      const group = screen.getByRole("radiogroup", { name: "Mode" });
      group.focus();
      await user.keyboard("{End}");
      expect(onChange).toHaveBeenLastCalledWith("code");
      await user.keyboard("{Home}");
      expect(onChange).toHaveBeenLastCalledWith("chat");
    });

    it("has no axe accessibility violations", async () => {
      const { container } = render(
        <TopNav.ModeSwitcher value="chat" options={allOptions} onChange={() => undefined} />,
      );
      expect(await axe(container)).toHaveNoViolations();
    });
  });
});
