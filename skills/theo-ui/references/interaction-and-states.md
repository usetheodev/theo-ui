# Interaction and states

Every interactive component must handle **eight states**. Theo-ui primitives ship these states out of the box; custom wrappers must propagate them.

The 8 states are:

| # | State | Triggered by | Visual cue |
|---|---|---|---|
| 1 | **default** | Idle | Base styling |
| 2 | **hover** | Pointer over | Background lift, optional glow |
| 3 | **focus-visible** | Keyboard focus | Ring at 3:1 contrast |
| 4 | **active** | Mouse-down or Enter | Scale `0.98`, deeper background |
| 5 | **disabled** | `disabled` attr | `opacity-50`, no pointer events |
| 6 | **loading** | `loading` prop | Spinner replaces icon/label |
| 7 | **error** | Validation fail / API error | Destructive ring, inline message |
| 8 | **success** | Confirmation | Brief flash to success, optional icon swap |

---

## Why eight, not five

Most LLM-generated UIs ship default + hover + (sometimes) focus. The other five are skipped:

- **Active** missed → button doesn't feel responsive on click.
- **Disabled** missed → user clicks a disabled-looking button that fires anyway.
- **Loading** missed → user double-clicks during async operations, fires twice.
- **Error** missed → silent failure with no UI signal.
- **Success** missed → user doesn't know whether the click registered.

The 8-state checklist closes this gap. It is **mandatory**, not advisory.

---

## State-by-state contracts

### 1. Default

The base styling. Set explicitly so other states can build on it.

```tsx
<Button>Save</Button>
// Internally:
// - bg-primary text-primary-foreground
// - rounded-lg
// - h-9 px-3.5 (md tier, comfortable density)
// - font-medium text-label
// - shadow-none (default)
```

### 2. Hover

Pointer over. Subtle elevation lift.

```tsx
// In the cva
hover:bg-primary       // same bg — fill doesn't shift
hover:shadow-glow      // adds the primary glow (signature)

// For secondary
hover:bg-muted

// For ghost
hover:bg-muted

// For destructive
hover:bg-destructive/90
```

**Theme-aware.** Hover state derives from theme tokens. Never hardcoded.

### 3. Focus-visible

Keyboard focus only — NOT mouse focus. Use `:focus-visible` not `:focus`.

```tsx
focus-visible:outline-none
focus-visible:ring-2
focus-visible:ring-ring
focus-visible:ring-offset-2
focus-visible:ring-offset-background
```

**WCAG 1.4.11 — Non-text contrast 3:1.** The `--ring` token (matches `--primary` at 262 83% 58%) passes against both light and dark backgrounds.

**NEVER animate the ring.** Focus rings must appear instantly on focus. Animating delay confuses keyboard users and triggers ATs to skip the announcement.

### 4. Active

Mouse-down or Enter pressed. The button "depresses."

```tsx
active:scale-[0.98]
active:bg-primary-deep  // for primary
active:shadow-none      // remove glow during press
```

The `scale-[0.98]` is the canonical Vercel-style depress. Subtle but registers as tactile feedback.

### 5. Disabled

`disabled` attribute set. Component is not interactive.

```tsx
disabled:pointer-events-none
disabled:opacity-50
disabled:cursor-default
aria-disabled:cursor-default
aria-disabled:pointer-events-none
aria-disabled:opacity-50
```

**ARIA pairing.** Use both `disabled` attribute AND `aria-disabled` for non-button elements (`<a disabled>` is invalid HTML). For `<Button>`, the attribute handles it.

**Disabled is visible.** Don't hide a disabled control — show it muted. Users need to see the action exists but isn't currently available, with context for why (tooltip, helper text).

### 6. Loading

Async operation in flight. Spinner replaces text/icon. Click is disabled.

```tsx
<Button loading={isSaving}>Save</Button>
// Internally:
// - Renders <Loader2 className="animate-spin" /> in place of (or alongside) the label
// - aria-busy="true"
// - disabled (no double-click possible)
```

**Spinner = `<Loader2>` from lucide-react.** Not a custom CSS-spin div. Never.

**Auto-disable.** When `loading=true`, the button is automatically `disabled`. The user doesn't need to manage both props.

**Auto-aria-busy.** The button sets `aria-busy="true"` so screen readers announce the loading state.

### 7. Error

Validation failure or API error. Visual destructive cue + inline message.

```tsx
<Input
  id="email"
  type="email"
  aria-invalid={!!error}
  aria-describedby={error ? "email-error" : undefined}
/>
{error && (
  <p id="email-error" className="text-body-sm text-destructive">
    {error}
  </p>
)}
```

**Three signals:**

1. **Visual** — `aria-invalid="true"` triggers `data-invalid:border-destructive` on `<Input>`.
2. **ARIA** — `aria-describedby` links the error message to the field.
3. **Text** — the message itself, in `text-destructive`.

Color alone is insufficient (WCAG 1.4.1 fail). Always pair with text.

### 8. Success

Confirmation after a successful action. Brief flash, optional icon swap.

```tsx
<CopyButton value="dep_abc123" />
// On click:
// - Copies value
// - Switches icon from <Copy> to <Check>
// - Switches label from "Copy" to "Copied!"
// - Returns to default after 2 seconds
```

**For form submits**, success is often surfaced via:

