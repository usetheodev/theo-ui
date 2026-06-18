"use client";

import { AlertOctagon, AlertTriangle, Info, type LucideIcon } from "lucide-react";
import { forwardRef, useState } from "react";

import { cn } from "../../../lib/cn.js";

/**
 * StabilityBundleViewer — inspector for a stability-bundle JSON produced by a
 * server crash. Sections (error, env, config, metadata) collapse independently.
 *
 * EC-9: handles bundles missing optional sections gracefully. Renderer DOES
 * NOT redact env values — bundle writer is expected to redact at emit-time.
 */

export type StabilitySeverity = "fatal" | "error" | "warn";

export interface StabilityBundle {
  timestamp: string;
  severity: StabilitySeverity;
  summary: string;
  error?: { name: string; message: string; stack?: string };
  env?: Record<string, string>;
  config?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export interface StabilityBundleViewerProps {
  bundle: StabilityBundle;
  onCopy?: () => void;
  className?: string;
  "data-testid"?: string;
}

const SEVERITY_META: Record<
  StabilitySeverity,
  { icon: LucideIcon; className: string; label: string }
> = {
  fatal: {
    icon: AlertOctagon,
    className: "text-destructive",
    label: "Fatal",
  },
  error: {
    icon: AlertTriangle,
    className: "text-warning",
    label: "Error",
  },
  warn: {
    icon: Info,
    className: "text-info",
    label: "Warning",
  },
};

interface CollapsibleSectionProps {
  title: string;
  testId: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

function CollapsibleSection({
  title,
  testId,
  defaultOpen = true,
  children,
}: CollapsibleSectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="rounded border border-border" data-testid={testId}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-3 py-2 text-left font-medium text-sm hover:bg-muted/30"
        aria-expanded={open}
        data-testid={`${testId}-toggle`}
      >
        <span>{title}</span>
        <span aria-hidden>{open ? "▾" : "▸"}</span>
      </button>
      {open && <div className="border-border border-t px-3 py-2">{children}</div>}
    </section>
  );
}

export const StabilityBundleViewer = forwardRef<HTMLDivElement, StabilityBundleViewerProps>(
  ({ bundle, onCopy, className, "data-testid": dataTestId }, ref) => {
    const meta = SEVERITY_META[bundle.severity] ?? SEVERITY_META.error;
    const Icon = meta.icon;
    const envEntries = bundle.env !== undefined ? Object.entries(bundle.env) : [];
    const configEntries = bundle.config !== undefined ? Object.entries(bundle.config) : [];
    const metadataEntries = bundle.metadata !== undefined ? Object.entries(bundle.metadata) : [];

    return (
      <div
        ref={ref}
        className={cn("flex flex-col gap-3", className)}
        data-testid={dataTestId ?? "stability-bundle-viewer"}
        data-slot="stability-bundle-viewer"
      >
        <header className="flex items-start gap-3 rounded border border-border bg-card p-3">
          <Icon className={cn("size-5", meta.className)} aria-hidden />
          <div className="flex-1">
            <div className="flex items-baseline gap-2">
              <span
                className={cn("font-semibold text-sm", meta.className)}
                data-testid="stability-severity"
              >
                {meta.label}
              </span>
              <time
                className="text-muted-foreground text-xs"
                dateTime={bundle.timestamp}
                data-testid="stability-timestamp"
              >
                {bundle.timestamp}
              </time>
            </div>
            <p className="mt-1 text-sm" data-testid="stability-summary">
              {bundle.summary}
            </p>
          </div>
          {onCopy !== undefined && (
            <button
              type="button"
              onClick={onCopy}
              className="rounded border border-border px-2 py-1 text-xs hover:bg-muted/30"
              data-testid="stability-copy"
            >
              Copy
            </button>
          )}
        </header>

        {bundle.error !== undefined && (
          <CollapsibleSection title="Error" testId="stability-section-error">
            <p className="font-mono text-sm">
              <strong>{bundle.error.name}</strong>: {bundle.error.message}
            </p>
            {bundle.error.stack !== undefined && bundle.error.stack.length > 0 && (
              <pre
                className="mt-2 overflow-x-auto rounded bg-muted/30 p-2 text-xs"
                data-testid="stability-stack"
              >
                {bundle.error.stack}
              </pre>
            )}
          </CollapsibleSection>
        )}

        {envEntries.length > 0 && (
          <CollapsibleSection
            title={`Environment (${envEntries.length})`}
            testId="stability-section-env"
            defaultOpen={false}
          >
            <table className="w-full text-xs">
              <thead className="text-muted-foreground">
                <tr>
                  <th className="text-left">Key</th>
                  <th className="text-left">Value</th>
                </tr>
              </thead>
              <tbody>
                {envEntries.map(([k, v]) => (
                  <tr key={k} className="border-border/40 border-t">
                    <td className="py-1 pr-2 font-mono">{k}</td>
                    <td className="py-1 font-mono">{v}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CollapsibleSection>
        )}

        {configEntries.length > 0 && (
          <CollapsibleSection title="Config" testId="stability-section-config" defaultOpen={false}>
            <pre className="overflow-x-auto rounded bg-muted/30 p-2 text-xs">
              {JSON.stringify(bundle.config, null, 2)}
            </pre>
          </CollapsibleSection>
        )}

        {metadataEntries.length > 0 && (
          <CollapsibleSection
            title="Metadata"
            testId="stability-section-metadata"
            defaultOpen={false}
          >
            <pre className="overflow-x-auto rounded bg-muted/30 p-2 text-xs">
              {JSON.stringify(bundle.metadata, null, 2)}
            </pre>
          </CollapsibleSection>
        )}
      </div>
    );
  },
);
StabilityBundleViewer.displayName = "StabilityBundleViewer";
