/**
 * `<FilePart>` — renders a `FileUIPart` as an image preview (`image/*`) or
 * a generic file chip (everything else).
 *
 * Security: only `http(s)` and `data:` URLs render. Anything else degrades
 * to a plain text label.
 */
import { FileIcon, ImageIcon } from "lucide-react";
import { cn } from "../../../../lib/cn.js";
import { safeHref } from "../../../../lib/safe-href.js";
import type { FileUIPart } from "../../../../types/chat.js";

export interface FilePartProps {
  part: FileUIPart;
}

function isImage(mediaType: string): boolean {
  return mediaType.startsWith("image/") || mediaType === "image";
}

export function FilePart({ part }: FilePartProps): JSX.Element {
  const safeUrl = safeHref(part.url);
  const label = part.filename ?? part.url.split("/").pop() ?? "file";

  if (isImage(part.mediaType)) {
    if (!safeUrl) {
      return (
        <div
          className={cn(
            "my-2 inline-flex items-center gap-2 rounded-md border border-border bg-muted/30 px-3 py-2",
            "text-body-sm text-muted-foreground",
          )}
          data-slot="file-part"
        >
          <ImageIcon className="size-4" aria-hidden="true" />
          <span>{label}</span>
          <span className="text-destructive">(blocked)</span>
        </div>
      );
    }
    return (
      <figure
        className="my-3 overflow-hidden rounded-lg border border-border"
        data-theo-file="image"
      >
        <img src={safeUrl} alt={label} className="block max-w-full" loading="lazy" />
        {part.filename ? (
          <figcaption className="border-border border-t bg-muted/30 px-3 py-1.5 font-mono text-label-caps text-muted-foreground uppercase tracking-wider">
            {part.filename}
          </figcaption>
        ) : null}
      </figure>
    );
  }

  return (
    <div
      className={cn(
        "my-2 inline-flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2",
        "text-body-sm",
      )}
      data-theo-file="generic"
    >
      <FileIcon className="size-4 text-muted-foreground" aria-hidden="true" />
      {safeUrl ? (
        <a href={safeUrl} className="text-primary hover:text-primary-deep hover:underline">
          {label}
        </a>
      ) : (
        <span>{label}</span>
      )}
      <span className="font-mono text-label-caps text-muted-foreground uppercase tracking-wider">
        {part.mediaType}
      </span>
    </div>
  );
}
