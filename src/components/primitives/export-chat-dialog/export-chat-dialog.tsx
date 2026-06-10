import { Download, Loader2 } from "lucide-react";
import { forwardRef, useState } from "react";

import { cn } from "../../../lib/cn.js";

/**
 * ExportChatDialog — modal letting users export a chat session in selectable
 * formats. Async-aware: `onExport` returning a Promise disables the button
 * until resolution.
 *
 * Controlled. Consumer renders the trigger and toggles `open`.
 */

export type ExportFormat = "markdown" | "json" | "jsonl" | "sharegpt";

export interface ExportChatDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onExport: (format: ExportFormat) => void | Promise<void>;
  availableFormats?: ExportFormat[];
  sessionLabel?: string;
  className?: string;
  "data-testid"?: string;
}

const FORMAT_LABELS: Record<ExportFormat, string> = {
  markdown: "Markdown (.md)",
  json: "JSON",
  jsonl: "JSONL (one message per line)",
  sharegpt: "ShareGPT trajectory",
};

const DEFAULT_FORMATS: ExportFormat[] = ["markdown", "json", "jsonl", "sharegpt"];

export const ExportChatDialog = forwardRef<HTMLDivElement, ExportChatDialogProps>(
  (
    {
      open,
      onOpenChange,
      onExport,
      availableFormats = DEFAULT_FORMATS,
      sessionLabel,
      className,
      "data-testid": dataTestId,
    },
    ref,
  ) => {
    const [format, setFormat] = useState<ExportFormat>(availableFormats[0] ?? "markdown");
    const [exporting, setExporting] = useState(false);

    if (!open) return null;

    const handleExport = async () => {
      setExporting(true);
      try {
        await Promise.resolve(onExport(format));
        onOpenChange(false);
      } finally {
        setExporting(false);
      }
    };

    return (
      <div
        ref={ref}
        // biome-ignore lint/a11y/useSemanticElements: custom modal backdrop, not browser <dialog>; aria-modal preserves a11y semantics
        role="dialog"
        aria-modal="true"
        aria-labelledby="export-chat-dialog-title"
        className={cn(
          "fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur",
          className,
        )}
        data-testid={dataTestId ?? "export-chat-dialog"}
      >
        <div className="w-full max-w-sm rounded-lg border border-border bg-card p-4 shadow-lg">
          <h2 id="export-chat-dialog-title" className="font-semibold text-base">
            Export chat
            {sessionLabel !== undefined && sessionLabel.length > 0 && (
              <span className="ml-2 text-muted-foreground text-xs">{sessionLabel}</span>
            )}
          </h2>

          <fieldset className="mt-3 space-y-1.5">
            <legend className="sr-only">Choose format</legend>
            {availableFormats.map((f) => (
              <label
                key={f}
                className="flex cursor-pointer items-center gap-2 rounded px-2 py-1 hover:bg-muted/30"
              >
                <input
                  type="radio"
                  name="export-format"
                  value={f}
                  checked={format === f}
                  onChange={() => setFormat(f)}
                  disabled={exporting}
                  data-testid={`export-format-${f}`}
                />
                <span className="text-sm">{FORMAT_LABELS[f]}</span>
              </label>
            ))}
          </fieldset>

          <div className="mt-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              disabled={exporting}
              className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-muted/30 disabled:opacity-50"
              data-testid="export-chat-cancel"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleExport}
              disabled={exporting}
              className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 font-medium text-primary-foreground text-sm hover:bg-primary/90 disabled:opacity-50"
              data-testid="export-chat-submit"
            >
              {exporting ? (
                <Loader2 className="size-4 animate-spin" aria-hidden />
              ) : (
                <Download className="size-4" aria-hidden />
              )}
              Export
            </button>
          </div>
        </div>
      </div>
    );
  },
);
ExportChatDialog.displayName = "ExportChatDialog";
