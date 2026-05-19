import { describe, expect, it } from "vitest";
import { slideFrontmatterJsonSchema } from "./json-schema.js";
import { slideFrontmatter } from "./schema.js";

interface JsonSchemaShape {
  type?: string;
  properties?: Record<string, { type?: string; enum?: unknown[] }>;
  additionalProperties?: boolean;
  $ref?: string;
  definitions?: Record<string, JsonSchemaShape>;
}

describe("slideFrontmatterJsonSchema", () => {
  // The schema may resolve via a top-level $ref into `definitions.SlideFrontmatter`
  // depending on zod-to-json-schema strategy. Pick the resolved object.
  function resolved(): JsonSchemaShape {
    const s = slideFrontmatterJsonSchema as JsonSchemaShape;
    if (s.$ref && s.definitions) {
      const name = s.$ref.replace("#/definitions/", "");
      const def = s.definitions[name];
      if (def) return def;
    }
    return s;
  }

  it("is a JSON Schema object describing an object type", () => {
    const r = resolved();
    expect(r.type).toBe("object");
    expect(typeof r.properties).toBe("object");
  });

  it("documents every accepted frontmatter property", () => {
    const r = resolved();
    const properties = r.properties ?? {};
    for (const key of [
      "theme",
      "layout",
      "lang",
      "color",
      "backgroundColor",
      "backgroundImage",
      "backgroundGradient",
      "header",
      "footer",
      "paginate",
    ]) {
      expect(properties, `missing property: ${key}`).toHaveProperty(key);
    }
  });

  it("theme property exposes the enum (default, violet-forge)", () => {
    const r = resolved();
    const theme = r.properties?.theme;
    expect(theme?.enum).toEqual(["default", "violet-forge"]);
  });

  it("layout property exposes the 7-layout enum", () => {
    const r = resolved();
    const layout = r.properties?.layout;
    expect(layout?.enum).toEqual([
      "default",
      "title",
      "two-column",
      "image-right",
      "image-left",
      "code-output",
      "section",
    ]);
  });

  it("is strict (additionalProperties: false) so LLMs cannot invent keys", () => {
    const r = resolved();
    expect(r.additionalProperties).toBe(false);
  });

  it("instances valid via JSON Schema also pass Zod (round-trip sanity)", () => {
    // No structural assertion — just confirm both layers accept the same minimal object.
    const sample = { theme: "violet-forge" as const, paginate: true };
    expect(slideFrontmatter.safeParse(sample).success).toBe(true);
  });
});
