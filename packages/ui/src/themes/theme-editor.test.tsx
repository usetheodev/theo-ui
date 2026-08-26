/**
 * The editor's contract: it applies live, and it refuses to hand back a palette nobody can read.
 *
 * The second half is the reason this component exists. Every design system lets you pick colours;
 * what makes an editor usable is the gate, because a low-contrast palette looks fine while you
 * build it — a badge at 1.61:1 is still a badge, just quiet — and no other gate in this repository
 * looks at colour. Typecheck, lint, tests and build all pass on an unreadable theme.
 */
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { JSX } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { cssColorToHex } from "./contrast.js";
import { DEFAULT_LABELS, ThemeEditor, buildRadius } from "./theme-editor.js";
import { ThemeProvider, useTheme } from "./theme-provider.js";
import type { Theme } from "./types.js";
import { violetForge } from "./violet-forge.js";

afterEach(cleanup);

function mount(props: Parameters<typeof ThemeEditor>[0] = {}) {
  return render(
    <ThemeProvider
      themes={[violetForge]}
      defaultTheme={violetForge.name}
      defaultMode="light"
      respectSystemMode={false}
      storageKey={null}
    >
      <ThemeEditor {...props} />
    </ThemeProvider>,
  );
}

describe("ThemeEditor", () => {
  it("opens on the active palette, not on a blank one", () => {
    mount();

    // The swatch shows hex because `<input type="color">` takes nothing else, while the theme is
    // written in OKLCH — so the assertion is against the converted value, not the raw token. A
    // swatch reading #000000 here would mean the palette never reached the control.
    const background = screen.getByLabelText("Background") as HTMLInputElement;
    expect(background.value.toLowerCase()).toBe(cssColorToHex(violetForge.light.background));
    expect(background.value).not.toBe("#000000");
  });

  it("reports the contrast of every pair, not just a verdict", () => {
    mount();

    // A person dragging a colour needs to watch the number approach the threshold.
    expect(screen.getByText(/foreground on background/)).toBeInTheDocument();
    expect(screen.getAllByText(/:1 · needs/).length).toBeGreaterThan(4);
  });

  it("says so when every pair passes", () => {
    mount();

    expect(screen.getByText(/All pairs pass/i)).toBeInTheDocument();
  });

  it("flags the failures as soon as a colour makes the palette unreadable", () => {
    mount();

    // Text set to almost the background: the exact shape of the defect that shipped in a real
    // product and that no build gate caught.
    fireEvent.change(screen.getByLabelText("Text"), { target: { value: "#fefefe" } });

    expect(screen.getByText(/below WCAG AA/i)).toBeInTheDocument();
  });

  it("refuses to commit an unreadable theme", () => {
    const onCommit = vi.fn();
    mount({ onCommit });

    fireEvent.change(screen.getByLabelText("Text"), { target: { value: "#fefefe" } });
    const save = screen.getByRole("button", { name: /save/i });

    expect(save).toBeDisabled();
    fireEvent.click(save);
    expect(onCommit).not.toHaveBeenCalled();
  });

  it("commits a readable one, as a real Theme", () => {
    const onCommit = vi.fn();
    mount({ onCommit, name: "brand" });

    fireEvent.click(screen.getByRole("button", { name: /save/i }));

    expect(onCommit).toHaveBeenCalledTimes(1);
    const theme = onCommit.mock.calls[0]?.[0] as Theme;
    expect(theme.name).toBe("brand");
    expect(theme.light.background).toBeDefined();
    expect(theme.radius?.DEFAULT).toBeDefined();
  });

  it("allows a failing theme through only when the consumer opted in, in code", () => {
    const onCommit = vi.fn();
    mount({ onCommit, allowFailing: true });

    fireEvent.change(screen.getByLabelText("Text"), { target: { value: "#fefefe" } });
    const save = screen.getByRole("button", { name: /save anyway/i });

    expect(save).not.toBeDisabled();
    fireEvent.click(save);
    expect(onCommit).toHaveBeenCalledTimes(1);
  });

  it("carries the chosen corners into the committed theme", () => {
    const onCommit = vi.fn();
    mount({ onCommit });

    fireEvent.click(screen.getByRole("radio", { name: "Square" }));
    fireEvent.click(screen.getByRole("button", { name: /save/i }));

    const theme = onCommit.mock.calls[0]?.[0] as Theme;
    expect(theme.radius?.DEFAULT).toBe("0px");
    expect(theme.radius?.none).toBe("0px");
  });

  it("uses real radios, so the selection is state rather than an ARIA claim", () => {
    mount();

    // Native inputs give one tab stop and arrow-key movement for free. A set of buttons carrying
    // `role="radio"` announces that behaviour without providing it.
    const pill = screen.getByRole("radio", { name: "Pill" }) as HTMLInputElement;
    fireEvent.click(pill);

    expect(pill.checked).toBe(true);
    expect((screen.getByRole("radio", { name: "Square" }) as HTMLInputElement).checked).toBe(false);
  });

  it("groups each control under its own name, so the two never share state", () => {
    mount();

    // `<fieldset>` + `<legend>` is the grouping; the shared `name` is what makes a set of radios
    // one control rather than several checkboxes.
    const radios = screen.getAllByRole("radio") as HTMLInputElement[];
    const groups = new Set(radios.map((r) => r.name));

    // Five independent controls: corners, density, elevation, motion, typeface. A shared `name`
    // across two of them would make choosing in one clear the other, which is why this counts
    // rather than assumes.
    expect(groups.size).toBe(5);
    expect(radios.filter((r) => r.name === "theme-editor-radius")).toHaveLength(5);
    expect(radios.filter((r) => r.name === "theme-editor-spacing")).toHaveLength(3);
    expect(radios.filter((r) => r.name === "theme-editor-elevation")).toHaveLength(4);
    expect(radios.filter((r) => r.name === "theme-editor-motion")).toHaveLength(4);
    expect(radios.filter((r) => r.name === "theme-editor-typography")).toHaveLength(5);
  });

  it("resets back to the theme it opened on", () => {
    mount();
    const text = screen.getByLabelText("Text") as HTMLInputElement;

    fireEvent.change(text, { target: { value: "#fefefe" } });
    expect(screen.getByText(/below WCAG AA/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /reset/i }));

    expect(screen.getByText(/All pairs pass/i)).toBeInTheDocument();
  });
});

