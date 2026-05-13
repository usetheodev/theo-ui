import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { auroraTerminal } from "./aurora-terminal.js";
import { classicPaper } from "./classic-paper.js";
import { ThemeProvider, useTheme } from "./theme-provider.js";

function Inspector() {
  const { theme, mode, themes, setTheme, toggleMode } = useTheme();
  return (
    <div>
      <p data-testid="theme">{theme.name}</p>
      <p data-testid="mode">{mode}</p>
      <p data-testid="count">{themes.length}</p>
      <button type="button" onClick={() => setTheme("classic-paper")}>
        switch
      </button>
      <button type="button" onClick={toggleMode}>
        toggle
      </button>
    </div>
  );
}

describe("ThemeProvider", () => {
  it("defaults to violet-forge in light mode", () => {
    render(
      <ThemeProvider storageKey={null}>
        <Inspector />
      </ThemeProvider>,
    );
    expect(screen.getByTestId("theme")).toHaveTextContent("violet-forge");
    expect(screen.getByTestId("mode")).toHaveTextContent("light");
  });

  it("always exposes violet-forge even if not passed in themes", () => {
    render(
      <ThemeProvider themes={[classicPaper]} storageKey={null}>
        <Inspector />
      </ThemeProvider>,
    );
    // violet-forge + classic-paper = 2
    expect(screen.getByTestId("count")).toHaveTextContent("2");
  });

  it("accepts a defaultTheme override", () => {
    render(
      <ThemeProvider
        themes={[classicPaper, auroraTerminal]}
        defaultTheme="aurora-terminal"
        storageKey={null}
      >
        <Inspector />
      </ThemeProvider>,
    );
    expect(screen.getByTestId("theme")).toHaveTextContent("aurora-terminal");
  });

  it("setTheme swaps the active theme", async () => {
    const user = userEvent.setup();
    render(
      <ThemeProvider themes={[classicPaper]} storageKey={null}>
        <Inspector />
      </ThemeProvider>,
    );
    await user.click(screen.getByRole("button", { name: "switch" }));
    expect(screen.getByTestId("theme")).toHaveTextContent("classic-paper");
  });

  it("toggleMode flips light <> dark", async () => {
    const user = userEvent.setup();
    render(
      <ThemeProvider storageKey={null}>
        <Inspector />
      </ThemeProvider>,
    );
    expect(screen.getByTestId("mode")).toHaveTextContent("light");
    await user.click(screen.getByRole("button", { name: "toggle" }));
    expect(screen.getByTestId("mode")).toHaveTextContent("dark");
  });

  it("applies data-theme and data-mode on <html>", () => {
    render(
      <ThemeProvider themes={[classicPaper]} defaultTheme="classic-paper" storageKey={null}>
        <Inspector />
      </ThemeProvider>,
    );
    expect(document.documentElement.getAttribute("data-theme")).toBe("classic-paper");
    expect(document.documentElement.getAttribute("data-mode")).toBe("light");
  });

  it("injects a style block with CSS vars for each theme", () => {
    render(
      <ThemeProvider themes={[classicPaper, auroraTerminal]} storageKey={null}>
        <Inspector />
      </ThemeProvider>,
    );
    const style = document.getElementById("theo-ui-theme-vars");
    expect(style).not.toBeNull();
    expect(style?.textContent ?? "").toContain('[data-theme="violet-forge"]');
    expect(style?.textContent ?? "").toContain('[data-theme="classic-paper"]');
    expect(style?.textContent ?? "").toContain('[data-theme="aurora-terminal"]');
    expect(style?.textContent ?? "").toContain("--primary:");
    expect(style?.textContent ?? "").toContain("--font-display:");
  });

  it("useTheme throws outside the provider", () => {
    const Bare = () => {
      useTheme();
      return null;
    };
    // suppress expected error noise
    const spy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    expect(() => render(<Bare />)).toThrow(/useTheme must be used inside/);
    spy.mockRestore();
  });
});

import { vi } from "vitest";
