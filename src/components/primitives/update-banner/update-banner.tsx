import { ArrowUpCircle, X } from "lucide-react";
import { type HTMLAttributes, forwardRef } from "react";

import { cn } from "../../../lib/cn.js";

/**
 * UpdateBanner — top-of-app alert when a newer version is available.
 *
 * Controlled. Dismiss persistence (localStorage/cookie/etc) is the consumer's
 * responsibility (per EC-16 DOCUMENT). Component just fires `onDismiss`.
 */

export interface UpdateBannerProps extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  currentVersion: string;
  latestVersion: string;
  onUpdate: () => void;
  onDismiss?: () => void;
  severity?: "info" | "warn";
  "data-testid"?: string;
}

export const UpdateBanner = forwardRef<HTMLDivElement, UpdateBannerProps>(
  (
    {
      currentVersion,
      latestVersion,
      onUpdate,
      onDismiss,
      severity = "info",
      className,
      "data-testid": dataTestId,
      ...rest
    },
    ref,
  ) => {
    return (
      <div
        ref={ref}
        role="alert"
        aria-live="polite"
        className={cn(
          "flex items-center justify-between gap-3 border-b px-4 py-2 text-sm",
          severity === "warn"
            ? "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300"
            : "border-primary/40 bg-primary/10 text-primary",
          className,
        )}
        data-testid={dataTestId ?? "update-banner"}
        data-severity={severity}
        {...rest}
      >
        <div className="flex items-center gap-2">
          <ArrowUpCircle className="size-4" aria-hidden />
          <span>
            Update available: <strong data-testid="update-banner-latest">v{latestVersion}</strong>{" "}
            (running <span data-testid="update-banner-current">v{currentVersion}</span>).
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onUpdate}
            className="rounded-md border border-current px-2 py-1 font-medium text-xs hover:bg-current/10"
            data-testid="update-banner-update-button"
          >
            Update now
          </button>
          {onDismiss !== undefined && (
            <button
              type="button"
              onClick={onDismiss}
              className="rounded-md p-1 hover:bg-current/10"
              aria-label="Dismiss update banner"
              data-testid="update-banner-dismiss"
            >
              <X className="size-4" aria-hidden />
            </button>
          )}
        </div>
      </div>
    );
  },
);
UpdateBanner.displayName = "UpdateBanner";
