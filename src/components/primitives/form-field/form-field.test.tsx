import { render, screen } from "@testing-library/react";
import { createRef } from "react";
import { describe, expect, it, vi } from "vitest";
import { Input } from "../input/input.js";
import { FormField } from "./form-field.js";

import { expectNoA11yViolations } from "../../../test/a11y.js";
describe("FormField", () => {
  it("auto-wires htmlFor / id between label and control", () => {
    render(
      <FormField>
        <FormField.Label>Email</FormField.Label>
        <FormField.Control>
          <Input placeholder="you@theokit.dev" />
        </FormField.Control>
      </FormField>,
    );
    const label = screen.getByText("Email").closest("label");
    const input = screen.getByPlaceholderText("you@theokit.dev");
    expect(label).toHaveAttribute("for", input.id);
  });

  it("shows hint when not invalid", () => {
    render(
      <FormField>
        <FormField.Label>Email</FormField.Label>
        <FormField.Control>
          <Input />
        </FormField.Control>
        <FormField.Hint>We never share your email.</FormField.Hint>
      </FormField>,
    );
    expect(screen.getByText("We never share your email.")).toBeInTheDocument();
  });

  it("shows error and hides hint when invalid", () => {
    render(
      <FormField invalid>
        <FormField.Label>Email</FormField.Label>
        <FormField.Control>
          <Input />
        </FormField.Control>
        <FormField.Hint>We never share your email.</FormField.Hint>
        <FormField.Error>Required.</FormField.Error>
      </FormField>,
    );
    expect(screen.queryByText("We never share your email.")).not.toBeInTheDocument();
    expect(screen.getByText("Required.")).toBeInTheDocument();
  });

  it("sets aria-invalid on the control when invalid", () => {
    render(
      <FormField invalid>
        <FormField.Label>Email</FormField.Label>
        <FormField.Control>
          <Input placeholder="email" />
        </FormField.Control>
      </FormField>,
    );
    expect(screen.getByPlaceholderText("email")).toHaveAttribute("aria-invalid", "true");
  });

  // HIGH-005 regression: previous spread implementation silently dropped `ref`
  // because it copied the element shape without honoring React's ref slot.
  // `cloneElement` preserves it.
  it("forwards ref through FormField.Control to the child input", () => {
    const ref = createRef<HTMLInputElement>();
    render(
      <FormField>
        <FormField.Label>Email</FormField.Label>
        <FormField.Control>
          <Input ref={ref} placeholder="ref-target" />
        </FormField.Control>
      </FormField>,
    );
    expect(ref.current).not.toBeNull();
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
    expect(ref.current).toBe(screen.getByPlaceholderText("ref-target"));
  });

  it("throws when FormField.Control has zero children", () => {
    // Children.only emits a React warning + throws.
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() =>
      render(
        <FormField>
          <FormField.Label>Empty</FormField.Label>
          <FormField.Control>{null}</FormField.Control>
        </FormField>,
      ),
    ).toThrow();
    consoleError.mockRestore();
  });

  it("throws when FormField.Control has multiple children", () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() =>
      render(
        <FormField>
          <FormField.Label>Two</FormField.Label>
          <FormField.Control>
            <Input placeholder="a" />
            <Input placeholder="b" />
          </FormField.Control>
        </FormField>,
      ),
    ).toThrow();
    consoleError.mockRestore();
  });

  it("has no a11y violations", async () => {
    await expectNoA11yViolations(
      <FormField>
        <FormField.Label>Email</FormField.Label>
        <FormField.Control>
          <Input placeholder="you@theokit.dev" />
        </FormField.Control>
      </FormField>,
    );
  });

  // HIGH-009 / T6.2: compound displayName chain.
  it("exposes correct displayName on root + subparts", () => {
    expect(FormField.displayName).toBe("FormField");
    expect(FormField.Label.displayName).toBe("FormField.Label");
    expect(FormField.Control.displayName).toBe("FormField.Control");
    expect(FormField.Hint.displayName).toBe("FormField.Hint");
    expect(FormField.Error.displayName).toBe("FormField.Error");
  });

  // T1.7 — size prop (theming-and-sizes plan)
  it("applies text-label-caps + gap-1 when size='sm'", () => {
    render(
      <FormField size="sm">
        <FormField.Label>L</FormField.Label>
        <FormField.Control>
          <Input placeholder="x" />
        </FormField.Control>
      </FormField>,
    );
    const label = screen.getByText("L").closest("label");
    expect(label?.className ?? "").toContain("text-label-caps");
    const root = label?.parentElement;
    expect(root?.className ?? "").toContain("gap-1");
  });

  it("applies text-body-sm + gap-1.5 when size omitted (default md)", () => {
    render(
      <FormField>
        <FormField.Label>L</FormField.Label>
        <FormField.Control>
          <Input placeholder="x" />
        </FormField.Control>
      </FormField>,
    );
    const label = screen.getByText("L").closest("label");
    expect(label?.className ?? "").toContain("text-body-sm");
    expect(label?.parentElement?.className ?? "").toContain("gap-1.5");
  });

  it("applies text-body-md + gap-2 when size='lg'", () => {
    render(
      <FormField size="lg">
        <FormField.Label>L</FormField.Label>
        <FormField.Control>
          <Input placeholder="x" />
        </FormField.Control>
      </FormField>,
    );
    const label = screen.getByText("L").closest("label");
    expect(label?.className ?? "").toContain("text-body-md");
    expect(label?.parentElement?.className ?? "").toContain("gap-2");
  });

  it("propagates size to Hint", () => {
    render(
      <FormField size="lg">
        <FormField.Label>L</FormField.Label>
        <FormField.Control>
          <Input placeholder="x" />
        </FormField.Control>
        <FormField.Hint>H</FormField.Hint>
      </FormField>,
    );
    expect(screen.getByText("H").className).toContain("text-body-md");
  });
});
