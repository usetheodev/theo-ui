"use client";

import { AlertTriangle, Check, RotateCcw } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import type { ChangeEvent, JSX } from "react";

import { cn } from "../lib/cn.js";
import { auditColorScale, cssColorToHex } from "./contrast.js";
import type { ContrastFinding } from "./contrast.js";
import { defineTheme } from "./define.js";
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

/** The colour tokens the editor exposes. Everything else is derived or inherited. */
const EDITABLE_COLORS = [
  "background",
  "foreground",
  "card",
  "card-foreground",
  "primary",
  "primary-foreground",
  "accent",
  "accent-foreground",
  "muted",
  "muted-foreground",
  "border",
] as const satisfies readonly (keyof ColorScale)[];

/** Where the corner control starts, and what Reset returns to. */
const DEFAULT_RADIUS = "10px";

const RADIUS_VALUES = ["0px", "4px", "10px", "16px", "24px"] as const;

/** Where the density control starts. `4px` is the scale every spacing utility multiplies. */
const DEFAULT_SPACING = "4px";

const SPACING_VALUES = ["3px", "4px", "5px"] as const;

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
  colours: Record<(typeof EDITABLE_COLORS)[number], string>;
  corners: Record<(typeof RADIUS_VALUES)[number], string>;
  density: Record<(typeof SPACING_VALUES)[number], string>;
}

const DEFAULT_LABELS: ThemeEditorLabels = {
  heading: "Theme",
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
    primary: "Primary",
    "primary-foreground": "On primary",
    accent: "Accent",
    "accent-foreground": "On accent",
    muted: "Muted",
    "muted-foreground": "Muted text",
    border: "Border",
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
type DeepPartialLabels = Partial<Omit<ThemeEditorLabels, "colours" | "corners" | "density">> & {
  colours?: Partial<ThemeEditorLabels["colours"]>;
  corners?: Partial<ThemeEditorLabels["corners"]>;
  density?: Partial<ThemeEditorLabels["density"]>;
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
  const [origin] = useState<Partial<ColorScale>>(() => {
    const scale = active[mode];
    const seed: Partial<ColorScale> = {};
    for (const token of EDITABLE_COLORS) seed[token] = scale[token];
    return seed;
  });
  const [baseScale] = useState<ColorScale>(() => active[mode]);
  const [colors, setColors] = useState<Partial<ColorScale>>(origin);
  const [radius, setRadius] = useState<string>(DEFAULT_RADIUS);
  const [spacing, setSpacing] = useState<string>(DEFAULT_SPACING);

  // Audited against the palette the editor opened on, not the live one — the live one already
  // contains these edits, so folding it in would compare a change against itself.
  const scale = useMemo(() => ({ ...baseScale, ...colors }), [baseScale, colors]);
  const findings = useMemo(() => auditColorScale(scale), [scale]);
  const failing = findings.filter((f) => !f.passes);
  const readable = failing.length === 0;

  const build = useCallback(
    (nextColors: Partial<ColorScale>, nextRadius: string, nextSpacing: string): Theme =>
      defineTheme({
        name,
        label: "Custom",
        [mode]: nextColors,
        radius: buildRadius(nextRadius),
        spacing: nextSpacing,
        // The mode not being edited inherits, which `defineTheme` warns about in development. The
        // warning is right for a theme written in a file and wrong here: this editor edits one
        // mode at a time by design, and the person can switch modes and edit the other.
        [mode === "dark" ? "light" : "dark"]: {},
      } as Parameters<typeof defineTheme>[0]),
    [mode, name],
  );

  /** Applies live: the page repaints from the cascade, with no rebuild and no reload. */
  const apply = useCallback(
    (nextColors: Partial<ColorScale>, nextRadius: string, nextSpacing: string) => {
      const next = build(nextColors, nextRadius, nextSpacing);
      registerTheme(next);
      setTheme(next.name);
    },
    [build, registerTheme, setTheme],
  );

  const onColorChange = useCallback(
    (token: keyof ColorScale) => (event: ChangeEvent<HTMLInputElement>) => {
      const next = { ...colors, [token]: event.target.value };
      setColors(next);
      apply(next, radius, spacing);
    },
    [colors, radius, spacing, apply],
  );

  const onRadiusChange = useCallback(
    (value: string) => {
      setRadius(value);
      apply(colors, value, spacing);
    },
    [colors, spacing, apply],
  );

  const onSpacingChange = useCallback(
    (value: string) => {
      setSpacing(value);
      apply(colors, radius, value);
    },
    [colors, radius, apply],
  );

  const reset = useCallback(() => {
    setColors(origin);
    setRadius(DEFAULT_RADIUS);
    setSpacing(DEFAULT_SPACING);
    apply(origin, DEFAULT_RADIUS, DEFAULT_SPACING);
  }, [origin, apply]);

  return (
    <section
      data-slot="theme-editor"
      className={cn("flex flex-col gap-5 rounded-xl border border-border bg-card p-5", className)}
    >
      <header className="flex items-center justify-between gap-3">
        <div>
          <h3 className="font-display text-title-md tracking-tight">Theme</h3>
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
          {labels.colourSection}
        </legend>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(11rem,1fr))] gap-2">
          {EDITABLE_COLORS.map((token) => (
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

      <ContrastReport findings={findings} labels={labels} />

      {onCommit ? (
        <button
          type="button"
          disabled={!readable && !allowFailing}
          onClick={() => {
            onCommit(build(colors, radius, spacing));
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

export { ThemeEditor, buildRadius };
export type { ThemeMode };