- Inline alert: `<Alert variant="success">Saved successfully</Alert>` (rare — too loud for routine saves)
- Toast: `<Toast variant="success">Saved</Toast>` (decent for important saves)
- Silent: no visual change, the form is back to default. The fact that the form no longer shows "Saving…" IS the success signal.

Prefer silent success for routine actions (Linear-style). Reserve toast/alert for actions where the user might leave the page before completion.

---

## Demo wrapper — render all 8 states at once

For component-scope output, emit an 8-state demo:

```tsx
{/* MyButton.preview.tsx */}
export function ButtonPreview() {
  return (
    <div className="p-8 space-y-4 max-w-xl">
      <h2 className="text-title-lg text-foreground">MyButton — 8 states</h2>

      <div className="grid grid-cols-[120px_1fr] gap-3 items-center">
        <span className="text-body-sm text-muted-foreground">default</span>
        <div><MyButton>Click me</MyButton></div>

        <span className="text-body-sm text-muted-foreground">hover</span>
        <div className="is-hover"><MyButton>Click me</MyButton></div>

        <span className="text-body-sm text-muted-foreground">focus</span>
        <div className="is-focus"><MyButton>Click me</MyButton></div>

        <span className="text-body-sm text-muted-foreground">active</span>
        <div className="is-active"><MyButton>Click me</MyButton></div>

        <span className="text-body-sm text-muted-foreground">disabled</span>
        <div><MyButton disabled>Click me</MyButton></div>

        <span className="text-body-sm text-muted-foreground">loading</span>
        <div><MyButton loading>Click me</MyButton></div>

        <span className="text-body-sm text-muted-foreground">error</span>
        <div><MyButton data-state="error">Try again</MyButton></div>

        <span className="text-body-sm text-muted-foreground">success</span>
        <div><MyButton data-state="success">Saved!</MyButton></div>
      </div>
    </div>
  );
}
```

The `.is-hover`, `.is-focus`, `.is-active` classes are forced pseudo-states. The component CSS targets them alongside the real `:hover`, `:focus-visible`, `:active`:

```css
.my-button:hover,
.my-button.is-hover {
  background: hsl(var(--muted));
}

.my-button:focus-visible,
.my-button.is-focus {
  outline: 2px solid hsl(var(--ring));
  outline-offset: 2px;
}

.my-button:active,
.my-button.is-active {
  transform: scale(0.98);
}
```

This lets the demo page render all 8 states statically, on one screen, for visual review.

---

## Specific component patterns

### `<Input>` states

| State | Cue |
|---|---|
| default | `border-input` |
| hover | (rare — inputs don't lift on hover) |
| focus-visible | `ring-2 ring-ring ring-offset-2` |
| active | (n/a) |
| disabled | `opacity-50 cursor-not-allowed` |
| loading | (rare — usually the surrounding submit button shows loading) |
| error | `border-destructive` + inline `aria-describedby` message |
| success | (rare — silent confirmation is the norm) |

### `<Switch>` / `<Checkbox>` states

| State | Cue |
|---|---|
| default | unchecked: `bg-input`; checked: `bg-primary` |
| hover | unchecked: `bg-input/80` |
| focus-visible | `ring-2 ring-ring` on the thumb / checkmark |
| active | (n/a — Switch / Checkbox don't typically respond to active visually) |
| disabled | `opacity-50` |
| loading | rare — use a sibling spinner if needed |
| error | `border-destructive` ring around the control |
| success | brief checkmark flash after toggle (optional) |

### `<Dialog>` states

A dialog has only two states from the user's perspective: **closed** and **open**. The 8-state model applies to the controls INSIDE the dialog (the confirm button, the input fields).

Dialog state to watch:

- **Opening** — animate in (theo-ui handles this).
- **Closing** — animate out (theo-ui handles this).
- **Focus trapped** — Tab cycles inside the dialog only (Radix handles this).
- **Escape closes** — pressing Escape closes the dialog (Radix handles this).
- **Backdrop click closes** — clicking the overlay closes (configurable; default true).

---

## Don't fake states

```tsx
// WRONG — fake loading by disabling the button without showing a spinner
<Button disabled={isSaving}>Save</Button>

// RIGHT
<Button loading={isSaving}>Save</Button>
```

```tsx
// WRONG — fake error by changing color but no aria-invalid
<Input className={error ? "border-red-500" : ""} />

// RIGHT — use the component's error prop or aria-invalid
<Input aria-invalid={!!error} aria-describedby={error ? "x-error" : undefined} />
```

```tsx
// WRONG — fake success with no visible change after the action
async function handleSave() {
  await save();
  // user has no idea if it worked
}

// RIGHT — at minimum, the loading state clears (which IS the success signal)
async function handleSave() {
  setSaving(true);
  try { await save(); } finally { setSaving(false); }
}

// BETTER — surface success explicitly for important actions
async function handleSave() {
  setSaving(true);
  try {
    await save();
    toast.success("Settings saved");  // or inline alert
  } finally { setSaving(false); }
}
```

---

## State coverage in the slop test

Gates A-01, A-04, C-05 all touch state coverage:

- **A-01** — focus-visible present?
- **A-04** — error states have label association + aria-describedby?
- **C-05** — loading states use `<Skeleton>` / `<Loader2>` / `<PageShell loading>`?

A custom component that hand-rolls states will fail multiple gates. Use theo-ui primitives and the states come for free.
