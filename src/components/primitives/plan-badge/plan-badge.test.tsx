import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import { PlanBadge, type PlanTier } from "./plan-badge.js";

const TIERS: { plan: PlanTier; expectedBg: string; expectedText: string; expectedLabel: string }[] =
  [
    {
      plan: "free",
      expectedBg: "bg-muted/40",
      expectedText: "text-muted-foreground",
      expectedLabel: "Free",
    },
    {
      plan: "hobby",
      expectedBg: "bg-warning/10",
      expectedText: "text-warning",
      expectedLabel: "Hobby",
    },
    {
      plan: "pro",
      expectedBg: "bg-primary/10",
      expectedText: "text-primary",
      expectedLabel: "Pro",
    },
    {
      plan: "team",
      expectedBg: "bg-success/10",
      expectedText: "text-success",
      expectedLabel: "Team",
    },
    {
      plan: "enterprise",
      expectedBg: "bg-foreground/5",
      expectedText: "text-foreground",
      expectedLabel: "Enterprise",
    },
  ];

describe("PlanBadge — tiers", () => {
  for (const tier of TIERS) {
    it(`'${tier.plan}' has distinct color classes`, () => {
      render(<PlanBadge plan={tier.plan} />);
      const badge = screen.getByText(tier.expectedLabel);
      expect(badge.className).toContain(tier.expectedBg);
      expect(badge.className).toContain(tier.expectedText);
    });

    it(`'${tier.plan}' default label is '${tier.expectedLabel}'`, () => {
      render(<PlanBadge plan={tier.plan} />);
      expect(screen.getByText(tier.expectedLabel)).toBeInTheDocument();
    });
  }

  it("sets data-plan attribute for consumer hooks/styling", () => {
    render(<PlanBadge plan="pro" />);
    expect(screen.getByText("Pro")).toHaveAttribute("data-plan", "pro");
  });
});

describe("PlanBadge — label override", () => {
  it("renders custom label verbatim (case-preserved)", () => {
    render(<PlanBadge plan="enterprise" label="Custom Tier" />);
    expect(screen.getByText("Custom Tier")).toBeInTheDocument();
    expect(screen.queryByText("Enterprise")).not.toBeInTheDocument();
  });
});

describe("PlanBadge — size", () => {
  it("size='sm' applies smaller padding + smaller text", () => {
    render(<PlanBadge plan="hobby" size="sm" />);
    const badge = screen.getByText("Hobby");
    expect(badge.className).toContain("px-1.5");
    expect(badge.className).toContain("text-label-caps");
  });

  it("size='md' is the default (px-2)", () => {
    render(<PlanBadge plan="hobby" />);
    const badge = screen.getByText("Hobby");
    expect(badge.className).toContain("px-2");
    expect(badge.className).toContain("text-label");
  });
});

describe("PlanBadge — fallback", () => {
  it("unknown tier falls back to free styling at runtime", () => {
    // biome-ignore lint/suspicious/noExplicitAny: testing the runtime guard
    render(<PlanBadge plan={"unknown" as any} label="Bogus" />);
    const badge = screen.getByText("Bogus");
    expect(badge.className).toContain("bg-muted/40");
    expect(badge.className).toContain("text-muted-foreground");
  });
});

describe("PlanBadge — a11y", () => {
  it("has no axe violations", async () => {
    const { container } = render(<PlanBadge plan="hobby" />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