describe("buildRadius", () => {
  it("turns one choice into a scale that stays in proportion", () => {
    const scale = buildRadius("16px");

    expect(scale.none).toBe("0px");
    expect(scale.full).toBe("9999px");
    expect(scale.xl).toBe("16px");
    expect(scale.DEFAULT).toBe("16px");
    // Smaller steps stay smaller, larger stay larger — the scale is not flattened.
    expect(Number.parseFloat(scale.sm ?? "0")).toBeLessThan(Number.parseFloat(scale.md ?? "0"));
    expect(Number.parseFloat(scale["2xl"] ?? "0")).toBeGreaterThan(16);
  });

  it("keeps square square, rather than producing fractional pixels", () => {
    const scale = buildRadius("0px");

    expect(scale.sm).toBe("0px");
    expect(scale["2xl"]).toBe("0px");
  });

  it("falls back to the raw value when it is not a number it can scale", () => {
    expect(buildRadius("var(--x)")).toEqual({ DEFAULT: "var(--x)" });
  });
});

/**
 * Copy is a prop, not a constant.
 *
 * The component shipped into a Portuguese product and rendered "Save theme" in the middle of it —
 * usable only in the language it was written in, which for a component library is the difference
 * between adoption and a fork.
 */
describe("ThemeEditor labels", () => {
  it("renders English by default, so the common case needs no configuration", () => {
    // `onCommit` because the save button only exists when there is somewhere for the theme to go.
    mount({ onCommit: vi.fn() });

    expect(screen.getByRole("button", { name: /save theme/i })).toBeInTheDocument();
    expect(screen.getByText("All pairs pass")).toBeInTheDocument();
  });

  it("takes a full translation", () => {
    mount({
      onCommit: vi.fn(),
      labels: {
        heading: "Aparência",
        save: "Guardar tema",
        allPass: "Todos os pares passam",
        colours: { background: "Fundo" },
        corners: { "0px": "Quadrado" },
      },
    });

    expect(screen.getByRole("button", { name: "Guardar tema" })).toBeInTheDocument();
    expect(screen.getByText("Todos os pares passam")).toBeInTheDocument();
    expect(screen.getByLabelText("Fundo")).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Quadrado" })).toBeInTheDocument();
  });

  it("merges nested groups one level, so translating one colour keeps the other ten", () => {
    mount({ labels: { colours: { background: "Fundo" } } });

    expect(screen.getByLabelText("Fundo")).toBeInTheDocument();
    // Untranslated siblings survive — a plain spread would have dropped them.
    expect(screen.getByLabelText("Primary")).toBeInTheDocument();
    expect(screen.getByLabelText("Border")).toBeInTheDocument();
  });

  it("passes the mode and the counts into the strings that need them", () => {
    mount({
      labels: {
        subtitle: (mode) => `modo: ${mode}`,
        needs: (minimum) => `mínimo ${String(minimum)}`,
      },
    });

    expect(screen.getByText("modo: light")).toBeInTheDocument();
    expect(screen.getAllByText(/mínimo 4.5/).length).toBeGreaterThan(0);
  });
});

