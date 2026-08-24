import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { builtinThemes } from "./index.js";
import { ThemeProvider, useTheme } from "./theme-provider.js";

/**
 * Tests for T5.1 / D6 — `respectSystemMode` + matchMedia auto-detect + cleanup.
 *
 * EC-12: matchMedia listener cleanup on unmount is asserted by capturing the
 * matchMedia object and verifying removeEventListener was called.
 */

function Inspector() {
  const { mode, setMode } = useTheme();
  return (
    <div>
      <p data-testid="mode">{mode}</p>
      <button type="button" onClick={() => setMode("dark")}>
        fix-dark
      </button>
    </div>
  );
}

interface FakeMql {
  matches: boolean;
  addEventListener: ReturnType<typeof vi.fn>;
  removeEventListener: ReturnType<typeof vi.fn>;
  listeners: Array<(e: MediaQueryListEvent) => void>;
}

let fakeMql: FakeMql;
let originalMatchMedia: typeof window.matchMedia | undefined;

beforeEach(() => {
  originalMatchMedia = window.matchMedia;
  fakeMql = {
    matches: false,
    addEventListener: vi.fn((_: string, cb: (e: MediaQueryListEvent) => void) => {
      fakeMql.listeners.push(cb);
    }),
    removeEventListener: vi.fn((_: string, cb: (e: MediaQueryListEvent) => void) => {
      fakeMql.listeners = fakeMql.listeners.filter((fn) => fn !== cb);
    }),
    listeners: [],
  };
  // Patch window.matchMedia globally for this test.
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    configurable: true,
    value: vi.fn(() => fakeMql),
  });
});

afterEach(() => {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    configurable: true,
    value: originalMatchMedia,
  });
});

describe("ThemeProvider respectSystemMode (T5.1 / D6)", () => {
  it("aligns with system light when matchMedia matches=false", async () => {
    fakeMql.matches = false;
    render(
      <ThemeProvider themes={builtinThemes} defaultMode="dark" storageKey={null}>
        <Inspector />
      </ThemeProvider>,
    );
    // Effect runs synchronously after mount under React 18 act/jsdom.
    expect(screen.getByTestId("mode").textContent).toBe("light");
  });

  it("aligns with system dark when matchMedia matches=true", () => {
    fakeMql.matches = true;
    render(
      <ThemeProvider themes={builtinThemes} defaultMode="light" storageKey={null}>
        <Inspector />
      </ThemeProvider>,
    );
    expect(screen.getByTestId("mode").textContent).toBe("dark");
  });

  it("respectSystemMode={false} preserves defaultMode and does NOT subscribe", () => {
    fakeMql.matches = false;
    render(
      <ThemeProvider
        respectSystemMode={false}
        themes={builtinThemes}
        defaultMode="dark"
        storageKey={null}
      >
        <Inspector />
      </ThemeProvider>,
    );
    expect(screen.getByTestId("mode").textContent).toBe("dark");
    expect(fakeMql.addEventListener).not.toHaveBeenCalled();
  });

  it("user setMode overrides subsequent system changes", async () => {
    fakeMql.matches = true; // system says dark
    const user = userEvent.setup();
    render(
      <ThemeProvider themes={builtinThemes} defaultMode="dark" storageKey={null}>
        <Inspector />
      </ThemeProvider>,
    );
    expect(screen.getByTestId("mode").textContent).toBe("dark");
    // User fixes to dark explicitly (same value but flips the override flag).
    await user.click(screen.getByText("fix-dark"));
    expect(screen.getByTestId("mode").textContent).toBe("dark");
    // Simulate system change to light — should NOT override the user's fix.
    fakeMql.matches = false;
    for (const cb of fakeMql.listeners) cb({ matches: false } as MediaQueryListEvent);
    expect(screen.getByTestId("mode").textContent).toBe("dark");
  });

  it("EC-12: removes matchMedia listener on unmount (no leak)", () => {
    const { unmount } = render(
      <ThemeProvider themes={builtinThemes} storageKey={null}>
        <Inspector />
      </ThemeProvider>,
    );
    expect(fakeMql.addEventListener).toHaveBeenCalledTimes(1);
    unmount();
    expect(fakeMql.removeEventListener).toHaveBeenCalledTimes(1);
  });
});
