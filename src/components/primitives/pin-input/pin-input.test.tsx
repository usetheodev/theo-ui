import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { PinInput, type PinInputProps } from "./pin-input.js";

function Controlled({
  initialValue = "",
  onCompleteSpy,
  "aria-label": ariaLabel = "Test PIN",
  ...rest
}: { initialValue?: string; onCompleteSpy?: (v: string) => void } & Partial<
  Omit<PinInputProps, "value" | "onChange" | "onComplete">
>) {
  const [v, setV] = useState(initialValue);
  return (
    <PinInput
      value={v}
      onChange={setV}
      onComplete={onCompleteSpy}
      aria-label={ariaLabel}
      {...rest}
    />
  );
}

describe("PinInput — composition", () => {
  it("renders N slots per length prop", () => {
    render(<Controlled length={4} />);
    const inputs = screen.getAllByRole("textbox");
    expect(inputs).toHaveLength(4);
  });

  it("default length is 6", () => {
    render(<Controlled />);
    expect(screen.getAllByRole("textbox")).toHaveLength(6);
  });

  it("slots have aria-label 'Digit N of M'", () => {
    render(<Controlled length={4} />);
    expect(screen.getByLabelText("Digit 1 of 4")).toBeInTheDocument();
    expect(screen.getByLabelText("Digit 4 of 4")).toBeInTheDocument();
  });
});

describe("PinInput — input + focus", () => {
  it("auto-advances focus on digit input", () => {
    render(<Controlled length={4} />);
    const inputs = screen.getAllByRole("textbox") as HTMLInputElement[];
    inputs[0]?.focus();
    fireEvent.change(inputs[0] as HTMLInputElement, { target: { value: "1" } });
    expect(document.activeElement).toBe(inputs[1]);
  });

  it("backspace clears current slot", () => {
    render(<Controlled length={4} initialValue="12" />);
    const inputs = screen.getAllByRole("textbox") as HTMLInputElement[];
    inputs[1]?.focus();
    fireEvent.keyDown(inputs[1] as HTMLInputElement, { key: "Backspace" });
    expect((inputs[1] as HTMLInputElement).value).toBe("");
    expect((inputs[0] as HTMLInputElement).value).toBe("1");
  });

  it("backspace on empty moves focus back", () => {
    render(<Controlled length={4} initialValue="1" />);
    const inputs = screen.getAllByRole("textbox") as HTMLInputElement[];
    inputs[1]?.focus();
    fireEvent.keyDown(inputs[1] as HTMLInputElement, { key: "Backspace" });
    expect(document.activeElement).toBe(inputs[0]);
  });
});

describe("PinInput — paste", () => {
  it("fills all slots from clipboard", () => {
    render(<Controlled length={6} />);
    const inputs = screen.getAllByRole("textbox") as HTMLInputElement[];
    inputs[0]?.focus();
    fireEvent.paste(inputs[0] as HTMLInputElement, {
      clipboardData: { getData: () => "123456" },
    });
    expect(inputs.map((i) => i.value).join("")).toBe("123456");
  });

  it("strips whitespace from pasted value", () => {
    render(<Controlled length={6} />);
    const inputs = screen.getAllByRole("textbox") as HTMLInputElement[];
    inputs[0]?.focus();
    fireEvent.paste(inputs[0] as HTMLInputElement, {
      clipboardData: { getData: () => "12 34 56" },
    });
    expect(inputs.map((i) => i.value).join("")).toBe("123456");
  });

  it("paste truncates excess characters to length", () => {
    render(<Controlled length={6} />);
    const inputs = screen.getAllByRole("textbox") as HTMLInputElement[];
    inputs[0]?.focus();
    fireEvent.paste(inputs[0] as HTMLInputElement, {
      clipboardData: { getData: () => "1234567" },
    });
    expect(inputs.map((i) => i.value).join("")).toBe("123456");
  });

  it("paste from middle slot fills from current onwards when prior slots filled", () => {
    // EC-5: paste-from-middle convention. When prior slots are already
    // filled, paste at slot N writes into N onwards. This preserves
    // positional information.
    render(<Controlled length={6} initialValue="12" />);
    const inputs = screen.getAllByRole("textbox") as HTMLInputElement[];
    inputs[2]?.focus();
    fireEvent.paste(inputs[2] as HTMLInputElement, {
      clipboardData: { getData: () => "345" },
    });
    expect(inputs[0]?.value).toBe("1");
    expect(inputs[1]?.value).toBe("2");
    expect(inputs[2]?.value).toBe("3");
    expect(inputs[3]?.value).toBe("4");
    expect(inputs[4]?.value).toBe("5");
  });
});

describe("PinInput — onComplete", () => {
  it("onComplete fires once when reaching length", () => {
    const spy = vi.fn();
    render(<Controlled length={4} onCompleteSpy={spy} />);
    const inputs = screen.getAllByRole("textbox") as HTMLInputElement[];
    inputs[0]?.focus();
    fireEvent.paste(inputs[0] as HTMLInputElement, {
      clipboardData: { getData: () => "1234" },
    });
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith("1234");
  });

  // EC-3: onComplete should NOT fire on mount when value already complete
  it("does NOT fire on mount when value is already complete", () => {
    const spy = vi.fn();
    render(
      <PinInput
        length={4}
        value="1234"
        onChange={() => undefined}
        onComplete={spy}
        aria-label="Pre-filled"
      />,
    );
    expect(spy).not.toHaveBeenCalled();
  });
});

describe("PinInput — inputMode + mask + error + disabled", () => {
  it("numeric inputMode strips non-digits on change", () => {
    render(<Controlled length={4} inputMode="numeric" />);
    const inputs = screen.getAllByRole("textbox") as HTMLInputElement[];
    inputs[0]?.focus();
    fireEvent.change(inputs[0] as HTMLInputElement, { target: { value: "a" } });
    expect(inputs[0]?.value).toBe("");
  });

  it("mask renders bullets for filled slots", () => {
    render(<Controlled length={4} initialValue="12" mask />);
    const inputs = screen.getAllByRole("textbox") as HTMLInputElement[];
    expect(inputs[0]?.value).toBe("•");
    expect(inputs[1]?.value).toBe("•");
    expect(inputs[2]?.value).toBe("");
  });

  it("error applies destructive border", () => {
    const { container } = render(<Controlled length={4} error />);
    expect(container.innerHTML).toContain("border-destructive");
  });

  // EC-4: disabled blocks typing
  it("disabled blocks typing and paste", () => {
    const onChange = vi.fn();
    render(<PinInput length={4} value="" onChange={onChange} disabled aria-label="Disabled PIN" />);
    const inputs = screen.getAllByRole("textbox") as HTMLInputElement[];
    expect(inputs[0]).toBeDisabled();
    fireEvent.keyDown(inputs[0] as HTMLInputElement, { key: "Backspace" });
    expect(onChange).not.toHaveBeenCalled();
  });
});

describe("PinInput — a11y", () => {
  it("has no axe violations", async () => {
    const { container } = render(<Controlled length={6} />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
