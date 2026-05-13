import type { Story } from "@ladle/react";
import { useState } from "react";

export default { title: "Foundations / Motion" };

const DURATIONS = [
  { token: "duration-fast", value: "120ms" },
  { token: "duration-base", value: "200ms" },
  { token: "duration-slow", value: "360ms" },
];

const EASINGS = [
  { token: "ease-out-soft", value: "cubic-bezier(0.22, 1, 0.36, 1)" },
  { token: "ease-snap", value: "cubic-bezier(0.85, 0, 0.15, 1)" },
];

export const Tokens: Story = () => {
  const [tick, setTick] = useState(0);
  return (
    <div className="grid gap-10">
      <header className="grid gap-1">
        <p className="font-mono text-label-caps text-primary uppercase tracking-wider">
          foundations / motion
        </p>
        <h1 className="font-display text-display-md tracking-tight">Motion tokens</h1>
        <p className="text-body-md text-muted-foreground">
          Click anywhere on a card to replay the animation. Stagger of 60ms used for cards in chat
          threads & timelines.
        </p>
      </header>

      <section className="grid gap-3">
        <h2 className="font-display text-title-lg">Durations</h2>
        <div className="grid gap-3">
          {DURATIONS.map((d) => (
            <button
              key={d.token}
              type="button"
              onClick={() => setTick((t) => t + 1)}
              className="grid grid-cols-[180px_80px_1fr] items-center gap-6 rounded-xl border bg-card px-5 py-3 text-left hover:bg-muted/40"
            >
              <code className="font-mono text-label-caps text-muted-foreground uppercase tracking-wider">
                --{d.token}
              </code>
              <span className="font-mono text-body-sm text-muted-foreground">{d.value}</span>
              <span
                key={`${d.token}-${tick}`}
                className={`h-3 origin-left animate-[scaleX_0.36s_var(--ease-out-soft)] rounded-full bg-primary ${d.token}`}
                style={{ animationDuration: d.value, transform: "scaleX(1)" }}
              />
            </button>
          ))}
        </div>
      </section>

      <section className="grid gap-3">
        <h2 className="font-display text-title-lg">Easings</h2>
        <div className="grid grid-cols-2 gap-4">
          {EASINGS.map((e) => (
            <button
              key={e.token}
              type="button"
              onClick={() => setTick((t) => t + 1)}
              className="grid gap-3 rounded-xl border bg-card p-5 text-left hover:bg-muted/40"
            >
              <div className="flex items-center justify-between">
                <code className="font-mono text-label-caps text-muted-foreground uppercase tracking-wider">
                  --{e.token}
                </code>
                <span className="font-mono text-label text-muted-foreground">click to replay</span>
              </div>
              <span className="font-mono text-body-sm text-muted-foreground">{e.value}</span>
              <span
                key={`${e.token}-${tick}`}
                className="h-3 w-full origin-left rounded-full bg-primary"
                style={{
                  animation: `slideRight 600ms var(--${e.token}) forwards`,
                }}
              />
            </button>
          ))}
        </div>
      </section>

      <section className="grid gap-3">
        <h2 className="font-display text-title-lg">Built-in keyframes</h2>
        <div className="grid grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => setTick((t) => t + 1)}
            className="rounded-xl border bg-card p-5 text-left hover:bg-muted/40"
          >
            <code className="mb-2 block font-mono text-label-caps text-muted-foreground uppercase tracking-wider">
              animate-fade-in-up
            </code>
            <span
              key={`fade-${tick}`}
              className="block animate-fade-in-up rounded-md border border-primary/40 bg-primary/10 px-3 py-2 text-body-sm"
            >
              Card entrance, used in lists & timelines.
            </span>
          </button>
          <button
            type="button"
            onClick={() => setTick((t) => t + 1)}
            className="rounded-xl border bg-card p-5 text-left hover:bg-muted/40"
          >
            <code className="mb-2 block font-mono text-label-caps text-muted-foreground uppercase tracking-wider">
              animate-pulse-glow
            </code>
            <span className="inline-flex size-3 animate-pulse-glow rounded-full bg-success" />
            <span className="ml-3 text-body-sm">Status indicator pulse (running, building).</span>
          </button>
        </div>
      </section>

      <style>{`
        @keyframes slideRight {
          from { transform: scaleX(0); transform-origin: left; }
          to { transform: scaleX(1); transform-origin: left; }
        }
      `}</style>
    </div>
  );
};
