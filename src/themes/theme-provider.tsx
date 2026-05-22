import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { JSX, ReactNode } from "react";
import { safeHref } from "../lib/safe-href.js";
import { type Density, DensityContext, injectDensityCss } from "./density.js";
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

// T3.2 (SEC-001): allowlist validators for theme values. injectThemeCss
// interpolates theme name + color values + font families into a <style>
// textContent. Without validation, a theme object from an untrusted source
// (e.g., a feature-flag service, a CMS) could inject arbitrary CSS via
// closing the declaration with `}` or smuggling `url(...)` for exfiltration.
// We reject rather than escape: themes are code, not user input. Invalid
// values cause a dev-time throw (caller sees the problem); production
// silently substitutes a safe fallback so a misconfigured theme can't
// crash the app.

// Color values. Multiple accepted shapes:
//   1. Hex: `#fff`, `#0a0a0a`, `#0a0a0aff`.
//   2. Fully-parenthesized CSS color functions: `oklch(...)`, `rgb(...)`,
//      `hsl(...)`, etc. Inner content restricted to digits/dots/spaces/
//      percent/slash/comma/dash/plus — no semicolons, no braces, no `url(`.
//   3. HSL-component split (shadcn-ui convention used by the built-in
//      themes): `"0 0% 100%"`, `"262 83% 58%"` — space-separated numeric
//      components consumed via `hsl(var(--token))` in stylesheets.
//   4. `var(--token)` references, optionally with a fallback value that
//      contains no parens/braces/semicolons.
//   5. CSS keywords: `transparent`, `currentColor`, `inherit`, `initial`,
//      `unset`.
const COLOR_VALUE_PATTERN =
  /^(#[0-9a-fA-F]{3,8}|(?:oklch|oklab|rgb|rgba|hsl|hsla|lab|lch|color)\(\s*[\d.\s%,/+\-]+\s*\)|-?\d+(?:\.\d+)?%?(?:\s+-?\d+(?:\.\d+)?%?){1,3}|var\(--[a-zA-Z0-9-]+(?:\s*,\s*[^();{}]+)?\)|transparent|currentColor|inherit|initial|unset)$/;

// Font family: word chars, spaces, commas, hyphens, dots, quotes. Excludes
// parens (blocks `url(...)`) and semicolons (blocks declaration breakouts).
const FONT_FAMILY_PATTERN = /^[\w\s,"'\-.]+$/;

// Theme name: kebab-case identifier. Excludes anything that could break out
// of an attribute selector or inject additional rules.
const THEME_NAME_PATTERN = /^[a-z][a-z0-9-]*$/;

const IS_DEV = typeof process === "undefined" || process.env.NODE_ENV !== "production";

function rejectOrFallback(scope: string, value: string, fallback: string): string {
  if (IS_DEV) {
    throw new Error(
      `[@usetheo/ui] invalid ${scope} value: ${JSON.stringify(value)}. Theme values must match the allowlist (see src/themes/theme-provider.tsx). Refusing to inject potentially unsafe CSS.`,
    );
  }
  return fallback;
}

function validatedColor(token: string, value: string): string {
  if (COLOR_VALUE_PATTERN.test(value)) return value;
  return rejectOrFallback(`color "${token}"`, value, "transparent");
}

function validatedFontFamily(slot: string, value: string): string {
  if (FONT_FAMILY_PATTERN.test(value)) return value;
  return rejectOrFallback(`fontFamily "${slot}"`, value, "inherit");
}

function validatedThemeName(value: string): string {
  if (THEME_NAME_PATTERN.test(value)) return value;
  return rejectOrFallback("theme.name", value, "invalid-theme");
}

function colorScaleToCss(name: string, mode: ThemeMode, colors: ColorScale): string {
  const safeName = validatedThemeName(name);
  const selector =
    mode === "light"
      ? `[data-theme="${safeName}"]`
      : `[data-theme="${safeName}"].dark, [data-theme="${safeName}"][data-mode="dark"]`;
  const decls = Object.entries(colors)
    .map(([token, value]) => `  --${token}: ${validatedColor(token, value)};`)
    .join("\n");
  return `${selector} {\n${decls}\n}`;
}

function fontsToCss(name: string, fonts: Theme["fonts"]): string {
  const safeName = validatedThemeName(name);
  const display = validatedFontFamily("display", fonts.display);
  const body = validatedFontFamily("body", fonts.body);
  const mono = validatedFontFamily("mono", fonts.mono);
  return `[data-theme="${safeName}"] {\n  --font-display: ${display};\n  --font-body: ${body};\n  --font-mono: ${mono};\n}`;
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

/**
 * loadThemeFonts — idempotently inject `<link rel="stylesheet">` for each
 * font URL declared by the theme.
 *
 * T4.2: the previous implementation kept a module-level `Set` to track
 * already-injected URLs. That singleton broke test isolation (state
 * leaked across renders) and silently skipped injection in micro-frontend
 * setups with multiple `<ThemeProvider>` mounts. Replaced with a DOM
 * check: we query `document.head` for an existing link with the same
 * `href` before appending a new one. The DOM is the single source of
 * truth; no shared state across instances.
 */
function loadThemeFonts(theme: Theme): void {
  if (typeof document === "undefined") return;
  if (!theme.fontUrls) return;
  for (const url of theme.fontUrls) {
    // Re-audit NEW-001 (SSRF, LOW): defang dangerous protocols on
    // consumer-provided font URLs. Built-in themes use
    // fonts.googleapis.com/gstatic.com — safe. registerTheme accepts
    // arbitrary objects at runtime; a malicious theme could try to inject
    // javascript:/data:text/html via fontUrls. safeHref returns undefined
    // for dangerous protocols, which we skip silently.
    const safe = safeHref(url);
    if (!safe) continue;
    if (document.head.querySelector(`link[rel="stylesheet"][href="${CSS.escape(safe)}"]`)) {
      continue;
    }
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = safe;
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
  /**
   * Initial density. Drives `data-density` on `<html>` and the `--theo-control-h`
   * / `--theo-control-px` CSS vars consumed by form-control `md` variants.
   * Defaults to `"comfortable"` (36px controls — FAANG-tier modern density).
   * Plan: faang-density-tightening (D3).
   */
  defaultDensity?: Density;
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
  defaultDensity = "comfortable",
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

  // T3.2 (SEC-001): eager validation. Calling validatedColor/FontFamily/
  // ThemeName here ensures CSS-injection attempts throw at construction
  // time rather than inside the deferred useEffect that injects the
  // <style>. Production-mode fallbacks keep the app rendering even if a
  // theme has bad values.
  //
  // Re-audit NEW-3: wrapped in useMemo so the validation cost (O(themes *
  // tokens), ~60 ops per built-in theme) only runs when themesProp's
  // reference changes — not on every parent re-render. Consumers passing
  // inline array literals (`themes={[violetForge, classicPaper]}`) would
  // otherwise pay this on every parent update.
  const mergedThemes = useMemo<Theme[]>(() => {
    for (const t of themesProp) {
      validatedThemeName(t.name);
      validatedFontFamily("display", t.fonts.display);
      validatedFontFamily("body", t.fonts.body);
      validatedFontFamily("mono", t.fonts.mono);
      for (const [token, value] of Object.entries(t.light)) {
        validatedColor(token, value);
      }
      for (const [token, value] of Object.entries(t.dark)) {
        validatedColor(token, value);
      }
    }
    // Dedup by theme name; last writer wins (allows registerTheme override).
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

  const [density, setDensityState] = useState<Density>(() => {
    if (typeof window === "undefined" || !storageKey) return defaultDensity;
    try {
      const stored = window.localStorage.getItem(`${storageKey}:density`);
      return stored === "compact" || stored === "comfortable" || stored === "spacious"
        ? stored
        : defaultDensity;
    } catch (err) {
      warnStorageFailure("read density", err);
      return defaultDensity;
    }
  });

  // Inject CSS vars whenever the themes list changes.
  useEffect(() => {
    injectThemeCss(themes);
  }, [themes]);

  // Apply data-theme + data-mode + data-density to <html>, load fonts,
  // inject density CSS vars.
  useEffect(() => {
    if (typeof document === "undefined") return;
    const active = themes.find((t) => t.name === themeName) ?? themes[0];
    if (!active) return;
    document.documentElement.setAttribute("data-theme", active.name);
    document.documentElement.setAttribute("data-mode", mode);
    document.documentElement.setAttribute("data-density", density);
    document.documentElement.classList.toggle("dark", mode === "dark");
    loadThemeFonts(active);
    injectDensityCss();
  }, [themeName, mode, density, themes]);

  // Persist on change.
  useEffect(() => {
    if (typeof window === "undefined" || !storageKey) return;
    try {
      window.localStorage.setItem(`${storageKey}:name`, themeName);
      window.localStorage.setItem(`${storageKey}:mode`, mode);
      window.localStorage.setItem(`${storageKey}:density`, density);
    } catch (err) {
      // Storage may fail in private mode; behavior remains correct (state
      // lives in memory). Per HIGH-006 we surface a one-time dev warning so
      // the engineer sees something instead of complete silence.
      warnStorageFailure("persist theme + mode + density", err);
    }
  }, [themeName, mode, density, storageKey]);

  const setTheme = useCallback((name: string) => setThemeName(name), []);
  const setMode = useCallback((next: ThemeMode) => setModeState(next), []);
  const toggleMode = useCallback(
    () => setModeState((cur) => (cur === "light" ? "dark" : "light")),
    [],
  );
  const setDensity = useCallback((next: Density) => setDensityState(next), []);
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

  const densityValue = useMemo(() => ({ density, setDensity }), [density, setDensity]);

  return (
    <ThemeContext.Provider value={value}>
      <DensityContext.Provider value={densityValue}>{children}</DensityContext.Provider>
    </ThemeContext.Provider>
  );
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
