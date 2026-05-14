import { Search } from "lucide-react";
import { forwardRef, useMemo, useState } from "react";
import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "../../../lib/cn.js";
import { type Skill, SkillCard, type SkillState } from "../../primitives/skill-card/index.js";

interface SkillsListProps extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  skills: Skill[];
  title?: ReactNode;
  /** If true, shows a search input above the grid. */
  searchable?: boolean;
  onToggle?: (id: string, next: SkillState) => void;
}

/**
 * SkillsList — grid of SkillCards with optional search + source filter chips.
 * Pairs with claw-code's `claw skills` inventory but visual.
 */
const SkillsList = forwardRef<HTMLDivElement, SkillsListProps>(
  ({ className, skills, title = "Skills", searchable = true, onToggle, ...props }, ref) => {
    const [q, setQ] = useState("");
    const filtered = useMemo(() => {
      if (!q.trim()) return skills;
      const needle = q.toLowerCase();
      return skills.filter((s) => {
        const hay = [
          s.name,
          typeof s.description === "string" ? s.description : "",
          ...(s.triggers ?? []),
        ]
          .join(" ")
          .toLowerCase();
        return hay.includes(needle);
      });
    }, [skills, q]);

    return (
      <section
        ref={ref}
        className={cn("grid gap-3", className)}
        aria-label="Available skills"
        {...props}
      >
        {title || searchable ? (
          <header className="flex flex-wrap items-center justify-between gap-3">
            {title ? (
              <h3 className="font-display text-title-md tracking-tight">{title}</h3>
            ) : (
              <span />
            )}
            {searchable ? (
              <div className="relative">
                <Search
                  className="-translate-y-1/2 absolute top-1/2 left-2 size-3.5 text-muted-foreground"
                  aria-hidden="true"
                />
                <input
                  type="search"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Filter skills…"
                  aria-label="Filter skills"
                  className="h-8 w-56 rounded-md border border-input bg-card pr-2 pl-7 font-mono text-code-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
            ) : null}
          </header>
        ) : null}
        {filtered.length === 0 ? (
          <p className="rounded-xl border border-border/60 border-dashed bg-muted/30 px-4 py-8 text-center font-sans text-body-sm text-muted-foreground">
            No skills match {q ? `"${q}"` : "the current filter"}.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {filtered.map((skill) => (
              <SkillCard key={skill.id} skill={skill} {...(onToggle ? { onToggle } : {})} />
            ))}
          </div>
        )}
      </section>
    );
  },
);
SkillsList.displayName = "SkillsList";

export { SkillsList };
