/**
 * Slide plugin contract — extension points for rich-content engines.
 *
 * Plugins are composable transformers applied during `parseSlide`. Each plugin
 * may inspect/mutate the mdast tree (before HTML conversion), the hast tree
 * (after HTML conversion, before sanitize), and override React component
 * renderers (after sanitize). They may also declare sanitize-schema extensions
 * so custom tags (e.g. Shiki spans, KaTeX MathML, Mermaid SVG) survive the
 * security barrier.
 *
 * Design rules (ADRs in `wiki/rfcs/0004-slide-rich-content.md`):
 *   D1  — explicit `plugins` prop (no auto-detect).
 *   D2  — plugin shape: { name, mdastTransform?, hastTransform?, components? }.
 *   D13 — execution order: mdast → hast → sanitize (with merged extensions) → components.
 *   D16 — plugin error isolation: each plugin call is try/catch wrapped; errors
 *         are collected, not thrown.
 *   D17 — sanitize-schema merge is OBLIGATORY for plugins emitting non-default
 *         tags; without it, the sanitize step silently strips the content.
 *
 * Sanitize is the security barrier. Plugins NEVER bypass `hast-util-sanitize`.
 */
import type { Root as HastRoot } from "hast";
import type { Root as MdastRoot } from "mdast";
import type { FC } from "react";
import type { SlideValidationError } from "./schema.js";

/** Sanitize schema extension declared by a plugin. Merged with `defaultSchema` in `parseSlide`. */
export interface SlideSanitizeExtension {
  /** Additional element tag names allowed past the sanitizer. */
  tagNames?: string[];
  /** Additional attribute allow-list keyed by tag name (or `"*"` for all tags). */
  attributes?: Record<string, string[]>;
}

/** A composable transformer + component-override unit. */
export interface SlidePlugin {
  /** Stable identifier used in PLUGIN_ERROR messages and dev logs. */
  name: string;
  /** Mutate the mdast tree before HTML conversion. Return value is forwarded. */
  mdastTransform?: (tree: MdastRoot) => Promise<MdastRoot> | MdastRoot;
  /** Mutate the hast tree after HTML conversion, before sanitize. */
  hastTransform?: (tree: HastRoot) => Promise<HastRoot> | HastRoot;
  /** React component overrides merged into the consumer's `components` map. */
  // biome-ignore lint/suspicious/noExplicitAny: third-party component override map
  components?: Record<string, FC<any>>;
  /** Sanitize-schema extension. Required for plugins emitting non-default tags. */
  sanitizeSchemaExtension?: SlideSanitizeExtension;
}

/** Merged sanitize-schema extensions from all plugins. */
export interface MergedSanitizeExtensions {
  tagNames: string[];
  attributes: Record<string, string[]>;
}

/** Composer over a plugin array. Hooks orchestrate transformation + error isolation. */
export interface PluginComposer {
  /** Run all `mdastTransform` hooks in array order. Collects errors. */
  runMdast(tree: MdastRoot, errors: SlideValidationError[]): Promise<MdastRoot>;
  /** Run all `hastTransform` hooks in array order. Collects errors. */
  runHast(tree: HastRoot, errors: SlideValidationError[]): Promise<HastRoot>;
  /** Merge all plugin component overrides; later-plugin-wins on conflict. */
  // biome-ignore lint/suspicious/noExplicitAny: third-party component override map
  mergedComponents(): Record<string, FC<any>>;
  /** Merge sanitize-schema extensions across all plugins (dedupes tag names). */
  mergedSanitizeExtensions(): MergedSanitizeExtensions;
}

/**
 * Build a composer over an array of plugins.
 *
 * Order semantics:
 *   - mdast transforms run sequentially in array order.
 *   - hast transforms run sequentially in array order.
 *   - components merge: later plugin wins on conflict (Object.assign semantics).
 *   - sanitize-schema extensions: union of tag names; union of attributes by tag.
 *
 * Error semantics (D16):
 *   - Each plugin call is wrapped in try/catch.
 *   - On throw, an error of code `PLUGIN_ERROR` is pushed to `errors[]` and the
 *     pipeline continues with the **non-transformed** input from that plugin
 *     (i.e. subsequent plugins see the tree that failed plugin received).
 *   - The composer NEVER throws; `parseSlide` keeps its "never throws on input"
 *     contract (RFC 0002 D9).
 */
export function composePlugins(plugins: SlidePlugin[]): PluginComposer {
  return {
    async runMdast(tree, errors) {
      let current = tree;
      for (const p of plugins) {
        if (!p.mdastTransform) continue;
        const previous = current;
        try {
          const result = await p.mdastTransform(current);
          if (!result || result.type !== "root") {
            // Defensive: a buggy plugin may return a non-Root node. Reject and
            // keep the previous tree so subsequent plugins see a valid input.
            throw new Error("mdastTransform returned non-Root node");
          }
          current = result;
        } catch (e) {
          current = previous;
          errors.push(makePluginError(p.name, "mdastTransform", e));
        }
      }
      return current;
    },
    async runHast(tree, errors) {
      let current = tree;
      for (const p of plugins) {
        if (!p.hastTransform) continue;
        const previous = current;
        try {
          const result = await p.hastTransform(current);
          if (!result || result.type !== "root") {
            throw new Error("hastTransform returned non-Root node");
          }
          current = result;
        } catch (e) {
          current = previous;
          errors.push(makePluginError(p.name, "hastTransform", e));
        }
      }
      return current;
    },
    mergedComponents() {
      // biome-ignore lint/suspicious/noExplicitAny: third-party component override map
      const out: Record<string, FC<any>> = {};
      for (const p of plugins) {
        if (p.components) Object.assign(out, p.components);
      }
      return out;
    },
    mergedSanitizeExtensions() {
      const tagNames = new Set<string>();
      const attributes: Record<string, Set<string>> = {};
      for (const p of plugins) {
        const ext = p.sanitizeSchemaExtension;
        if (!ext) continue;
        if (ext.tagNames) {
          for (const tag of ext.tagNames) tagNames.add(tag);
        }
        if (ext.attributes) {
          for (const [tag, attrs] of Object.entries(ext.attributes)) {
            if (!attributes[tag]) attributes[tag] = new Set();
            for (const a of attrs) attributes[tag].add(a);
          }
        }
      }
      const mergedAttrs: Record<string, string[]> = {};
      for (const [tag, set] of Object.entries(attributes)) {
        mergedAttrs[tag] = Array.from(set);
      }
      return {
        tagNames: Array.from(tagNames),
        attributes: mergedAttrs,
      };
    },
  };
}

function makePluginError(
  name: string,
  hook: "mdastTransform" | "hastTransform",
  e: unknown,
): SlideValidationError {
  const msg = e instanceof Error ? e.message : String(e);
  return {
    code: "PLUGIN_ERROR",
    path: [],
    message: `Plugin '${name}' failed in ${hook}: ${msg}`,
    got: name,
  };
}
