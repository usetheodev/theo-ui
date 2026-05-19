import type { Root as HastRoot } from "hast";
/**
 * Markdown → React tree pipeline for the Slide primitive.
 *
 *   parseSlide(markdown)
 *     ├─ validateSlide(markdown) → { frontmatter, body, errors? }
 *     ├─ parseBody(body)        → mdast Root (micromark + GFM)
 *     ├─ mdastToHast(mdastTree) → hast Root (allowDangerousHtml: false)
 *     ├─ sanitizeHast(hastTree) → hast Root + BANNED_TAG diff (ADR D13)
 *     └─ hastToReact(hastTree)  → React tree (jsx-runtime, no innerHTML)
 *
 * Every transform is composed of lazy-imported peer-deps so the slide bundle
 * stays under budget and never vendors the markdown stack into the barrel
 * (ADR D2 / D3 of the slide plan).
 */
import type { Root as MdastRoot } from "mdast";
import type { ReactElement } from "react";
import { collectTagCounts, getSlideSanitizeSchema } from "./sanitize.js";
import type { SlideFrontmatter, SlideValidationError } from "./schema.js";
import { validateSlide } from "./validate.js";

export interface ParseSlideOptions {
  /** Override individual element renderers (passed to hast-util-to-jsx-runtime). */
  components?: Record<string, unknown>;
}

export interface ParsedSlide {
  frontmatter: SlideFrontmatter;
  /** React element renderable as the body of a slide. Always defined (may be empty Fragment). */
  tree: ReactElement;
  /** Validation + sanitize errors collected during parsing. Empty on success. */
  errors: SlideValidationError[];
  /** True when the input contained a top-level thematic break and only the first slide was rendered. */
  truncated: boolean;
}

export async function parseBody(body: string): Promise<MdastRoot> {
  const [{ fromMarkdown }, { gfmFromMarkdown }, { gfm }] = await Promise.all([
    import("mdast-util-from-markdown"),
    import("mdast-util-gfm"),
    import("micromark-extension-gfm"),
  ]);
  return fromMarkdown(body, {
    extensions: [gfm()],
    mdastExtensions: [gfmFromMarkdown()],
  });
}

export async function mdastToHast(tree: MdastRoot): Promise<HastRoot> {
  const { toHast } = await import("mdast-util-to-hast");
  const hast = toHast(tree, { allowDangerousHtml: false });
  if (!hast || hast.type !== "root") {
    return { type: "root", children: hast ? [hast] : [] } as HastRoot;
  }
  return hast as HastRoot;
}

export async function sanitizeHast(
  tree: HastRoot,
): Promise<{ tree: HastRoot; bannedTags: string[] }> {
  const schema = await getSlideSanitizeSchema();
  const { sanitize } = await import("hast-util-sanitize");
  const preCount = collectTagCounts(tree);
  const safe = sanitize(tree, schema);
  const safeRoot: HastRoot =
    safe.type === "root" ? (safe as HastRoot) : ({ type: "root", children: [safe] } as HastRoot);
  const postCount = collectTagCounts(safeRoot);
  const bannedTags: string[] = [];
  for (const [tag, before] of preCount) {
    const after = postCount.get(tag) ?? 0;
    if (after < before) {
      // Push once per stripped tag name; agents can self-correct from this signal.
      bannedTags.push(tag);
    }
  }
  return { tree: safeRoot, bannedTags };
}

export async function hastToReact(
  tree: HastRoot,
  components?: Record<string, unknown>,
): Promise<ReactElement> {
  const { Fragment, jsx, jsxs } = await import("react/jsx-runtime");
  const { toJsxRuntime } = await import("hast-util-to-jsx-runtime");
  return toJsxRuntime(tree, {
    Fragment,
    jsx,
    jsxs,
    components,
  }) as ReactElement;
}

/**
 * Public entry point. Validates → parses → sanitizes → returns a React tree.
 *
 * Never throws on input. Errors (validation, BANNED_TAG) are collected into
 * `errors[]` so callers can show them via `onValidationError`.
 */
export async function parseSlide(
  markdown: string,
  opts: ParseSlideOptions = {},
): Promise<ParsedSlide> {
  const errors: SlideValidationError[] = [];
  let frontmatter: SlideFrontmatter = {};
  let body = markdown;
  let truncated = false;

  const validation = await validateSlide(markdown);
  if (validation.ok) {
    frontmatter = validation.input.frontmatter;
    body = validation.input.body;
    errors.push(...validation.errors);
    truncated = validation.errors.some((e) => e.code === "MULTIPLE_SLIDES");
  } else {
    errors.push(...validation.errors);
    // Best-effort recovery: render the body as if frontmatter was absent.
    // This preserves "never throw, always render something" contract.
    body = markdown;
  }

  const mdastTree = await parseBody(body);
  const hastTree = await mdastToHast(mdastTree);
  const { tree: safeTree, bannedTags } = await sanitizeHast(hastTree);
  for (const tag of bannedTags) {
    errors.push({
      code: "BANNED_TAG",
      path: ["body"],
      message: `Tag <${tag}> was stripped by the slide sanitizer.`,
      got: tag,
    });
  }
  const tree = await hastToReact(safeTree, opts.components);

  return { frontmatter, tree, errors, truncated };
}
