import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Toast } from "./toast.js";
import { Toaster, useToast } from "./toaster.js";

function FireToast({
  variant,
  title,
  description,
}: {
  variant?: "default" | "info" | "success" | "warning" | "destructive";
  title?: string;
  description?: string;
}) {
  const { toast } = useToast();
  return (
    <button type="button" onClick={() => toast({ title, description, variant, duration: null })}>
      fire
    </button>
  );
}

describe("Toast", () => {
  it("exposes Title, Description, Close, Action subcomponents", () => {
    expect(Toast.Title).toBeDefined();
    expect(Toast.Description).toBeDefined();
    expect(Toast.Close).toBeDefined();
    expect(Toast.Action).toBeDefined();
    expect(Toast.Provider).toBeDefined();
    expect(Toast.Viewport).toBeDefined();
  });

  it("renders a toast title and description fired through useToast", async () => {
    const user = userEvent.setup();
    render(
      <Toaster>
        <FireToast title="Deployed" description="Build #128 succeeded" variant="success" />
      </Toaster>,
    );
    await user.click(screen.getByRole("button", { name: "fire" }));
    expect(await screen.findByText("Deployed")).toBeInTheDocument();
    expect(screen.getByText("Build #128 succeeded")).toBeInTheDocument();
  });

  it("throws when useToast is called outside <Toaster>", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() =>
      act(() => {
        render(<FireToast title="x" />);
      }),
    ).toThrow(/useToast must be used inside <Toaster>/);
    spy.mockRestore();
  });
});
