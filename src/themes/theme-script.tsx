/**
 * ThemeScript — inline `<script>` for SSR-safe theme initialization.
 *
 * Renders a synchronous script that runs BEFORE React hydration. It reads the
 * persisted theme + mode from localStorage (or falls back to the defaults) and
 * sets `data-theme` / `data-mode` on `<html>`, plus the `.dark` class when
 * mode is dark. This eliminates FOUC and avoids hydration mismatch warnings
 * when the user's persisted choice differs from the SSR defaults.
 *
 * Place this in `<head>` ABOVE `<body>`. The component does not need to live
 * inside `<ThemeProvider>`.
 *
 * Security: the inline script is built from `JSON.stringify`-encoded literals
 * (no user input), so it is not a `dangerouslySetInnerHTML` XSS vector.
 *
 * Example (Next.js App Router): see docs/design-system.md → SSR section.
 * Pass `defaultTheme` and `defaultMode` to align with the consumer's
 * preferred initial state. Always wrap the root in `<html
 * suppressHydrationWarning>` to silence the expected one-render diff.
 */
import type { JSX } from "react";
import type { ThemeMode } from "./types.js";

interface ThemeScriptProps {
  /** Theme name to apply when no persisted value exists. Default `"violet-forge"`. */
  defaultTheme?: string;
  /** Mode to apply when no persisted value exists. Default `"dark"`. */
  defaultMode?: ThemeMode;
  /**
   * localStorage namespace. Must match the `storageKey` passed to
   * `<ThemeProvider>`. Default `"theo-ui:theme"`. Pass `null` to disable
   * persistence reads (the script will always apply defaults).
   */
  storageKey?: string | null;
}

function buildScript(
  defaultTheme: string,
  defaultMode: ThemeMode,
  storageKey: string | null,
): string {
  const k = JSON.stringify(storageKey);
  const t = JSON.stringify(defaultTheme);
  const m = JSON.stringify(defaultMode);
  return `(function(){try{var k=${k};var d=document.documentElement;var t=null;var m=null;if(k){t=localStorage.getItem(k+":name");m=localStorage.getItem(k+":mode");}d.setAttribute("data-theme",t||${t});d.setAttribute("data-mode",m||${m});if((m||${m})==="dark"){d.classList.add("dark");}}catch(e){}})();`;
}

function ThemeScript({
  defaultTheme = "violet-forge",
  defaultMode = "dark",
  storageKey = "theo-ui:theme",
}: ThemeScriptProps): JSX.Element {
  const code = buildScript(defaultTheme, defaultMode, storageKey);
  // biome-ignore lint/security/noDangerouslySetInnerHtml: payload is JSON.stringify-encoded literals (no user input); intentional for SSR theme bootstrap before React hydrates
  return <script suppressHydrationWarning dangerouslySetInnerHTML={{ __html: code }} />;
}

export { ThemeScript };
