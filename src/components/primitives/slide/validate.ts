import { extractFrontmatter } from "./frontmatter.js";
/**
 * Async validator for slide markdown input.
 *
 * Returns `Promise<ValidationResult>` (ADR D11 — sync impossible because
 * `yaml` and `mdast-util-from-markdown` are lazy-imported peer-deps).
 *
 * Pipeline:
 *   1. Strip BOM + extract frontmatter (`frontmatter.ts`).
 *   2. Reject `FRONTMATTER_TOO_LARGE` early if raw > 10 KB (ADR D14).
 *   3. Parse YAML in safe mode → validate against `slideFrontmatter` (Zod).
 *   4. Validate body length → emit `CONTENT_TOO_LARGE` if > 50 KB.
 *   5. Detect multi-slide via mdast `thematicBreak` walk (ADR D12) — not
 *      a regex, so `---` inside fenced code blocks does not false-positive.
 *   6. Return `{ ok, input, errors[] }`.
 *
 * Errors are structured so an LLM can self-correct from the callback.
 */
import {
  type SlideFrontmatter,
  type SlideInput,
  type SlideValidationError,
  slideFrontmatter,
} from "./schema.js";

export type ValidationResult =
  | { ok: true; input: SlideInput; errors: SlideValidationError[] }
  | { ok: false; errors: SlideValidationError[] };

interface ZodLikeIssue {
  path: ReadonlyArray<string | number>;
  message: string;
  code: string;
  received?: unknown;
}

const MAX_BODY = 50_000;

function valueAtPath(input: unknown, path: ReadonlyArray<string | number>): unknown {
  let cursor: unknown = input;
  for (const segment of path) {
    if (cursor === null || typeof cursor !== "object") return undefined;
    cursor = (cursor as Record<string | number, unknown>)[segment];
  }
  return cursor;
}

function formatZodIssue(
  issue: ZodLikeIssue,
  input: unknown,
  pathPrefix: (string | number)[],
): SlideValidationError {
  const error: SlideValidationError = {
    path: [...pathPrefix, ...issue.path],
    message: issue.message,
    code: "INVALID_FRONTMATTER",
  };
  if ("received" in issue && issue.received !== undefined) {
    error.got = issue.received;
  } else if (issue.path.length > 0) {
    const value = valueAtPath(input, issue.path);
    if (value !== undefined) error.got = value;
  }
  return error;
}

async function detectMultiSlide(body: string): Promise<{
  multi: boolean;
  firstSlideBody: string;
}> {
  // mdast-based — regex would false-positive on `---` inside fenced code blocks.
  // Cost: one extra parse. Cheap; would be parsed again in `parse.ts` anyway.
  const { fromMarkdown } = await import("mdast-util-from-markdown");
  const tree = fromMarkdown(body);
  const hrIdx = tree.children.findIndex((n) => n.type === "thematicBreak");
  if (hrIdx === -1) {
    return { multi: false, firstSlideBody: body };
  }
  const firstHr = tree.children[hrIdx];
  const offset = firstHr?.position?.start.offset;
  if (typeof offset !== "number") {
    return { multi: true, firstSlideBody: body };
  }
  return { multi: true, firstSlideBody: body.slice(0, offset) };
}

/**
 * Validate the markdown input. Returns errors structured for LLM self-correction.
 *
 * Async because frontmatter YAML parsing and mdast multi-slide detection both
 * use lazy-imported peer-deps (yaml + mdast-util-from-markdown).
 */
export async function validateSlide(markdown: string): Promise<ValidationResult> {
  const errors: SlideValidationError[] = [];
  const extracted = extractFrontmatter(markdown);

  if (extracted.tooLarge) {
    errors.push({
      code: "FRONTMATTER_TOO_LARGE",
      path: [],
      message: `Raw frontmatter exceeds ${10_240} bytes.`,
      got: extracted.rawFrontmatter?.length,
    });
    return { ok: false, errors };
  }

  let frontmatter: SlideFrontmatter = {};
  if (extracted.rawFrontmatter !== null) {
    let parsed: unknown;
    try {
      const yaml = await import("yaml");
      parsed = yaml.parse(extracted.rawFrontmatter);
    } catch (e) {
      errors.push({
        code: "INVALID_FRONTMATTER",
        path: [],
        message: e instanceof Error ? e.message : "YAML parse failed.",
        got: extracted.rawFrontmatter,
      });
      return { ok: false, errors };
    }
    if (parsed === null || parsed === undefined) {
      // empty frontmatter — treat as {}
      frontmatter = {};
    } else if (typeof parsed !== "object" || Array.isArray(parsed)) {
      errors.push({
        code: "INVALID_FRONTMATTER",
        path: [],
        message: "Frontmatter must be a YAML mapping (object).",
        got: parsed,
      });
      return { ok: false, errors };
    } else {
      const result = slideFrontmatter.safeParse(parsed);
      if (!result.success) {
        for (const issue of result.error.issues) {
          errors.push(formatZodIssue(issue as unknown as ZodLikeIssue, parsed, []));
        }
        return { ok: false, errors };
      }
      frontmatter = result.data;
    }
  }

  let body = extracted.body;

  if (body.length > MAX_BODY) {
    errors.push({
      code: "CONTENT_TOO_LARGE",
      path: ["body"],
      message: `Body exceeds ${MAX_BODY} characters.`,
      got: body.length,
    });
    return { ok: false, errors };
  }

  const multi = await detectMultiSlide(body);
  if (multi.multi) {
    body = multi.firstSlideBody;
    errors.push({
      code: "MULTIPLE_SLIDES",
      path: ["body"],
      message:
        "Input contains a top-level thematic break (---). <Slide> renders single-slide markdown only. Only the first slide was rendered.",
    });
  }

  return { ok: true, input: { frontmatter, body }, errors };
}
