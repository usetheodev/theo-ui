import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Input } from "../input/input.js";
import { FormField } from "./form-field.js";

describe("FormField", () => {
  it("auto-wires htmlFor / id between label and control", () => {
    render(
      <FormField>
        <FormField.Label>Email</FormField.Label>
        <FormField.Control>
          <Input placeholder="you@usetheo.dev" />
        </FormField.Control>
      </FormField>,
    );
    const label = screen.getByText("Email").closest("label");
    const input = screen.getByPlaceholderText("you@usetheo.dev");
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
});
