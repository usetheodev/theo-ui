import type { Story } from "@ladle/react";

export const Default: Story = () => (
  <div className="space-y-12">
    <header className="space-y-4">
      <p className="font-mono text-label-caps text-primary-glow uppercase">@usetheo/ui</p>
      <h1 className="text-balance font-display text-display-xl">
        Violet Forge. <span className="text-accent">Forged for AI agents.</span>
      </h1>
      <p className="max-w-2xl text-body-lg text-muted-foreground">
        Framework-agnostic React component library. Editorial typography (Boska + Switzer),
        dark-first violet palette, burnt-sienna accents. Built to be consumed by{" "}
        <code className="text-primary">theo-code</code> and{" "}
        <code className="text-primary">theo-agents</code>.
      </p>
    </header>

    <section className="grid grid-cols-1 gap-6 md:grid-cols-3">
      <Swatch token="primary" value="#7C3AED" label="Theo violet — primary" />
      <Swatch token="accent" value="#C96442" label="Burnt sienna — accent" />
      <Swatch token="background" value="#0E0B14 / #FAF9F7" label="Charcoal / warm off-white" />
      <Swatch token="success" value="#22E58C / #16A34A" label="Success" />
      <Swatch token="warning" value="#F59E0B / #D97706" label="Warning" />
      <Swatch token="destructive" value="#FF4F6D / #DC2626" label="Destructive" />
    </section>

    <section className="space-y-4">
      <h2 className="font-display text-headline">Typography</h2>
      <div className="space-y-2 rounded-xl border bg-card p-8 shadow-md">
        <p className="font-display text-display-2xl">Display 2xl</p>
        <p className="font-display text-display-xl">Display xl</p>
        <p className="font-display text-headline">Headline</p>
        <p className="text-title-lg">Title lg — Switzer 700</p>
        <p className="text-body-md">Body md — the workhorse, Switzer 500.</p>
        <p className="text-body-sm text-muted-foreground">Body sm — secondary copy.</p>
        <p className="font-mono text-code-md">$ theo deploy api web worker</p>
      </div>
    </section>

    <section className="space-y-4">
      <h2 className="font-display text-headline">Elevation</h2>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {(["sm", "md", "lg", "glow"] as const).map((s) => (
          <div key={s} className={`rounded-xl border bg-card p-6 text-label-caps shadow-${s}`}>
            shadow-{s}
          </div>
        ))}
      </div>
    </section>
  </div>
);

function Swatch({ token, value, label }: { token: string; value: string; label: string }) {
  return (
    <div className="overflow-hidden rounded-xl border bg-card shadow-md">
      <div className="h-24 w-full" style={{ backgroundColor: `hsl(var(--${token}))` }} />
      <div className="space-y-1 p-4">
        <p className="font-mono text-label-caps text-muted-foreground uppercase">--{token}</p>
        <p className="text-title-md">{label}</p>
        <p className="font-mono text-code-sm text-muted-foreground">{value}</p>
      </div>
    </div>
  );
}
