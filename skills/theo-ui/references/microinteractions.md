# Microinteractions

The small motion + feedback patterns that make a UI feel "made, not generated." Theo-ui primitives ship these — custom code adds them when composing.

---

## Principles

1. **Cut motion before adding it.** Most pages have too much, not too little. If removing an animation doesn't lose information, remove it.
2. **Animate `transform` and `opacity` only.** Layout properties (`width`, `height`, `top`, `left`, `padding`) cause repaint storms. Use `transform` for scale/translate, `opacity` for fade.
3. **Theme-aware easings.** Use `--ease-out-soft`, `--ease-in-out`, `--ease-snap` tokens. Never browser default `ease`.
4. **Reduced motion is honored.** `prefers-reduced-motion: reduce` collapses spatial motion to opacity-only crossfade.
5. **Silent success over celebratory toasts.** Routine successes don't need a banner.
6. **Optimistic update + Undo over confirmation.** For non-destructive actions, apply optimistically and surface Undo. Destructive actions get `<ConfirmDialog>`.

---

## Motion tokens (mirrored from `tokens.css`)

```
--ease-out-soft: cubic-bezier(0.22, 1, 0.36, 1)   /* default for entering motion */
--ease-in-out:   cubic-bezier(0.65, 0, 0.35, 1)   /* for two-way state changes */
--ease-snap:     cubic-bezier(0.85, 0, 0.15, 1)   /* for short, decisive moves */

--duration-fast: 120ms   /* hover, focus, micro */
--duration-base: 200ms   /* default state changes */
--duration-slow: 360ms   /* entrance/exit, larger spatial moves */

--stagger: 60ms          /* delay between siblings when staggering */
```

Tailwind class equivalents: `duration-fast`, `duration-base`, `duration-slow`, `ease-out-soft`, `ease-snap`.

---

## The microinteraction catalog

### 1. Button hover lift

When the pointer enters a primary button, add `shadow-glow`. Duration 120 ms, ease-out-soft.

```tsx
// Already baked into <Button variant="primary">
className="transition-shadow duration-base ease-out-soft hover:shadow-glow"
```

No size change, no fill change. Just the glow. The primary button's hover is the brand signature.

### 2. Button press depress

On active (mouse-down), scale `0.98`. Duration 120 ms.

```tsx
// Already baked into <Button>
className="transition-transform duration-fast ease-snap active:scale-[0.98]"
```

Subtle. Registers as tactile.

### 3. Card hover lift (rare — opt-in)

For clickable cards (`<ProjectCard>` etc.), a soft lift on hover:

```tsx
className="transition-shadow duration-base ease-out-soft hover:shadow-md cursor-pointer"
```

Don't apply card-lift to every card — only the ones that are interactive entry points to a detail view.

### 4. Focus ring instant-on

The focus ring appears INSTANTLY on focus. Don't animate it.

```tsx
className="focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
// NO transition on the ring properties
```

Animating the ring delays the visibility cue. Keyboard users need immediate feedback that focus moved.

### 5. Dialog enter / exit

Radix `<Dialog>` handles enter / exit animations via `data-state="open|closed"` attribute. Theo-ui's `<Dialog>` extends with:

```tsx
data-[state=open]:animate-in
data-[state=closed]:animate-out
data-[state=closed]:fade-out-0
data-[state=open]:fade-in-0
data-[state=closed]:zoom-out-95
data-[state=open]:zoom-in-95
duration-base
ease-out-soft
```

Backdrop fades in/out separately:

```tsx
data-[state=open]:animate-in
data-[state=closed]:animate-out
data-[state=closed]:fade-out-0
data-[state=open]:fade-in-0
duration-slow
```

### 6. Popover / Tooltip enter / exit

Same Radix `data-state` pattern, shorter durations (popovers should feel snappier than dialogs):

