/**
 * JSON Schema for the Slide YAML frontmatter — derived from the Zod
 * `slideFrontmatter` schema via Zod 4's native `z.toJSONSchema()`.
 *
 * Purpose: enable LLM-driven generation pipelines (OpenAI structured outputs,
 * Anthropic tool use, function calling, JSON-mode constrained generation) to
 * produce frontmatter that is GUARANTEED to pass `validateSlide` without
 * round-tripping through human-written prompt engineering.
 *
 * Usage (Anthropic tool use):
 *
 *     import { slideFrontmatterJsonSchema } from "@theokit/ui/slide";
 *
 *     const tool = {
 *       name: "render_slide",
 *       description: "Render a presentation slide.",
 *       input_schema: {
 *         type: "object",
 *         properties: {
 *           frontmatter: slideFrontmatterJsonSchema,
 *           body: { type: "string", description: "CommonMark + GFM markdown body" },
 *         },
 *         required: ["body"],
 *       },
 *     };
 *
 * The output matches Zod's behaviour exactly — anything that passes the JSON
 * Schema validator passes Zod, and vice-versa.
 *
 * Companion guide: `docs/slide-llm-guide.md` — copy-paste system prompt that
 * documents every Tier 1 + Tier 2 feature with examples.
 */
import { z } from "zod";
import { slideFrontmatter } from "./schema.js";

interface JsonSchemaProperties {
  [key: string]: Record<string, unknown>;
}

interface JsonSchemaWithProperties {
  properties?: JsonSchemaProperties;
  [key: string]: unknown;
}

/**
 * JSON Schema (Draft 2020-12) describing all accepted frontmatter fields:
 * `theme`, `layout`, `lang`, `color`, `backgroundColor`, `backgroundImage`,
 * `backgroundGradient`, `header`, `footer`, `paginate`.
 *
 * Note: `backgroundImage` uses a Zod `.transform()` (URL sanitization) which
 * cannot be represented in JSON Schema natively. We pass `unrepresentable: "any"`
 * to fall back to `{}` for transformed fields, then enrich `backgroundImage`
 * with manual metadata so LLMs still get useful constraints.
 *
 * Generated once at module load. Treat as immutable.
 */
const rawSchema = z.toJSONSchema(slideFrontmatter, {
  unrepresentable: "any",
}) as JsonSchemaWithProperties;

if (rawSchema.properties) {
  // Backgrounds carry hard constraints (http(s) only, ≤500_000 chars) that
  // Zod erases through `.transform()`. Inline them here so the LLM tooling
  // sees the same contract `sanitizeBgUrl` enforces at runtime.
  rawSchema.properties.backgroundImage = {
    type: "string",
    format: "uri",
    maxLength: 500_000,
    pattern: "^https?://",
    description:
      "Slide background image URL. Only http(s) schemes are accepted; data: URLs are rejected at runtime (use a hosted image).",
  };
}

export const slideFrontmatterJsonSchema = rawSchema;
