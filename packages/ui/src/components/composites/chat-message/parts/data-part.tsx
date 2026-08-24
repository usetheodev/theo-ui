/**
 * `<DataPart>` — renders a `DataUIPart` (`type: "data-${name}"`).
 *
 * Consumer-defined data parts get routed to a custom renderer via the
 * `dataRenderers` prop on `<ChatMessage>`. Without a matching renderer,
 * the part renders as a compact `<details>` JSON dump (debug-friendly).
 */
import { CodeIcon } from "lucide-react";
import type { JSX } from "react";
import { cn } from "../../../../lib/cn.js";
import type { DataUIPart } from "../../../../types/chat.js";

export type DataRenderer = (data: unknown, part: DataUIPart) => JSX.Element;
export type DataRendererMap = Record<string, DataRenderer>;

export interface DataPartProps {
  part: DataUIPart;
  /** Map of `data-${name}` → renderer. */
  renderers?: DataRendererMap;
}

function deriveDataName(part: DataUIPart): string {
  return part.type.slice("data-".length);
}

export function DataPart({ part, renderers }: DataPartProps): JSX.Element {
  const name = deriveDataName(part);
  const renderer = renderers?.[part.type] ?? renderers?.[name];
  if (renderer) return renderer(part.data, part);

  return (
    <details
      className={cn("my-2 rounded-md border border-border bg-muted/20 px-3 py-1.5 text-body-sm")}
      data-theo-data={name}
    >
      <summary className="flex cursor-pointer items-center gap-1.5 font-mono text-label-caps text-muted-foreground uppercase tracking-wider">
        <CodeIcon className="size-3" aria-hidden="true" />
        <span>data-{name}</span>
      </summary>
      <pre className="mt-2 overflow-x-auto border-border border-t pt-2 text-code-sm">
        <code>{safeStringify(part.data)}</code>
      </pre>
    </details>
  );
}

function safeStringify(value: unknown): string {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}
