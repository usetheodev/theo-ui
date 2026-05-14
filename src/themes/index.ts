export type { ColorScale, Theme, ThemeFonts, ThemeMode } from "./types.js";
export { ThemeProvider, useTheme } from "./theme-provider.js";
export { ThemeScript } from "./theme-script.js";
export { ThemeSwitcher } from "./theme-switcher.js";
export { violetForge } from "./violet-forge.js";
export { classicPaper } from "./classic-paper.js";
export { auroraTerminal } from "./aurora-terminal.js";

import { auroraTerminal } from "./aurora-terminal.js";
import { classicPaper } from "./classic-paper.js";
import { violetForge } from "./violet-forge.js";

/**
 * All themes bundled with Theo UI. Pass to `<ThemeProvider themes={builtinThemes}>`
 * if you want all of them available out of the box.
 */
export const builtinThemes = [violetForge, classicPaper, auroraTerminal];
