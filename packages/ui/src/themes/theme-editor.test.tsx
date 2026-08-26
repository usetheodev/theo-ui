/**
 * The editor's contract: it applies live, and it refuses to hand back a palette nobody can read.
 *
 * The second half is the reason this component exists. Every design system lets you pick colours;
 * what makes an editor usable is the gate, because a low-contrast palette looks fine while you
 * build it — a badge at 1.61:1 is still a badge, just quiet — and no other gate in this repository
 * looks at colour. Typecheck, lint, tests and build all pass on an unreadable theme.
 */
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { cssColorToHex } from "./contrast.js";
import { DEFAULT_LABELS, ThemeEditor, buildRadius } from "./theme-editor.js";
import { ThemeProvider } from "./theme-provider.js";
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
    // one control rather than several checkboxes. Corners and density are separate sets, so there
    // are exactly two names — if they collided, choosing a corner would clear the density.
    const radios = screen.getAllByRole("radio") as HTMLInputElement[];
    const groups = new Set(radios.map((r) => r.name));

    // Four independent controls: corners, density, elevation, motion. A shared `name` would make
    // choosing a corner clear the density, which is why this counts rather than assumes.
    expect(groups.size).toBe(4);
    expect(radios.filter((r) => r.name === "theme-editor-radius")).toHaveLength(5);
    expect(radios.filter((r) => r.name === "theme-editor-spacing")).toHaveLength(3);
    expect(radios.filter((r) => r.name === "theme-editor-elevation")).toHaveLength(4);
    expect(radios.filter((r) => r.name === "theme-editor-motion")).toHaveLength(4);
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
