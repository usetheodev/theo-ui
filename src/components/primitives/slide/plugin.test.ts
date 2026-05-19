import type { Root as HastRoot } from "hast";
import type { Root as MdastRoot } from "mdast";
import { describe, expect, it } from "vitest";
import { type SlidePlugin, composePlugins } from "./plugin.js";
import type { SlideValidationError } from "./schema.js";

const emptyMdast = (): MdastRoot => ({ type: "root", children: [] });
const emptyHast = (): HastRoot => ({ type: "root", children: [] });

describe("composePlugins (T0.1)", () => {
  it("returns the four expected hooks", () => {
    const c = composePlugins([]);
    expect(typeof c.runMdast).toBe("function");
    expect(typeof c.runHast).toBe("function");
    expect(typeof c.mergedComponents).toBe("function");
    expect(typeof c.mergedSanitizeExtensions).toBe("function");
  });

  it("runMdast is no-op when array is empty", async () => {
    const c = composePlugins([]);
    const errors: SlideValidationError[] = [];
    const tree = emptyMdast();
    const out = await c.runMdast(tree, errors);
    expect(out).toBe(tree);
    expect(errors).toEqual([]);
  });

  it("runMdast applies plugins in array order", async () => {
    const order: string[] = [];
    const plugins: SlidePlugin[] = [
      {
        name: "p1",
        mdastTransform: (t) => {
          order.push("p1");
          return t;
        },
      },
      {
        name: "p2",
        mdastTransform: (t) => {
          order.push("p2");
          return t;
        },
      },
      {
        name: "p3",
        mdastTransform: (t) => {
          order.push("p3");
          return t;
        },
      },
    ];
    const c = composePlugins(plugins);
    await c.runMdast(emptyMdast(), []);
    expect(order).toEqual(["p1", "p2", "p3"]);
  });

  it("runHast applies plugins in array order", async () => {
    const order: string[] = [];
    const plugins: SlidePlugin[] = [
      {
        name: "h1",
        hastTransform: (t) => {
          order.push("h1");
          return t;
        },
      },
      {
        name: "h2",
        hastTransform: (t) => {
          order.push("h2");
          return t;
        },
      },
    ];
    const c = composePlugins(plugins);
    await c.runHast(emptyHast(), []);
    expect(order).toEqual(["h1", "h2"]);
  });

  it("plugin without hooks is a no-op", async () => {
    const plugins: SlidePlugin[] = [{ name: "empty" }];
    const c = composePlugins(plugins);
    const errors: SlideValidationError[] = [];
    const tree = emptyMdast();
    const out = await c.runMdast(tree, errors);
    expect(out).toBe(tree);
    expect(errors).toEqual([]);
  });

  it("async plugin is awaited properly", async () => {
    const plugin: SlidePlugin = {
      name: "async",
      mdastTransform: async (tree) => {
        await new Promise((r) => setTimeout(r, 5));
        return { ...tree, children: [...tree.children, { type: "thematicBreak" }] } as MdastRoot;
      },
    };
    const c = composePlugins([plugin]);
    const out = await c.runMdast(emptyMdast(), []);
    expect(out.children).toHaveLength(1);
    expect(out.children[0]?.type).toBe("thematicBreak");
  });

  it("mergedComponents combines all plugin components", () => {
    const A = () => null;
    const B = () => null;
    const plugins: SlidePlugin[] = [
      { name: "p1", components: { foo: A } },
      { name: "p2", components: { bar: B } },
    ];
    const c = composePlugins(plugins);
    const merged = c.mergedComponents();
    expect(merged.foo).toBe(A);
    expect(merged.bar).toBe(B);
  });

  it("mergedComponents — later plugin wins on conflict", () => {
    const A = () => null;
    const B = () => null;
    const plugins: SlidePlugin[] = [
      { name: "p1", components: { foo: A } },
      { name: "p2", components: { foo: B } },
    ];
    const c = composePlugins(plugins);
    expect(c.mergedComponents().foo).toBe(B);
  });

  it("mergedSanitizeExtensions deduplicates tag names across plugins (EC-3)", () => {
    const plugins: SlidePlugin[] = [
      {
        name: "a",
        sanitizeSchemaExtension: {
          tagNames: ["span", "div"],
          attributes: { "*": ["style"] },
        },
      },
      {
        name: "b",
        sanitizeSchemaExtension: {
          tagNames: ["div", "math"],
          attributes: { "*": ["class"], math: ["xmlns"] },
        },
      },
    ];
    const c = composePlugins(plugins);
    const ext = c.mergedSanitizeExtensions();
    expect(ext.tagNames.sort()).toEqual(["div", "math", "span"]);
    expect(ext.attributes["*"]?.sort()).toEqual(["class", "style"]);
    expect(ext.attributes.math).toEqual(["xmlns"]);
  });

  it("mergedSanitizeExtensions returns empty when no plugin declares", () => {
    const c = composePlugins([{ name: "p1" }]);
    const ext = c.mergedSanitizeExtensions();
    expect(ext.tagNames).toEqual([]);
    expect(ext.attributes).toEqual({});
  });

  it("plugin throwing in mdastTransform emits PLUGIN_ERROR + continues (D16 / EC-1)", async () => {
    const order: string[] = [];
    const plugins: SlidePlugin[] = [
      {
        name: "boom",
        mdastTransform: () => {
          order.push("boom");
          throw new Error("kaboom");
        },
      },
      {
        name: "next",
        mdastTransform: (t) => {
          order.push("next");
          return t;
        },
      },
    ];
    const c = composePlugins(plugins);
    const errors: SlideValidationError[] = [];
    const out = await c.runMdast(emptyMdast(), errors);
    expect(order).toEqual(["boom", "next"]);
    expect(errors).toHaveLength(1);
    expect(errors[0]?.code).toBe("PLUGIN_ERROR");
    expect(errors[0]?.got).toBe("boom");
    expect(errors[0]?.message).toContain("boom");
    expect(errors[0]?.message).toContain("kaboom");
    expect(out).toBeDefined();
    expect(out.type).toBe("root");
  });

  it("plugin throwing in hastTransform emits PLUGIN_ERROR + continues (D16 / EC-1)", async () => {
    const plugins: SlidePlugin[] = [
      {
        name: "ouch",
        hastTransform: () => {
          throw new Error("hast-boom");
        },
      },
    ];
    const c = composePlugins(plugins);
    const errors: SlideValidationError[] = [];
    const out = await c.runHast(emptyHast(), errors);
    expect(errors).toHaveLength(1);
    expect(errors[0]?.code).toBe("PLUGIN_ERROR");
    expect(errors[0]?.message).toContain("hastTransform");
    expect(out.type).toBe("root");
  });

  it("plugin returning non-Root from mdastTransform is rejected with PLUGIN_ERROR (defensive)", async () => {
    const plugins: SlidePlugin[] = [
      {
        name: "bad-return",
        // Deliberate non-Root return for test — cast through unknown to bypass the
        // SlidePlugin signature without `any` so Biome stays happy.
        mdastTransform: (() => ({ type: "paragraph", children: [] })) as unknown as NonNullable<
          SlidePlugin["mdastTransform"]
        >,
      },
    ];
    const c = composePlugins(plugins);
    const errors: SlideValidationError[] = [];
    const out = await c.runMdast(emptyMdast(), errors);
    expect(errors).toHaveLength(1);
    expect(errors[0]?.code).toBe("PLUGIN_ERROR");
    expect(out.type).toBe("root");
  });
});
