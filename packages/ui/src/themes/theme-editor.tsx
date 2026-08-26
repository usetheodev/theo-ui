"use client";

import { AlertTriangle, Check, RotateCcw } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import type { ChangeEvent, JSX } from "react";

import { cn } from "../lib/cn.js";
import { auditColorScale, cssColorToHex } from "./contrast.js";
import type { ContrastFinding } from "./contrast.js";
import { defineTheme } from "./define.js";
import { deriveColorScale } from "./derive.js";
import { useTheme } from "./theme-provider.js";
import type { ColorScale, RadiusScale, Theme, ThemeMode } from "./types.js";

/**
 * ThemeEditor — build a theme by hand, with the accessibility check running while you do it.
 *
 * The point of this component is the last part. Picking colours in a UI is easy and every design
 * system offers it; what separates a usable editor from a toy is refusing to hand back a palette
 * nobody can read. That failure is invisible while you work — a badge at 1.61:1 looks like a badge,
 * just quiet — and it survives typecheck, lint, tests and build, because none of them look at
 * colour. The only place it can be caught is here, at the moment somebody chooses.
 *
 * Applying is live: every change writes a theme through `registerTheme` and the page repaints from
 * the cascade, no rebuild. Shape is included because the radii now defer to runtime variables
 * (usetheokit/theokit-ui#88) — before that, corners were fixed at build time and an editor could
 * only offer half the job.
 *
 * `onCommit` is where the result leaves this component. It is called with a real `Theme`, so the
 * consumer can persist it, ship it to a server, or write it into a file — this component has no
 * opinion about where a theme lives.
 */

/**
 * Every colour a theme has, grouped by the question a person is answering.
 *
 * The editor used to show eleven of the twenty-nine, which meant the other eighteen could only be
 * changed by writing a theme file — a "customise your theme" screen that quietly could not.
 * Showing all of them as one flat wall of swatches is the other failure, so they are grouped and
 * the groups after the first are collapsed: the common case stays two decisions, and the rest is
 * one click away instead of unreachable.
 *
 * The optional tonal variants (`primary-deep`, `accent-deep`, `primary-glow`) are deliberately
 * absent — they are derived in CSS from their base via `oklch(from ...)`, and offering a control
 * that silently stops that derivation would trade a feature for a footgun.
 */
const COLOR_GROUPS = [
  {
    id: "surfaces",
    tokens: [
      "background",
      "foreground",
      "card",
      "card-foreground",
      "popover",
      "popover-foreground",
    ],
  },
  {
    id: "brand",
    tokens: [
      "primary",
      "primary-foreground",
      "secondary",
      "secondary-foreground",
      "accent",
      "accent-foreground",
    ],
  },
  { id: "neutrals", tokens: ["muted", "muted-foreground", "border", "input", "ring"] },
  {
    id: "semantic",
    tokens: [
      "destructive",
      "destructive-foreground",
      "success",
      "success-foreground",
      "warning",
      "warning-foreground",
      "info",
      "info-foreground",
    ],
  },
  {
    id: "status",
    tokens: [
      "status-online",
      "status-online-foreground",
      "status-offline",
      "status-offline-foreground",
      "status-degraded",
      "status-degraded-foreground",
      "status-info",
      "status-info-foreground",
    ],
  },
] as const satisfies readonly { id: string; tokens: readonly (keyof ColorScale)[] }[];

/**
 * Flat list, for seeding and for the derivation to write into.
 *
 * Typed from the groups rather than as `keyof ColorScale`, so the label record covers exactly the
 * tokens with a control and not the three optional tonal variants — those are derived in CSS from
 * their base and have no swatch here.
 */
type EditableColor = (typeof COLOR_GROUPS)[number]["tokens"][number];
const EDITABLE_COLORS: readonly EditableColor[] = COLOR_GROUPS.flatMap((g) => [...g.tokens]);

/** Where the corner control starts, and what Reset returns to. */
const DEFAULT_RADIUS = "10px";

const RADIUS_VALUES = ["0px", "4px", "10px", "16px", "24px"] as const;

/** Where the density control starts. `4px` is the scale every spacing utility multiplies. */
const DEFAULT_SPACING = "4px";

const SPACING_VALUES = ["3px", "4px", "5px"] as const;

