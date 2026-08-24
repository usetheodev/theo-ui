/**
 * ThemeScript — inline `<script>` for SSR-safe theme initialization.
 *
 * Renders a synchronous script that runs BEFORE React hydration. It resolves the mode the way
 * `ThemeProvider` does — the persisted choice first, then the OS `prefers-color-scheme` when
 * `respectSystemMode` is on, then the default — and writes `data-theme` / `data-mode` /
 * `data-density` on the root element, plus the `.dark` class when the mode is dark.
 *
 * Resolving it the SAME way is the whole point. The provider settles the mode again after
 * hydration; if the two disagree the page paints once and repaints, which is precisely the flash
 * this component exists to remove. Pass it the same `defaultTheme`, `defaultMode`, `storageKey`
 * and `respectSystemMode` you pass the provider — `theme-boot-agreement.test.tsx` holds them
 * together across the matrix.
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
 * Example (Next.js App Router): see wiki/design-system/themes.md → SSR section.
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
   * Density to apply when no persisted value exists. Default `"comfortable"`.
   * Mirrors `ThemeProvider`'s `defaultDensity` so the inline-script and
   * the React provider agree on the SSR-default density (and the
   * `data-density` attribute set by this script matches what
   * `ThemeProvider` promotes via its post-mount hydration effect).
   */
  defaultDensity?: "compact" | "comfortable" | "spacious";
  /**
   * localStorage namespace. Must match the `storageKey` passed to
   * `<ThemeProvider>`. Default `"theo-ui:theme"`. Pass `null` to disable
   * persistence reads (the script will always apply defaults).
   */
  storageKey?: string | null;
  /**
   * Follow the OS `prefers-color-scheme` when nothing is stored. Default `true`.
   *
   * Must match the value passed to `<ThemeProvider>`, whose default is also `true`. When the two
   * disagree, the script applies one mode and the provider applies the other the moment React
   * hydrates — the page repaints, which is the flash this component exists to remove.
   */
  respectSystemMode?: boolean;
  /**
   * CSP nonce for the inline `<script>`.
   *
   * A nonce-based `script-src` blocks an unstamped inline script outright, and this one has to run
   * before the first paint or it is worthless. Pass the per-request nonce here on any app that
   * serves one.
   */
  nonce?: string;
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
  defaultDensity: "compact" | "comfortable" | "spacious",
  storageKey: string | null,
  respectSystemMode: boolean,
): string {
  const k = safe(storageKey);
  const t = safe(defaultTheme);
  const m = safe(defaultMode);
  const dn = safe(defaultDensity);
  const sys = respectSystemMode ? "1" : "0";
  // Mirrors ThemeProvider's own resolution, branch for branch: a stored value only counts when it
  // is one of the valid literals, the OS signal decides when nothing is stored and
  // `respectSystemMode` is on, and the default is the last resort — including when the engine has
  // no `matchMedia`, which is exactly where the provider's effect bails out.
  return `(function(){try{var k=${k};var d=document.documentElement;var t=null;var m=null;var dn=null;if(k){t=localStorage.getItem(k+":name");m=localStorage.getItem(k+":mode");dn=localStorage.getItem(k+":density");}if(m!=="dark"&&m!=="light"){m=(${sys}&&window.matchMedia)?(window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"):${m};}if(dn!=="compact"&&dn!=="comfortable"&&dn!=="spacious"){dn=${dn};}d.setAttribute("data-theme",t||${t});d.setAttribute("data-mode",m);d.setAttribute("data-density",dn);d.classList.toggle("dark",m==="dark");}catch(e){}})();`;
}

function ThemeScript({
  defaultTheme = "violet-forge",
  defaultMode = "dark",
  defaultDensity = "comfortable",
  storageKey = "theo-ui:theme",
  respectSystemMode = true,
  nonce,
}: ThemeScriptProps): JSX.Element {
  const code = buildScript(
    defaultTheme,
    defaultMode,
    defaultDensity,
    storageKey,
    respectSystemMode,
  );
  return (
    <script
      nonce={nonce}
      suppressHydrationWarning
      // biome-ignore lint/security/noDangerouslySetInnerHtml: payload is JSON.stringify-encoded literals (no user input); intentional for SSR theme bootstrap before React hydrates
      dangerouslySetInnerHTML={{ __html: code }}
    />
  );
}

export { ThemeScript };
