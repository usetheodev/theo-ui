"use client";

/**
 * `useDensity()` — runtime control of the global UI density.
 *
 * FAANG-modern dashboards (Vercel / Linear / Stripe) ship at "comfortable"
 * density: form controls at 36px, body text 14px, card padding 20px. For
 * dense surfaces (data tables, agent tool lists, admin grids) `compact` mode
 * tightens form controls to 32px without touching `sm`/`lg` props the
 * consumer already passed. Spacious mode bumps the default up to 44px for
 * accessibility-first surfaces.
 *
 * Mechanism (EC-1 fix from edge-case review 2026-05-22):
 *   - ThemeProvider sets `data-density="{value}"` on `<html>`.
 *   - A `<style id="theo-ui-density-vars">` block defines CSS custom
 *     properties under each `[data-density=...]` selector:
 *       --theo-control-h, --theo-control-px
 *   - Form-control `cva` variants for the `md` tier read from these vars:
 *       `md: "h-[var(--theo-control-h,2.25rem)] px-[var(--theo-control-px,0.875rem)] text-body-sm"`
 *   - `sm` and `lg` variants stay hardcoded → explicit `size` prop always
 *     wins over density.
 *
 * RFC: `wiki/rfcs/0006-density-faang.md`.
 */
import { createContext, useContext } from "react";

export type Density = "compact" | "comfortable" | "spacious";

export interface DensityContextValue {
  density: Density;
  setDensity: (next: Density) => void;
}

export const DensityContext = createContext<DensityContextValue | undefined>(undefined);

const STYLE_ELEMENT_ID = "theo-ui-density-vars";

const DENSITY_CSS = `[data-density="compact"]     { --theo-control-h: 2rem;    --theo-control-px: 0.75rem; }
[data-density="comfortable"] { --theo-control-h: 2.25rem; --theo-control-px: 0.875rem; }
[data-density="spacious"]    { --theo-control-h: 2.75rem; --theo-control-px: 1rem; }
`;

/**
 * Inject (idempotent) the density CSS variable definitions into the document
 * head. Returns true if the style tag was newly created. Safe to call on
 * every ThemeProvider mount — duplicates are skipped.
 */
export function injectDensityCss(): boolean {
  if (typeof document === "undefined") return false;
  if (document.getElementById(STYLE_ELEMENT_ID)) return false;
  const style = document.createElement("style");
  style.id = STYLE_ELEMENT_ID;
  style.textContent = DENSITY_CSS;
  document.head.appendChild(style);
  return true;
}

/**
 * Read the current density from the active ThemeProvider context. Throws
 * outside the provider so misuse fails loud — analogous to `useTheme`.
 */
export function useDensity(): DensityContextValue {
  const ctx = useContext(DensityContext);
  if (!ctx) {
    throw new Error("useDensity must be used inside <ThemeProvider>.");
  }
  return ctx;
}
