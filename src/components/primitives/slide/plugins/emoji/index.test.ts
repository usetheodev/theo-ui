import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { parseSlide } from "../../parse.js";
import { EMOJI_MAP, emojiPlugin } from "./index.js";

describe("emojiPlugin (T9.1)", () => {
  it("returns plugin object with name 'emoji'", () => {
    const plugin = emojiPlugin();
    expect(plugin.name).toBe("emoji");
    expect(typeof plugin.hastTransform).toBe("function");
  });

  it("map contains ≥100 shortcodes", () => {
    expect(Object.keys(EMOJI_MAP).length).toBeGreaterThanOrEqual(100);
  });

  it("replaces :smile: with 😀", async () => {
    const result = await parseSlide(":smile: hello", { plugins: [emojiPlugin()] });
    const html = renderToStaticMarkup(result.tree);
    expect(html).toContain("\u{1F600}");
    expect(html).not.toContain(":smile:");
  });

  it("replaces multiple shortcodes in one text", async () => {
    const result = await parseSlide(":rocket: launching :fire:", { plugins: [emojiPlugin()] });
    const html = renderToStaticMarkup(result.tree);
    expect(html).toContain("\u{1F680}"); // rocket
    expect(html).toContain("\u{1F525}"); // fire
  });

  it("leaves :unknown_shortcode: as-is", async () => {
    const result = await parseSlide(":totally_not_real_shortcode: text", {
      plugins: [emojiPlugin()],
    });
    const html = renderToStaticMarkup(result.tree);
    expect(html).toContain(":totally_not_real_shortcode:");
  });

  it("ignores shortcodes inside <code> blocks (EC-6)", async () => {
    const result = await parseSlide("Inline: `:rocket:` stays literal", {
      plugins: [emojiPlugin()],
    });
    const html = renderToStaticMarkup(result.tree);
    // The :rocket: inside <code> must NOT be substituted.
    expect(html).toContain("<code>:rocket:</code>");
    expect(html).not.toContain("\u{1F680}");
  });

  it("ignores shortcodes inside <pre> blocks (EC-6)", async () => {
    const md = "```\n:rocket: should stay\n```";
    const result = await parseSlide(md, { plugins: [emojiPlugin()] });
    const html = renderToStaticMarkup(result.tree);
    expect(html).toContain(":rocket:");
    expect(html).not.toContain("\u{1F680}");
  });

  it("replaces shortcodes outside code even when sibling has code (EC-6)", async () => {
    const md = "`:rocket:` stays but :rocket: substitutes";
    const result = await parseSlide(md, { plugins: [emojiPlugin()] });
    const html = renderToStaticMarkup(result.tree);
    expect(html).toContain("<code>:rocket:</code>");
    expect(html).toContain("\u{1F680}"); // the one outside code IS replaced
  });

  it("custom extra map merges on top of defaults", async () => {
    const plugin = emojiPlugin({ extra: { theo: "🎵", smile: "🤘" } });
    const result = await parseSlide(":theo: vibes :smile:", { plugins: [plugin] });
    const html = renderToStaticMarkup(result.tree);
    expect(html).toContain("🎵");
    // Override wins on conflict
    expect(html).toContain("🤘");
  });

  it("zero peer-deps of runtime adicionais (visit-parents is in stack)", async () => {
    // Smoke: plugin loads + runs without throwing.
    const result = await parseSlide(":tada:", { plugins: [emojiPlugin()] });
    expect(result.errors.filter((e) => e.code === "PLUGIN_ERROR")).toHaveLength(0);
    const html = renderToStaticMarkup(result.tree);
    expect(html).toContain("\u{1F389}");
  });
});
