import { PlanBadge, type PlanTier } from "@theokit/ui";



const TIERS: PlanTier[] = ["free", "hobby", "pro", "team", "enterprise"];

export const Tiers = () => (
  <div className="grid gap-6">
    <div>
      <p className="mb-2 font-mono text-label-caps text-muted-foreground uppercase tracking-wider">
        size = "md" (default)
      </p>
      <div className="flex flex-wrap items-center gap-2">
        {TIERS.map((plan) => (
          <PlanBadge key={plan} plan={plan} />
        ))}
      </div>
    </div>
    <div>
      <p className="mb-2 font-mono text-label-caps text-muted-foreground uppercase tracking-wider">
        size = "sm"
      </p>
      <div className="flex flex-wrap items-center gap-2">
        {TIERS.map((plan) => (
          <PlanBadge key={plan} plan={plan} size="sm" />
        ))}
      </div>
    </div>
  </div>
);

export const WithCustomLabels = () => (
  <div className="flex flex-wrap items-center gap-2">
    <PlanBadge plan="enterprise" label="Custom" />
    <PlanBadge plan="pro" label="Acme Pro" />
    <PlanBadge plan="hobby" label="Beta" />
  </div>
);
