import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { ConfirmDialog } from "./confirm-dialog.js";

function basicProps(overrides: Partial<React.ComponentProps<typeof ConfirmDialog>> = {}) {
  return {
    open: true,
    onOpenChange: vi.fn(),
    title: "Delete project",
    description: "This cannot be undone.",
    onConfirm: vi.fn(),
    ...overrides,
  };
}

describe("ConfirmDialog — focus + close", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("auto-focuses Cancel on open", async () => {
    render(<ConfirmDialog {...basicProps()} />);
    await waitFor(() => {
      const cancel = screen.getByRole("button", { name: "Cancel" });
      expect(document.activeElement).toBe(cancel);
    });
  });

  it("Escape calls onOpenChange(false)", () => {
    const props = basicProps();
    render(<ConfirmDialog {...props} />);
    fireEvent.keyDown(document.body, { key: "Escape" });
    expect(props.onOpenChange).toHaveBeenCalledWith(false);
  });
});

describe("ConfirmDialog — intent + phrase", () => {
  it("destructive intent applies destructive variant class", () => {
    render(<ConfirmDialog {...basicProps()} intent="destructive" />);
    const confirm = screen.getByRole("button", { name: "Confirm" });
    expect(confirm.className).toMatch(/destructive/);
  });

  it("confirmation phrase disables confirm until exact match", () => {
    render(<ConfirmDialog {...basicProps()} confirmationPhrase="delete" />);
    const confirm = screen.getByRole("button", { name: "Confirm" });
    expect(confirm).toBeDisabled();
    const input = screen.getByLabelText("Confirmation phrase") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "delete" } });
    expect(confirm).not.toBeDisabled();
  });

  it("phrase is case-sensitive", () => {
    render(<ConfirmDialog {...basicProps()} confirmationPhrase="delete" />);
    const input = screen.getByLabelText("Confirmation phrase") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "DELETE" } });
    expect(screen.getByRole("button", { name: "Confirm" })).toBeDisabled();
  });

  // EC-9: empty phrase treated as no phrase
  it("empty phrase string is treated as no phrase (confirm enabled)", () => {
    render(<ConfirmDialog {...basicProps()} confirmationPhrase="" />);
    // No input rendered when phrase is empty
    expect(screen.queryByLabelText("Confirmation phrase")).toBeNull();
    expect(screen.getByRole("button", { name: "Confirm" })).not.toBeDisabled();
  });

  // EC-10: Enter in input triggers confirm when matched
  it("Enter in input triggers confirm when matched", async () => {
    const props = basicProps({ confirmationPhrase: "delete" });
    render(<ConfirmDialog {...props} />);
    const input = screen.getByLabelText("Confirmation phrase") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "delete" } });
    fireEvent.keyDown(input, { key: "Enter" });
    await waitFor(() => expect(props.onConfirm).toHaveBeenCalled());
  });
});

describe("ConfirmDialog — async + loading", () => {
  it("loading=true disables both buttons", () => {
    render(<ConfirmDialog {...basicProps()} loading />);
    expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Confirm" })).toBeDisabled();
  });

  it("async onConfirm resolve closes the dialog", async () => {
    const props = basicProps({ onConfirm: () => Promise.resolve() });
    render(<ConfirmDialog {...props} />);
    fireEvent.click(screen.getByRole("button", { name: "Confirm" }));
    await waitFor(() => expect(props.onOpenChange).toHaveBeenCalledWith(false));
  });

  it("async onConfirm reject keeps dialog open", async () => {
    const props = basicProps({ onConfirm: () => Promise.reject(new Error("nope")) });
    render(<ConfirmDialog {...props} />);
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Confirm" }));
    });
    expect(props.onOpenChange).not.toHaveBeenCalledWith(false);
  });

  it("loader icon shown during loading", () => {
    const { baseElement } = render(<ConfirmDialog {...basicProps()} loading />);
    expect(baseElement.innerHTML).toContain("animate-spin");
  });

  it("phrase resets on close", () => {
    const props = basicProps({ confirmationPhrase: "go" });
    const { rerender } = render(<ConfirmDialog {...props} />);
    const input = screen.getByLabelText("Confirmation phrase") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "go" } });
    expect(input.value).toBe("go");
    rerender(<ConfirmDialog {...props} open={false} />);
    rerender(<ConfirmDialog {...props} open={true} />);
    const reopened = screen.getByLabelText("Confirmation phrase") as HTMLInputElement;
    expect(reopened.value).toBe("");
  });
});

describe("ConfirmDialog — a11y", () => {
  it("has no axe violations (default)", async () => {
    const { baseElement } = render(<ConfirmDialog {...basicProps()} />);
    // Radix Dialog's focus-guard spans intentionally violate aria-hidden-focus
    // (tabindex=0 on aria-hidden element) for its own focus management. Same
    // workaround used by CommandPalette tests.
    expect(
      await axe(baseElement, {
        rules: { "aria-hidden-focus": { enabled: false } },
      }),
    ).toHaveNoViolations();
  });
});
