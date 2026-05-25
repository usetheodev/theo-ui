import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { auroraTerminal } from "./aurora-terminal.js";
import { classicPaper } from "./classic-paper.js";
import { builtinThemes } from "./index.js";
import { ThemeProvider, useTheme } from "./theme-provider.js";
import { violetForge } from "./violet-forge.js";

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
  it("defaults to violet-forge in dark mode (dark-first) when builtinThemes passed", () => {
    render(
      <ThemeProvider themes={builtinThemes} storageKey={null}>
        <Inspector />
      </ThemeProvider>,
    );
    expect(screen.getByTestId("theme")).toHaveTextContent("violet-forge");
    expect(screen.getByTestId("mode")).toHaveTextContent("dark");
  });

  it("accepts defaultMode='light' explicitly", () => {
    render(
      <ThemeProvider themes={builtinThemes} defaultMode="light" storageKey={null}>
        <Inspector />
      </ThemeProvider>,
    );
    expect(screen.getByTestId("mode")).toHaveTextContent("light");
  });

  it("uses only the themes passed (T2.5 — decoupled from violet-forge)", () => {
    render(
      <ThemeProvider themes={[classicPaper]} defaultTheme="classic-paper" storageKey={null}>
        <Inspector />
      </ThemeProvider>,
    );
    expect(screen.getByTestId("count")).toHaveTextContent("1");
    expect(screen.getByTestId("theme")).toHaveTextContent("classic-paper");
  });

  it("does not inject violet-forge CSS vars when not in themes (T2.5)", () => {
    render(
      <ThemeProvider themes={[classicPaper]} defaultTheme="classic-paper" storageKey={null}>
        <Inspector />
      </ThemeProvider>,
    );
    const style = document.getElementById("theo-ui-theme-vars");
    expect(style?.textContent ?? "").not.toContain('[data-theme="violet-forge"]');
    expect(style?.textContent ?? "").toContain('[data-theme="classic-paper"]');
  });

  it("throws a helpful error when themes is empty (T2.5)", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    expect(() =>
      render(
        <ThemeProvider themes={[]} storageKey={null}>
          <Inspector />
        </ThemeProvider>,
      ),
    ).toThrow(/requires the `themes` prop with at least one Theme/);
    spy.mockRestore();
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
      <ThemeProvider themes={[violetForge, classicPaper]} storageKey={null}>
        <Inspector />
      </ThemeProvider>,
    );
    await user.click(screen.getByRole("button", { name: "switch" }));
    expect(screen.getByTestId("theme")).toHaveTextContent("classic-paper");
  });

  it("toggleMode flips dark <> light", async () => {
    const user = userEvent.setup();
    render(
      <ThemeProvider themes={builtinThemes} storageKey={null}>
        <Inspector />
      </ThemeProvider>,
    );
    expect(screen.getByTestId("mode")).toHaveTextContent("dark");
    await user.click(screen.getByRole("button", { name: "toggle" }));
    expect(screen.getByTestId("mode")).toHaveTextContent("light");
  });

  it("applies data-theme and data-mode on <html>", () => {
    render(
      <ThemeProvider
        themes={[classicPaper]}
        defaultTheme="classic-paper"
        defaultMode="light"
        storageKey={null}
      >
        <Inspector />
      </ThemeProvider>,
    );
    expect(document.documentElement.getAttribute("data-theme")).toBe("classic-paper");
    expect(document.documentElement.getAttribute("data-mode")).toBe("light");
  });

  it("re-syncs when themes prop changes between renders", () => {
    const { rerender } = render(
      <ThemeProvider themes={[classicPaper]} defaultTheme="classic-paper" storageKey={null}>
        <Inspector />
      </ThemeProvider>,
    );
    expect(screen.getByTestId("count")).toHaveTextContent("1");
    rerender(
      <ThemeProvider
        themes={[classicPaper, auroraTerminal]}
        defaultTheme="classic-paper"
        storageKey={null}
      >
        <Inspector />
      </ThemeProvider>,
    );
    expect(screen.getByTestId("count")).toHaveTextContent("2");
  });

  it("injects a style block with CSS vars for each theme", () => {
    render(
      <ThemeProvider
        themes={[classicPaper, auroraTerminal]}
        defaultTheme="classic-paper"
        storageKey={null}
      >
        <Inspector />
      </ThemeProvider>,
    );
    const style = document.getElementById("theo-ui-theme-vars");
    expect(style).not.toBeNull();
    expect(style?.textContent ?? "").toContain('[data-theme="classic-paper"]');
    expect(style?.textContent ?? "").toContain('[data-theme="aurora-terminal"]');
    expect(style?.textContent ?? "").toContain("--primary:");
    expect(style?.textContent ?? "").toContain("--font-display:");
  });

  it("rejects color value that smuggles closing brace (T3.2 / SEC-001)", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const malicious: typeof classicPaper = {
      ...classicPaper,
      light: {
        ...classicPaper.light,
        background: "red; } body { background: red",
      },
    };
    expect(() =>
      render(
        <ThemeProvider themes={[malicious]} defaultTheme={classicPaper.name} storageKey={null}>
          <Inspector />
        </ThemeProvider>,
      ),
    ).toThrow(/invalid color "background" value/);
    spy.mockRestore();
  });

  it("rejects font family that smuggles url() (T3.2 / SEC-001)", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const malicious: typeof classicPaper = {
      ...classicPaper,
      fonts: {
        ...classicPaper.fonts,
        display: "url(https://attacker.example/exfil)",
      },
    };
    expect(() =>
      render(
        <ThemeProvider themes={[malicious]} defaultTheme={classicPaper.name} storageKey={null}>
          <Inspector />
        </ThemeProvider>,
      ),
    ).toThrow(/invalid fontFamily "display" value/);
    spy.mockRestore();
  });

  it("rejects theme name that breaks out of attribute selector (T3.2 / SEC-001)", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const malicious: typeof classicPaper = {
      ...classicPaper,
      name: 'foo" }',
    };
    expect(() =>
      render(
        <ThemeProvider themes={[malicious]} defaultTheme='foo" }' storageKey={null}>
          <Inspector />
        </ThemeProvider>,
      ),
    ).toThrow(/invalid theme.name/);
    spy.mockRestore();
  });

  it("useTheme throws outside the provider", () => {
    const Bare = () => {
      useTheme();
      return null;
    };
    const spy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    expect(() => render(<Bare />)).toThrow(/useTheme must be used inside/);
    spy.mockRestore();
  });

  describe("localStorage persistence (T5.1)", () => {
    const STORAGE_KEY = "test-ui:theme";

    beforeEach(() => {
      window.localStorage.clear();
    });

    afterEach(() => {
      window.localStorage.clear();
      vi.restoreAllMocks();
    });

    it("reads initial theme name from localStorage", () => {
      window.localStorage.setItem(`${STORAGE_KEY}:name`, "classic-paper");
      render(
        <ThemeProvider themes={builtinThemes} storageKey={STORAGE_KEY}>
          <Inspector />
        </ThemeProvider>,
      );
      expect(screen.getByTestId("theme")).toHaveTextContent("classic-paper");
    });

    it("reads initial mode from localStorage", () => {
      window.localStorage.setItem(`${STORAGE_KEY}:mode`, "light");
      render(
        <ThemeProvider themes={builtinThemes} storageKey={STORAGE_KEY}>
          <Inspector />
        </ThemeProvider>,
      );
      expect(screen.getByTestId("mode")).toHaveTextContent("light");
    });

    it("persists theme + mode on toggleMode", async () => {
      const user = userEvent.setup();
      render(
        <ThemeProvider themes={builtinThemes} storageKey={STORAGE_KEY}>
          <Inspector />
        </ThemeProvider>,
      );
      await user.click(screen.getByRole("button", { name: "toggle" }));
      expect(window.localStorage.getItem(`${STORAGE_KEY}:mode`)).toBe("light");
      expect(window.localStorage.getItem(`${STORAGE_KEY}:name`)).toBe("violet-forge");
    });

    it("persists theme name on setTheme (Test NEW-A from re-audit)", async () => {
      const user = userEvent.setup();
      render(
        <ThemeProvider themes={builtinThemes} storageKey={STORAGE_KEY}>
          <Inspector />
        </ThemeProvider>,
      );
      await user.click(screen.getByRole("button", { name: "switch" }));
      expect(window.localStorage.getItem(`${STORAGE_KEY}:name`)).toBe("classic-paper");
    });

    it("falls back to defaults if localStorage.getItem throws", () => {
      const getSpy = vi.spyOn(window.localStorage.__proto__, "getItem").mockImplementation(() => {
        throw new Error("SecurityError: blocked");
      });
      render(
        <ThemeProvider themes={builtinThemes} storageKey={STORAGE_KEY}>
          <Inspector />
        </ThemeProvider>,
      );
      // Falls back to defaults: violet-forge / dark.
      expect(screen.getByTestId("theme")).toHaveTextContent("violet-forge");
      expect(screen.getByTestId("mode")).toHaveTextContent("dark");
      getSpy.mockRestore();
    });

    it("ignores invalid stored mode and uses default", () => {
      window.localStorage.setItem(`${STORAGE_KEY}:mode`, "twilight");
      render(
        <ThemeProvider themes={builtinThemes} storageKey={STORAGE_KEY}>
          <Inspector />
        </ThemeProvider>,
      );
      // "twilight" is not "dark" or "light" → falls back to defaultMode (dark).
      expect(screen.getByTestId("mode")).toHaveTextContent("dark");
    });

    // 0.6.3-next.0 hydration-mismatch fix — these guard against
    // regressing the SSR-safe initialization pattern.
    it("does NOT clobber stored value with default on mount (hydration guard)", () => {
      // Pre-seed storage with a non-default value.
      window.localStorage.setItem(`${STORAGE_KEY}:name`, "aurora-terminal");
      window.localStorage.setItem(`${STORAGE_KEY}:mode`, "light");

      render(
        <ThemeProvider themes={builtinThemes} storageKey={STORAGE_KEY}>
          <Inspector />
        </ThemeProvider>,
      );

      // After mount + post-mount hydration effect: state reflects stored value.
      expect(screen.getByTestId("theme")).toHaveTextContent("aurora-terminal");
      expect(screen.getByTestId("mode")).toHaveTextContent("light");

      // CRUCIAL: storage still holds the original stored value, NOT the
      // default. Previously the persist effect ran before hydration and
      // wrote `defaultTheme`/`defaultMode` for one tick.
      expect(window.localStorage.getItem(`${STORAGE_KEY}:name`)).toBe("aurora-terminal");
      expect(window.localStorage.getItem(`${STORAGE_KEY}:mode`)).toBe("light");
    });

    it("does NOT write to localStorage on first mount when nothing changes (persist gate)", () => {
      // Empty storage + no user interaction → persist effect MUST NOT fire.
      // Previously this wrote `defaultTheme`/`defaultMode`/`defaultDensity`
      // on every mount, briefly clobbering a stored value before the
      // hydration effect could promote it.
      render(
        <ThemeProvider themes={builtinThemes} storageKey={STORAGE_KEY}>
          <Inspector />
        </ThemeProvider>,
      );

      // Storage stays empty for unchanged keys.
      expect(window.localStorage.getItem(`${STORAGE_KEY}:name`)).toBeNull();
      expect(window.localStorage.getItem(`${STORAGE_KEY}:mode`)).toBeNull();
      expect(window.localStorage.getItem(`${STORAGE_KEY}:density`)).toBeNull();
    });

    it("writes to localStorage AFTER a user-driven change (persist fires post-hydration)", async () => {
      const user = userEvent.setup();
      render(
        <ThemeProvider themes={builtinThemes} storageKey={STORAGE_KEY}>
          <Inspector />
        </ThemeProvider>,
      );

      expect(window.localStorage.getItem(`${STORAGE_KEY}:mode`)).toBeNull();
      await user.click(screen.getByRole("button", { name: "toggle" }));
      expect(window.localStorage.getItem(`${STORAGE_KEY}:mode`)).toBe("light");
      // Sibling keys are also persisted in the same effect.
      expect(window.localStorage.getItem(`${STORAGE_KEY}:name`)).toBe("violet-forge");
    });
  });

  // T2.3 — integration: defineTheme output is a drop-in Theme.
  describe("integration with defineTheme", () => {
    it("accepts a Theme produced by defineTheme() and applies it", async () => {
      const { defineTheme } = await import("./define.js");
      const corp = defineTheme({
        name: "corp",
        light: { primary: "0 0% 0%" },
      });
      render(
        <ThemeProvider themes={[corp]} defaultTheme="corp" storageKey={null}>
          <Inspector />
        </ThemeProvider>,
      );
      expect(screen.getByTestId("theme")).toHaveTextContent("corp");
      expect(screen.getByTestId("count")).toHaveTextContent("1");
    });
  });
});
