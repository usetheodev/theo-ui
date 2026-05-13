import type { Story } from "@ladle/react";

export default { title: "Foundations / Spacing" };

const SPACES = [
  { token: "space-1", px: 4 },
  { token: "space-2", px: 8 },
  { token: "space-3", px: 12 },
  { token: "space-4", px: 16 },
  { token: "space-5", px: 20 },
  { token: "space-6", px: 24 },
  { token: "space-8", px: 32 },
  { token: "space-10", px: 40 },
  { token: "space-12", px: 48 },
  { token: "space-16", px: 64 },
  { token: "space-20", px: 80 },
  { token: "space-24", px: 96 },
  { token: "space-32", px: 128 },
];

const RADII = [
  { token: "radius-none", value: "0px" },
  { token: "radius-sm", value: "4px" },
  { token: "radius-md", value: "6px" },
  { token: "radius-lg", value: "10px" },
  { token: "radius-xl", value: "14px" },
  { token: "radius-2xl", value: "20px" },
  { token: "radius-full", value: "9999px" },
];

export const Scale: Story = () => (
  <div className="grid gap-10">
    <header className="grid gap-1">
      <p className="font-mono text-label-caps text-primary uppercase tracking-wider">
        foundations / spacing
      </p>
      <h1 className="font-display text-display-md tracking-tight">Spacing & radii</h1>
      <p className="text-body-md text-muted-foreground">
        4px base scale. Use Tailwind utilities like <code className="font-mono">p-4</code>,
        <code className="font-mono">gap-6</code> — they map to these tokens automatically.
      </p>
    </header>

    <section className="grid gap-3">
      <h2 className="font-display text-title-lg">Spacing scale</h2>
      <div className="grid divide-y divide-border/40 rounded-2xl border bg-card">
        {SPACES.map((s) => (
          <div
            key={s.token}
            className="grid grid-cols-[180px_80px_1fr] items-center gap-6 px-5 py-3"
          >
            <code className="font-mono text-label-caps text-muted-foreground uppercase tracking-wider">
              --{s.token}
            </code>
            <span className="font-mono text-body-sm text-muted-foreground">{s.px}px</span>
            <div className="flex h-6 items-center">
              <span className="h-4 rounded-sm bg-primary" style={{ width: `${s.px}px` }} />
            </div>
          </div>
        ))}
      </div>
    </section>

    <section className="grid gap-3">
      <h2 className="font-display text-title-lg">Border radii</h2>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {RADII.map((r) => (
          <div
            key={r.token}
            className="flex flex-col items-center gap-2 rounded-2xl border bg-card p-5"
          >
            <span
              className="h-16 w-16 border border-primary bg-primary/20"
              style={{ borderRadius: `var(--${r.token})` }}
            />
            <code className="font-mono text-label-caps text-muted-foreground uppercase tracking-wider">
              --{r.token}
            </code>
            <span className="font-mono text-body-sm text-muted-foreground">{r.value}</span>
          </div>
        ))}
      </div>
    </section>
  </div>
);