/**
 * Elevation presets, as whole languages rather than five separate shadows.
 *
 * `none` is a real design position — flat interfaces exist — and the reason this is a preset and
 * not a shadow-per-slot control: five independent shadows that do not agree with each other read
 * as a bug, not as a theme.
 *
 * `inherit` leaves `tokens.css` alone, where the shadows are composed from `--foreground` via
 * `color-mix` and therefore already follow a palette change.
 */
const ELEVATION_PRESETS = {
  inherit: undefined,
  flat: { sm: "none", md: "none", lg: "none" },
  soft: {
    sm: "0 1px 2px 0 rgb(0 0 0 / 0.04)",
    md: "0 2px 6px -2px rgb(0 0 0 / 0.06), 0 1px 2px rgb(0 0 0 / 0.04)",
    lg: "0 8px 24px -8px rgb(0 0 0 / 0.10), 0 3px 8px rgb(0 0 0 / 0.06)",
  },
  strong: {
    sm: "0 1px 3px 0 rgb(0 0 0 / 0.12)",
    md: "0 4px 12px -2px rgb(0 0 0 / 0.18), 0 2px 4px rgb(0 0 0 / 0.10)",
    lg: "0 16px 40px -12px rgb(0 0 0 / 0.28), 0 6px 14px rgb(0 0 0 / 0.14)",
  },
} as const;

/**
 * Motion presets. Durations move together because a UI where hovers are instant and panels are
 * slow reads as unfinished rather than as deliberate.
 *
 * `none` sets every duration to zero rather than removing the transitions, so a component that
 * animates on a class change still lands in the right final state. It is not a substitute for
 * `prefers-reduced-motion`, which `global.css` honours regardless of what a theme says here.
 */
const MOTION_PRESETS = {
  inherit: undefined,
  none: { "duration-fast": "0ms", "duration-base": "0ms", "duration-slow": "0ms" },
  snappy: { "duration-fast": "80ms", "duration-base": "140ms", "duration-slow": "220ms" },
  relaxed: { "duration-fast": "160ms", "duration-base": "280ms", "duration-slow": "480ms" },
} as const;

/**
 * Typography presets: a display face, a body face and a mono face that belong together.
 *
 * Three named faces rather than three free-text fields, for the same reason elevation is a preset —
 * a display serif over a geometric body over a slab mono is three decisions that have to agree, and
 * a picker that lets them disagree mostly produces themes that look broken rather than themes that
 * look different.
 *
 * Every stack ends in a generic family, so a theme still renders when the first choice is missing.
 * Nothing here loads a webfont: `fontUrls` is where a theme asks for one, and a control that
 * silently fetched from a third party would be a surprising thing for a colour picker to do.
 */
const TYPOGRAPHY_PRESETS = {
  inherit: undefined,
  system: {
    display: 'system-ui, -apple-system, "Segoe UI", sans-serif',
    body: 'system-ui, -apple-system, "Segoe UI", sans-serif',
    mono: 'ui-monospace, "SF Mono", "Cascadia Mono", monospace',
  },
  geometric: {
    display: 'Inter, "Helvetica Neue", Arial, sans-serif',
    body: 'Inter, "Helvetica Neue", Arial, sans-serif',
    mono: 'ui-monospace, "JetBrains Mono", monospace',
  },
  editorial: {
    display: 'Georgia, "Times New Roman", serif',
    body: 'Georgia, "Times New Roman", serif',
    mono: 'ui-monospace, "Courier New", monospace',
  },
  monospaced: {
    display: 'ui-monospace, "JetBrains Mono", "SF Mono", monospace',
    body: 'ui-monospace, "JetBrains Mono", "SF Mono", monospace',
    mono: 'ui-monospace, "JetBrains Mono", "SF Mono", monospace',
  },
} as const;

type ElevationKey = keyof typeof ELEVATION_PRESETS;
type MotionKey = keyof typeof MOTION_PRESETS;
type TypographyKey = keyof typeof TYPOGRAPHY_PRESETS;

