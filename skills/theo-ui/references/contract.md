# Output contract

Final rules for handoff. Load at Step 7 of the default verb, or at handoff for audit / migrate / catalog.

---

## What the skill emits

Depending on the verb:

| Verb | Emits |
|---|---|
| default (Design flow) | (1) JSX file(s) for the page, (2) updated `.theo-ui-skill/log.json`, (3) preview block with slop-test result. |
| `audit` | (1) Markdown punch list, (2) NO file edits. |
| `migrate` | (1) Migration plan (Markdown), (2) approved edits applied to target files, (3) post-migration audit. |
| `catalog` | (1) Markdown answer with import + usage example, (2) NO file edits. |
| Component-scope | (1) Single JSX file edit/create, (2) optional 8-state demo wrapper. |

---

## What the skill does NOT emit

- **README updates** — unless explicitly requested. The skill doesn't gratuitously touch `README.md`.
- **Test files** — unless explicitly requested. The skill produces UI, not tests.
- **Storybook / Ladle stories** — unless explicitly requested.
- **Routing changes** — the skill doesn't add Next.js routes / React Router routes / Vite routes unless the brief is a page that doesn't exist yet AND the user has confirmed the route.
- **Package installs** — the skill shows the `pnpm add` / `npm install` command but doesn't run it. The user installs.
- **Build / deploy commands** — the skill emits code; deployment is the user's call.

---

## What the skill assumes

- The project has `@theokit/ui` installed (or the user knows to install it after seeing the emit).
- The project has React 18+ (preferably 19).
- The project uses Tailwind CSS v4 with theo-ui's preset (or knows how to wire CSS vars manually).
- The project has a routing setup if pages are emitted.

If any assumption is wrong, the pre-flight scan surfaces it — the skill doesn't proceed silently.

---

## File modifications

### When the skill creates files

- Component-scope: a single component file (`MyButton.tsx`) and optionally a preview wrapper (`MyButton.preview.tsx`).
- Page-scope: one page file (e.g., `page.tsx` for Next.js, or `deployments.tsx` for React Router).
- Skill housekeeping: `.theo-ui-skill/log.json` and `.theo-ui-skill/preflight.json` at the project root.

### When the skill edits files

- Migrate verb: edits in place. Always shows the migration plan first; never edits without approval.
- Default verb, when the target is an existing file the user named: in-place edit of that file.

### When the skill deletes files

- Never automatically. Deletions require explicit user confirmation per the safety rail.

---

## File paths

The skill respects the project's existing convention:

- Next.js App Router: `app/<route>/page.tsx`
- Next.js Pages Router: `pages/<route>.tsx`
- React Router with Vite: `src/routes/<route>.tsx` or `src/pages/<route>.tsx` (whichever the project uses)
- Standalone: `src/components/<ComponentName>.tsx`

For a NEW route, the skill emits ONE file at the conventional location. It does NOT create routing configuration unless the project doesn't have a router (rare).

---

## Import style

Post-0.10 (subpath imports):

```tsx
import { Button } from "@theokit/ui/button";
import { Card } from "@theokit/ui/card";
import { PageShell } from "@theokit/ui/page-shell";
```

Pre-0.10 (barrel imports):

```tsx
import { Button, Card, PageShell } from "@theokit/ui";
```

Determined by pre-flight scan. When pre-flight isn't available, default to subpath and note: *"Subpath imports require `@theokit/ui` ≥ 0.10. If your version is older, use barrel imports."*

---

## Tailwind preset wiring

If the project's `tailwind.config.{ts,js}` doesn't include the theo-ui preset, the skill emits the snippet:

```ts
// tailwind.config.ts
import type { Config } from "tailwindcss";
import theoUiPreset from "@theokit/ui/tailwind-preset";

export default {
  presets: [theoUiPreset],
  content: [
    "./src/**/*.{ts,tsx,js,jsx,mdx}",
    "./node_modules/@theokit/ui/dist/**/*.js",
  ],
} satisfies Config;
```

For Tailwind v4 (CSS-first config):

```css
/* src/styles/globals.css */
@import "@theokit/ui/styles/globals.css";

/* Or, if you want only the tokens: */
@import "@theokit/ui/styles/tokens.css";
```

---

## `<ThemeProvider>` wiring

If the project doesn't have a `<ThemeProvider>` mount at the root, the skill emits the snippet:

```tsx
// src/app/layout.tsx (Next.js App Router)
import { ThemeProvider } from "@theokit/ui";
import { ThemeScript } from "@theokit/ui";  // SSR-safe theme bootstrap

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <ThemeScript defaultTheme="violet-forge" />
      </head>
      <body>
        <ThemeProvider defaultTheme="violet-forge" defaultDensity="comfortable">
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
```

The `<ThemeScript>` injects the theme before React hydrates, preventing FOUC.

---

## Stamping

Every emitted file gets a stamp comment at the top. Format depends on scope:

### Page-scope

```tsx
{/* theo-ui · archetype: P1 ListPage · surface: cloud-dashboard · density: comfortable
 *  composites: PageShell · ActionBar · DataTable · DropdownMenu
 *  primitives: Button · Badge · StatusDot
 *  theme: violet-forge  ·  a11y: WCAG 2.5.8 AA pass
 *  pre-emit critique: L5 T5 C5 A5 R5 V5
 */}
```

### Component-scope

```tsx
{/* theo-ui · component: button · surface: cloud-dashboard · base: Button
 *  states: default · hover · focus · active · disabled · loading · error · success
 *  tokens: primary · foreground · border · ring  ·  a11y: 2.5.8 AA pass
 */}
```

### Migration

