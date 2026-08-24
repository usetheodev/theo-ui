import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { builtinThemes } from "./index.js";
import { ThemeProvider, useTheme } from "./theme-provider.js";
import { ThemeScript } from "./theme-script.js";

/**
 * `ThemeScript` runs before the first paint; `ThemeProvider` runs after React hydrates. They write
 * the same three attributes, so whenever they resolve to different values the page paints once and
 * repaints — which is the flash of unstyled content the script exists to remove. A divergence here
 * does not merely fail to help: it reintroduces the bug while looking like the fix.
 *
 * The two implementations cannot share code — one is a string of JavaScript built for an inline
 * `<script>`, the other is React state — so this suite runs the real script against a real DOM and
 * compares the result with what the real provider settles on, across the matrix that matters:
 * stored value present or absent, OS light or dark, system preference honoured or not.
 *
 * Regression test for usetheokit/theokit-ui#42.
 */

const STORAGE_KEY = "theo-ui:theme";

function Inspector() {
  const { mode } = useTheme();
  return <p data-testid="mode">{mode}</p>;
}

let originalMatchMedia: typeof window.matchMedia | undefined;

/** Stands in for the OS appearance setting, answering both queries the two code paths use. */
function stubOsPrefersDark(prefersDark: boolean) {
  window.matchMedia = ((query: string) => ({
    matches: query.includes("dark") ? prefersDark : !prefersDark,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  })) as unknown as typeof window.matchMedia;
}

/** Renders the component, then executes the script it produced against this document. */
function runBootScript(element: React.ReactElement) {
  const { container } = render(element);
  const code = container.querySelector("script")?.innerHTML ?? "";
  expect(code).not.toBe("");
  new Function(code)();
  return {
    mode: document.documentElement.getAttribute("data-mode"),
    theme: document.documentElement.getAttribute("data-theme"),
    density: document.documentElement.getAttribute("data-density"),
    dark: document.documentElement.classList.contains("dark"),
  };
}

beforeEach(() => {
  originalMatchMedia = window.matchMedia;
  localStorage.clear();
  document.documentElement.className = "";
  for (const attribute of ["data-mode", "data-theme", "data-density"]) {
    document.documentElement.removeAttribute(attribute);
  }
});

afterEach(() => {
  if (originalMatchMedia) window.matchMedia = originalMatchMedia;
  localStorage.clear();
});

describe("ThemeScript — mode resolution", () => {
  it("follows the OS when nothing is stored and the system is light", () => {
    // The reported bug: the script applied `defaultMode` here, the provider applied `light`, and
    // every first-time visitor on a light system watched the page flash dark and settle light.
    stubOsPrefersDark(false);

    expect(runBootScript(<ThemeScript defaultMode="dark" />)).toMatchObject({
      mode: "light",
      dark: false,
    });
  });

  it("follows the OS when nothing is stored and the system is dark", () => {
    stubOsPrefersDark(true);

    expect(runBootScript(<ThemeScript defaultMode="light" />)).toMatchObject({
      mode: "dark",
      dark: true,
    });
  });

  it("prefers a stored choice over the OS", () => {
    stubOsPrefersDark(true);
    localStorage.setItem(`${STORAGE_KEY}:mode`, "light");

    expect(runBootScript(<ThemeScript />)).toMatchObject({ mode: "light", dark: false });
  });

  it("ignores a stored value that is not a mode", () => {
    stubOsPrefersDark(true);
    localStorage.setItem(`${STORAGE_KEY}:mode`, "midnight");

    expect(runBootScript(<ThemeScript />).mode).toBe("dark");
  });

  it("uses the default when the OS signal is turned off", () => {
    stubOsPrefersDark(false);

    expect(
      runBootScript(<ThemeScript defaultMode="dark" respectSystemMode={false} />),
    ).toMatchObject({ mode: "dark", dark: true });
  });

  it("uses the default when the engine has no matchMedia, as the provider does", () => {
    // The provider's effect returns early without `matchMedia`, leaving `defaultMode` in place.
    (window as { matchMedia?: unknown }).matchMedia = undefined;

    expect(runBootScript(<ThemeScript defaultMode="light" />).mode).toBe("light");
  });

  it("removes the dark class rather than only adding it", () => {
    stubOsPrefersDark(false);
    document.documentElement.classList.add("dark");

    expect(runBootScript(<ThemeScript />).dark).toBe(false);
  });

  it("falls back to the default density when the stored one is unrecognised", () => {
    stubOsPrefersDark(true);
    localStorage.setItem(`${STORAGE_KEY}:density`, "roomy");

    expect(runBootScript(<ThemeScript />).density).toBe("comfortable");
  });
});

describe("ThemeScript and ThemeProvider agree", () => {
  const matrix = [
    { stored: null, osDark: false, defaultMode: "dark" as const },
    { stored: null, osDark: true, defaultMode: "light" as const },
    { stored: "light" as const, osDark: true, defaultMode: "dark" as const },
    { stored: "dark" as const, osDark: false, defaultMode: "light" as const },
  ];

  for (const { stored, osDark, defaultMode } of matrix) {
    it(`settles on the same mode — stored=${stored ?? "none"}, OS=${osDark ? "dark" : "light"}`, () => {
      stubOsPrefersDark(osDark);
      if (stored) localStorage.setItem(`${STORAGE_KEY}:mode`, stored);

      const fromScript = runBootScript(<ThemeScript defaultMode={defaultMode} />).mode;

      render(
        <ThemeProvider themes={builtinThemes} defaultMode={defaultMode}>
          <Inspector />
        </ThemeProvider>,
      );
      // `render` flushes effects, so this is the mode the provider settles on after hydration —
      // exactly what the reader would see once the page comes alive.
      expect(fromScript).toBe(screen.getByTestId("mode").textContent);
    });
  }
});