/**
 * Every string the editor renders.
 *
 * A component that hard-codes its own copy is only usable in the language it was written in — this
 * one shipped into a Portuguese product and rendered "Save theme" in the middle of it. Making the
 * strings a prop is the difference between a component a team can adopt and one they have to fork.
 *
 * `Partial`, so a consumer overrides the words they care about and inherits the rest, rather than
 * restating eleven colour names to translate one button.
 */
export interface ThemeEditorLabels {
  heading: string;
  brandSection: string;
  brandColour: string;
  brandHint: string;
  /** Receives the mode being edited, e.g. `dark`. */
  subtitle: (mode: ThemeMode) => string;
  reset: string;
  colourSection: string;
  cornerSection: string;
  densitySection: string;
  contrastSection: string;
  allPass: string;
  /** Receives how many pairs fall below their threshold. */
  belowMinimum: (count: number) => string;
  save: string;
  /** Receives how many pairs are unreadable, for the opted-in failing case. */
  saveAnyway: (count: number) => string;
  unreadable: string;
  /** Receives the required ratio, e.g. `4.5`. */
  needs: (minimum: number) => string;
  colours: Record<EditableColor, string>;
  groups: Record<(typeof COLOR_GROUPS)[number]["id"], string>;
  elevationSection: string;
  elevation: Record<ElevationKey, string>;
  motionSection: string;
  typographySection: string;
  motion: Record<MotionKey, string>;
  typography: Record<TypographyKey, string>;
  corners: Record<(typeof RADIUS_VALUES)[number], string>;
  density: Record<(typeof SPACING_VALUES)[number], string>;
}

const DEFAULT_LABELS: ThemeEditorLabels = {
  heading: "Theme",
  brandSection: "Brand",
  brandColour: "Brand colour",
  brandHint: "Pick one colour and the rest is derived, contrast included.",
  subtitle: (mode) => `Editing the ${mode} palette. Changes apply as you make them.`,
  reset: "Reset",
  colourSection: "Colour",
  cornerSection: "Corners",
  densitySection: "Density",
  contrastSection: "Contrast",
  allPass: "All pairs pass",
  belowMinimum: (count) => `${String(count)} below WCAG AA`,
  save: "Save theme",
  saveAnyway: (count) => `Save anyway (${String(count)} unreadable)`,
  unreadable: "unreadable",
  needs: (minimum) => `needs ${String(minimum)}`,
  colours: {
    background: "Background",
    foreground: "Text",
    card: "Surface",
    "card-foreground": "Surface text",
    popover: "Overlay",
    "popover-foreground": "Overlay text",
    primary: "Primary",
    "primary-foreground": "On primary",
    secondary: "Secondary",
    "secondary-foreground": "On secondary",
    accent: "Accent",
    "accent-foreground": "On accent",
    muted: "Muted",
    "muted-foreground": "Muted text",
    border: "Border",
    input: "Input border",
    ring: "Focus ring",
    destructive: "Destructive",
    "destructive-foreground": "On destructive",
    success: "Success",
    "success-foreground": "On success",
    warning: "Warning",
    "warning-foreground": "On warning",
    info: "Info",
    "info-foreground": "On info",
    "status-online": "Online",
    "status-online-foreground": "On online",
    "status-offline": "Offline",
    "status-offline-foreground": "On offline",
    "status-degraded": "Degraded",
    "status-degraded-foreground": "On degraded",
    "status-info": "Status info",
    "status-info-foreground": "On status info",
  },
  groups: {
    surfaces: "Surfaces",
    brand: "Brand",
    neutrals: "Neutrals",
    semantic: "Semantic",
    status: "Status",
  },
  elevationSection: "Elevation",
  elevation: { inherit: "Inherit", flat: "Flat", soft: "Soft", strong: "Strong" },
  motionSection: "Motion",
  typographySection: "Typeface",
  motion: { inherit: "Inherit", none: "None", snappy: "Snappy", relaxed: "Relaxed" },
  typography: {
    inherit: "Inherit",
    system: "System",
    geometric: "Geometric",
    editorial: "Editorial",
    monospaced: "Monospaced",
  },
  corners: {
    "0px": "Square",
    "4px": "Slight",
    "10px": "Soft",
    "16px": "Round",
    "24px": "Pill",
  },
  density: {
    "3px": "Compact",
    "4px": "Comfortable",
    "5px": "Spacious",
  },
};

