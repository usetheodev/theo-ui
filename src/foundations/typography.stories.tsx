import type { Story } from "@ladle/react";

export default { title: "Foundations / Typography" };

const SCALE = [
  { name: "display-2xl", class: "text-display-2xl", sample: "Display 2xl" },
  { name: "display-xl", class: "text-display-xl", sample: "Display xl" },
  { name: "display-lg", class: "text-display-lg", sample: "Display lg" },
  { name: "display-md", class: "text-display-md", sample: "Display md" },
  { name: "headline", class: "text-headline", sample: "Headline" },
  { name: "title-lg", class: "text-title-lg", sample: "Title lg" },
  { name: "title-md", class: "text-title-md", sample: "Title md" },
  { name: "body-lg", class: "text-body-lg", sample: "Body lg — workhorse" },
  { name: "body-md", class: "text-body-md", sample: "Body md — default" },
  { name: "body-sm", class: "text-body-sm", sample: "Body sm — metadata" },
  { name: "label", class: "text-label", sample: "Label" },
  { name: "label-caps", class: "text-label-caps uppercase", sample: "Label caps" },
];

export const Scale: Story = () => (
  <div className="grid gap-8">
    <header className="grid gap-1">
      <p className="font-mono text-label-caps text-primary uppercase tracking-wider">
        foundations / typography
      </p>
      <h1 className="font-display text-display-md tracking-tight">Typographic scale</h1>
      <p className="text-body-md text-muted-foreground">
        Sizes / weights / line-heights configured in{" "}
        <code className="font-mono">tailwind.config.ts</code>. Default font is{" "}
        <code className="font-mono text-primary">Geist Sans</code>; swap themes to see{" "}
        <code className="font-mono">Inter</code>, etc.
      </p>
    </header>

    <section className="grid divide-y divide-border/40 rounded-2xl border bg-card">
      {SCALE.map((s) => (
        <div key={s.name} className="grid grid-cols-[160px_1fr] items-baseline gap-6 px-5 py-4">
          <code className="font-mono text-label-caps text-muted-foreground uppercase tracking-wider">
            text-{s.name}
          </code>
          <p className={s.class}>{s.sample}</p>
        </div>
      ))}
    </section>

    <section className="grid gap-3 rounded-2xl border bg-card p-6">
      <p className="font-mono text-label-caps text-muted-foreground uppercase tracking-wider">
        font-mono · code-md / code-sm
      </p>
      <pre className="overflow-x-auto rounded-lg bg-muted/40 p-4 font-mono text-code-md text-foreground">
        {`$ theo deploy api web worker
✓ Build success (24s, 35.7k tokens)
✓ Deploy live → https://acme-api.usetheo.dev`}
      </pre>
    </section>
  </div>
);
