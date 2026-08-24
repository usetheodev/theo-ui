import type { Story } from "@ladle/react";

export default { title: "Foundations / Elevation" };

const SHADOWS = [
  { token: "shadow-sm", note: "Hairline elevation, default for cards" },
  { token: "shadow-md", note: "Modals, popovers, dropdowns" },
  { token: "shadow-lg", note: "Lifted surfaces, drawers" },
  { token: "shadow-glow", note: "Signature violet glow — used on primary CTA hover" },
  { token: "shadow-glow-strong", note: "Stronger violet glow — focus / pressed" },
];

export const Levels: Story = () => (
  <div className="grid gap-8">
    <header className="grid gap-1">
      <p className="font-mono text-label-caps text-primary uppercase tracking-wider">
        foundations / elevation
      </p>
      <h1 className="font-display text-display-md tracking-tight">Elevation</h1>
      <p className="text-body-md text-muted-foreground">
        Depth comes from violet glow + soft shadows. We don't stack blur for skeuomorphic
        glassmorphism — it conflicts with the editorial direction.
      </p>
    </header>

    <section className="grid grid-cols-2 gap-6 md:grid-cols-3">
      {SHADOWS.map((s) => (
        <div
          key={s.token}
          className={`flex h-40 flex-col justify-end rounded-2xl border bg-card p-5 ${s.token}`}
        >
          <code className="font-mono text-label-caps text-muted-foreground uppercase tracking-wider">
            {s.token}
          </code>
          <p className="mt-1 text-body-sm text-foreground">{s.note}</p>
        </div>
      ))}
    </section>

    <section className="grid gap-3">
      <h2 className="font-display text-title-lg">Background textures</h2>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="flex h-32 items-end rounded-2xl border bg-card bg-dotted-violet p-4">
          <code className="font-mono text-label-caps text-muted-foreground uppercase tracking-wider">
            .bg-dotted-violet
          </code>
        </div>
        <div className="flex h-32 items-end rounded-2xl border bg-card bg-dotted-violet-strong p-4">
          <code className="font-mono text-label-caps text-muted-foreground uppercase tracking-wider">
            .bg-dotted-violet-strong
          </code>
        </div>
        <div className="flex h-32 items-end rounded-2xl border bg-card bg-hero-glow p-4">
          <code className="font-mono text-label-caps text-muted-foreground uppercase tracking-wider">
            .bg-hero-glow
          </code>
        </div>
      </div>
    </section>
  </div>
);