```tsx
data-[state=open]:animate-in
data-[state=closed]:animate-out
data-[state=closed]:fade-out-0
data-[state=open]:fade-in-0
data-[state=closed]:zoom-out-95
data-[state=open]:zoom-in-95
duration-fast
ease-snap
```

### 7. Toast slide-in

Toasts slide in from the bottom-right (or top-right), then auto-dismiss after ~4 seconds:

```tsx
// Slide-in
data-[state=open]:animate-in
data-[state=open]:slide-in-from-bottom-5
data-[state=open]:fade-in-0
duration-base
ease-out-soft

// Slide-out
data-[state=closed]:animate-out
data-[state=closed]:slide-out-to-right-full
data-[state=closed]:fade-out-0
duration-base
```

### 8. Dropdown menu open

When a `<DropdownMenu>` opens, the content fades + scales from the trigger:

```tsx
data-[side=bottom]:slide-in-from-top-2
data-[side=top]:slide-in-from-bottom-2
data-[side=left]:slide-in-from-right-2
data-[side=right]:slide-in-from-left-2
data-[state=open]:animate-in
data-[state=closed]:animate-out
data-[state=closed]:fade-out-0
data-[state=open]:fade-in-0
data-[state=closed]:zoom-out-95
data-[state=open]:zoom-in-95
duration-fast
ease-snap
```

### 9. List stagger entrance

When rendering a list that appears all at once (e.g., search results), stagger each item:

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

60 ms stagger (`--stagger` token) between items. Cap at ~10 items — beyond that, the last items are visible long before they animate in.

### 10. Counter increment

For animated number tickers (StatTile values, usage meters):

```tsx
// Use a 200 ms ease-out tween from previous value → new value
// Pseudocode (use a real lib like react-spring or framer-motion):
const animated = useTween(value, { duration: 200, ease: "easeOut" });
return <span>{Math.round(animated)}</span>;
```

DO NOT animate on every render. Animate only when the value changes (mount, prop change).

### 11. Copy button success flash

On click, swap icon Copy → Check, swap label "Copy" → "Copied!", brief background flash to `bg-success/10`, return to default after 2 seconds:

```tsx
const [copied, setCopied] = useState(false);

function handleClick() {
  navigator.clipboard.writeText(value);
  setCopied(true);
  setTimeout(() => setCopied(false), 2000);
}

return (
  <Button
    onClick={handleClick}
    variant="ghost"
    size="sm"
    className={cn(
      "transition-colors duration-base",
      copied && "bg-success/10 text-success"
    )}
  >
    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
    {copied ? "Copied!" : "Copy"}
  </Button>
);
```

`<CopyButton>` primitive bakes this in.

### 12. Streaming cursor

In agent chat, the streaming cursor pulses while the assistant is generating:

```tsx
// Inside <AgentStreaming>
<span className="inline-block w-2 h-4 bg-foreground animate-pulse" />
```

The `animate-pulse` Tailwind utility uses `--duration-slow` and theme tokens. Theo-ui's `<AgentStreaming>` uses this internally.

### 13. Hover tooltip — delayed open, immediate close

Tooltips open after 800 ms of hover (avoid noise on quick scans) but close immediately on mouse-leave:

```tsx
// Radix Tooltip defaults
<Tooltip delayDuration={800}>
```

For `<Tooltip>` triggered by keyboard focus, open immediately (0 ms). Theo-ui handles this.

### 14. Save / unsaved indicator

When a form has unsaved changes, the submit button highlights and a dirty indicator appears:

```tsx
<div className="flex items-center gap-2">
  {dirty && (
    <span className="text-body-sm text-warning flex items-center gap-1">
      <Circle className="h-2 w-2 fill-current" />
      Unsaved changes
    </span>
  )}
  <Button
    variant="primary"
    onClick={save}
    loading={saving}
    disabled={!dirty}
  >
    Save changes
  </Button>
</div>
```

The dirty indicator is text + a filled dot icon (warning color). Not color alone.

### 15. Optimistic update + Undo

For non-destructive list mutations:

