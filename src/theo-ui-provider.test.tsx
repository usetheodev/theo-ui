import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { builtinThemes } from "./themes/index.js";
import { TheoUIProvider } from "./theo-ui-provider.js";

/**
 * Tests for `<TheoUIProvider>` — the primary entry point that composes
 * `<ThemeProvider>` + `<Toaster>`. Covers:
 *   1. Children render through the provider stack.
 *   2. `<ThemeProvider>` applies `data-theme` + `data-mode` to <html>.
 *   3. `<Toaster>` viewport is mounted in the DOM (toast functionality).
 *   4. `theme` prop pass-through reaches `<ThemeProvider>`.
 *   5. `toaster` prop pass-through reaches `<Toaster>`.
 */
describe("TheoUIProvider", () => {
  beforeEach(() => {
    document.documentElement.removeAttribute("data-theme");
    document.documentElement.removeAttribute("data-mode");
    document.documentElement.classList.remove("dark");
  });

  afterEach(() => {
    document.documentElement.removeAttribute("data-theme");
    document.documentElement.removeAttribute("data-mode");
    document.documentElement.classList.remove("dark");
  });

  it("renders children", () => {
    render(
      <TheoUIProvider>
        <span data-testid="child">hello</span>
      </TheoUIProvider>,
    );
    expect(screen.getByTestId("child")).toHaveTextContent("hello");
  });

  it("applies default theme (violet-forge) to <html>", () => {
    render(
      <TheoUIProvider>
        <div>content</div>
      </TheoUIProvider>,
    );
    expect(document.documentElement.getAttribute("data-theme")).toBe("violet-forge");
  });

  it("applies default mode (dark) to <html>", () => {
    render(
      <TheoUIProvider>
        <div>content</div>
      </TheoUIProvider>,
    );
    expect(document.documentElement.getAttribute("data-mode")).toBe("dark");
  });

  it("mounts the Toaster viewport in the DOM", () => {
    render(
      <TheoUIProvider>
        <div>content</div>
      </TheoUIProvider>,
    );
    // Radix Toast.Viewport renders <div role="region" aria-label="Notifications (F8)">
    // wrapping the <ol> that carries our position classes.
    const region = document.querySelector('[role="region"][aria-label^="Notifications"]');
    expect(region).not.toBeNull();
    expect(region?.querySelector("ol")).not.toBeNull();
  });

  it("passes theme prop through to <ThemeProvider> (defaultMode override)", () => {
    render(
      <TheoUIProvider theme={{ defaultMode: "light", storageKey: null }}>
        <div>content</div>
      </TheoUIProvider>,
    );
    expect(document.documentElement.getAttribute("data-mode")).toBe("light");
  });

  it("passes theme prop through to <ThemeProvider> (defaultTheme override)", () => {
    render(
      <TheoUIProvider
        theme={{
          defaultTheme: "classic-paper",
          themes: builtinThemes,
          storageKey: null,
        }}
      >
        <div>content</div>
      </TheoUIProvider>,
    );
    expect(document.documentElement.getAttribute("data-theme")).toBe("classic-paper");
  });

  it("passes toaster prop through to <Toaster> (position override)", () => {
    render(
      <TheoUIProvider toaster={{ position: "top-left" }}>
        <div>content</div>
      </TheoUIProvider>,
    );
    const ol = document.querySelector(
      '[role="region"][aria-label^="Notifications"] ol',
    ) as HTMLOListElement | null;
    expect(ol).not.toBeNull();
    expect(ol?.className).toContain("top-4");
    expect(ol?.className).toContain("left-4");
  });

  it("exposes a stable displayName", () => {
    expect(TheoUIProvider.displayName).toBe("TheoUIProvider");
  });
});
