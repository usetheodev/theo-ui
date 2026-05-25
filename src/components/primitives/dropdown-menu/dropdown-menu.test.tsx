import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { DropdownMenu } from "./dropdown-menu.js";

function renderMenu(onSelect?: () => void) {
  return {
    user: userEvent.setup(),
    ...render(
      <DropdownMenu>
        <DropdownMenu.Trigger>Open</DropdownMenu.Trigger>
        <DropdownMenu.Content>
          <DropdownMenu.Label>Section</DropdownMenu.Label>
          <DropdownMenu.Item onSelect={onSelect}>Edit</DropdownMenu.Item>
          <DropdownMenu.Separator />
          <DropdownMenu.Item>Delete</DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu>,
    ),
  };
}

describe("DropdownMenu", () => {
  it("renders trigger button", () => {
    renderMenu();
    expect(screen.getByRole("button", { name: "Open" })).toBeInTheDocument();
  });

  it("opens content on click", async () => {
    const { user } = renderMenu();
    await user.click(screen.getByRole("button", { name: "Open" }));
    expect(await screen.findByText("Edit")).toBeInTheDocument();
    expect(screen.getByText("Delete")).toBeInTheDocument();
  });

  it("item onSelect fires when clicked", async () => {
    const onSelect = vi.fn();
    const { user } = renderMenu(onSelect);
    await user.click(screen.getByRole("button", { name: "Open" }));
    await user.click(await screen.findByText("Edit"));
    expect(onSelect).toHaveBeenCalled();
  });

  it("escape closes content", async () => {
    const { user } = renderMenu();
    await user.click(screen.getByRole("button", { name: "Open" }));
    expect(await screen.findByText("Edit")).toBeInTheDocument();
    await user.keyboard("{Escape}");
    expect(screen.queryByText("Edit")).toBeNull();
  });

  // EC-2: SSR safety
  it("ssr-safe (no crash with renderToString)", () => {
    expect(() =>
      renderToString(
        <DropdownMenu>
          <DropdownMenu.Trigger>Open</DropdownMenu.Trigger>
        </DropdownMenu>,
      ),
    ).not.toThrow();
  });

  it("has no axe violations", async () => {
    const { user, baseElement } = renderMenu();
    await user.click(screen.getByRole("button", { name: "Open" }));
    await screen.findByText("Edit");
    // Radix focus-guard spans intentionally violate aria-hidden-focus;
    // same workaround used in confirm-dialog.test.tsx and command-palette.test.tsx.
    expect(
      await axe(baseElement, {
        rules: {
          "aria-hidden-focus": { enabled: false },
          // Radix Portal renders outside the user's landmark structure;
          // consumer is responsible for placing the trigger inside a
          // <main> or other landmark. Test fixture has no landmarks.
          region: { enabled: false },
        },
      }),
    ).toHaveNoViolations();
  });
});
