import { File, FileCode, FileImage, FileSpreadsheet, FileText, X } from "lucide-react";
import { forwardRef } from "react";
import type { HTMLAttributes } from "react";
import { cn } from "../../../lib/cn.js";
import type { IconComponent } from "../../../lib/types.js";
import type { Attachment } from "../../../types/chat.js";

const typeIcon: Record<string, IconComponent> = {
  image: FileImage,
  spreadsheet: FileSpreadsheet,
  code: FileCode,
  text: FileText,
};

interface AttachmentChipProps extends HTMLAttributes<HTMLDivElement> {
  attachment: Attachment;
  onRemove?: (id: string) => void;
}

/**
 * AttachmentChip — file pill shown in chat composer or message attachments row.
 *
 * Visual: rounded chip with type-icon + name + size + optional remove button.
 * Truncates the name with `text-ellipsis`; full name available via title.
 */
const AttachmentChip = forwardRef<HTMLDivElement, AttachmentChipProps>(
  ({ className, attachment, onRemove, ...props }, ref) => {
    const Icon: IconComponent = (attachment.type ? typeIcon[attachment.type] : undefined) ?? File;
    return (
      <div
        ref={ref}
        className={cn(
          "inline-flex max-w-[18rem] items-center gap-2 rounded-md border border-border/40 bg-muted/60 px-2 py-1",
          "font-mono text-code-sm text-muted-foreground",
          className,
        )}
        {...props}
        data-slot="attachment-chip"
      >
        <Icon className="size-3.5 shrink-0 text-primary" aria-hidden="true" />
        <span className="truncate text-foreground" title={attachment.name}>
          {attachment.name}
        </span>
        {attachment.size ? <span>· {attachment.size}</span> : null}
        {onRemove ? (
          <button
            type="button"
            onClick={() => onRemove(attachment.id)}
            aria-label={`Remove ${attachment.name}`}
            className={cn(
              "ml-1 rounded-sm p-0.5 text-muted-foreground transition-colors hover:bg-muted hover:text-destructive",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            )}
          >
            <X className="size-3" />
          </button>
        ) : null}
      </div>
    );
  },
);
AttachmentChip.displayName = "AttachmentChip";

export { AttachmentChip };
