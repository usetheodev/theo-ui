import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { Theme } from "./types.js";
import { builtinThemes } from "./index.js";
import { ThemeProvider, useTheme } from "./theme-provider.js";

/**
 * usetheokit/theokit-ui#116 — the provider persisted a theme and a mode it never applied, and the
 * app lost its theme on the second visit.
 *
 * Both halves are the same defect wearing different clothes: a value that reached `localStorage`
 * without ever having been a decision. One came from a default the provider silently replaced at
 * apply time; the other came from the operating system. On the next load both are read back as
 * though a human had chosen them.
 *
 * The mode half is the one that bites hardest, because reading a stored mode sets the
 * user-override flag — so a mode the OS picked, once persisted, outranks the app's `defaultMode`
 * AND survives `respectSystemMode={false}`, which is exactly the escape hatch an app reaches for
 * when it wants to stop this.
 */

/**
 * A real builtin, renamed. Deriving from one rather than hand-writing a literal keeps the test
 * about the persistence defect: a hand-written theme fails schema validation first, and a test
 * that goes red before reaching the behaviour under test proves nothing about it.
 */
const APP_THEME: Theme = {
  ...(builtinThemes[0] as Theme),
  name: "devrel-desk",
  label: "DevRel Desk",
};

function Inspector() {
  const { themeName, mode, toggleMode } = useTheme();
  return (
    <div>
      <p data-testid="theme">{themeName}</p>
      <p data-testid="mode">{mode}</p>
      <button type="button" onClick={toggleMode}>
        toggle
      </button>
    </div>
  );
}

function systemPrefers(dark: boolean): void {
  window.matchMedia = vi.fn().mockImplementation((q: string) => ({
    matches: dark,
    media: q,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
    onchange: null,
  })) as unknown as typeof window.matchMedia;
}

let originalMatchMedia: typeof window.matchMedia | undefined;

beforeEach(() => {
  originalMatchMedia = window.matchMedia;
  window.localStorage.clear();
});

afterEach(() => {
  if (originalMatchMedia) window.matchMedia = originalMatchMedia;
  window.localStorage.clear();
  vi.restoreAllMocks();
});

describe("ThemeProvider persists only what it actually applied (#116)", () => {
  it("does not persist a theme name it replaced with the app's own at apply time", async () => {
    // The app ships one theme and never passes `defaultTheme`, so state holds the library default
    // `violet-forge` while the apply effect resolves `themes[0]` — devrel-desk — via its `?? themes[0]`
    // fallback. What is on screen and what is in storage disagree, and storage wins next time.
    // System LIGHT against defaultMode dark, as in the report: that disagreement is what makes the
    // mode change after mount, which is what makes the persist effect run at all. With the system
    // already agreeing, nothing is written and the assertion passes without exercising anything.
    systemPrefers(false);
    render(
      <ThemeProvider themes={[APP_THEME]} defaultMode="dark">
        <Inspector />
      </ThemeProvider>,
    );

    await waitFor(() => {
      expect(document.documentElement.getAttribute("data-theme")).toBe("devrel-desk");
    });

    const persisted = window.localStorage.getItem("theo-ui:theme:name");
    expect(
      persisted === null || persisted === "devrel-desk",
      `persisted ${String(persisted)} but applied devrel-desk`,
    ).toBe(true);
  });

  it("persists the theme that is on screen when the user acts, not the one state was left holding", async () => {
    // The half the gate alone does not fix. With persistence gated on a decision, one click IS a
    // decision — so if state still named the library default while the DOM showed the app's theme,
    // that first click would write the wrong name and reintroduce the exact defect through the
    // supported path. This is the assertion that makes the state/DOM reconciliation load-bearing.
    const user = userEvent.setup();
    systemPrefers(false);
    render(
      <ThemeProvider themes={[APP_THEME]} defaultMode="dark">
        <Inspector />
      </ThemeProvider>,
    );
    await waitFor(() => {
      expect(document.documentElement.getAttribute("data-theme")).toBe("devrel-desk");
    });

    await user.click(screen.getByRole("button", { name: "toggle" }));

    expect(window.localStorage.getItem("theo-ui:theme:name")).toBe("devrel-desk");
  });

});
