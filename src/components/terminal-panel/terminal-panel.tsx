import { Terminal as TerminalIcon } from "lucide-react";
import { forwardRef } from "react";
import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "../../lib/cn.js";

export interface TerminalLine {
  id: string;
  /**
   * Visual kind: command (prompted), stdout, stderr, ok (success), prompt (active line).
   */
  kind?: "command" | "stdout" | "stderr" | "ok" | "prompt";
  content: ReactNode;
}

interface TerminalPanelProps extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  title?: ReactNode;
  lines: TerminalLine[];
  /**
   * Optional prompt prefix for commands, defaults to "$".
   */
  promptPrefix?: string;
}

const kindColor: Record<NonNullable<TerminalLine["kind"]>, string> = {
  command: "text-foreground",
  stdout: "text-muted-foreground",
  stderr: "text-destructive",
  ok: "text-success",
  prompt: "text-primary",
};

/**
 * TerminalPanel — minimal terminal output viewer.
 *
 * Visual: dark card with mono font, "$ " prefix on command lines, color-coded
 * stdout/stderr/success. No interactivity (read-only) — pair with your own
 * pty/xterm for live shells if needed.
 */
const TerminalPanel = forwardRef<HTMLDivElement, TerminalPanelProps>(
  ({ className, title = "Terminal", lines, promptPrefix = "$", ...props }, ref) => (
    <div
      ref={ref}
      className={cn("overflow-hidden rounded-xl border bg-card", className)}
      {...props}
    >
      <header className="flex items-center gap-2 border-border/40 border-b px-3 py-2">
        <TerminalIcon className="size-3.5 text-muted-foreground" aria-hidden />
        <span className="font-sans text-label-caps text-muted-foreground uppercase tracking-wider">
          {title}
        </span>
      </header>
      <ol className="grid gap-0.5 px-3 py-2 font-mono text-code-sm">
        {lines.map((line) => {
          const kind = line.kind ?? "stdout";
          return (
            <li key={line.id} className={cn("whitespace-pre-wrap", kindColor[kind])}>
              {kind === "command" ? (
                <>
                  <span className="select-none text-primary">{promptPrefix} </span>
                  {line.content}
                </>
              ) : kind === "prompt" ? (
                <span className="animate-pulse">{line.content}</span>
              ) : (
                line.content
              )}
            </li>
          );
        })}
      </ol>
    </div>
  ),
);
TerminalPanel.displayName = "TerminalPanel";

export { TerminalPanel };
