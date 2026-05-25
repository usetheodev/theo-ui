/**
 * `<SourceUrlPart>` + `<SourceDocumentPart>` — render `source-url` and
 * `source-document` citations as compact link chips.
 */
import { ExternalLinkIcon, FileTextIcon } from "lucide-react";
import { cn } from "../../../../lib/cn.js";
import { safeHref } from "../../../../lib/safe-href.js";
import type { SourceDocumentUIPart, SourceUrlUIPart } from "../../../../types/chat.js";

export interface SourceUrlPartProps {
  part: SourceUrlUIPart;
}

export function SourceUrlPart({ part }: SourceUrlPartProps): JSX.Element {
  const safe = safeHref(part.url);
  const label = part.title || part.url;
  return (
    <span
      className={cn(
        "my-1 inline-flex max-w-full items-center gap-1.5 rounded-md border border-border bg-card px-2 py-1",
        "align-middle font-mono text-label",
      )}
      data-theo-source="url"
    >
      <ExternalLinkIcon className="size-3 text-muted-foreground" aria-hidden="true" />
      {safe ? (
        <a
          href={safe}
          className="truncate text-primary hover:text-primary-deep hover:underline"
          rel="noopener noreferrer"
          target="_blank"
        >
          {label}
        </a>
      ) : (
        <span className="truncate text-muted-foreground">{label}</span>
      )}
    </span>
  );
}

export interface SourceDocumentPartProps {
  part: SourceDocumentUIPart;
}

export function SourceDocumentPart({ part }: SourceDocumentPartProps): JSX.Element {
  return (
    <span
      className={cn(
        "my-1 inline-flex max-w-full items-center gap-1.5 rounded-md border border-border bg-card px-2 py-1",
        "align-middle font-mono text-label",
      )}
      data-theo-source="document"
    >
      <FileTextIcon className="size-3 text-muted-foreground" aria-hidden="true" />
      <span className="truncate text-foreground">{part.title}</span>
      <span className="text-muted-foreground">·</span>
      <span className="text-muted-foreground">{part.mediaType}</span>
    </span>
  );
}
