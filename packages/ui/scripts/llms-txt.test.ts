/**
 * `llms.txt` declares itself the project's "factual ground truth". Nothing enforced that.
 *
 * Regression: usetheokit/theokit-ui#73.
 *
 * Three claims in that file had drifted from the code at the same time, and each one costs a
 * consumer (or an agent reading the file, which is its stated audience) real work:
 *
 *   - the version said `1.3.2` while `1.4.5` was published;
 *   - the theme section documented `<ThemeProvider initial=… extra=…>` and
 *     `defineTheme({ mode, palette })` — four prop names that have never existed, so code
 *     written from this file does not compile;
 *   - the theme count said 10 with 11 shipping.
 *
 * The checks below are deliberately narrow. They assert the facts that are cheap to verify
 * against the source and expensive to get wrong — not prose, not the catalog (which
 * `sync:readme` already regenerates).
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const PKG_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const LLMS = readFileSync(join(PKG_ROOT, "llms.txt"), "utf-8");
const PKG = JSON.parse(readFileSync(join(PKG_ROOT, "package.json"), "utf-8")) as {
  version: string;
};
const THEMES_INDEX = readFileSync(join(PKG_ROOT, "src/themes/index.ts"), "utf-8");
const PROVIDER = readFileSync(join(PKG_ROOT, "src/themes/theme-provider.tsx"), "utf-8");
const DEFINE = readFileSync(join(PKG_ROOT, "src/themes/define.ts"), "utf-8");

describe("llms.txt stays true to the source", () => {
  it("states the published version", () => {
    // A stale version is the cheapest possible lie and the first thing a reader anchors on.
    expect(LLMS).toContain(`**Current version:** \`${PKG.version}\``);
  });

  it("counts the built-in themes correctly", () => {
    const entries = /export const builtinThemes = \[([^\]]*)\]/s.exec(THEMES_INDEX)?.[1] ?? "";
    const count = entries
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean).length;

    expect(count).toBeGreaterThan(0);
    expect(LLMS).toContain(`**Built-in themes (${String(count)}):**`);
  });

  it("documents only ThemeProvider props that exist", () => {
    // Extract the prop names the component actually declares, then assert the file mentions
    // none that are absent. This is what would have caught `initial=` and `extra=`.
    const propsBlock = /interface ThemeProviderProps \{([\s\S]*?)\n\}/.exec(PROVIDER)?.[1] ?? "";
    const declared = new Set(
      [...propsBlock.matchAll(/^\s{2}([a-zA-Z]+)\??:/gm)].map((match) => match[1]),
    );
    expect(declared.size).toBeGreaterThan(3);

    const themeSection = LLMS.slice(
      LLMS.indexOf("## Theme system"),
      LLMS.indexOf("## Component catalog"),
    );
    const mentionedAsJsxProp = [...themeSection.matchAll(/<ThemeProvider\s+([^>]*)>/g)]
      .flatMap((match) => [...(match[1] ?? "").matchAll(/([a-zA-Z]+)=/g)].map((p) => p[1]))
      .filter((prop): prop is string => prop !== undefined);

    expect(mentionedAsJsxProp.length).toBeGreaterThan(0);
    for (const prop of mentionedAsJsxProp) {
      expect(declared, `llms.txt documents <ThemeProvider ${prop}=…>`).toContain(prop);
    }
  });

  it("documents only defineTheme fields that exist", () => {
    const inputBlock = /interface DefineThemeInput \{([\s\S]*?)\n\}/.exec(DEFINE)?.[1] ?? "";
    const declared = new Set(
      [...inputBlock.matchAll(/^\s{2}([a-zA-Z]+)\??:/gm)].map((match) => match[1]),
    );
    expect(declared.size).toBeGreaterThan(3);

    // The signature line in the docs, e.g. `defineTheme({ name, label?, dark?, fonts? })`.
    const signature = /defineTheme\(\{([^}]*)\}\)/.exec(LLMS)?.[1] ?? "";
    const documented = signature
      .split(",")
      .map((field) => field.trim().replace(/\?$/, ""))
      .filter(Boolean);

    expect(documented.length).toBeGreaterThan(0);
    for (const field of documented) {
      expect(declared, `llms.txt documents defineTheme({ ${field} })`).toContain(field);
    }
  });

  it("points at the companion package that holds the generic primitives", () => {
    // The gap that started #73: a reader looking for Button/Table/Sidebar found no signpost
    // and rewrote them by hand.
    expect(LLMS).toContain("@usetheo/ui");
    expect(LLMS).toContain("## Which package has what");
  });
});
