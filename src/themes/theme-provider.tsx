import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { JSX, ReactNode } from "react";
import type { ColorScale, Theme, ThemeMode } from "./types.js";

interface ThemeContextValue {
  /** Active theme (full descriptor). */
  theme: Theme;
  /** Active mode: light or dark. */
  mode: ThemeMode;
  /** All available themes. */
  themes: Theme[];
  /** Swap the active theme by name. */
  setTheme: (name: string) => void;
  /** Set light/dark explicitly. */
  setMode: (mode: ThemeMode) => void;
  /** Toggle light <> dark. */
  toggleMode: () => void;
  /** Register an additional theme at runtime. */
  registerTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const STYLE_ELEMENT_ID = "theo-ui-theme-vars";

function colorScaleToCss(name: string, mode: ThemeMode, colors: ColorScale): string {
  const selector =
    mode === "light"
      ? `[data-theme="${name}"]`
      : `[data-theme="${name}"].dark, [data-theme="${name}"][data-mode="dark"]`;
  const decls = Object.entries(colors)
    .map(([token, value]) => `  --${token}: ${value};`)
    .join("\n");
  return `${selector} {\n${decls}\n}`;
}

function fontsToCss(name: string, fonts: Theme["fonts"]): string {
  return `[data-theme="${name}"] {\n  --font-display: ${fonts.display};\n  --font-body: ${fonts.body};\n  --font-mono: ${fonts.mono};\n}`;
}

function injectThemeCss(themes: Theme[]): void {
  if (typeof document === "undefined") return;
  let style = document.getElementById(STYLE_ELEMENT_ID) as HTMLStyleElement | null;
  if (!style) {
    style = document.createElement("style");
    style.id = STYLE_ELEMENT_ID;
    document.head.appendChild(style);
  }
  const blocks: string[] = [];
  for (const theme of themes) {
    blocks.push(fontsToCss(theme.name, theme.fonts));
    blocks.push(colorScaleToCss(theme.name, "light", theme.light));
    blocks.push(colorScaleToCss(theme.name, "dark", theme.dark));
  }
  style.textContent = blocks.join("\n\n");
}

const injectedFontUrls = new Set<string>();

function loadThemeFonts(theme: Theme): void {
  if (typeof document === "undefined") return;
  if (!theme.fontUrls) return;
  for (const url of theme.fontUrls) {
    if (injectedFontUrls.has(url)) continue;
    injectedFontUrls.add(url);
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = url;
    document.head.appendChild(link);
  }
}

interface ThemeProviderProps {
  children: ReactNode;
  /**
   * Theme to start with. Must match the `name` of an entry in `themes`.
   * Defaults to `"violet-forge"` for backward compat — if you don't pass
   * `violet-forge` in `themes`, set this prop explicitly.
   */
  defaultTheme?: string;
  /** Mode to start with. Defaults to `"dark"` (library is dark-first). */
  defaultMode?: ThemeMode;
  /**
   * Available themes. **Required**: ThemeProvider does not auto-include any
   * built-in theme since v0.1.0-next.0 — pass `builtinThemes` for all three
   * Violet Forge defaults, or your own array for a slimmer bundle.
   *
   * Migration: consumers previously calling `<ThemeProvider>` without this
   * prop now must pass `themes={builtinThemes}` (or use `<TheoUIProvider>`
   * which defaults to `builtinThemes` for you).
   */
  themes: Theme[];
  /**
   * Persist selection in localStorage under this key. Pass `null` to disable.
   * Default: "theo-ui:theme".
   */
  storageKey?: string | null;
}

/**
 * Storage failure diagnostic — dev-only one-line warn so engineers see
 * something when localStorage throws (Safari private mode, blocked
 * third-party cookies, sandboxed iframes). In production we stay silent;
 * runtime behavior is fail-safe (state still lives in memory).
 *
 * Per HIGH-006: silent catches diverge from the "fail loud" principle
 * declared in the global CLAUDE.md. We accept silence in prod because the
 * fallback is correct, but we surface a single warn per call site in dev.
 */
function warnStorageFailure(scope: string, err: unknown): void {
  if (typeof process === "undefined" || process.env.NODE_ENV === "production") return;
  // biome-ignore lint/suspicious/noConsole: dev-only diagnostic for storage failures (HIGH-006)
  console.warn(`[@usetheo/ui] theme storage failure (${scope}):`, err);
}

/**
 * ThemeProvider — central registry + runtime switcher for Theo themes.
 *
 * Behavior:
 *   1. On mount, injects a `<style id="theo-ui-theme-vars">` element with
 *      one CSS block per theme (`[data-theme="<name>"] { --token: ... }`).
 *   2. Sets `data-theme` and `data-mode` on `<html>` so any element nested
 *      below inherits the right tokens (the Tailwind config consumes them).
 *   3. Lazy-loads theme font URLs by injecting `<link rel="stylesheet">`.
 *   4. Optionally persists choice in localStorage.
 */
function ThemeProvider({
  children,
  defaultTheme = "violet-forge",
  defaultMode = "dark",
  themes: themesProp,
  storageKey = "theo-ui:theme",
}: ThemeProviderProps): JSX.Element {
  // Themes prop is required since v0.1.0-next.0 — see migration note in
  // the JSDoc on ThemeProviderProps. Pass `builtinThemes` for the legacy
  // default behavior (violet-forge + classic-paper + aurora-terminal), or
  // an array of your own. Empty array is rejected: ThemeProvider has no
  // valid state without at least one registered theme.
  if (!themesProp || themesProp.length === 0) {
    throw new Error(
      "<ThemeProvider> requires the `themes` prop with at least one Theme. " +
        "Pass `themes={builtinThemes}` for the Violet Forge defaults (importable " +
        "via the package barrel), or use <TheoUIProvider> which sets this for you.",
    );
  }

  // Dedup by theme name; last writer wins (allows registerTheme override).
  const mergedThemes = useMemo<Theme[]>(() => {
    const map = new Map<string, Theme>();
    for (const t of themesProp) map.set(t.name, t);
    return Array.from(map.values());
  }, [themesProp]);

  const [themes, setThemes] = useState<Theme[]>(mergedThemes);

  // Re-sync state when the `themes` prop changes between renders. Avoids the
  // common pitfall where the user passes a different array later and the
  // initial-state-only seed silently ignores the change.
  useEffect(() => {
    setThemes(mergedThemes);
  }, [mergedThemes]);

  const [themeName, setThemeName] = useState<string>(() => {
    if (typeof window === "undefined" || !storageKey) return defaultTheme;
    try {
      return window.localStorage.getItem(`${storageKey}:name`) ?? defaultTheme;
    } catch (err) {
      warnStorageFailure("read theme name", err);
      return defaultTheme;
    }
  });

  const [mode, setModeState] = useState<ThemeMode>(() => {
    if (typeof window === "undefined" || !storageKey) return defaultMode;
    try {
      const stored = window.localStorage.getItem(`${storageKey}:mode`);
      return stored === "dark" || stored === "light" ? stored : defaultMode;
    } catch (err) {
      warnStorageFailure("read theme mode", err);
      return defaultMode;
    }
  });

  // Inject CSS vars whenever the themes list changes.
  useEffect(() => {
    injectThemeCss(themes);
  }, [themes]);

  // Apply data-theme + data-mode to <html>, load fonts.
  useEffect(() => {
    if (typeof document === "undefined") return;
    const active = themes.find((t) => t.name === themeName) ?? themes[0];
    if (!active) return;
    document.documentElement.setAttribute("data-theme", active.name);
    document.documentElement.setAttribute("data-mode", mode);
    document.documentElement.classList.toggle("dark", mode === "dark");
    loadThemeFonts(active);
  }, [themeName, mode, themes]);

  // Persist on change.
  useEffect(() => {
    if (typeof window === "undefined" || !storageKey) return;
    try {
      window.localStorage.setItem(`${storageKey}:name`, themeName);
      window.localStorage.setItem(`${storageKey}:mode`, mode);
    } catch (err) {
      // Storage may fail in private mode; behavior remains correct (state
      // lives in memory). Per HIGH-006 we surface a one-time dev warning so
      // the engineer sees something instead of complete silence.
      warnStorageFailure("persist theme + mode", err);
    }
  }, [themeName, mode, storageKey]);

  const setTheme = useCallback((name: string) => setThemeName(name), []);
  const setMode = useCallback((next: ThemeMode) => setModeState(next), []);
  const toggleMode = useCallback(
    () => setModeState((cur) => (cur === "light" ? "dark" : "light")),
    [],
  );
  const registerTheme = useCallback((theme: Theme) => {
    setThemes((cur) => {
      const idx = cur.findIndex((t) => t.name === theme.name);
      if (idx >= 0) {
        const next = cur.slice();
        next[idx] = theme;
        return next;
      }
      return [...cur, theme];
    });
  }, []);

  // themes[0] is guaranteed non-undefined by the constructor-time check
  // above (themesProp is non-empty); the non-null assert encodes that
  // invariant for TypeScript, which can't trace it through useState.
  // biome-ignore lint/style/noNonNullAssertion: T2.5 runtime invariant — themesProp non-empty validated at top of function
  const active = themes.find((t) => t.name === themeName) ?? themes[0]!;

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme: active,
      mode,
      themes,
      setTheme,
      setMode,
      toggleMode,
      registerTheme,
    }),
    [active, mode, themes, setTheme, setMode, toggleMode, registerTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

/**
 * useTheme — access theme state from any component inside <ThemeProvider>.
 * Throws if used outside the provider — fail-fast.
 */
function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used inside <ThemeProvider>.");
  }
  return ctx;
}

export { ThemeProvider, useTheme };
