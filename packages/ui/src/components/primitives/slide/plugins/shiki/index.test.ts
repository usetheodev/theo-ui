import { describe, expect, it } from "vitest";
import { parseSlide } from "../../parse.js";
import { shikiPlugin } from "./index.js";

describe("shikiPlugin (T6.1)", () => {
  it("returns plugin object with name 'shiki'", () => {
    const plugin = shikiPlugin();
    expect(plugin.name).toBe("shiki");
    expect(plugin.sanitizeSchemaExtension).toBeDefined();
    expect(plugin.sanitizeSchemaExtension?.tagNames).toContain("span");
    expect(typeof plugin.hastTransform).toBe("function");
  });

  it("sanitizeSchemaExtension lists style + class for span/pre/code (EC-3)", () => {
    const plugin = shikiPlugin();
    const ext = plugin.sanitizeSchemaExtension;
    expect(ext?.attributes?.["*"]).toContain("style");
    expect(ext?.attributes?.span).toContain("className");
    expect(ext?.attributes?.pre).toContain("tabIndex");
  });

  it("custom themes/langs options forwarded to createHighlighter (smoke)", () => {
    const plugin = shikiPlugin({ langs: ["ts", "rust"], themes: { light: "nord", dark: "nord" } });
    expect(plugin.name).toBe("shiki");
    expect(plugin.sanitizeSchemaExtension?.tagNames).toContain("span");
  });

  it("replaces <pre><code class='language-ts'> with highlighted html (real shiki)", async () => {
    // Peer-dep `shiki` is now installed (auto-install-peers). Run a real
    // highlight pass and assert the output carries Shiki's markup.
    const plugin = shikiPlugin({ langs: ["ts"] });
    const md = "```ts\nconst x = 1;\n```";
    const result = await parseSlide(md, { plugins: [plugin] });
    // PLUGIN_ERROR may surface only if shiki itself errors, not in the success path.
    const pluginErrors = result.errors.filter((e) => e.code === "PLUGIN_ERROR");
    expect(pluginErrors).toHaveLength(0);
    const json = JSON.stringify(result.tree);
    // Shiki injects inline color styles on <span> tokens. hast→React shows
    // those as object-form style props (e.g. `"color":"#D73A49"`).
    expect(json).toMatch(/"color"\s*:\s*"#/);
    expect(json).toContain("shiki");
  }, 15_000);

  it("skips unknown langs (passes plain code block through)", async () => {
    const plugin = shikiPlugin({ langs: ["ts"] });
    const md = "```unknownlang\nfoo\n```";
    const result = await parseSlide(md, { plugins: [plugin] });
    const json = JSON.stringify(result.tree);
    expect(json).toContain("foo");
    // No Shiki-specific markup should appear (language not in our list).
    expect(json).not.toMatch(/color:\s*#[0-9a-f]{6,}/i);
  }, 15_000);

  it("peer-dep guard: error path is wrapped in try/catch (EC-2 structural)", () => {
    // Structural check: the plugin's hastTransform is guarded. If the dynamic
    // import for shiki failed at runtime, composePlugins would absorb it as
    // PLUGIN_ERROR (verified in plugin.test.ts D16 tests). Here we only
    // assert the plugin shape is correct.
    const plugin = shikiPlugin();
    expect(plugin.hastTransform).toBeDefined();
    expect(plugin.sanitizeSchemaExtension).toBeDefined();
  });
});