describe("ThemeEditor density", () => {
  it("offers the spacing base, which every p-*/gap-*/m-* utility multiplies", () => {
    mount();

    for (const name of ["Compact", "Comfortable", "Spacious"]) {
      expect(screen.getByRole("radio", { name })).toBeInTheDocument();
    }
  });

  it("carries the choice into the committed theme", () => {
    const onCommit = vi.fn();
    mount({ onCommit });

    fireEvent.click(screen.getByRole("radio", { name: "Compact" }));
    fireEvent.click(screen.getByRole("button", { name: /save/i }));

    expect((onCommit.mock.calls[0]?.[0] as Theme).spacing).toBe("3px");
  });

  it("keeps corners and density independent — they are separate radio groups", () => {
    const onCommit = vi.fn();
    mount({ onCommit });

    fireEvent.click(screen.getByRole("radio", { name: "Square" }));
    fireEvent.click(screen.getByRole("radio", { name: "Spacious" }));
    fireEvent.click(screen.getByRole("button", { name: /save/i }));

    const theme = onCommit.mock.calls[0]?.[0] as Theme;
    expect(theme.radius?.DEFAULT).toBe("0px");
    expect(theme.spacing).toBe("5px");
  });
});

describe("ThemeEditor labels are exhaustive", () => {
  it("renders NO default string once every label is overridden", () => {
    // The specific defect this catches: `labels.heading` existed, was documented, and the JSX still
    // rendered the literal "Theme". A label that is defined and never read looks like support for
    // translation and is not.
    //
    // Both halves are DERIVED from `DEFAULT_LABELS` rather than listed by hand — the overrides and
    // the words to search for. A hand-written list covers the labels that existed when it was
    // written, which is how `brandSection` was added and missed by this very test.
    const mark = (key: string): string => `«${key}»`;
    const marked = <T extends Record<string, unknown>>(group: T): T =>
      Object.fromEntries(Object.keys(group).map((k) => [k, mark(k)])) as T;

    // Every nested group is discovered, not listed. Naming `colours`, `corners` and `density` by
    // hand is what let `groups`, `elevation` and `motion` be added and slip past this test — the
    // exact failure it exists to prevent, committed inside the test itself.
    const overrides = Object.fromEntries(
      Object.entries(DEFAULT_LABELS).map(([key, value]) => {
        if (typeof value === "function") return [key, () => mark(key)];
        if (typeof value === "object") return [key, marked(value as Record<string, unknown>)];
        return [key, mark(key)];
      }),
    ) as Parameters<typeof ThemeEditor>[0]["labels"];

    mount({ onCommit: vi.fn(), labels: overrides });

    const rendered = document.querySelector('[data-slot="theme-editor"]');
    const text = rendered?.textContent ?? "";
    expect(text.length, "the editor rendered nothing").toBeGreaterThan(50);

    /** Every default string, flattened — including the nested groups. */
    const defaults = Object.entries(DEFAULT_LABELS).flatMap(([key, value]) => {
      if (typeof value === "string") return [{ key, text: value }];
      if (typeof value === "function") return [];
      return Object.entries(value as Record<string, string>).map(([k, v]) => ({
        key: `${key}.${k}`,
        text: v,
      }));
    });

    for (const { key, text: english } of defaults) {
      expect(text, `${key} ("${english}") is still hard-coded`).not.toContain(english);
    }
  });
});

/**
 * One colour, whole palette.
 *
 * The control that decides whether a non-designer can use this: choosing twenty-nine colours is a
 * design job, choosing one is a preference. It only works because the derivation solves for
 * contrast — an interpolated scale would look plausible and fail the audit for half the hues.
 */
