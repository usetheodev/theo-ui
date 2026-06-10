/**
 * Valibot schema for Theme — Phase 2 T2.7 / D5 (revised post-EC-6).
 *
 * Validates the shape and types of a Theme object passed to <ThemeProvider>
 * or registerTheme(). Complements the COLOR_VALUE_PATTERN regex (the second
 * defense layer against CSS injection): valibot validates shape; regex
 * validates that each individual color value is safe to interpolate.
 *
 * Why valibot (not zod): valibot core is ~1.5KB gzipped vs zod ~12KB.
 * <ThemeProvider> is a sync constructor — dynamic import does not tree-shake.
 * For our use case (validating ~37 string fields) valibot is strictly
 * better in bundle size and API parity.
 *
 * Output of safeParse → { success: true, output } or { success: false, issues }.
 * formatThemeIssues() produces human-readable error message with the failing
 * field path so consumers see what to fix.
 */

import * as v from "valibot";

import { COLOR_VALUE_PATTERN } from "./color-value-pattern.js";

const THEME_NAME_PATTERN = /^[a-z][a-z0-9-]*$/;
const FONT_FAMILY_PATTERN = /^[\w\s,"'\-.]+$/;

const colorValueSchema = v.pipe(
  v.string(),
  v.check(
    (value) => COLOR_VALUE_PATTERN.test(value),
    "color value did not match the allowed format (hex, oklch, hsl, rgb, var(), HSL split, or CSS keyword)",
  ),
);

const themeNameSchema = v.pipe(
  v.string(),
  v.check(
    (value) => THEME_NAME_PATTERN.test(value),
    "theme name must match /^[a-z][a-z0-9-]*$/ (lowercase + digits + hyphens, starts with a letter)",
  ),
);

const fontFamilySchema = v.pipe(
  v.string(),
  v.check(
    (value) => FONT_FAMILY_PATTERN.test(value),
    "font family contains disallowed characters (parens, semicolons, etc.)",
  ),
);

const fontsSchema = v.object({
  display: fontFamilySchema,
  body: fontFamilySchema,
  mono: fontFamilySchema,
});

// All 37 ColorScale keys (29 base + 8 status — D4).
const colorScaleSchema = v.object({
  background: colorValueSchema,
  foreground: colorValueSchema,
  card: colorValueSchema,
  "card-foreground": colorValueSchema,
  popover: colorValueSchema,
  "popover-foreground": colorValueSchema,
  primary: colorValueSchema,
  // Optional since T3.2 (ADR-0006) — CSS derives via oklch(from var(--primary) ...).
  "primary-deep": v.optional(colorValueSchema),
  "primary-glow": v.optional(colorValueSchema),
  "primary-foreground": colorValueSchema,
  secondary: colorValueSchema,
  "secondary-foreground": colorValueSchema,
  accent: colorValueSchema,
  "accent-deep": v.optional(colorValueSchema),
  "accent-foreground": colorValueSchema,
  muted: colorValueSchema,
  "muted-foreground": colorValueSchema,
  border: colorValueSchema,
  input: colorValueSchema,
  ring: colorValueSchema,
  success: colorValueSchema,
  "success-foreground": colorValueSchema,
  warning: colorValueSchema,
  "warning-foreground": colorValueSchema,
  destructive: colorValueSchema,
  "destructive-foreground": colorValueSchema,
  info: colorValueSchema,
  "info-foreground": colorValueSchema,
  "status-online": colorValueSchema,
  "status-online-foreground": colorValueSchema,
  "status-offline": colorValueSchema,
  "status-offline-foreground": colorValueSchema,
  "status-degraded": colorValueSchema,
  "status-degraded-foreground": colorValueSchema,
  "status-info": colorValueSchema,
  "status-info-foreground": colorValueSchema,
});

export const themeSchema = v.object({
  name: themeNameSchema,
  label: v.string(),
  description: v.optional(v.string()),
  fonts: fontsSchema,
  light: colorScaleSchema,
  dark: colorScaleSchema,
  fontUrls: v.optional(
    v.array(
      v.pipe(
        v.string(),
        v.url(),
        v.check(
          (value) => /^https?:\/\//i.test(value),
          "fontUrls must use http(s) protocol (javascript:, data:, etc. are rejected)",
        ),
      ),
    ),
  ),
});

export type ThemeIssue = v.InferIssue<typeof themeSchema>;

export interface ThemeValidationResult {
  success: boolean;
  issues?: ThemeIssue[];
}

export function validateTheme(theme: unknown): ThemeValidationResult {
  const result = v.safeParse(themeSchema, theme);
  if (result.success) return { success: true };
  return { success: false, issues: result.issues };
}

export function formatThemeIssues(themeName: string, issues: ThemeIssue[]): string {
  const lines: string[] = [`[@theokit/ui] theme '${themeName}' failed validation:`];
  for (const issue of issues) {
    const path = (issue.path ?? [])
      .map((segment) => (typeof segment.key === "string" ? segment.key : String(segment.key)))
      .join(".");
    lines.push(`  - ${path || "(root)"}: ${issue.message}`);
  }
  return lines.join("\n");
}