export interface ThemeEditorProps {
  className?: string;
  /**
   * Where the edited theme goes when the person is done.
   *
   * Called with a complete `Theme`. Not called when the audit fails, unless `allowFailing` is set:
   * the component's job is to not hand back something unreadable, and a callback that fires anyway
   * would make the audit decorative.
   */
  onCommit?: (theme: Theme) => void;
  /**
   * Let a failing theme be committed anyway.
   *
   * Exists because a contrast ratio is a floor, not a law: a decorative surface, a disabled state,
   * a brand colour signed off with an exception. The default is `false` so the exception is
   * something a consumer opts into, in code, rather than something a person clicks past.
   */
  allowFailing?: boolean;
  /** Name for the theme being built. Defaults to `custom`. */
  name?: string;
  /**
   * Override any of the strings the editor renders.
   *
   * Partial: pass the words you care about, inherit the rest. Nested groups merge one level, so
   * translating two colour names does not mean restating eleven.
   */
  labels?: DeepPartialLabels;
}

/** `labels` accepts a subset, including a subset of each nested group. */
type DeepPartialLabels = Partial<
  Omit<
    ThemeEditorLabels,
    "colours" | "corners" | "density" | "groups" | "elevation" | "motion" | "typography"
  >
> & {
  colours?: Partial<ThemeEditorLabels["colours"]>;
  corners?: Partial<ThemeEditorLabels["corners"]>;
  density?: Partial<ThemeEditorLabels["density"]>;
  groups?: Partial<ThemeEditorLabels["groups"]>;
  elevation?: Partial<ThemeEditorLabels["elevation"]>;
  motion?: Partial<ThemeEditorLabels["motion"]>;
  typography?: Partial<ThemeEditorLabels["typography"]>;
};

/** One level of merge for the nested groups; a plain spread would drop the untranslated keys. */
function mergeLabels(overrides: DeepPartialLabels | undefined): ThemeEditorLabels {
  if (!overrides) return DEFAULT_LABELS;
  return {
    ...DEFAULT_LABELS,
    ...overrides,
    colours: { ...DEFAULT_LABELS.colours, ...overrides.colours },
    corners: { ...DEFAULT_LABELS.corners, ...overrides.corners },
    density: { ...DEFAULT_LABELS.density, ...overrides.density },
    groups: { ...DEFAULT_LABELS.groups, ...overrides.groups },
    elevation: { ...DEFAULT_LABELS.elevation, ...overrides.elevation },
    motion: { ...DEFAULT_LABELS.motion, ...overrides.motion },
    typography: { ...DEFAULT_LABELS.typography, ...overrides.typography },
  };
}

/**
 * `<input type="color">` accepts hex and nothing else.
 *
 * Every built-in theme is written in OKLCH, so without the conversion the editor opens with every
 * swatch black — the palette is loaded, the control just cannot show it. Black is still the last
 * resort for a value nothing can read, because the input needs *some* string.
 */
function asSwatch(value: string | undefined): string {
  if (value === undefined) return "#000000";
  return cssColorToHex(value) ?? "#000000";
}

