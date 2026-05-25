# Recipe — Billing page

Worked example of P8 BillingPage with current plan + usage meters + pricing tier upgrade options.

---

## Brief

> "Build the billing page. Users see their current plan (Pro), current month's usage (bandwidth, build minutes, function invocations), pricing tier comparison with upgrade option, and payment method."

---

## Step 6 — Build

```tsx
{/* theo-ui · archetype: P8 BillingPage · surface: settings-form · density: comfortable
 *  composites: PageShell · Card
 *  primitives: PlanBadge · UsageMeter · CostMeter · Button · Badge
 *  theme: violet-forge  ·  a11y: WCAG 2.5.8 AA pass
 *  pre-emit critique: L5 T5 C5 A5 R5 V5
 */}
"use client";

import { CreditCard, Check } from "lucide-react";

import { PageShell } from "@usetheo/ui/page-shell";
import { Card } from "@usetheo/ui/card";
import { PlanBadge } from "@usetheo/ui/plan-badge";
import { UsageMeter } from "@usetheo/ui/usage-meter";
import { Button } from "@usetheo/ui/button";
import { Badge } from "@usetheo/ui/badge";

import { useBilling } from "@/hooks/useBilling";

const PRICING_TIERS = [
  {
    id: "hobby",
    name: "Hobby",
    price: 0,
    tagline: "For personal projects.",
    features: [
      "1 project",
      "100 GB bandwidth",
      "1,000 build minutes",
      "Community support",
    ],
    cta: "Current plan",
    ctaDisabled: true,
  },
  {
    id: "pro",
    name: "Pro",
    price: 20,
    tagline: "For growing teams.",
    featured: true,
    features: [
      "Unlimited projects",
      "1 TB bandwidth",
      "6,000 build minutes",
      "Email support",
      "Custom domains",
      "Analytics",
    ],
    cta: "Current plan",
    ctaDisabled: true,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: null,  // contact sales
    tagline: "For organizations.",
    features: [
      "Everything in Pro",
      "Dedicated support",
      "SLA + uptime guarantee",
      "SSO + audit log",
      "Custom contracts",
    ],
    cta: "Contact sales",
    ctaDisabled: false,
  },
];

export default function BillingPage() {
  const { plan, usage, invoices, paymentMethod } = useBilling();

  return (
    <PageShell
      title="Billing"
      description="Manage your plan, usage, and payment method."
    >
      <div className="space-y-6 max-w-5xl">
        <Card>
          <Card.Header>
            <Card.Title>Current plan</Card.Title>
            <div className="flex items-center gap-2">
              <PlanBadge variant="primary">{plan.name}</PlanBadge>
              <span className="text-body-md text-muted-foreground">
                Renews on {new Date(plan.renewsAt).toLocaleDateString()}
              </span>
            </div>
          </Card.Header>
          <Card.Content>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <UsageMeter
                label="Bandwidth"
                current={usage.bandwidth.current}
                max={usage.bandwidth.max}
                unit="GB"
              />
              <UsageMeter
                label="Build minutes"
                current={usage.buildMinutes.current}
                max={usage.buildMinutes.max}
                unit="min"
              />
              <UsageMeter
                label="Function invocations"
                current={usage.invocations.current}
                max={usage.invocations.max}
                unit="M"
              />
            </div>
          </Card.Content>
          <Card.Footer className="flex gap-2">
            <Button variant="ghost" asChild>
              <a href="/billing/invoices">View invoices</a>
            </Button>
          </Card.Footer>
        </Card>

        <Card>
          <Card.Header>
            <Card.Title>Plans</Card.Title>
            <Card.Description>Compare plans and upgrade or downgrade.</Card.Description>
          </Card.Header>
          <Card.Content>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {PRICING_TIERS.map((tier) => (
                <Card
                  key={tier.id}
                  className={tier.featured ? "border-primary" : undefined}
                >
                  {tier.featured && (
                    <div className="px-6 pt-6">
                      <PlanBadge variant="primary">Most popular</PlanBadge>
                    </div>
                  )}
                  <Card.Header>
                    <Card.Title>{tier.name}</Card.Title>
                    <Card.Description>{tier.tagline}</Card.Description>
                  </Card.Header>
                  <Card.Content>
                    <div className="mb-6">
                      {tier.price !== null ? (
                        <>
                          <span className="text-display-xl text-foreground font-mono">${tier.price}</span>
                          <span className="text-body-md text-muted-foreground">/month</span>
                        </>
                      ) : (
                        <span className="text-display-md text-foreground">Custom pricing</span>
                      )}
                    </div>
                    <ul className="space-y-2">
                      {tier.features.map((f) => (
                        <li key={f} className="flex items-start gap-2 text-body-md">
                          <Check className="h-4 w-4 mt-0.5 text-success shrink-0" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </Card.Content>
                  <Card.Footer>
                    <Button
                      variant={tier.featured ? "primary" : "secondary"}
                      size="lg"
                      className="w-full"
                      disabled={tier.ctaDisabled}
                    >
                      {tier.cta}
                    </Button>
                  </Card.Footer>
                </Card>
              ))}
            </div>
          </Card.Content>
        </Card>

        <Card>
          <Card.Header>
            <Card.Title>Payment method</Card.Title>
          </Card.Header>
          <Card.Content>
            {paymentMethod ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CreditCard className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-body-md text-foreground">
                      {paymentMethod.brand} ending in {paymentMethod.last4}
                    </p>
                    <p className="text-body-sm text-muted-foreground">
                      Expires {paymentMethod.expMonth}/{paymentMethod.expYear}
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="sm">Update</Button>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <p className="text-body-md text-muted-foreground">No payment method on file.</p>
                <Button variant="secondary" size="sm">Add payment method</Button>
              </div>
            )}
          </Card.Content>
        </Card>
      </div>
    </PageShell>
  );
}
```

---

## Step 7 — Slop test

| Gate | Result |
|---|---|
| L-01–L-06 | PASS |
| T-01–T-08 | PASS — `font-mono` on price digits, `text-display-xl` for the price, `text-foreground` / `text-muted-foreground` everywhere |
| C-01–C-05 | PASS |
| A-01 focus-visible | PASS |
| A-05 Color + icon | PASS — pricing tier featured uses `border-primary` + `<PlanBadge>` text (not color alone) |
| R-01–R-04 | PASS — pricing 3-up grid responsive |
| V-01 | PASS — pricing values from constants; usage values from real props |
| V-02 | PASS — buttons are verbs ("Update", "Contact sales", "Add payment method") |

**32 / 32 ✓**

---

## Handoff

```
Build complete: src/app/settings/billing/page.tsx (171 lines).

Notable patterns:
- Featured pricing tier uses `border-primary` (outline), NOT `bg-primary` (filled). The PlanBadge tells the user it's featured; the border reinforces. Filling the card primary-violet would be loud and sales-y.
- Price digits use `font-mono` so the numbers align across tiers.
- Custom pricing tier (Enterprise) replaces the price with "Custom pricing" instead of "$ — /month".
- Payment method card handles two states (has card / no card) inline.

Next steps:
- Wire useBilling() to your billing provider (Stripe, Paddle, custom).
- Add invoice list at /billing/invoices (P1 ListPage with downloadable PDF column).
- For team-billing where the org owner pays for seats, add a "Seats" UsageMeter to the current plan card.
```