describe("ThemeEditor brand seed", () => {
  function setColour(label: string, value: string): void {
    const input = screen.getByLabelText(label) as HTMLInputElement;
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
    setter?.call(input, value);
    fireEvent.change(input, { target: { value } });
  }

  it("rewrites every swatch the editor shows", () => {
    mount();
    const before = (screen.getByLabelText("Background") as HTMLInputElement).value;

    setColour("Brand colour", "#7C3AED");

    expect((screen.getByLabelText("Background") as HTMLInputElement).value).not.toBe(before);
    expect((screen.getByLabelText("Primary") as HTMLInputElement).value).not.toBe("#000000");
  });

  it("produces a palette that passes the audit, which is the whole point", () => {
    mount();

    // Yellow is the hue a naive derivation gets wrong: bright at every lightness a brand wants.
    setColour("Brand colour", "#facc15");

    expect(screen.getByText(/All pairs pass/i)).toBeInTheDocument();
  });

  it("recovers a broken palette — deriving is also the way back", () => {
    mount();
    // Near-white text: the editor opens on the LIGHT palette, so near-black would read fine here.
    setColour("Text", "#fefefe");
    expect(screen.getByText(/below WCAG AA/i)).toBeInTheDocument();

    setColour("Brand colour", "#10b981");

    expect(screen.getByText(/All pairs pass/i)).toBeInTheDocument();
  });

  it("carries the derived colours into the committed theme", () => {
    const onCommit = vi.fn();
    mount({ onCommit });

    setColour("Brand colour", "#DE2329");
    fireEvent.click(screen.getByRole("button", { name: /save/i }));

    const theme = onCommit.mock.calls[0]?.[0] as Theme;
    expect(theme.light.primary).toBeDefined();
    expect(theme.light.primary).not.toBe(violetForge.light.primary);
  });
});

/**
 * Everything a theme has, reachable from the editor.
 *
 * It used to show eleven of the thirty-three required colour tokens, which made "customise your
 * theme" a screen that quietly could not — the other twenty-two were editable only by writing a
 * theme file. The count is derived from `ColorScale` rather than written down, so a token added to
 * the type without a control fails here.
 */
describe("ThemeEditor covers the whole theme", () => {
  it("offers a control for every required colour token", () => {
    mount();

    const required = Object.keys(violetForge.light).filter(
      // The tonal variants are derived in CSS from their base; a control would stop that.
      (k) => !k.endsWith("-deep") && !k.endsWith("-glow"),
    );
    const swatches = document.querySelectorAll('[data-slot="theme-editor"] input[type="color"]');

    // One per token, plus the brand seed.
    expect(swatches.length).toBe(required.length + 1);
  });

  it("groups them, so thirty-three swatches are not one wall", () => {
    mount();
    const groups = document.querySelectorAll('[data-slot="theme-editor"] details');

    expect(groups.length).toBeGreaterThan(3);
    // Only the first is open: the common case stays short, the rest is one click away.
    expect([...groups].filter((d) => (d as HTMLDetailsElement).open)).toHaveLength(1);
  });

  it("carries elevation into the committed theme", () => {
    const onCommit = vi.fn();
    mount({ onCommit });

    fireEvent.click(screen.getByRole("radio", { name: "Flat" }));
    fireEvent.click(screen.getByRole("button", { name: /save/i }));

    expect((onCommit.mock.calls[0]?.[0] as Theme).shadows?.md).toBe("none");
  });

  it("carries motion into the committed theme", () => {
    const onCommit = vi.fn();
    mount({ onCommit });

    fireEvent.click(screen.getByRole("radio", { name: "Snappy" }));
    fireEvent.click(screen.getByRole("button", { name: /save/i }));

    expect((onCommit.mock.calls[0]?.[0] as Theme).motion?.["duration-base"]).toBe("140ms");
  });

  it("leaves elevation and motion alone unless asked", () => {
    const onCommit = vi.fn();
    mount({ onCommit });

    fireEvent.click(screen.getByRole("button", { name: /save/i }));
    const theme = onCommit.mock.calls[0]?.[0] as Theme;

    // `inherit` must emit nothing, so `tokens.css` — where shadows are composed from the palette —
    // keeps working. An empty object here would override it with silence.
    expect(theme.shadows).toBeUndefined();
    expect(theme.motion).toBeUndefined();
  });

  it("resets elevation and motion with everything else", () => {
    const onCommit = vi.fn();
    mount({ onCommit });

    fireEvent.click(screen.getByRole("radio", { name: "Strong" }));
    fireEvent.click(screen.getByRole("radio", { name: "Relaxed" }));
    fireEvent.click(screen.getByRole("button", { name: /reset/i }));
    fireEvent.click(screen.getByRole("button", { name: /save/i }));

    const theme = onCommit.mock.calls[0]?.[0] as Theme;
    expect(theme.shadows).toBeUndefined();
    expect(theme.motion).toBeUndefined();
  });
});

