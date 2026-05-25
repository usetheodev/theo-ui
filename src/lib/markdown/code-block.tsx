"use client";

/**
 * `<CodeBlock>` — fenced code block with syntax highlight + copy button.
 *
 * Lazy-loads `shiki` (peer-dep optional). If shiki is not installed, falls
 * back to a plain `<pre><code>` with the language label still visible. The
 * copy button works in both modes (clipboard API only).
 *
 * Inspired by `shadcn.io`'s AI code-block pattern:
 *   - language label top-left
 *   - copy button top-right, icon swap (Copy → Check) for ~2s after success
 *   - keyboard accessible (button is a real <button>)
 *   - SSR-safe: highlighted markup is sync-rendered when ready; before
 *     hydration, plain text shows (matches Slide's shiki plugin behavior).
 *
 * Used by `parseMarkdownToReact` via the `components.code` override.
 */
import { CheckIcon, CopyIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "../cn.js";

export interface CodeBlockProps {
  /** The raw source code. Newlines preserved verbatim. */
  code: string;
  /** Language hint (`typescript`, `python`, `bash`, …). Falls through if unknown. */
  language?: string;
  /** Dual-theme map — Shiki theme names. */
  themes?: { light: string; dark: string };
  /** Extra className for the outer wrapper. */
  className?: string;
}

const DEFAULT_THEMES = { light: "github-light", dark: "github-dark" };

let cachedHighlighter: unknown = null;
let highlighterFailed = false;

async function getHighlighter(themes: { light: string; dark: string }): Promise<unknown> {
  if (cachedHighlighter) return cachedHighlighter;
  if (highlighterFailed) return null;
  try {
    const shiki = await import("shiki");
    cachedHighlighter = await shiki.createHighlighter({
      themes: [themes.light, themes.dark],
      langs: [
        "ts",
        "tsx",
        "js",
        "jsx",
        "python",
        "go",
        "rust",
        "java",
        "json",
        "yaml",
        "bash",
        "shell",
        "html",
        "css",
        "sql",
        "markdown",
      ],
    });
    return cachedHighlighter;
  } catch {
    highlighterFailed = true;
    return null;
  }
}

export function CodeBlock({ code, language, themes, className }: CodeBlockProps): JSX.Element {
  const [html, setHtml] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const effectiveThemes = themes ?? DEFAULT_THEMES;

  useEffect(() => {
    let cancelled = false;
    if (!language) return;
    getHighlighter(effectiveThemes)
      .then((hl) => {
        if (cancelled || !hl) return;
        try {
          // biome-ignore lint/suspicious/noExplicitAny: shiki Highlighter is untyped here
          const out = (hl as any).codeToHtml(code, {
            lang: language,
            themes: { light: effectiveThemes.light, dark: effectiveThemes.dark },
            defaultColor: "light",
          });
          setHtml(out);
        } catch {
          // unknown language or grammar load error — pass through plain
        }
      })
      .catch(() => {
        // peer-dep missing — silent; plain <pre><code> below renders
      });
    return () => {
      cancelled = true;
    };
  }, [code, language, effectiveThemes.light, effectiveThemes.dark, effectiveThemes]);

  const handleCopy = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard denied — silent */
    }
  };

  return (
    <div
      className={cn(
        "group relative my-4 overflow-hidden rounded-lg border border-border bg-muted/30",
        className,
      )}
      data-theo-code-block=""
    >
      <div className="flex items-center justify-between border-border border-b bg-muted/50 px-3 py-1.5">
        <span className="font-mono text-label-caps text-muted-foreground uppercase tracking-wider">
          {language || "text"}
        </span>
        <button
          type="button"
          onClick={handleCopy}
          className={cn(
            "inline-flex h-7 items-center gap-1.5 rounded-md px-2 text-label",
            "text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground",
            "focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring",
          )}
          aria-label={copied ? "Copied" : "Copy code"}
        >
          {copied ? (
            <>
              <CheckIcon className="size-3.5" aria-hidden="true" />
              <span>Copied</span>
            </>
          ) : (
            <>
              <CopyIcon className="size-3.5" aria-hidden="true" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      {html ? (
        <div
          className="[&_pre]:!bg-transparent [&_pre]:!m-0 [&_pre]:!p-0 overflow-x-auto p-3 text-code-sm"
          // biome-ignore lint/security/noDangerouslySetInnerHtml: Shiki output is sanitized HTML it produced itself; no user input flows through
          dangerouslySetInnerHTML={{ __html: html }}
        />
      ) : (
        <pre className="overflow-x-auto p-3 text-code-sm">
          <code className={language ? `language-${language}` : undefined}>{code}</code>
        </pre>
      )}
    </div>
  );
}