```tsx
{/* theo-ui · migrated: 2026-05-25 · v1.0.0
 *  surface: cloud-dashboard  ·  archetype: P1 ListPage
 *  composites added: PageShell · DataTable · DropdownMenu · ConfirmDialog
 *  hand-rolled removed: 4 buttons, 1 dropdown, 1 modal, 1 table
 *  pre-migration audit score: 60%  ·  post-migration audit score: 100%
 */}
```

---

## Preview block (Step 5)

Before emitting code, the skill outputs a preview block (Markdown bullets):

```markdown
**theo-ui · v1.0.0**

- **Surface** · cloud-dashboard
- **Archetype** · P1 ListPage
- **Anchor composite** · PageShell + ActionBar + DataTable
- **Components used** · PageShell · ActionBar · DataTable · DropdownMenu · Button · Badge · StatusDot
- **Theme** · violet-forge (project default)
- **Density** · comfortable (project default)
- **Imports** · subpath (post-0.10 pattern)
- **Slop test** · 32 / 32 ✓ (run after Build)
```

If any slop-test gate fails at Step 7, RE-EMIT the preview block with the corrected slop-test row. The preview is the durable summary — it must be accurate.

---

## Project memory (`.theo-ui-skill/log.json`)

After every page-scope emit, append to the log:

```json
[
  {
    "date": "2026-05-25",
    "verb": "default",
    "archetype": "P1 ListPage",
    "surface": "cloud-dashboard",
    "components": ["PageShell", "ActionBar", "DataTable", "DropdownMenu", "Button", "Badge", "StatusDot"],
    "theme": "violet-forge",
    "density": "comfortable",
    "brief": "Deployments list"
  }
]
```

Keep only the last 20 entries (rotate the oldest off the back of the array).

Component-scope and catalog runs do NOT append. Audit runs do NOT append (read-only). Migrate runs append with `"verb": "migrate"`.

---

## What the skill refuses

### Refusal heuristics

The skill refuses to:

1. **Generate fake customer logos, fake testimonials, fake metric counts.** (Gate V-01.)
2. **Hand-roll components the library already ships.** (Gates L-01 through L-06.)
3. **Bypass the design token system.** (Gates T-01 through T-08.)
4. **Generate UI with a11y holes the library would catch.** (Gates A-01 through A-06.)
5. **Pixel-clone competitor designs.** If the user pastes a screenshot and asks "build this exactly", the skill extracts the structural archetype and rebuilds with theo-ui — it doesn't 1:1 reproduce the visual style.
6. **Generate destructive code without confirmation.** Migrations require explicit `go` / `yes` / `apply`. Deletions require typed confirmation.
7. **Touch files the user didn't authorize.** The plan lists files to be modified; outside that list, no edits.
8. **Install packages.** The skill shows the install command; the user runs it.

### When to refuse politely

```markdown
I can't build that as described — the request involves [specific issue]. Here's what I can do instead:

- [Alternative 1]
- [Alternative 2]

Let me know which fits.
```

Examples:

- *"Build a pricing page with `+47% conversion` social proof banner"* → "I can't generate invented metrics. I can build the pricing page with placeholders ('—' or 'metric to confirm') that you'd wire to real data. Or I can build it without the social proof band. Which fits?"
- *"Clone Stripe's homepage exactly"* → "I can't pixel-clone Stripe's design — copyright + trademark. I can study Stripe's structure (macrostructure + archetypes) and rebuild with `@theokit/ui` tokens. Want me to do the structural rebuild?"

---

## When to ask for clarification

The skill asks for clarification when:

1. **The brief is genuinely ambiguous between component and page.** Default to component if unanswered, but ask once.
2. **The brief fires two non-default surface signals.** Pick the primary surface.
3. **The pre-flight reveals a conflict** (e.g., Tailwind preset present but theo-ui import missing).
4. **A migration plan removes > 30% of a file's lines** (structural rewrite, not a swap).
5. **The user asks for something that violates a slop-test gate** (e.g., invented metrics, pixel-clone).

The skill does NOT ask for clarification when:

1. **The brief is short but answerable** (default verb's Step 1 gate covers it).
2. **The surface is obvious from context** (deployment terms → cloud-dashboard).
3. **The theme is set in the project** (no need to ask — inherit).

One clarification question max per turn. If the user doesn't engage, infer from the brief and state the inference.

---

## Telemetry and privacy

The skill does NOT phone home. There's no analytics endpoint, no version-check ping, no opt-in survey. Everything is local.

The `.theo-ui-skill/log.json` file is local-only — the user controls whether it's committed (recommend `.gitignore`).

The pre-flight cache (`.theo-ui-skill/preflight.json`) is local-only — re-scanned when source files change.

---

## Versioning

The skill is at v1.0.0 as of 2026-05-25. Future versions add:

- New surfaces (e.g., `docs-page` for docs sites).
- New verbs (e.g., `theo-ui story <component>` for Ladle story generation).
- New page archetypes (P13+).
- New slop-test gates as the library evolves.

Breaking changes to the skill bump the major version. The skill's frontmatter (`version: 1.0.0`) is the authoritative number.

---

## Handoff

After every default-verb build, the skill emits:

1. The stamped file(s).
2. The preview block with slop-test result.
3. A short "next steps" suggestion if applicable:

```
Build complete. Next steps you might want:
- `theo-ui audit src/app/deployments/page.tsx` to score against the slop test.
- `theo-ui catalog usage meter` to find more components for the metric grid.
- Update `package.json > files` to include any new files for npm publishing.
```

The next-steps suggestion is OPTIONAL. Skip it for trivial builds (single component, single page).
