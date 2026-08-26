/**
 * A theme built in the editor survives a reload.
 *
 * `ThemeProvider` persists which theme is active; it cannot persist one that exists only in the
 * React tree. Without this, every reload threw away the palette somebody had just assembled —
 * which is the difference between a demo and a feature.
 */
import { cleanup, render, screen } from "@testing-library/react";
import type { JSX } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { defineTheme } from "./define.js";
import { ThemeProvider } from "./theme-provider.js";
import type { Theme } from "./types.js";
import { useStoredTheme } from "./use-stored-theme.js";
import { violetForge } from "./violet-forge.js";

const KEY = "test:custom-theme";

afterEach(() => {
  cleanup();
  window.localStorage.clear();
});

function Probe({ save }: { save?: Theme } = {}): JSX.Element {
  const { stored, save: persist, clear } = useStoredTheme(KEY);
  return (
    <div>
      <span data-testid="stored">{stored?.name ?? "none"}</span>
      <button
        type="button"
        onClick={() => {
          if (save) persist(save);
        }}
      >
        save
      </button>
      <button type="button" onClick={clear}>
        clear
      </button>
    </div>
  );
}

function mount(props: { save?: Theme } = {}) {
  return render(
    <ThemeProvider
      themes={[violetForge]}
      defaultTheme={violetForge.name}
      respectSystemMode={false}
      storageKey={null}
    >
      <Probe {...props} />
    </ThemeProvider>,
  );
}

const CUSTOM = defineTheme({
  name: "brand",
  label: "Brand",
  dark: { primary: "#10b981" },
  light: {},
});

describe("useStoredTheme", () => {
  it("reports nothing stored on a clean start", () => {
    mount();
    expect(screen.getByTestId("stored").textContent).toBe("none");
  });

  it("restores a theme written by a previous session", () => {
    window.localStorage.setItem(KEY, JSON.stringify(CUSTOM));
    mount();

    expect(screen.getByTestId("stored").textContent).toBe("brand");
  });

  it("persists what it is given", () => {
    mount({ save: CUSTOM });
    screen.getByRole("button", { name: "save" }).click();

    const raw = window.localStorage.getItem(KEY);
    expect(raw).not.toBeNull();
    expect(JSON.parse(raw ?? "{}").name).toBe("brand");
  });

  it("forgets on clear", () => {
    window.localStorage.setItem(KEY, JSON.stringify(CUSTOM));
    mount();
    screen.getByRole("button", { name: "clear" }).click();

    expect(window.localStorage.getItem(KEY)).toBeNull();
  });
});

describe("useStoredTheme refuses what it cannot trust", () => {
  let warn: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
  });

  afterEach(() => {
    warn.mockRestore();
  });

  it("ignores a truncated write instead of applying half a theme", () => {
    window.localStorage.setItem(KEY, '{"name":"brand","label":"Brand"');
    mount();

    expect(screen.getByTestId("stored").textContent).toBe("none");
    expect(warn).toHaveBeenCalled();
  });

  it("ignores an object of the wrong shape — an older format, or something else entirely", () => {
    window.localStorage.setItem(KEY, JSON.stringify({ name: "brand", colours: {} }));
    mount();

    expect(screen.getByTestId("stored").textContent).toBe("none");
    expect(warn).toHaveBeenCalled();
  });

  it("survives storage being unavailable, which is a real browser state", () => {
    const getItem = vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("SecurityError");
    });

    expect(() => {
      mount();
    }).not.toThrow();
    expect(screen.getByTestId("stored").textContent).toBe("none");

    getItem.mockRestore();
  });
});
