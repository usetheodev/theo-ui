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
import { detectAlerts } from "./alerts.js";
import { extractMarpitBackgrounds } from "./marpit-bg.js";
import { type MergedSanitizeExtensions, type SlidePlugin, composePlugins } from "./plugin.js";
import { collectTagCounts, getSlideSanitizeSchema } from "./sanitize.js";
import { type SlideFrontmatter, type SlideValidationError, sanitizeBgUrl } from "./schema.js";
import { validateSlide } from "./validate.js";

export interface ParseSlideOptions {
  /** Override individual element renderers (passed to hast-util-to-jsx-runtime). */
  components?: Record<string, unknown>;
  /** Rich-content plugins (Tier 2). Order matters — D13 / RFC 0004. */
  plugins?: SlidePlugin[];
}

export interface ExtractedBackground {
  /** Sanitized URL (http/https only). */
  url: string;
  /** Optional Marpit modifier: `cover` | `fit` | `left` | `right`. */
  modifier?: "cover" | "fit" | "left" | "right";
}

export interface ParsedSlide {
  frontmatter: SlideFrontmatter;
  /** React element renderable as the body of a slide. Always defined (may be empty Fragment). */
  tree: ReactElement;
  /** Validation + sanitize errors collected during parsing. Empty on success. */
  errors: SlideValidationError[];
  /** True when the input contained a top-level thematic break and only the first slide was rendered. */
  truncated: boolean;
  /**
   * Background image extracted from Marpit `![bg](url)` syntax (D18 / EC-5).
   * Precedence: `frontmatter.backgroundImage` > `extractedBackground.url`.
   */
  extractedBackground?: ExtractedBackground;
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
  extensions?: MergedSanitizeExtensions,
): Promise<{ tree: HastRoot; bannedTags: string[] }> {
  const schema = await getSlideSanitizeSchema(extensions);
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
    // `components` is `Record<string, unknown>` on our public surface and
    // `Partial<Components>` here. It cannot be typed as the latter: `hast-util-to-jsx-runtime`
    // is an OPTIONAL peer, so naming its types in our published API would make them a hard
    // requirement for every consumer, including the ones who never render markdown. Under
    // React 18's types the two were structurally compatible and this went unnoticed; React
    // 19 tightened the value union and they no longer are. The cast is the adapter at that
    // boundary — the runtime contract is unchanged, and toJsxRuntime validates what it gets.
    components: components as Parameters<typeof toJsxRuntime>[1]["components"],
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

  const compose = composePlugins(opts.plugins ?? []);

  const rawMdast = await parseBody(body);
  // Tier 1 — GFM alerts (D3): in-tree post-process, no plugin needed.
  // Runs BEFORE plugin mdastTransforms so plugins observing the tree see the
  // normalized aside shape (consistent with how `> [!NOTE]` is treated as
  // native GFM by consumers).
  detectAlerts(rawMdast);
  // Tier 1 — Marpit ![bg](url) (D18 / EC-5): extract before plugins run so the
  // tree handed to plugins is free of bg directives.
  const { tree: mdastNoBg, background: marpitBg } = extractMarpitBackgrounds(rawMdast);
  let extractedBackground: ExtractedBackground | undefined;
  if (marpitBg) {
    const safeUrl = sanitizeBgUrl(marpitBg.url);
    if (safeUrl) {
      extractedBackground = { url: safeUrl, modifier: marpitBg.modifier };
    } else {
      errors.push({
        code: "MARPIT_BG_UNSAFE_URL",
        path: [],
        message: "Marpit ![bg](url) rejected: unsafe scheme or malformed URL.",
        got: marpitBg.url.slice(0, 80),
      });
    }
  }
  const transformedMdast = await compose.runMdast(mdastNoBg, errors);
  const rawHast = await mdastToHast(transformedMdast);
  const transformedHast = await compose.runHast(rawHast, errors);

  // D17 / EC-3: merge plugin sanitize-schema extensions with defaultSchema so
  // plugins emitting non-default tags (Shiki spans, KaTeX MathML, Mermaid SVG)
  // survive the security barrier. Sanitize ALWAYS runs.
  const sanitizeExtensions = compose.mergedSanitizeExtensions();
  const { tree: safeTree, bannedTags } = await sanitizeHast(transformedHast, sanitizeExtensions);
  for (const tag of bannedTags) {
    errors.push({
      code: "BANNED_TAG",
      path: ["body"],
      message: `Tag <${tag}> was stripped by the slide sanitizer.`,
      got: tag,
    });
  }

  // D2 / D13: plugin component overrides merge on top of consumer's components;
  // plugin definitions win on conflict (last-write-wins in mergedComponents).
  const mergedComponents = {
    ...(opts.components ?? {}),
    ...compose.mergedComponents(),
  };
  const tree = await hastToReact(safeTree, mergedComponents);

  return { frontmatter, tree, errors, truncated, extractedBackground };
}
