import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { JSX, ReactNode } from "react";
import type { ColorScale, Theme, ThemeMode } from "./types.js";
import { violetForge } from "./violet-forge.js";

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
  /** Theme to start with. Defaults to `violet-forge`. */
  defaultTheme?: string;
  /** Mode to start with. Defaults to `"dark"` (library is dark-first). */
  defaultMode?: ThemeMode;
  /**
   * Available themes. Always includes `violet-forge` even if omitted.
   * Pass extra Theme objects to register them.
   */
  themes?: Theme[];
  /**
   * Persist selection in localStorage under this key. Pass `null` to disable.
   * Default: "theo-ui:theme".
   */
  storageKey?: string | null;
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
  // Merge user themes with the default, dedup by name (user wins).
  const mergedThemes = useMemo<Theme[]>(() => {
    const base = [violetForge];
    const extras = themesProp ?? [];
    const map = new Map<string, Theme>();
    for (const t of base) map.set(t.name, t);
    for (const t of extras) map.set(t.name, t);
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
    } catch {
      return defaultTheme;
    }
  });

  const [mode, setModeState] = useState<ThemeMode>(() => {
    if (typeof window === "undefined" || !storageKey) return defaultMode;
    try {
      const stored = window.localStorage.getItem(`${storageKey}:mode`);
      return stored === "dark" || stored === "light" ? stored : defaultMode;
    } catch {
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
    } catch {
      /* storage may fail in private mode; not critical */
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

  const active = themes.find((t) => t.name === themeName) ?? themes[0] ?? violetForge;

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
