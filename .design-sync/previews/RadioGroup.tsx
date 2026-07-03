import { useState } from "react";
import { Label } from "@theokit/ui";
import { RadioGroup } from "@theokit/ui";



export const Plans = () => {
  const [v, setV] = useState("pro");
  return (
    <RadioGroup value={v} onValueChange={setV} className="max-w-sm">
      {[
        { id: "starter", label: "Starter", hint: "Free · 1 project · 3 members" },
        { id: "pro", label: "Pro", hint: "$29/mo · 3 projects · 10 members" },
        { id: "team", label: "Team", hint: "$79/mo · 10 projects · 25 members" },
      ].map((opt) => (
        <div key={opt.id} className="flex items-start gap-3 rounded-lg border border-border/40 p-3">
          <RadioGroup.Item value={opt.id} id={opt.id} className="mt-0.5" />
          <div className="grid gap-0.5">
            <Label htmlFor={opt.id}>{opt.label}</Label>
            <span className="text-body-sm text-muted-foreground">{opt.hint}</span>
          </div>
        </div>
      ))}
    </RadioGroup>
  );
};
