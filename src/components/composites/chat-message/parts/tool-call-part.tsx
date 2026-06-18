/**
 * `<ToolCallPart>` — renders a `ToolUIPart` (static `tool-${name}` or
 * `dynamic-tool`) as an inline card with the tool name, the input args, the
 * resolved output / error, and the current invocation state.
 *
 * Uses our `<Card>` primitive (composite-layer dep is allowed).
 */
import { AlertCircleIcon, CheckCircleIcon, LoaderIcon, ShieldIcon, WrenchIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "../../../../lib/cn.js";
import type { ToolUIPart } from "../../../../types/chat.js";

export interface ToolCallPartProps {
  part: ToolUIPart;
}

function deriveToolName(part: ToolUIPart): string {
  if (part.toolName) return part.toolName;
  if (part.type === "dynamic-tool") return "dynamic-tool";
  // type is `tool-${name}` — strip the prefix
  return part.type.slice("tool-".length);
}

function stateBadge(state: ToolUIPart["state"]): { icon: ReactNode; label: string; tone: string } {
  switch (state) {
    case "input-streaming":
      return {
        icon: <LoaderIcon className="size-3.5 animate-spin" aria-hidden="true" />,
        label: "Streaming input",
        tone: "text-muted-foreground",
      };
    case "input-available":
      return {
        icon: <WrenchIcon className="size-3.5" aria-hidden="true" />,
        label: "Ready to call",
        tone: "text-primary",
      };
    case "approval-requested":
      return {
        icon: <ShieldIcon className="size-3.5" aria-hidden="true" />,
        label: "Awaiting approval",
        tone: "text-warning",
      };
    case "approval-responded":
      return {
        icon: <ShieldIcon className="size-3.5" aria-hidden="true" />,
        label: "Approval responded",
        tone: "text-primary",
      };
    case "output-available":
      return {
        icon: <CheckCircleIcon className="size-3.5" aria-hidden="true" />,
        label: "Completed",
        tone: "text-success",
      };
    case "output-error":
      return {
        icon: <AlertCircleIcon className="size-3.5" aria-hidden="true" />,
        label: "Error",
        tone: "text-destructive",
      };
    case "output-denied":
      return {
        icon: <ShieldIcon className="size-3.5" aria-hidden="true" />,
        label: "Denied",
        tone: "text-destructive",
      };
    default:
      return {
        icon: <WrenchIcon className="size-3.5" aria-hidden="true" />,
        label: "Unknown",
        tone: "text-muted-foreground",
      };
  }
}

function safeStringify(value: unknown): string {
  if (value === undefined) return "";
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

export function ToolCallPart({ part }: ToolCallPartProps): JSX.Element {
  const toolName = deriveToolName(part);
  const badge = stateBadge(part.state);
  const inputStr = safeStringify(part.input);
  const outputStr =
    part.state === "output-available" ? safeStringify(part.output) : (part.errorText ?? "");

  return (
    <div
      data-slot="tool-call-part"
      className={cn("my-3 overflow-hidden rounded-lg border border-border bg-card", "shadow-sm")}
      data-theo-tool-call={part.state}
    >
      <header className="flex items-center justify-between gap-3 border-border border-b bg-muted/30 px-3 py-1.5">
        <div className="flex min-w-0 items-center gap-2">
          <WrenchIcon className="size-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
          <span className="truncate font-mono text-foreground text-label">{toolName}</span>
        </div>
        <span
          className={cn(
            "inline-flex items-center gap-1 text-label-caps uppercase tracking-wider",
            badge.tone,
          )}
        >
          {badge.icon}
          <span>{badge.label}</span>
        </span>
      </header>

      {inputStr ? (
        <details className="border-border border-b" open={part.state === "input-streaming"}>
          <summary className="cursor-pointer px-3 py-1.5 font-mono text-label-caps text-muted-foreground uppercase tracking-wider hover:text-foreground">
            Input
          </summary>
          <pre className="overflow-x-auto bg-muted/20 px-3 py-2 text-code-sm">
            <code>{inputStr}</code>
          </pre>
        </details>
      ) : null}

      {outputStr ? (
        <details open={part.state === "output-error" || part.state === "output-available"}>
          <summary
            className={cn(
              "cursor-pointer px-3 py-1.5 font-mono text-label-caps uppercase tracking-wider hover:text-foreground",
              part.state === "output-error" ? "text-destructive" : "text-muted-foreground",
            )}
          >
            {part.state === "output-error" ? "Error" : "Output"}
          </summary>
          <pre
            className={cn(
              "overflow-x-auto px-3 py-2 text-code-sm",
              part.state === "output-error" ? "bg-destructive/5" : "bg-muted/20",
            )}
          >
            <code>{outputStr}</code>
          </pre>
        </details>
      ) : null}
    </div>
  );
}
