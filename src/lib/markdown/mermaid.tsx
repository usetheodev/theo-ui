"use client";

/**
 * `<MermaidDiagram>` — Mermaid diagram renderer.
 *
 * Renders a Mermaid source code block as an inline SVG. Lazy-loads
 * `mermaid` (peer-dep optional, ~200 KB) on mount; falls back to a
 * styled `<pre>` showing the raw source when the peer-dep is missing
 * OR when parsing the diagram fails (invalid syntax).
 *
 * Security note: Mermaid v11+ initialize with `securityLevel: "strict"`
 * by default, which sanitizes HTML inside diagram labels and disables
 * `click` interactions. We re-assert that here.
 *
 * In a chat context an unverified LLM response could include a malformed
 * or hostile diagram — auto-rendering is acceptable under strict mode
 * because the produced SVG goes through Mermaid's own sanitizer first.
 */
import { useEffect, useRef, useState } from "react";
import { cn } from "../cn.js";

interface MermaidLib {
  initialize: (opts: { startOnLoad?: boolean; securityLevel?: string; theme?: string }) => void;
  render: (id: string, src: string) => Promise<{ svg: string }>;
}

let mermaidCache: MermaidLib | null = null;
let mermaidFailed = false;

async function loadMermaid(): Promise<MermaidLib | null> {
  if (mermaidCache) return mermaidCache;
  if (mermaidFailed) return null;
  try {
    const mod = (await import("mermaid")) as unknown as { default?: MermaidLib } & MermaidLib;
    const lib = mod.default ?? mod;
    if (!lib || typeof lib.initialize !== "function") {
      mermaidFailed = true;
      return null;
    }
    lib.initialize({
      startOnLoad: false,
      securityLevel: "strict",
      theme: "default",
    });
    mermaidCache = lib;
    return mermaidCache;
  } catch {
    mermaidFailed = true;
    return null;
  }
}

let renderCounter = 0;

export interface MermaidDiagramProps {
  /** The Mermaid source code (e.g. `flowchart TD\nA-->B`). */
  source: string;
  className?: string;
}

export function MermaidDiagram({ source, className }: MermaidDiagramProps): JSX.Element {
  const [svg, setSvg] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const idRef = useRef(`theo-mermaid-${++renderCounter}`);

  useEffect(() => {
    let cancelled = false;
    loadMermaid().then(async (mermaid) => {
      if (cancelled || !mermaid) {
        if (!cancelled) setFailed(true);
        return;
      }
      try {
        const { svg: out } = await mermaid.render(idRef.current, source);
        if (!cancelled) setSvg(out);
      } catch {
        if (!cancelled) setFailed(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [source]);

  if (svg) {
    return (
      <div
        className={cn("my-4 flex justify-center overflow-x-auto", className)}
        data-theo-mermaid=""
        // biome-ignore lint/security/noDangerouslySetInnerHtml: Mermaid render() output is sanitized SVG it produced itself under securityLevel="strict"; only `source` (already-sanitized markdown content) flows in
        dangerouslySetInnerHTML={{ __html: svg }}
      />
    );
  }

  return (
    <pre
      className={cn(
        "my-4 overflow-x-auto rounded-lg border border-border bg-muted/30 p-3 text-code-sm",
        failed && "border-warning/40",
        className,
      )}
      data-theo-mermaid-fallback={failed ? "true" : "loading"}
    >
      <code className="language-mermaid">{source}</code>
    </pre>
  );
}
