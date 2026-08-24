import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { injectDensityCss, useDensity } from "./density.js";
import { ThemeProvider } from "./theme-provider.js";
import { violetForge } from "./violet-forge.js";

function Inspector() {
  const { density, setDensity } = useDensity();
  return (
    <div>
      <p data-testid="density">{density}</p>
      <button type="button" onClick={() => setDensity("compact")}>
        compact
      </button>
      <button type="button" onClick={() => setDensity("spacious")}>
        spacious
      </button>
    </div>
  );
}

describe("useDensity / ThemeProvider density wiring", () => {
  beforeEach(() => {
    document.documentElement.removeAttribute("data-density");
    document.getElementById("theo-ui-density-vars")?.remove();
    window.localStorage.clear();
  });

  afterEach(() => {
    document.documentElement.removeAttribute("data-density");
    document.getElementById("theo-ui-density-vars")?.remove();
  });

  it("defaults to comfortable when no defaultDensity is passed", () => {
    render(
      <ThemeProvider themes={[violetForge]} storageKey={null}>
        <Inspector />
      </ThemeProvider>,
    );
    expect(screen.getByTestId("density")).toHaveTextContent("comfortable");
    expect(document.documentElement.getAttribute("data-density")).toBe("comfortable");
  });

  it("honors defaultDensity prop", () => {
    render(
      <ThemeProvider themes={[violetForge]} defaultDensity="compact" storageKey={null}>
        <Inspector />
      </ThemeProvider>,
    );
    expect(screen.getByTestId("density")).toHaveTextContent("compact");
    expect(document.documentElement.getAttribute("data-density")).toBe("compact");
  });

  it("setDensity updates the data-attribute on <html>", async () => {
    const user = userEvent.setup();
    render(
      <ThemeProvider themes={[violetForge]} storageKey={null}>
        <Inspector />
      </ThemeProvider>,
    );
    await user.click(screen.getByText("compact"));
    expect(document.documentElement.getAttribute("data-density")).toBe("compact");
    await user.click(screen.getByText("spacious"));
    expect(document.documentElement.getAttribute("data-density")).toBe("spacious");
  });

  it("useDensity throws outside <ThemeProvider>", () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<Inspector />)).toThrow(/useDensity must be used inside/);
    consoleError.mockRestore();
  });

  it("persists density to localStorage when storageKey is set", async () => {
    const user = userEvent.setup();
    render(
      <ThemeProvider themes={[violetForge]} storageKey="theo-ui:test">
        <Inspector />
      </ThemeProvider>,
    );
    await user.click(screen.getByText("compact"));
    expect(window.localStorage.getItem("theo-ui:test:density")).toBe("compact");
  });

  it("reads persisted density on mount", () => {
    window.localStorage.setItem("theo-ui:test:density", "spacious");
    render(
      <ThemeProvider themes={[violetForge]} storageKey="theo-ui:test">
        <Inspector />
      </ThemeProvider>,
    );
    expect(screen.getByTestId("density")).toHaveTextContent("spacious");
  });

  // EC-3 — Safari private mode: localStorage throws on set. State must
  // still update in memory; provider must not crash.
  it("survives localStorage.setItem throw (Safari private mode)", async () => {
    const consoleWarn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const setItemSpy = vi.spyOn(window.localStorage.__proto__, "setItem").mockImplementation(() => {
      throw new Error("QuotaExceededError");
    });
    const user = userEvent.setup();
    render(
      <ThemeProvider themes={[violetForge]} storageKey="theo-ui:test">
        <Inspector />
      </ThemeProvider>,
    );
    await act(async () => {
      await user.click(screen.getByText("compact"));
    });
    // In-memory state still flipped.
    expect(screen.getByTestId("density")).toHaveTextContent("compact");
    setItemSpy.mockRestore();
    consoleWarn.mockRestore();
  });

  it("injectDensityCss creates the <style id='theo-ui-density-vars'> block (idempotent)", () => {
    expect(document.getElementById("theo-ui-density-vars")).toBeNull();
    const firstResult = injectDensityCss();
    expect(firstResult).toBe(true);
    const style = document.getElementById("theo-ui-density-vars");
    expect(style).not.toBeNull();
    expect(style?.textContent).toContain('[data-density="compact"]');
    expect(style?.textContent).toContain("--theo-control-h: 2rem");
    expect(style?.textContent).toContain('[data-density="comfortable"]');
    expect(style?.textContent).toContain("--theo-control-h: 2.25rem");
    expect(style?.textContent).toContain('[data-density="spacious"]');
    expect(style?.textContent).toContain("--theo-control-h: 2.75rem");
    // Second call is no-op (idempotent).
    expect(injectDensityCss()).toBe(false);
  });
});
