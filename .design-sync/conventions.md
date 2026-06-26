# Building with @theokit/ui (Violet Forge)

`@theokit/ui` is a React component library for AI-agent interfaces and cloud
dashboards. Import components from `@theokit/ui`; compose your own layout with
the design system's Tailwind utility classes (below). The look is "Violet
Forge" — Geist Sans/Mono, an electric-violet primary, tight Vercel-style type.

## Setup — no provider required

The design tokens cascade from `:root` (default theme is light), so components
render fully styled with **no wrapper**. Just import the components and the
stylesheet once:

```tsx
import { Button, Card, Badge } from "@theokit/ui";
// styles ship via the bound stylesheet (already loaded in this environment).
```

`ThemeProvider` is OPTIONAL — wrap the app in it only to switch themes at
runtime (`violet-forge` default, plus `classic-paper`, `aurora-terminal`) or to
toggle light/dark via `[data-theme="dark"]`. It is not needed for styling.

## Styling idiom — semantic Tailwind utilities, never literal colors

Style your own layout/markup with the design system's **semantic** Tailwind v4
utility classes. NEVER hand-pick hex/`bg-red-500`-style colors — always use the
semantic token classes so everything stays on-theme and theme-switchable.

Color families (each available as `bg-*`, `text-*`, `border-*`, `ring-*`, and
some as `fill-*`/`stroke-*`):

| Token class | Use for |
|---|---|
| `background` / `foreground` | page surface + default text |
| `card` / `card-foreground` | card/panel surface + its text |
| `popover` / `popover-foreground` | menus, tooltips, overlays |
| `primary` / `primary-foreground` | brand actions (violet) |
| `secondary` / `secondary-foreground` | secondary surfaces |
| `muted` / `muted-foreground` | subtle surfaces + secondary text |
| `accent` / `accent-foreground` | highlights, hover surfaces |
| `border` / `input` / `ring` | borders, field borders, focus ring |
| `destructive` | danger/delete actions (red) |
| `success` / `warning` | status (green / amber) |

Examples: `bg-background text-foreground`, `bg-card border border-border`,
`bg-primary text-primary-foreground`, `text-muted-foreground`,
`border-destructive`, a focus ring via `ring-ring`.

Type scale (use instead of raw `text-lg` etc. for DS rhythm):
`text-display-2xl`, `text-display-xl`, `text-display-lg`, `text-display-md`,
`text-body`, `text-body-sm`, `text-label-caps` (uppercase mono labels),
`text-code-sm`. Font families: `--font-body`, `--font-display` (Geist),
`--font-mono` (Geist Mono).

## Where the truth lives

- The component API for each `<Name>` is its `<Name>.d.ts` (the `<Name>Props`
  interface) — read it before passing props.
- Usage examples + element index are in each `<Name>.prompt.md`.
- The full token/utility CSS is in the bound `styles.css` import closure
  (tokens + the compiled component/utility stylesheet). Read it when you need a
  class or token name not listed above.

## One idiomatic example

```tsx
import { Card, Badge, Button } from "@theokit/ui";

export function DeploymentCard() {
  return (
    <Card className="flex flex-col gap-3 p-4 bg-card border border-border">
      <div className="flex items-center justify-between">
        <span className="text-label-caps text-muted-foreground">Production</span>
        <Badge variant="success">Live</Badge>
      </div>
      <p className="text-body text-foreground">usetheo.dev · deployed 2m ago</p>
      <Button variant="primary" className="self-start">View logs</Button>
    </Card>
  );
}
```

> Code blocks rendered by `CodeBlock`/`ChatMessage`/markdown show plain
> monospace (no syntax-highlight colors) — `shiki` is an optional peer-dep not
> bundled here. Everything else renders in full Violet Forge styling.