```tsx
function deleteOptimistic(id: string) {
  // Optimistically remove
  setItems((prev) => prev.filter((i) => i.id !== id));

  // Fire request
  const undo = api.delete(id);

  // Surface Undo toast
  toast({
    title: "Item deleted",
    action: (
      <Button variant="ghost" size="sm" onClick={() => {
        undo.cancel();
        setItems((prev) => [...prev, originalItem]);
      }}>
        Undo
      </Button>
    ),
    duration: 5000,
  });

  // After 5s, the request actually fires
}
```

5-second undo window. After the timer, the request commits. If the user clicks Undo, cancel.

---

## Reduced motion contract

When `prefers-reduced-motion: reduce` fires, motion collapses:

- **Spatial motion** (slide, scale, translate) → opacity-only crossfade ≤ 150 ms.
- **Hover lifts** (`shadow-glow`, `shadow-md`) → no shadow, color change only.
- **Stagger** → no stagger, all items appear simultaneously with single opacity fade.
- **Counter increments** → instant value change, no tween.

Tailwind v4 + the theo-ui preset handle this automatically via `:where(.motion-safe\:…)` selectors. Custom CSS should wrap motion in `@media (prefers-reduced-motion: no-preference) { … }`.

---

## Anti-patterns

### Hardcoded `transition` on browser default `ease`

```tsx
// WRONG
className="transition-colors duration-200 ease-in"

// RIGHT
className="transition-colors duration-base ease-out-soft"
```

The default browser easings (`linear`, `ease`, `ease-in`, `ease-out`, `ease-in-out`) are flat. Theme-aware tokens read better.

### Bouncy / overshoot easings on UI state

```tsx
// WRONG — overshoot on a checkbox toggle
className="transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
```

Overshoot easings belong in marketing animations (hero ticker, scroll reveal). Not on routine state changes. They read as toy-like on dashboards.

### Animating `width` or `height`

```tsx
// WRONG — causes layout thrash
className="transition-all duration-base"  // animates width / height / padding too

// RIGHT — explicit properties
className="transition-[transform,opacity] duration-base"
```

`transition-all` is a code smell. Specify the properties.

### Endless spinners with no progress signal

```tsx
// WRONG — user has no idea what's happening
<Loader2 className="animate-spin" />

// RIGHT — at minimum, label what's happening
<div className="flex items-center gap-2 text-muted-foreground">
  <Loader2 className="h-4 w-4 animate-spin" />
  <span className="text-body-sm">Loading deployments…</span>
</div>

// BEST — show progress when possible
<Progress value={progress} />
```

### Animating the focus ring

```tsx
// WRONG — focus ring fades in over 200 ms
className="focus-visible:ring-2 transition-shadow duration-base"

// RIGHT — ring is instant
className="focus-visible:ring-2 ring-ring"
```

### Triggering motion on every render

```tsx
// WRONG — re-mounts the animation on every state change
function StatTile({ value }) {
  return (
    <div key={value} className="animate-in fade-in">
      {value}
    </div>
  );
}

// RIGHT — animate only on mount / when value changes via tween
function StatTile({ value }) {
  const animated = useTween(value, { duration: 200 });
  return <div>{Math.round(animated)}</div>;
}
```

### Marketing-grade motion on dashboards

A spring-bouncing card hover with rotate + scale + glow + delay is great for a marketing hero. It's wrong on a deployments list. Match motion intensity to surface.

---

## When to add motion

Ask: *"What information does this motion convey?"*

- **State change** (default → hover, closed → open) — yes, add subtle motion.
- **Entrance** (page load, dialog open) — yes, subtle fade.
- **Confirmation** (success state on copy button) — yes, brief flash.
- **Decoration** (the headline floats slightly on scroll) — usually no. Cut it.
- **Drawing attention** (the new feature pulses) — only if the user genuinely needs to notice. Otherwise it's a tic.

If you can't articulate what the motion conveys in one sentence, remove it.