function ThemeEditor({
  className,
  onCommit,
  allowFailing = false,
  name = "custom",
  labels: labelOverrides,
}: ThemeEditorProps): JSX.Element {
  const { theme: active, mode, registerTheme, setTheme } = useTheme();
  const labels = useMemo(() => mergeLabels(labelOverrides), [labelOverrides]);

  /**
   * Seeded from the active theme, so the editor opens on what the person is already looking at
   * rather than on a blank palette they have to rebuild from memory.
   *
   * Captured ONCE, and that is not a detail. Applying a change makes the edited theme the active
   * one, so `active` stops being where the person started the moment they touch anything — reading
   * it again in `reset` restored the broken palette instead of the original one, which made the
   * button do nothing visible after the first edit.
   */
  const [origin] = useState<Record<ThemeMode, Partial<ColorScale>>>(() => {
    const seedFor = (m: ThemeMode): Partial<ColorScale> => {
      const scale = active[m];
      const seed: Partial<ColorScale> = {};
      for (const token of EDITABLE_COLORS) seed[token] = scale[token];
      return seed;
    };
    return { light: seedFor("light"), dark: seedFor("dark") };
  });
  const [baseScales] = useState<Record<ThemeMode, ColorScale>>(() => ({
    light: active.light,
    dark: active.dark,
  }));

  /**
   * Both modes are held, and both are emitted.
   *
   * The editor edits whichever mode is active, but a theme is not one palette — it is two, and a
   * person who tunes the dark one and switches to light should not find their work replaced by
   * Violet Forge. Keeping a single scale meant the mode not being edited was emitted as `{}`, which
   * inherits: exactly the silent one-sided theme that `defineTheme` warns about
   * (usetheokit/theokit-ui#81), produced by the tool that is supposed to prevent it.
   */
  const [colorsByMode, setColorsByMode] = useState<Record<ThemeMode, Partial<ColorScale>>>(origin);
  const colors = colorsByMode[mode];
  const [radius, setRadius] = useState<string>(DEFAULT_RADIUS);
  const [spacing, setSpacing] = useState<string>(DEFAULT_SPACING);
  const [elevation, setElevation] = useState<ElevationKey>("inherit");
  const [motion, setMotion] = useState<MotionKey>("inherit");
  const [typography, setTypography] = useState<TypographyKey>("inherit");
  const [openGroup, setOpenGroup] = useState<string>(COLOR_GROUPS[0].id);

  // Audited against the palette the editor opened on, not the live one — the live one already
  // contains these edits, so folding it in would compare a change against itself.
  const scale = useMemo(() => ({ ...baseScales[mode], ...colors }), [baseScales, mode, colors]);
  const findings = useMemo(() => auditColorScale(scale), [scale]);
  const failing = findings.filter((f) => !f.passes);
  const readable = failing.length === 0;

  const build = useCallback(
    (
      nextByMode: Record<ThemeMode, Partial<ColorScale>>,
      nextRadius: string,
      nextSpacing: string,
      nextElevation: ElevationKey = elevation,
      nextMotion: MotionKey = motion,
      nextTypography: TypographyKey = typography,
    ): Theme =>
      defineTheme({
        name,
        label: "Custom",
        // BOTH modes, always. Emitting `{}` for the one not being edited inherits it from Violet
        // Forge — the silent one-sided theme `defineTheme` warns about, produced by the very tool
        // meant to prevent it. Seeded from the active theme, so an untouched mode carries what it
        // already had rather than nothing.
        light: nextByMode.light,
        dark: nextByMode.dark,
        radius: buildRadius(nextRadius),
        spacing: nextSpacing,
        shadows: ELEVATION_PRESETS[nextElevation],
        motion: MOTION_PRESETS[nextMotion],
        fonts: TYPOGRAPHY_PRESETS[nextTypography],
      }),
    [name, elevation, motion, typography],
  );

  /** Applies live: the page repaints from the cascade, with no rebuild and no reload. */
  const apply = useCallback(
    (
      nextByMode: Record<ThemeMode, Partial<ColorScale>>,
      nextRadius: string,
      nextSpacing: string,
      nextElevation?: ElevationKey,
      nextMotion?: MotionKey,
      nextTypography?: TypographyKey,
    ) => {
      const next = build(
        nextByMode,
        nextRadius,
        nextSpacing,
        nextElevation,
        nextMotion,
        nextTypography,
      );
      registerTheme(next);
      setTheme(next.name);
    },
    [build, registerTheme, setTheme],
  );

  /** Writes a palette for the mode being edited, leaving the other one as it was. */
  const commitColors = useCallback(
    (next: Partial<ColorScale>) => {
      const byMode = { ...colorsByMode, [mode]: next };
      setColorsByMode(byMode);
      return byMode;
    },
    [colorsByMode, mode],
  );

  const onColorChange = useCallback(
    (token: keyof ColorScale) => (event: ChangeEvent<HTMLInputElement>) => {
      apply(commitColors({ ...colors, [token]: event.target.value }), radius, spacing);
    },
    [colors, radius, spacing, apply, commitColors],
  );

  const onRadiusChange = useCallback(
    (value: string) => {
      setRadius(value);
      apply(colorsByMode, value, spacing);
    },
    [colorsByMode, spacing, apply],
  );

  /**
   * One colour becomes the whole palette.
   *
   * This is the control that makes the editor usable by someone who is not a designer. Choosing
   * twenty-nine colours is a design job; choosing one and deriving the rest is what Radix and
   * Material 3 do, and it only works because the derivation solves for contrast rather than
   * interpolating — the result clears the audit by construction.
   *
   * Only the tokens this editor shows are taken. The derivation produces the full scale, but
   * writing tokens the person cannot see back into their theme would change things they never
   * chose and cannot undo from here.
   */
  const onSeedChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const derived = deriveColorScale({ seed: event.target.value, mode });
      if (!derived) return;

      const next: Partial<ColorScale> = { ...colors };
      for (const token of EDITABLE_COLORS) next[token] = derived[token];
      apply(commitColors(next), radius, spacing);
    },
    [colors, radius, spacing, mode, apply, commitColors],
  );

  const onSpacingChange = useCallback(
    (value: string) => {
      setSpacing(value);
      apply(colorsByMode, radius, value);
    },
    [colorsByMode, radius, apply],
  );

  const onElevationChange = useCallback(
    (value: ElevationKey) => {
      setElevation(value);
      apply(colorsByMode, radius, spacing, value, motion);
    },
    [colorsByMode, radius, spacing, motion, apply],
  );

  const onMotionChange = useCallback(
    (value: MotionKey) => {
      setMotion(value);
      apply(colorsByMode, radius, spacing, elevation, value);
    },
    [colorsByMode, radius, spacing, elevation, apply],
  );

  const onTypographyChange = useCallback(
    (value: TypographyKey) => {
      setTypography(value);
      apply(colorsByMode, radius, spacing, elevation, motion, value);
    },
    [colorsByMode, radius, spacing, elevation, motion, apply],
  );

  const reset = useCallback(() => {
    setColorsByMode(origin);
    setRadius(DEFAULT_RADIUS);
    setSpacing(DEFAULT_SPACING);
    setElevation("inherit");
    setMotion("inherit");
    setTypography("inherit");
    apply(origin, DEFAULT_RADIUS, DEFAULT_SPACING, "inherit", "inherit", "inherit");
  }, [origin, apply]);

  return (
    <section
      data-slot="theme-editor"
      className={cn("flex flex-col gap-5 rounded-xl border border-border bg-card p-5", className)}
    >
      <header className="flex items-center justify-between gap-3">
        <div>
          <h3 className="font-display text-title-md tracking-tight">{labels.heading}</h3>
          <p className="text-body-sm text-muted-foreground">{labels.subtitle(mode)}</p>
        </div>
        <button
          type="button"
          onClick={reset}
          className={cn(
            "inline-flex h-9 items-center gap-2 rounded-lg border border-border/60 px-3",
            "font-medium text-body-sm transition-colors hover:bg-muted",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          )}
        >
          <RotateCcw className="size-4" aria-hidden="true" />
          {labels.reset}
        </button>
      </header>

      <fieldset className="flex flex-col gap-2">
        <legend className="pb-2 font-mono text-label text-muted-foreground uppercase tracking-wider">
          {labels.brandSection}
        </legend>
        <label className="flex items-center gap-3 text-body-sm">
          <input
            type="color"
            onChange={onSeedChange}
            aria-label={labels.brandColour}
            className="size-9 shrink-0 cursor-pointer rounded-md border border-border/60 bg-transparent"
          />
          <span className="min-w-0 text-muted-foreground">{labels.brandHint}</span>
        </label>
      </fieldset>

      <fieldset className="flex flex-col gap-2">
        <legend className="pb-2 font-mono text-label text-muted-foreground uppercase tracking-wider">
          {labels.colourSection}
        </legend>
        {/*
          Grouped and collapsed rather than one wall of thirty-three swatches. `<details>` because
          it is a disclosure and the browser already knows how to do one — keyboard, screen reader
          and the open/closed state come free, and none of them survive a hand-rolled version
          intact.
        */}
        {COLOR_GROUPS.map((group) => (
          <details
            key={group.id}
            open={openGroup === group.id}
            onToggle={(event) => {
              if (event.currentTarget.open) setOpenGroup(group.id);
            }}
            className="rounded-lg border border-border/60"
          >
            <summary className="cursor-pointer px-3 py-2 font-medium text-body-sm marker:text-muted-foreground">
              {labels.groups[group.id]}
              <span className="ml-2 font-mono text-label text-muted-foreground">
                {group.tokens.length}
              </span>
            </summary>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(11rem,1fr))] gap-2 px-3 pt-1 pb-3">
              {group.tokens.map((token) => (
                <label key={token} className="flex items-center gap-2 text-body-sm">
                  <input
                    type="color"
                    value={asSwatch(colors[token])}
                    onChange={onColorChange(token)}
                    aria-label={labels.colours[token]}
                    className="size-7 shrink-0 cursor-pointer rounded-md border border-border/60 bg-transparent"
                  />
                  <span className="min-w-0 truncate">{labels.colours[token]}</span>
                </label>
              ))}
            </div>
          </details>
        ))}
      </fieldset>

      <fieldset className="flex flex-col gap-2">
        <legend className="pb-2 font-mono text-label text-muted-foreground uppercase tracking-wider">
          {labels.cornerSection}
        </legend>
        {/*
          Real radio inputs rather than buttons carrying `role="radio"`. The ARIA role would
          describe the behaviour without providing it: a native radio group is one tab stop with
          arrow-key movement between options, which a set of buttons is not, and rebuilding that
          by hand is how a control ends up announcing one thing and doing another.

          The input is visually hidden rather than `display: none`, which would take it out of the
          accessibility tree along with the focus ring.
        */}
        <div className="flex flex-wrap gap-2">
          {RADIUS_VALUES.map((value) => (
            <label
              key={value}
              className={cn(
                "inline-flex h-9 cursor-pointer items-center px-3",
                "font-medium text-body-sm transition-colors",
                "border has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring",
                radius === value
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border/60 hover:bg-muted",
              )}
              style={{ borderRadius: value }}
            >
              <input
                type="radio"
                name="theme-editor-radius"
                value={value}
                checked={radius === value}
                onChange={() => {
                  onRadiusChange(value);
                }}
                className="sr-only"
              />
              {labels.corners[value]}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-2">
        <legend className="pb-2 font-mono text-label text-muted-foreground uppercase tracking-wider">
          {labels.densitySection}
        </legend>
        {/*
          One value, and every `p-*`, `gap-*` and `m-*` utility moves with it: they all compile to
          `calc(var(--spacing) * n)`. A whole-UI rhythm control for one custom property.
        */}
        <div className="flex flex-wrap gap-2">
          {SPACING_VALUES.map((value) => (
            <label
              key={value}
              className={cn(
                "inline-flex h-9 cursor-pointer items-center rounded-lg px-3",
                "font-medium text-body-sm transition-colors",
                "border has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring",
                spacing === value
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border/60 hover:bg-muted",
              )}
            >
              <input
                type="radio"
                name="theme-editor-spacing"
                value={value}
                checked={spacing === value}
                onChange={() => {
                  onSpacingChange(value);
                }}
                className="sr-only"
              />
              {labels.density[value]}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-2">
        <legend className="pb-2 font-mono text-label text-muted-foreground uppercase tracking-wider">
          {labels.elevationSection}
        </legend>
        <PresetRow
          name="theme-editor-elevation"
          options={Object.keys(ELEVATION_PRESETS) as ElevationKey[]}
          value={elevation}
          labels={labels.elevation}
          onChange={onElevationChange}
        />
      </fieldset>

      <fieldset className="flex flex-col gap-2">
        <legend className="pb-2 font-mono text-label text-muted-foreground uppercase tracking-wider">
          {labels.motionSection}
        </legend>
        <PresetRow
          name="theme-editor-motion"
          options={Object.keys(MOTION_PRESETS) as MotionKey[]}
          value={motion}
          labels={labels.motion}
          onChange={onMotionChange}
        />
      </fieldset>

      <fieldset className="flex flex-col gap-2">
        <legend className="pb-2 font-mono text-label text-muted-foreground uppercase tracking-wider">
          {labels.typographySection}
        </legend>
        <PresetRow
          name="theme-editor-typography"
          options={Object.keys(TYPOGRAPHY_PRESETS) as TypographyKey[]}
          value={typography}
          labels={labels.typography}
          onChange={onTypographyChange}
        />
      </fieldset>

      <ContrastReport findings={findings} labels={labels} />

      {onCommit ? (
        <button
          type="button"
          disabled={!readable && !allowFailing}
          onClick={() => {
            onCommit(build(colorsByMode, radius, spacing, elevation, motion, typography));
          }}
          className={cn(
            "inline-flex h-10 items-center justify-center gap-2 rounded-lg px-4",
            "font-medium text-body-sm transition-colors",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            "disabled:cursor-not-allowed disabled:opacity-50",
            "bg-primary text-primary-foreground hover:bg-primary/90",
          )}
        >
          <Check className="size-4" aria-hidden="true" />
          {readable ? labels.save : labels.saveAnyway(failing.length)}
        </button>
      ) : null}
    </section>
  );
}

/**
 * A row of radios sharing one name.
 *
 * Extracted because elevation, motion and density are the same control three times, and three
 * copies of a native radio group is three chances to forget the shared `name` that makes it one.
 */
function PresetRow<T extends string>({
  name,
  options,
  value,
  labels,
  onChange,
}: {
  name: string;
  options: readonly T[];
  value: T;
  labels: Record<T, string>;
  onChange: (next: T) => void;
}): JSX.Element {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => (
        <label
          key={option}
          className={cn(
            "inline-flex h-9 cursor-pointer items-center rounded-lg px-3",
            "font-medium text-body-sm transition-colors",
            "border has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring",
            value === option
              ? "border-primary bg-primary/10 text-primary"
              : "border-border/60 hover:bg-muted",
          )}
        >
          <input
            type="radio"
            name={name}
            value={option}
            checked={value === option}
            onChange={() => {
              onChange(option);
            }}
            className="sr-only"
          />
          {labels[option]}
        </label>
      ))}
    </div>
  );
}

/**
 * The audit, shown in full rather than as a pass/fail badge.
 *
 * Someone dragging a colour wants to watch the ratio approach 4.5, not discover at the end that it
 * never got there. Failures are listed first because they are what needs action.
 */
function ContrastReport({
  findings,
  labels,
}: {
  findings: ContrastFinding[];
  labels: ThemeEditorLabels;
}): JSX.Element {
  const failing = findings.filter((f) => !f.passes);
  const ordered = [...failing, ...findings.filter((f) => f.passes)];

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <span className="font-mono text-label text-muted-foreground uppercase tracking-wider">
          {labels.contrastSection}
        </span>
        {failing.length > 0 ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-destructive/15 px-2 py-0.5 font-mono text-destructive text-label uppercase">
            <AlertTriangle className="size-3" aria-hidden="true" />
            {labels.belowMinimum(failing.length)}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full bg-success/15 px-2 py-0.5 font-mono text-label text-success uppercase">
            <Check className="size-3" aria-hidden="true" />
            {labels.allPass}
          </span>
        )}
      </div>

      {/* A live region, because the number changes as a colour is dragged and a screen-reader user
          would otherwise get no feedback at all from this panel. */}
      <ul aria-live="polite" className="flex flex-col gap-1">
        {ordered.map((finding) => (
          <li
            key={`${finding.foreground}-${finding.background}`}
            className="flex items-center justify-between gap-3 font-mono text-label"
          >
            <span className="min-w-0 truncate text-muted-foreground">
              {finding.foreground} on {finding.background}
            </span>
            <span
              className={cn(
                "shrink-0 tabular-nums",
                finding.passes ? "text-success" : "text-destructive",
              )}
            >
              {finding.ratio === null
                ? labels.unreadable
                : `${finding.ratio.toFixed(2)}:1 · ${labels.needs(finding.minimum)}`}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** One slider value becomes the whole radius scale, kept in proportion. */
function buildRadius(base: string): RadiusScale {
  const px = Number.parseFloat(base);
  if (!Number.isFinite(px)) return { DEFAULT: base };
  const step = (factor: number): string => `${String(Math.round(px * factor))}px`;

  return {
    none: "0px",
    sm: step(0.3),
    md: step(0.5),
    lg: step(0.75),
    xl: base,
    "2xl": step(1.4),
    full: "9999px",
    DEFAULT: base,
  };
}

export { DEFAULT_LABELS, ThemeEditor, buildRadius };
export type { ThemeMode };
