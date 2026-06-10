# Motion

Light supplement to [`microinteractions.md`](microinteractions.md) — covers the macro-level motion patterns (page transitions, scroll reveals, ambient animations).

For state-change motion (button hover, dialog open, etc.), see microinteractions.

---

## Motion tokens (reminder)

```
--ease-out-soft: cubic-bezier(0.22, 1, 0.36, 1)
--ease-in-out:   cubic-bezier(0.65, 0, 0.35, 1)
--ease-snap:     cubic-bezier(0.85, 0, 0.15, 1)

--duration-fast: 120ms
--duration-base: 200ms
--duration-slow: 360ms

--stagger:       60ms
```

---

## Page transitions

`@theokit/ui` does NOT ship a page-transition primitive. If the user wants page transitions:

- **Next.js App Router** — use `next/navigation`'s `useTransition()` + suspense. Or roll a `motion.div` wrapper with framer-motion.
- **React Router** — use `react-router-dom`'s `useTransition()` + custom CSS.
- **Vite SPA** — implement via a library like `framer-motion` or `react-transition-group`.

The skill does NOT recommend installing a motion library unless the user explicitly asks for page transitions. Most dashboard / settings / chat surfaces don't need them — and the bundle cost (framer-motion is ~30 KB gz) is real.

If the user wants subtle "feels-loaded" transitions, the simplest pattern:

```tsx
{/* On every route change, the wrapper key changes, triggering animation */}
<div key={pathname} className="animate-in fade-in duration-base">
  {children}
</div>
```

This uses Tailwind's built-in `animate-in` (from `tailwindcss-animate`, already a peer-dep of theo-ui's preset).

---

## Scroll reveal

Marketing surfaces sometimes use scroll-triggered reveals. Light pattern:

```tsx
import { useInView } from "framer-motion";
import { useRef } from "react";

function ScrollReveal({ children }: { children: React.ReactNode }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <div
      ref={ref}
      className={cn(
        "transition-all duration-slow ease-out-soft",
        inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      )}
    >
      {children}
    </div>
  );
}
```

**Rules:**

- `once: true` — animate only on first reveal. Don't re-animate when the user scrolls back up (annoying).
- Subtle translate (`translate-y-4` = 16 px) — not dramatic.
- `ease-out-soft` — entering motion should decelerate.
- Honor reduced-motion — skip the translate entirely when prefers-reduced-motion fires.

Don't apply scroll reveal to every section. Use it sparingly — 2-3 key bands max.

---

## Ambient animations

For atmospheric backdrops (hero gradient mesh slowly rotating, particle systems):

**Default: don't.** Theo-ui's anti-glass principle extends to ambient motion. The brand is calm, engineered, restrained. Floating gradient meshes belong in atmospheric AI tools (Suno, Midjourney landing pages), not in dashboard / settings.

For `marketing` surface ONLY, ambient motion can apply:

```tsx
{/* Hero gradient mesh — only on marketing landing */}
<div className="absolute inset-0 -z-10 opacity-50 overflow-hidden">
  <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full bg-primary/30 blur-3xl animate-pulse" />
  <div className="absolute bottom-0 right-1/4 w-96 h-96 rounded-full bg-accent/20 blur-3xl animate-pulse" />
</div>
```

`animate-pulse` is Tailwind's slow pulse (about 2 s). For something more elaborate, framer-motion or GSAP. The skill does NOT introduce GSAP unless the user explicitly asks — it's a heavy dep.

---

## Reduced motion contract

```css
@media (prefers-reduced-motion: reduce) {
  *, ::before, ::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

This rule lives in `src/styles/tokens.css` and applies globally. Custom CSS / framer-motion / GSAP code in the consumer's project must honor this too.

For framer-motion:

```tsx
import { useReducedMotion } from "framer-motion";

const shouldReduceMotion = useReducedMotion();

return (
  <motion.div
    initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
    animate={shouldReduceMotion ? false : { opacity: 1, y: 0 }}
    transition={{ duration: 0.36, ease: [0.22, 1, 0.36, 1] }}
  >
    {children}
  </motion.div>
);
```

When `shouldReduceMotion` is true, skip the animation entirely.

---

## What NOT to animate

- **Layout properties** (`width`, `height`, `padding`, `top`, `left`) — causes layout thrash. Animate `transform: scale/translate` instead.
- **Color on every theme change** — `<ThemeProvider>` swaps themes by changing the `<style>` block; CSS doesn't transition between two custom-property sets. The whole UI snap-changes, which is correct behavior.
- **Focus rings** — must appear instantly.
- **Numbers being displayed**, unless you're explicitly tweening a counter (use a library for that, not raw CSS).

---

## What TO animate

- **Hover state** — subtle, fast (120ms).
- **State change** (open / closed, expanded / collapsed) — base (200ms).
- **Entrance** (page load, dialog open) — slow (360ms).
- **Toast slide-in** — base (200ms).
- **Skeleton shimmer** — loop, slow (1.5–2s per cycle).
- **Streaming cursor** — loop, base (1s per blink).

---

## Stagger discipline

When animating a list of items entering, stagger by `--stagger` (60ms):

```tsx
{items.map((item, i) => (
  <div
    key={item.id}
    style={{ animationDelay: `${i * 60}ms` }}
    className="animate-in fade-in slide-in-from-bottom-2 duration-base ease-out-soft fill-mode-both"
  >
    {item.content}
  </div>
))}
```

**Cap at ~10 items.** Beyond that, the last items don't animate visibly (they're below the fold or off-screen when their delay hits).

For lists with > 10 items, animate the visible window only:

```tsx
{items.slice(0, 10).map((item, i) => (
  <div style={{ animationDelay: `${i * 60}ms` }} className="animate-in fade-in">
    {item.content}
  </div>
))}
{items.slice(10).map((item) => (
  <div key={item.id}>
    {item.content}  {/* no animation past index 9 */}
  </div>
))}
```

---

## Don't compete with browser UI

Things that should NOT animate:

- **Scrollbar appearance** (browser controls this).
- **Cursor** (browser controls).
- **Tab switch** (browser controls).
- **Browser autofill animation** (browser controls).

If your motion fights the browser, it loses — and the user sees jank.

---

## Summary

Theo-ui's motion philosophy: **subtract before you add**. Most LLM-generated UIs ship too much motion. Most production dashboards ship just enough.

Cut motion when:

- The motion doesn't convey information.
- The motion delays the user.
- The motion adds bundle cost (framer-motion / GSAP) without ROI.
- The motion fights browser UI.
- The motion violates reduced-motion preferences.
