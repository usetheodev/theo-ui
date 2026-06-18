"use client";

import type { Element, Root as HastRoot } from "hast";
/**
 * Slide rich-content plugin — Mermaid diagrams.
 *
 * Peer-dep: `mermaid` (optional, ~370 KB raw — lazy + opt-in mandatory).
 * Render is client-only because Mermaid measures DOM nodes during layout;
 * SSR / static render emits a labelled placeholder + source-code fallback.
 *
 * Pipeline contribution (D11 of the rich-content plan):
 *   - `hastTransform`: detect `<pre><code class="language-mermaid">…</code></pre>`
 *     and replace with `<div class="theo-slide-mermaid-host" data-theo-mermaid-source="…">`.
 *   - `components.div`: when div has `data-theo-mermaid-source`, render the
 *     `<MermaidDiagram>` React component that lazy-imports `mermaid` and
 *     injects the SVG via `dangerouslySetInnerHTML` after `mermaid.render()`.
 *
 * EC-4: complete SVG tag + attribute allow-list (~30 tags) so the rendered SVG
 * survives sanitize. Critical: without these, sanitize strips the SVG entirely.
 *
 * EC-10: SSR placeholder is distinguishable from a render error. Error path
 * surfaces the Mermaid source code in a `<pre>` so consumers can debug + the
 * print path still shows the code (PDF cannot run dynamic Mermaid).
 */
import { type FC, useEffect, useState } from "react";
import type { SlidePlugin } from "../../plugin.js";

// EC-4: comprehensive SVG tag list (mermaid 11.x output across diagram types).
const SVG_TAG_NAMES = [
  "div",
  // Custom element used to bridge into our React renderer (mapped via components).
  "theo-mermaid",
  // root + grouping
  "svg",
  "g",
  "defs",
  "use",
  "symbol",
  "marker",
  "pattern",
  "mask",
  "clipPath",
  // shapes
  "path",
  "rect",
  "circle",
  "ellipse",
  "line",
  "polyline",
  "polygon",
  // text
  "text",
  "tspan",
  "textPath",
  "title",
  "desc",
  // gradients + filters (used by some flowchart themes)
  "linearGradient",
  "radialGradient",
  "stop",
  "filter",
  "feGaussianBlur",
  "feOffset",
  "feColorMatrix",
  "feComponentTransfer",
  "feComposite",
  "feMerge",
  "feMergeNode",
  "feFlood",
  // foreign content (HTML labels)
  "foreignObject",
  "span",
  "br",
];

const SVG_ATTRIBUTES: Record<string, string[]> = {
  "*": [
    "id",
    "className",
    "style",
    "transform",
    "fill",
    "stroke",
    "strokeWidth",
    "strokeDasharray",
    "strokeLinecap",
    "strokeLinejoin",
    "opacity",
    "fillOpacity",
    "strokeOpacity",
    "ariaLabel",
    "ariaHidden",
    "role",
  ],
  svg: ["xmlns", "viewBox", "width", "height", "preserveAspectRatio", "xmlnsXlink", "version"],
  path: ["d", "markerEnd", "markerStart", "markerMid"],
  rect: ["x", "y", "width", "height", "rx", "ry"],
  circle: ["cx", "cy", "r"],
  ellipse: ["cx", "cy", "rx", "ry"],
  line: ["x1", "y1", "x2", "y2"],
  polyline: ["points"],
  polygon: ["points"],
  text: [
    "x",
    "y",
    "dx",
    "dy",
    "textAnchor",
    "dominantBaseline",
    "fontSize",
    "fontFamily",
    "fontWeight",
  ],
  tspan: ["x", "y", "dx", "dy"],
  textPath: ["xlinkHref", "href", "startOffset"],
  marker: ["markerUnits", "markerWidth", "markerHeight", "refX", "refY", "orient", "viewBox"],
  use: ["xlinkHref", "href", "x", "y", "width", "height"],
  linearGradient: ["x1", "y1", "x2", "y2", "gradientUnits"],
  radialGradient: ["cx", "cy", "r", "fx", "fy", "gradientUnits"],
  stop: ["offset", "stopColor", "stopOpacity"],
  foreignObject: ["x", "y", "width", "height"],
  div: ["data-state", "data-theo-mermaid-source", "className"],
  "theo-mermaid": ["source"],
};

export interface MermaidPluginOptions {
  /** Mermaid theme name. Defaults to `"default"`. */
  theme?: "default" | "forest" | "dark" | "neutral" | "base";
}

/**
 * React component that renders Mermaid lazily on mount.
 *
 * SSR / pre-load: renders the source as `<pre>` + `role="img"` for a11y.
 * Client: lazy-loads `mermaid`, calls `mermaid.render()`, then injects the
 *         resulting SVG via `dangerouslySetInnerHTML` so React owns the DOM
 *         subtree (avoids reconciliation crashes when state flips back to the
 *         placeholder — `ref.innerHTML` would mutate under React's feet).
 *
 * The Mermaid output is a TRUSTED string from the `mermaid` lib itself (not
 * user-controlled markup) — the user-supplied source is the DSL, not raw HTML.
 * Using dangerouslySetInnerHTML here is a controlled escape hatch.
 *
 * Peer-dep guard: if `import("mermaid")` fails, falls back to the same
 * pre-formatted source view + an `aria-label` hint (EC-10).
 */
