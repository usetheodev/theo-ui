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
 * Security: every interpolated value is passed through `safe()`, which both
 * `JSON.stringify`s the value AND escapes `<` to `<`. The `<` escape is
 * REQUIRED because `JSON.stringify` alone does NOT escape `/`, so a payload
 * like `"</script><script>alert(1)</script>"` would otherwise break out of
 * the inline `<script>` tag even though it stays inside a JS string literal.
 * (The browser tokenizes `</script>` at the HTML layer before JS parses.)
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

/**
 * Encode a value for safe embedding inside an inline `<script>` block.
 *
 * `JSON.stringify` does NOT escape `/` by default, so `"</script>"` survives
 * as the literal three-character sequence inside the resulting string. When
 * that string is then rendered inside `<script>...</script>`, the browser's
 * HTML tokenizer sees `</script>` and ends the script tag — regardless of
 * whether the JS parser would have kept it inside a string. Escaping `<` to
 * its Unicode escape `<` preserves JS semantics (the JS parser still
 * resolves the escape to `<`) while making the HTML tokenizer happy.
 *
 * Reference: OWASP "JSON-in-script" guidance; React's own server-renderer
 * applies the same escape for inline JSON.
 */
function safe(value: unknown): string {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

function buildScript(
  defaultTheme: string,
  defaultMode: ThemeMode,
  storageKey: string | null,
): string {
  const k = safe(storageKey);
  const t = safe(defaultTheme);
  const m = safe(defaultMode);
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