/**
 * A theme is two palettes, and the editor emits both.
 *
 * Holding one scale meant the mode not being edited went out as `{}`, which inherits from Violet
 * Forge — the silent one-sided theme `defineTheme` warns about (usetheokit/theokit-ui#81), produced
 * by the tool built to prevent it. Somebody tuning dark and switching to light would have found
 * their work replaced by another product's palette.
 */
describe("ThemeEditor emits both modes", () => {
  it("keeps an edit made in the other mode after switching", () => {
    // The test that actually distinguishes the two implementations. Asserting that the untouched
    // mode "still looks like Violet Forge" proves nothing: emitting `{}` inherits from Violet
    // Forge, so both the broken and the fixed version pass it. The difference only shows once BOTH
    // modes have been edited — which is why this switches modes mid-edit.
    const onCommit = vi.fn();

    function ModeSwitch(): JSX.Element {
      const { toggleMode } = useTheme();
      return (
        <button type="button" onClick={toggleMode}>
          switch mode
        </button>
      );
    }

    render(
      <ThemeProvider
        themes={[violetForge]}
        defaultTheme={violetForge.name}
        defaultMode="light"
        respectSystemMode={false}
        storageKey={null}
      >
        <ModeSwitch />
        <ThemeEditor onCommit={onCommit} />
      </ThemeProvider>,
    );

    // Edit light, switch to dark, edit dark, commit.
    fireEvent.change(screen.getByLabelText("Background"), { target: { value: "#f7f7f5" } });
    fireEvent.click(screen.getByRole("button", { name: "switch mode" }));
    fireEvent.change(screen.getByLabelText("Background"), { target: { value: "#0b0b0d" } });
    fireEvent.click(screen.getByRole("button", { name: /save/i }));

    const theme = onCommit.mock.calls.at(-1)?.[0] as Theme;
    expect(theme.dark.background).toBe("#0b0b0d");
    // The one that regresses when only the active mode is emitted.
    expect(theme.light.background).toBe("#f7f7f5");
  });

  it("keeps an edit to one mode out of the other", () => {
    const onCommit = vi.fn();
    mount({ onCommit });

    // A light background, because the editor opens on the light palette and the commit is gated on
    // contrast — `#123456` under dark text fails, and the button correctly refuses to fire.
    fireEvent.change(screen.getByLabelText("Background"), { target: { value: "#f7f7f5" } });
    fireEvent.click(screen.getByRole("button", { name: /save/i }));
    const theme = onCommit.mock.calls[0]?.[0] as Theme;

    expect(theme.light.background).toBe("#f7f7f5");
    expect(theme.dark.background).toBe(violetForge.dark.background);
  });
});

describe("ThemeEditor typography", () => {
  it("offers a typeface control", () => {
    mount();

    for (const name of ["Inherit", "System", "Geometric", "Editorial", "Monospaced"]) {
      expect(screen.getAllByRole("radio", { name }).length).toBeGreaterThan(0);
    }
  });

  it("emits nothing for `inherit`, so tokens.css keeps its own faces", () => {
    const onCommit = vi.fn();
    mount({ onCommit });

    fireEvent.click(screen.getByRole("button", { name: /save/i }));
    const theme = onCommit.mock.calls[0]?.[0] as Theme;

    // `defineTheme` fills fonts from Violet Forge when the input omits them — which is the point:
    // an untouched typeface control must not overwrite what the theme already had.
    expect(theme.fonts).toEqual(violetForge.fonts);
  });

  it("carries a chosen typeface into the committed theme", () => {
    const onCommit = vi.fn();
    mount({ onCommit });

    const editorial = screen
      .getAllByRole("radio", { name: "Editorial" })
      .find((r) => (r as HTMLInputElement).name === "theme-editor-typography");
    fireEvent.click(editorial as HTMLElement);
    fireEvent.click(screen.getByRole("button", { name: /save/i }));

    const theme = onCommit.mock.calls[0]?.[0] as Theme;
    expect(theme.fonts.body).toContain("Georgia");
    expect(theme.fonts.mono).toContain("monospace");
  });

  it("every stack ends in a generic family, so a missing face still renders", () => {
    const onCommit = vi.fn();
    mount({ onCommit });

    for (const preset of ["System", "Geometric", "Editorial", "Monospaced"]) {
      const radio = screen
        .getAllByRole("radio", { name: preset })
        .find((r) => (r as HTMLInputElement).name === "theme-editor-typography");
      fireEvent.click(radio as HTMLElement);
    }
    fireEvent.click(screen.getByRole("button", { name: /save/i }));

    const theme = onCommit.mock.calls.at(-1)?.[0] as Theme;
    for (const slot of ["display", "body", "mono"] as const) {
      expect(theme.fonts[slot]).toMatch(/(sans-serif|serif|monospace)$/);
    }
  });
});

