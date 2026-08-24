"use client";

/**
 * KaTeX math rendering — inline and block.
 *
 * `<MathInline>` for `$x + y$`, `<MathBlock>` for `$$\sum_i x_i$$`. Both
 * lazy-load `katex` (peer-dep optional). When `katex` is not installed the
 * component renders a plain `<code>` fallback so the chat surface stays
 * usable.
 *
 * Markdown integration: enable in `parseMarkdownToReact` via the
 * `components` map (`{ "math-inline": MathInline, "math-block": MathBlock }`)
 * once a math mdast extension is wired in (`mdast-util-math`, peer-dep).
 */
import { useEffect, useState } from "react";
import type { JSX } from "react";
import { cn } from "../cn.js";

interface KatexLib {
  renderToString: (
    tex: string,
    opts?: { displayMode?: boolean; throwOnError?: boolean; output?: string },
  ) => string;
}

let katexCache: KatexLib | null = null;
let katexFailed = false;

async function loadKatex(): Promise<KatexLib | null> {
  if (katexCache) return katexCache;
  if (katexFailed) return null;
  try {
    const mod = (await import("katex")) as unknown as { default?: KatexLib } & KatexLib;
    // `katex` ships UMD-default; both shapes exist depending on the bundler.
    const lib = mod.default ?? mod;
    katexCache = lib;
    return katexCache;
  } catch {
    katexFailed = true;
    return null;
  }
}

interface MathProps {
  /** The TeX source string (without `$` or `$$` wrappers). */
  tex: string;
  /** Inline (true) vs display (false). */
  inline: boolean;
  className?: string;
}

function MathImpl({ tex, inline, className }: MathProps): JSX.Element {
  const [html, setHtml] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadKatex().then((katex) => {
      if (cancelled || !katex) return;
      try {
        const out = katex.renderToString(tex, {
          displayMode: !inline,
          throwOnError: false,
          output: "html",
        });
        setHtml(out);
      } catch {
        /* invalid TeX — leave plain fallback */
      }
    });
    return () => {
      cancelled = true;
    };
  }, [tex, inline]);

  if (!html) {
    const Tag = inline ? "code" : "pre";
    return (
      <Tag
        className={cn(
          inline
            ? "rounded bg-muted px-1.5 py-0.5 font-mono text-code-sm"
            : "my-3 overflow-x-auto rounded-lg border border-border bg-muted/30 p-3 font-mono text-code-sm",
          className,
        )}
      >
        {tex}
      </Tag>
    );
  }

  const Tag = inline ? "span" : "div";
  return (
    <Tag
      className={cn(inline ? "katex-inline" : "katex-block my-3 overflow-x-auto", className)}
      // biome-ignore lint/security/noDangerouslySetInnerHtml: KaTeX renderToString output is sanitized HTML it produced itself; only `tex` (already-sanitized markdown content) flows in
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

export type MathInlineProps = Omit<MathProps, "inline">;
export type MathBlockProps = Omit<MathProps, "inline">;

export function MathInline(props: MathInlineProps): JSX.Element {
  return <MathImpl {...props} inline={true} />;
}

export function MathBlock(props: MathBlockProps): JSX.Element {
  return <MathImpl {...props} inline={false} />;
}
