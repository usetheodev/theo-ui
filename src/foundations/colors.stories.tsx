import type { Story } from "@ladle/react";

export default { title: "Foundations / Colors" };

const TOKENS = [
  { token: "background", label: "Background", note: "Page floor" },
  { token: "foreground", label: "Foreground", note: "Body text & icons" },
  { token: "card", label: "Card", note: "Elevated surface" },
  { token: "popover", label: "Popover", note: "Floating surface" },
  { token: "primary", label: "Primary", note: "CTAs, links, focus ring" },
  { token: "primary-deep", label: "Primary deep", note: "Pressed state" },
  { token: "primary-glow", label: "Primary glow", note: "Hover halo" },
  { token: "secondary", label: "Secondary", note: "Secondary surface" },
  { token: "accent", label: "Accent", note: "Highlights, beta tags" },
  { token: "accent-deep", label: "Accent deep", note: "Variant" },
  { token: "muted", label: "Muted", note: "Soft panel" },
  { token: "muted-foreground", label: "Muted foreground", note: "Secondary copy" },
  { token: "border", label: "Border", note: "Hairlines & dividers" },
  { token: "input", label: "Input", note: "Input borders" },
  { token: "ring", label: "Ring", note: "Focus ring" },
  { token: "success", label: "Success", note: "Status / OK" },
  { token: "warning", label: "Warning", note: "Status / Queued" },
  { token: "destructive", label: "Destructive", note: "Status / Failed" },
  { token: "info", label: "Info", note: "Neutral notifications" },
];

function Swatch({ token, label, note }: { token: string; label: string; note: string }) {
  return (
    <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
      <div
        className="h-20 w-full border-border/40 border-b"
        style={{ backgroundColor: `hsl(var(--${token}))` }}
      />
      <div className="space-y-1 p-3">
        <p className="font-mono text-label-caps text-muted-foreground uppercase tracking-wider">
          --{token}
        </p>
        <p className="font-medium text-body-sm">{label}</p>
        <p className="text-body-sm text-muted-foreground">{note}</p>
      </div>
    </div>
  );
}

export const Palette: Story = () => (
  <div className="grid gap-6">
    <header className="grid gap-1">
      <p className="font-mono text-label-caps text-primary uppercase tracking-wider">
        foundations / colors
      </p>
      <h1 className="font-display text-display-md tracking-tight">Color tokens</h1>
      <p className="text-body-md text-muted-foreground">
        Use the theme picker (top-right) to swap palettes. All tokens are HSL triplets so utilities
        like <code className="font-mono text-primary">bg-primary/20</code> work.
      </p>
    </header>
    <section className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
      {TOKENS.map((t) => (
        <Swatch key={t.token} {...t} />
      ))}
    </section>
  </div>
);
