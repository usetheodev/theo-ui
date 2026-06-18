"use client";

import { Check, Globe, Plus, ShieldCheck, ShieldX, Trash2 } from "lucide-react";
import { forwardRef, useState } from "react";
import type { HTMLAttributes } from "react";
import { cn } from "../../../lib/cn.js";
import { Badge } from "../../primitives/badge/index.js";
import { Button } from "../../primitives/button/index.js";
import { Input } from "../../primitives/input/index.js";

export type DomainStatus = "verified" | "pending" | "invalid";

export interface Domain {
  id: string;
  hostname: string;
  status: DomainStatus;
  primary?: boolean;
  /**
   * TLS state. If true, certificate is provisioned & valid.
   */
  tls?: boolean;
  /**
   * DNS record the user must add to verify ownership.
   */
  verificationRecord?: {
    type: "TXT" | "CNAME" | "A";
    name: string;
    value: string;
  };
}

const statusVariant: Record<DomainStatus, "success" | "warning" | "destructive"> = {
  verified: "success",
  pending: "warning",
  invalid: "destructive",
};
const statusDot: Record<DomainStatus, "success" | "warning" | "destructive"> = {
  verified: "success",
  pending: "warning",
  invalid: "destructive",
};
const statusLabel: Record<DomainStatus, string> = {
  verified: "Verified",
  pending: "Pending DNS",
  invalid: "Invalid",
};

interface DomainConfigProps extends HTMLAttributes<HTMLDivElement> {
  domains: Domain[];
  onAdd?: (hostname: string) => void;
  onRemove?: (id: string) => void;
  onSetPrimary?: (id: string) => void;
}

/**
 * DomainConfig — manage custom domains for a project.
 *
 * Shows: hostname, status, TLS, primary flag, and verification DNS record when pending.
 * Common in every cloud dashboard (Vercel, Railway, Render).
 */
const DomainConfig = forwardRef<HTMLDivElement, DomainConfigProps>(
  ({ className, domains, onAdd, onRemove, onSetPrimary, ...props }, ref) => {
    const [hostname, setHostname] = useState("");

    return (
      <div
        data-slot="domain-config"
        ref={ref}
        className={cn("rounded-xl border bg-card p-5 shadow-sm", className)}
        {...props}
      >
        <header className="mb-4 flex items-baseline justify-between gap-3">
          <div>
            <h3 className="font-display text-title-md tracking-tight">Domains</h3>
            <p className="text-body-sm text-muted-foreground">{domains.length} configured</p>
          </div>
        </header>

        {onAdd ? (
          <form
            className="mb-4 grid grid-cols-[1fr_auto] gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              const v = hostname.trim();
              if (!v) return;
              onAdd(v);
              setHostname("");
            }}
          >
            <Input
              placeholder="api.acme.com"
              value={hostname}
              onChange={(e) => setHostname(e.target.value)}
              aria-label="Hostname"
              className="font-mono"
            />
            <Button type="submit">
              <Plus /> Add domain
            </Button>
          </form>
        ) : null}

        <ul className="grid gap-3">
          {domains.map((d) => (
            <li key={d.id} className="grid gap-3 rounded-lg border border-border/40 p-4">
              <div className="flex flex-wrap items-center gap-3">
                <Globe className="size-4 text-muted-foreground" aria-hidden="true" />
                <span className="font-mono text-code-md text-foreground">{d.hostname}</span>
                <Badge variant={statusVariant[d.status]}>
                  <Badge.Dot tone={statusDot[d.status]} pulse={d.status === "pending"} />
                  {statusLabel[d.status]}
                </Badge>
                {d.tls === true ? (
                  <Badge variant="primary">
                    <ShieldCheck className="size-3" /> TLS
                  </Badge>
                ) : d.tls === false ? (
                  <Badge variant="destructive">
                    <ShieldX className="size-3" /> No TLS
                  </Badge>
                ) : null}
                {d.primary ? (
                  <Badge variant="accent">
                    <Check className="size-3" /> Primary
                  </Badge>
                ) : null}
                <div className="ml-auto flex items-center gap-1">
                  {!d.primary && onSetPrimary ? (
                    <Button size="sm" variant="ghost" onClick={() => onSetPrimary(d.id)}>
                      Set primary
                    </Button>
                  ) : null}
                  {onRemove ? (
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => onRemove(d.id)}
                      aria-label={`Remove ${d.hostname}`}
                    >
                      <Trash2 />
                    </Button>
                  ) : null}
                </div>
              </div>
              {d.status === "pending" && d.verificationRecord ? (
                <div className="rounded-md border border-border/60 border-dashed bg-muted/30 p-3 font-mono text-code-sm">
                  <p className="mb-2 font-sans text-label-caps text-muted-foreground uppercase">
                    Add this DNS record to verify
                  </p>
                  <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
                    <span className="text-muted-foreground">type</span>
                    <span>{d.verificationRecord.type}</span>
                    <span className="text-muted-foreground">name</span>
                    <span>{d.verificationRecord.name}</span>
                    <span className="text-muted-foreground">value</span>
                    <span className="break-all">{d.verificationRecord.value}</span>
                  </div>
                </div>
              ) : null}
            </li>
          ))}
          {domains.length === 0 ? (
            <li className="rounded-lg border border-border/40 border-dashed p-8 text-center text-body-sm text-muted-foreground">
              No domains yet. Add one to route traffic to this project.
            </li>
          ) : null}
        </ul>
      </div>
    );
  },
);
DomainConfig.displayName = "DomainConfig";

export { DomainConfig };
