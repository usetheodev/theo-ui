import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { Timestamp } from "./timestamp.js";

const NOW = new Date("2026-05-23T12:00:00Z");

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

function getText() {
  return screen.getByRole("time").textContent ?? "";
}

describe("Timestamp — relative", () => {
  it("renders 'just now' for value within last 60s", () => {
    render(<Timestamp value={new Date(NOW.getTime() - 30_000)} />);
    expect(getText()).toBe("just now");
  });

  it("renders minutes ago", () => {
    render(<Timestamp value={new Date(NOW.getTime() - 5 * 60_000)} locale="en-US" />);
    expect(getText()).toMatch(/5 minutes ago/i);
  });

  it("renders hours ago", () => {
    render(<Timestamp value={new Date(NOW.getTime() - 2 * 60 * 60_000)} locale="en-US" />);
    expect(getText()).toMatch(/2 hours ago/i);
  });

  it("renders days ago", () => {
    render(<Timestamp value={new Date(NOW.getTime() - 3 * 24 * 60 * 60_000)} locale="en-US" />);
    expect(getText()).toMatch(/3 days ago/i);
  });

  it("uses short absolute format same-year past 7d", () => {
    const eightDaysAgo = new Date(NOW.getTime() - 8 * 24 * 60 * 60_000);
    render(<Timestamp value={eightDaysAgo} locale="en-US" />);
    const t = getText();
    expect(t).toMatch(/May/);
    expect(t).not.toMatch(/\b2026\b/);
  });

  it("includes year when different year", () => {
    const lastYear = new Date(NOW.getTime() - 200 * 24 * 60 * 60_000);
    render(<Timestamp value={lastYear} locale="en-US" />);
    expect(getText()).toMatch(/2025/);
  });

  it("future dates prefix 'in'", () => {
    render(<Timestamp value={new Date(NOW.getTime() + 5 * 60_000)} locale="en-US" />);
    expect(getText()).toMatch(/in 5 minutes/i);
  });
});

describe("Timestamp — invalid + refresh", () => {
  it("invalid date renders empty time element", () => {
    render(<Timestamp value="not a date" />);
    const t = screen.getByRole("time");
    expect(t.textContent).toBe("");
  });

  it("refreshInterval=0 does not schedule setInterval", () => {
    const spy = vi.spyOn(globalThis, "setInterval");
    render(
      <Timestamp value={new Date(NOW.getTime() - 60_000)} refreshInterval={0} locale="en-US" />,
    );
    expect(spy).not.toHaveBeenCalled();
  });

  it("aria-label carries the absolute time with year", () => {
    render(<Timestamp value={new Date(NOW.getTime() - 60_000)} locale="en-US" />);
    const label = screen.getByRole("time").getAttribute("aria-label") ?? "";
    expect(label).toMatch(/2026/);
  });
});

describe("Timestamp — edge cases", () => {
  // EC-7: Unix seconds vs ms — document via behavior (seconds → ~1970)
  it("number value is treated as milliseconds (Unix seconds renders ~1970)", () => {
    render(<Timestamp value={1_700_000_000} locale="en-US" />);
    // 1.7B ms = 1970-01-20; ~55 years before NOW = renders as long-ago year.
    const t = getText();
    expect(t).toMatch(/1970/);
  });

  // EC-8: invalid locale falls back to default
  it("invalid locale does not crash, falls back to default", () => {
    const Original = Intl.RelativeTimeFormat;
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    // Replace the Intl constructor with a wrapper that throws on a specific
    // tag — some engines accept "invalid-tag" silently, so we force the
    // failure path explicitly.
    function Patched(
      this: unknown,
      locale?: Intl.LocalesArgument,
      opts?: Intl.RelativeTimeFormatOptions,
    ) {
      if (locale === "throws") {
        throw new RangeError("Incorrect locale information provided");
      }
      return new Original(locale, opts);
    }
    Patched.supportedLocalesOf = Original.supportedLocalesOf.bind(Original);
    // biome-ignore lint/suspicious/noExplicitAny: test-only constructor substitution
    (Intl as any).RelativeTimeFormat = Patched;
    try {
      expect(() =>
        render(<Timestamp value={new Date(NOW.getTime() - 60_000)} locale="throws" />),
      ).not.toThrow();
      expect(warn).toHaveBeenCalled();
    } finally {
      // biome-ignore lint/suspicious/noExplicitAny: test-only restore
      (Intl as any).RelativeTimeFormat = Original;
    }
  });
});

describe("Timestamp — a11y", () => {
  it("has no axe violations", async () => {
    vi.useRealTimers();
    const { container } = render(
      <Timestamp value={new Date(Date.now() - 60_000)} locale="en-US" />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
