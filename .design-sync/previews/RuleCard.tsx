import { RuleCard } from "@theokit/ui";



export const States = () => (
  <div className="grid max-w-xl gap-2">
    <RuleCard
      rule={{
        id: "1",
        title: "Always write tests before fixes",
        body: "When fixing a bug, write a failing regression test first, then the fix.",
        scope: "global",
        state: "enabled",
        tags: ["testing", "process"],
        updatedAt: "2d ago",
      }}
      onSelect={() => undefined}
      onEdit={() => undefined}
      onDelete={() => undefined}
      onToggle={() => undefined}
    />
    <RuleCard
      rule={{
        id: "2",
        title: "Prefer composition over inheritance",
        body: "When designing components, lean on composition + props rather than class hierarchies.",
        scope: "project",
        state: "enabled",
        tags: ["style"],
        updatedAt: "1w ago",
      }}
      onSelect={() => undefined}
      onToggle={() => undefined}
    />
    <RuleCard
      rule={{
        id: "3",
        title: "Imports must use .js extensions",
        body: "Under ESM, all relative imports must include the .js extension even for TypeScript files.",
        scope: "project",
        state: "disabled",
        tags: ["typescript"],
      }}
      onToggle={() => undefined}
    />
  </div>
);
