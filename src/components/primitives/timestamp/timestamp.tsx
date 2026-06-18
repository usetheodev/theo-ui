"use client";

import { forwardRef, useEffect, useState } from "react";
import type { TimeHTMLAttributes } from "react";
import { cn } from "../../../lib/cn.js";
import { isDev } from "../../../lib/env.js";

/**
 * Timestamp — accessible relative/absolute time primitive.
 *
 * Renders a semantic `<time datetime>` element. Format modes:
 *   - `relative` (default) — "just now", "5 minutes ago", "2 hours ago",
 *     "Dec 5" (>7d), "Dec 5, 2024" (different year)
 *   - `absolute` — full localized date+time
 *   - `both` — "Dec 5, 2026 (2 hours ago)"
 *
 * Uses zero-dep `Intl.RelativeTimeFormat`. The tooltip on hover is the
 * HTML `title` attribute (not the `<Tooltip>` component) — keeps this
 * file a true primitive without sibling-primitive imports.
 *
 * Auto-refreshes via `setInterval` (default 60_000ms); pass
 * `refreshInterval={0}` to disable. `aria-label` always carries the
 * absolute time so screen readers read "May 23, 2026 14:32 — posted
 * 2 hours ago".
 *
 * @param value Source date — ISO string, Date object, or **Unix ms**
 *              (NOT seconds). Passing seconds renders ~1970.
 */
export interface TimestampProps extends Omit<TimeHTMLAttributes<HTMLTimeElement>, "children"> {
  value: string | Date | number;
  format?: "relative" | "absolute" | "both";
  /** Auto-refresh interval when format=relative. Default 60000. 0 disables. */
  refreshInterval?: number;
  /** Locale for absolute formatting + Intl.RelativeTimeFormat. Default browser locale. */
  locale?: string;
  /** When true, omit the `title` tooltip. */
  noTooltip?: boolean;
}

function toDate(value: string | Date | number): Date | null {
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
const UNITS: Array<{ unit: Intl.RelativeTimeFormatUnit; ms: number }> = [
  { unit: "year", ms: 365 * 24 * 60 * 60 * 1000 },
  { unit: "month", ms: 30 * 24 * 60 * 60 * 1000 },
  { unit: "day", ms: 24 * 60 * 60 * 1000 },
  { unit: "hour", ms: 60 * 60 * 1000 },
  { unit: "minute", ms: 60 * 1000 },
];

function safeRelativeFormatter(locale: string | undefined): Intl.RelativeTimeFormat | null {
  try {
    return new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  } catch {
    // EC-8: invalid locale tag — fall back to default locale.
    if (isDev()) {
      // biome-ignore lint/suspicious/noConsole: dev-only diagnostic.
      console.warn(`<Timestamp locale="${locale}">: invalid locale tag, falling back to default.`);
    }
    try {
      return new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });
    } catch {
      return null;
    }
  }
}

function safeAbsoluteFormat(date: Date, locale: string | undefined, withYear: boolean): string {
  try {
    return date.toLocaleDateString(locale, {
      month: "short",
      day: "numeric",
      ...(withYear ? { year: "numeric" } : {}),
    });
  } catch {
    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      ...(withYear ? { year: "numeric" } : {}),
    });
  }
}

function formatRelative(date: Date, now: Date, locale: string | undefined): string {
  const diffMs = date.getTime() - now.getTime();
  const absMs = Math.abs(diffMs);

  if (absMs < 60_000) return "just now";

  if (diffMs < 0 && absMs > SEVEN_DAYS_MS) {
    const sameYear = date.getFullYear() === now.getFullYear();
    return safeAbsoluteFormat(date, locale, !sameYear);
  }

  const rtf = safeRelativeFormatter(locale);
  if (rtf === null) {
    return safeAbsoluteFormat(date, locale, date.getFullYear() !== now.getFullYear());
  }

  for (const { unit, ms } of UNITS) {
    if (absMs >= ms) {
      return rtf.format(Math.round(diffMs / ms), unit);
    }
  }
  return "just now";
}

function formatAbsolute(date: Date, locale: string | undefined): string {
  try {
    return date.toLocaleString(locale, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return date.toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }
}

const Timestamp = forwardRef<HTMLTimeElement, TimestampProps>(
  (
    {
      className,
      value,
      format = "relative",
      refreshInterval = 60_000,
      locale,
      noTooltip,
      ...props
    },
    ref,
  ) => {
    const date = toDate(value);
    const [now, setNow] = useState<Date>(() => new Date());

    useEffect(() => {
      if (format !== "relative" || refreshInterval === 0 || date === null) return;
      const id = setInterval(() => setNow(new Date()), refreshInterval);
      return () => clearInterval(id);
    }, [format, refreshInterval, date]);

    if (date === null) {
      return (
        <time
          ref={ref}
          className={cn(className)}
          suppressHydrationWarning
          {...props}
          data-slot="timestamp"
        />
      );
    }

    const iso = date.toISOString();
    const absolute = formatAbsolute(date, locale);
    const relative = formatRelative(date, now, locale);
    const visibleText =
      format === "absolute" ? absolute : format === "both" ? `${absolute} (${relative})` : relative;

    return (
      <time
        ref={ref}
        dateTime={iso}
        title={noTooltip ? undefined : absolute}
        aria-label={absolute}
        suppressHydrationWarning
        className={cn(className)}
        {...props}
        data-slot="timestamp"
      >
        {visibleText}
      </time>
    );
  },
);
Timestamp.displayName = "Timestamp";

export { Timestamp };
