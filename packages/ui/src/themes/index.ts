export type {
  ColorScale,
  MotionScale,
  RadiusScale,
  ShadowScale,
  Theme,
  ThemeFonts,
  ThemeMode,
} from "./types.js";
export { ThemeProvider, useTheme } from "./theme-provider.js";
export { ThemeScript } from "./theme-script.js";
export { ThemeSwitcher } from "./theme-switcher.js";
export { ThemeEditor, type ThemeEditorProps } from "./theme-editor.js";
export {
  CONTRAST_PAIRS,
  WCAG_AA,
  auditColorScale,
  contrastLevel,
  contrastRatio,
  cssColorToHex,
  relativeLuminance,
  type ContrastFinding,
  type ContrastLevel,
} from "./contrast.js";
export { violetForge } from "./violet-forge.js";
export { classicPaper } from "./classic-paper.js";
export { auroraTerminal } from "./aurora-terminal.js";
export { defineTheme, type DefineThemeInput } from "./define.js";
export { hex, hexToHsl, rgb, rgbToHslLegacy } from "./color.js";
export { useDensity, type Density, type DensityContextValue } from "./density.js";
// Seven new themes — RFC 0007, plan: seven-themes (2026-05-22).
// Trademark-safe slugs (D1.1) — `*-style` / `*-mono` / `*-glass` suffixes,
// description includes "Inspired by, not affiliated with [X]".
export { vercelMono } from "./vercel-mono.js";
export { githubDark } from "./github-dark.js";
export { dracula } from "./dracula.js";
export { oneDark } from "./one-dark.js";
export { anthropicStyle } from "./anthropic-style.js";
export { openaiStyle } from "./openai-style.js";
export { linearGlass } from "./linear-glass.js";
// The TheoKit brand theme — primary measured from the falcon mark (#DE2329).
export { falconRed } from "./falcon-red.js";

import { anthropicStyle } from "./anthropic-style.js";
import { auroraTerminal } from "./aurora-terminal.js";
import { classicPaper } from "./classic-paper.js";
import { dracula } from "./dracula.js";
import { falconRed } from "./falcon-red.js";
import { githubDark } from "./github-dark.js";
import { linearGlass } from "./linear-glass.js";
import { oneDark } from "./one-dark.js";
import { openaiStyle } from "./openai-style.js";
import { vercelMono } from "./vercel-mono.js";
import { violetForge } from "./violet-forge.js";

/**
 * All themes bundled with Theo UI. Pass to `<ThemeProvider themes={builtinThemes}>`
 * if you want all 11 available out of the box.
 *
 * EC-4 note: passing the full 11-entry list triggers ~66 KB CSS injection in
 * `<style id="theo-ui-theme-vars">`. For apps focused on 1-2 themes, prefer
 * `themes={[falconRed, dracula]}` to keep the payload at ~12 KB.
 *
 * `violetForge` stays first, and therefore the default: `falconRed` carries the TheoKit brand
 * colour, but promoting it to the default is a product decision with a visual-regression blast
 * radius across every consumer, not something a new theme should decide for them.
 */
export const builtinThemes = [
  violetForge,
  falconRed,
  classicPaper,
  auroraTerminal,
  vercelMono,
  githubDark,
  dracula,
  oneDark,
  anthropicStyle,
  openaiStyle,
  linearGlass,
];
