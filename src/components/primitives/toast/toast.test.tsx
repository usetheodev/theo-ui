import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Toast } from "./toast.js";
import { Toaster, useToast } from "./toaster.js";

import { expectNoA11yViolations } from "../../../test/a11y.js";
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

  it("has no a11y violations", async () => {
    await expectNoA11yViolations(
      <Toaster>
        <FireToast title="Deployed" description="Build #128 succeeded" variant="success" />
      </Toaster>,
    );
  });

  // HIGH-009 / T6.2: compound displayName chain.
  it("exposes correct displayName on root + subparts", () => {
    expect(Toast.displayName).toBe("Toast");
    expect(Toast.Title.displayName).toBe("Toast.Title");
    expect(Toast.Description.displayName).toBe("Toast.Description");
    expect(Toast.Close.displayName).toBe("Toast.Close");
    expect(Toast.Action.displayName).toBe("Toast.Action");
  });

  // T1.3 — size prop (theming-and-sizes plan)
  it("applies p-3 + text-body-sm when size='sm'", () => {
    render(
      <Toast.Provider>
        <Toast size="sm" open>
          <Toast.Title>tiny</Toast.Title>
        </Toast>
        <Toast.Viewport />
      </Toast.Provider>,
    );
    const root = screen.getByText("tiny").closest("[role=status],[role=alert],li");
    expect(root?.className ?? "").toMatch(/p-3/);
    expect(root?.className ?? "").toMatch(/text-body-sm/);
  });

  it("applies p-4 + text-body-md when size omitted (default md)", () => {
    render(
      <Toast.Provider>
        <Toast open>
          <Toast.Title>regular</Toast.Title>
        </Toast>
        <Toast.Viewport />
      </Toast.Provider>,
    );
    const root = screen.getByText("regular").closest("[role=status],[role=alert],li");
    expect(root?.className ?? "").toMatch(/p-4/);
    expect(root?.className ?? "").toMatch(/text-body-md/);
  });

  it("applies p-5 + text-body-lg when size='lg'", () => {
    render(
      <Toast.Provider>
        <Toast size="lg" open>
          <Toast.Title>banner</Toast.Title>
        </Toast>
        <Toast.Viewport />
      </Toast.Provider>,
    );
    const root = screen.getByText("banner").closest("[role=status],[role=alert],li");
    expect(root?.className ?? "").toMatch(/p-5/);
    expect(root?.className ?? "").toMatch(/text-body-lg/);
  });

  it("preserves variant when size is set", () => {
    render(
      <Toast.Provider>
        <Toast variant="destructive" size="sm" open>
          <Toast.Title>oops</Toast.Title>
        </Toast>
        <Toast.Viewport />
      </Toast.Provider>,
    );
    const root = screen.getByText("oops").closest("[role=status],[role=alert],li");
    expect(root?.className ?? "").toMatch(/border-destructive\/50/);
  });
});