export const MermaidDiagram: FC<{ source: string; theme?: string }> = ({ source, theme }) => {
  const [svg, setSvg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    // Reset state when source/theme changes so the placeholder shows again
    // while the new diagram renders.
    setSvg(null);
    setError(null);
    (async () => {
      try {
        // biome-ignore lint/suspicious/noExplicitAny: mermaid default export untyped
        const mermaid: any = (await import("mermaid")).default;
        if (cancelled) return;
        mermaid.initialize({ startOnLoad: false, theme: theme ?? "default" });
        const id = `theo-mmd-${Math.random().toString(36).slice(2, 10)}`;
        const result = await mermaid.render(id, source);
        if (!cancelled) {
          setSvg(result.svg);
        }
      } catch (e) {
        if (cancelled) return;
        const msg = e instanceof Error ? e.message : String(e);
        // Recognize the various module-resolution failure messages emitted by
        // Node, Vite, Rollup, Webpack, Vitest, and browser dynamic-import.
        const moduleNotFound =
          msg.includes("Cannot find module") ||
          msg.includes("Could not resolve") ||
          msg.includes("Failed to fetch") ||
          msg.includes("Failed to resolve module") ||
          msg.includes("ERR_MODULE_NOT_FOUND");
        if (moduleNotFound) {
          setError("Mermaid not installed. Run: pnpm add mermaid");
        } else {
          setError(`Mermaid render failed: ${msg}`);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [source, theme]);

  if (error) {
    return (
      <div
        data-theo-slide-mermaid
        data-state="error"
        role="img"
        aria-label={error}
        className="theo-slide-mermaid-host"
        data-slot="mermaid-diagram"
      >
        <pre style={{ fontSize: "0.8em", opacity: 0.7, whiteSpace: "pre-wrap" }}>{source}</pre>
      </div>
    );
  }
  if (svg) {
    // SVG is React-owned via dangerouslySetInnerHTML so the next state change
    // (e.g. new `source` prop → back to placeholder) can unmount cleanly.
    return (
      <div
        data-theo-slide-mermaid
        data-state="ready"
        role="img"
        aria-label="Mermaid diagram"
        className="theo-slide-mermaid-host"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: mermaid.render() output is trusted (lib-generated SVG, not user markup)
        dangerouslySetInnerHTML={{ __html: svg }}
      />
    );
  }
  return (
    <div
      data-theo-slide-mermaid
      data-state="loading"
      role="img"
      aria-label="Mermaid diagram"
      className="theo-slide-mermaid-host"
    >
      <pre style={{ fontSize: "0.7em", opacity: 0.4, whiteSpace: "pre-wrap" }}>{source}</pre>
    </div>
  );
};

export function mermaidPlugin(opts: MermaidPluginOptions = {}): SlidePlugin {
  return {
    name: "mermaid",
    sanitizeSchemaExtension: {
      tagNames: SVG_TAG_NAMES,
      attributes: SVG_ATTRIBUTES,
    },
    components: {
      // The hastTransform below replaces mermaid <pre> with a `<div>` carrying
      // `data-theo-mermaid-source`. We can't override `div` globally — instead,
      // we use a custom tagName `theo-mermaid` that the React renderer maps.
      "theo-mermaid": ((props: { source?: string }) => (
        <MermaidDiagram source={props.source ?? ""} theme={opts.theme} />
      )) as FC<unknown>,
    },
    async hastTransform(tree: HastRoot): Promise<HastRoot> {
      // unist-util-visit is a peer-dep of the slide stack — should always be
      // present. Guard anyway per EC-2.
      // biome-ignore lint/suspicious/noExplicitAny: unist-util-visit untyped at runtime
      let visit: any;
      try {
        visit = (await import("unist-util-visit")).visit;
      } catch (e) {
        throw new Error(`[slide/plugins/mermaid] peer-dep 'unist-util-visit' missing: ${e}`);
      }
      visit(
        tree,
        "element",
        (
          node: Element,
          _idx: number | undefined,
          parent: { tagName?: string; type?: string; children?: unknown[] } | undefined,
        ) => {
          if (node.tagName !== "code") return;
          const className = (node.properties?.className as string[] | undefined) ?? [];
          if (!className.includes("language-mermaid")) return;
          if (!parent || parent.tagName !== "pre") return;
          const codeNode = node.children?.[0];
          const source = codeNode && codeNode.type === "text" ? codeNode.value : "";
          // Replace the entire <pre> with our custom element. hast-util-to-jsx-runtime
          // maps element tagName to a React component if found in `components` map.
          Object.assign(parent, {
            type: "element",
            tagName: "theo-mermaid",
            // Note: `source` is passed as a non-standard property; the React
            // component picks it up. We avoid `data-*` attributes here so we
            // don't have to whitelist them in sanitize.
            properties: { source },
            children: [],
          });
        },
      );
      return tree;
    },
  };
}