/**
 * The escape hatch from the presets.
 *
 * Presets keep the three faces agreeing and cover the common case; they cannot cover the case that
 * matters most to a design system, which is a company with its own type. "Geometric" is not a brand.
 */
describe("ThemeEditor custom typeface", () => {
  it("offers a field per slot", () => {
    mount();

    for (const slot of ["Display", "Body", "Mono"]) {
      expect(screen.getByText(slot)).toBeInTheDocument();
    }
  });

  it("a typed stack reaches the theme", () => {
    const onCommit = vi.fn();
    mount({ onCommit });

    const bodyField = screen.getByText("Body").parentElement?.querySelector("input");
    fireEvent.change(bodyField as HTMLElement, {
      target: { value: '"Brand Sans", Arial, sans-serif' },
    });
    fireEvent.click(screen.getByRole("button", { name: /save/i }));

    expect((onCommit.mock.calls.at(-1)?.[0] as Theme).fonts.body).toBe(
      '"Brand Sans", Arial, sans-serif',
    );
  });

  it("overrides a preset per slot, leaving the others as the preset set them", () => {
    const onCommit = vi.fn();
    mount({ onCommit });

    const editorial = screen
      .getAllByRole("radio", { name: "Editorial" })
      .find((r) => (r as HTMLInputElement).name === "theme-editor-typography");
    fireEvent.click(editorial as HTMLElement);

    const displayField = screen.getByText("Display").parentElement?.querySelector("input");
    fireEvent.change(displayField as HTMLElement, { target: { value: '"Brand Display", serif' } });
    fireEvent.click(screen.getByRole("button", { name: /save/i }));

    const theme = onCommit.mock.calls.at(-1)?.[0] as Theme;
    expect(theme.fonts.display).toBe('"Brand Display", serif');
    // The preset still owns the slots that were not typed into.
    expect(theme.fonts.body).toContain("Georgia");
  });

  it("ignores a blank field rather than emitting an empty font-family", () => {
    const onCommit = vi.fn();
    mount({ onCommit });

    const bodyField = screen.getByText("Body").parentElement?.querySelector("input");
    fireEvent.change(bodyField as HTMLElement, { target: { value: "   " } });
    fireEvent.click(screen.getByRole("button", { name: /save/i }));

    // An empty `font-family` erases the face instead of leaving it alone, so whitespace is dropped
    // and the theme keeps what it had.
    expect((onCommit.mock.calls.at(-1)?.[0] as Theme).fonts.body).toBe(violetForge.fonts.body);
  });

  it("marks a stack that cannot be injected, instead of taking the page down", () => {
    // The provider throws on a value that could break out of the declaration — right for a theme
    // written in a file, wrong for a field somebody is still typing into. `Font (Bold)` would take
    // the page down on the `(`. So the editor checks first: the text stays, the theme does not
    // receive it, and the field says so.
    const onCommit = vi.fn();
    mount({ onCommit });

    const monoField = screen.getByText("Mono").parentElement?.querySelector("input");

    expect(() => {
      fireEvent.change(monoField as HTMLElement, { target: { value: "Mono (Bold)" } });
    }).not.toThrow();

    expect(monoField).toHaveValue("Mono (Bold)");
    expect(monoField).toHaveAttribute("aria-invalid", "true");
  });

  it("applies it once the text becomes valid again", () => {
    const onCommit = vi.fn();
    mount({ onCommit });

    const monoField = screen.getByText("Mono").parentElement?.querySelector("input");
    fireEvent.change(monoField as HTMLElement, { target: { value: "Mono (Bold)" } });
    fireEvent.change(monoField as HTMLElement, { target: { value: '"Mono Bold", monospace' } });
    fireEvent.click(screen.getByRole("button", { name: /save/i }));

    expect(monoField).toHaveAttribute("aria-invalid", "false");
    expect((onCommit.mock.calls.at(-1)?.[0] as Theme).fonts.mono).toBe('"Mono Bold", monospace');
  });
});
