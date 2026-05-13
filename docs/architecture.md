# Architecture — @usetheo/ui

> Last updated: 2026-05-13. This document defines the **taxonomy** rule for the library.
> All future components must comply.

---

## Top-level layout

```
src/
├── lib/                   Pure utilities (cn) — no React state, no DOM.
├── themes/                Theme registry + ThemeProvider + ThemeSwitcher.
├── types/                 Shared domain models (Message, AgentEvent, …).
├── components/
│   ├── primitives/        Atomic components. See rule below.
│   └── composites/        Compose >= 1 primitive. See rule below.
├── screens/               Example screens (Ladle stories only — not exported).
└── test/                  Vitest setup.
```

---

## The taxonomy rule

The split between `primitives/` and `composites/` is determined by a **mechanical rule**, not by domain feeling.

> **A component is a primitive if and only if it does NOT import any other
> `@usetheo/ui` component.**
>
> Otherwise it is a composite.

**Allowed imports for primitives:**
- React (`react`, hooks).
- Radix primitives (`@radix-ui/react-*`).
- Icon libraries (`lucide-react`).
- `class-variance-authority`, `clsx`, `tailwind-merge`.
- `../../../lib/cn.js` and `../../../types/*.js` (utilities & shared types).
- Internal subparts of the same component (e.g. `Card.Header`, `Sidebar.Item`).

**Forbidden in primitives:**
- Importing `Button`, `Badge`, `Card`, `Dialog`, etc., from another primitive folder.

**Composites freely import primitives** and may also import other composites,
but **must not import their own consumers** (no circular deps).

### Why this rule?

1. **Predictable bundle sizes**. A consumer who installs only `Badge` from the
   registry gets just `cn` + Radix + Badge code — no surprise transitive deps.
2. **Registry hygiene**. The shadcn registry declares `registryDependencies`;
   if `Button` depended on `Card` depended on `Button`, that graph would cycle.
3. **Refactor safety**. Moving a primitive's internals never breaks composites —
   only their public API matters. Composites are explicitly the place where
   coupling between components happens.
4. **Discoverability**. Newcomers see two folders: the LEGO bricks and the
   assembled models. No “Compostos / Agent” bucket that is actually atomic.

---

## Current census (auto-derived from imports)

### Primitives (36)
`agent-event`, `agent-starting-state`, `artifact-preview`, `attachment-chip`,
`badge`, `browser-controls`, `build-log-stream`, `button`, `card`,
`chat-message`, `chat-thread`, `context-card`, `created-files-card`, `dialog`,
`diff-viewer`, `folder-context-card`, `folder-selector`, `input`, `login-split`,
`metrics-panel`, `model-selector`, `progress-checklist`, `quick-action-chips`,
`recent-folders-list`, `run-stats`, `running-tasks-panel`, `scroll-area`,
`sidebar`, `social-auth-row`, `steps-rail`, `tabs`, `terminal-panel`,
`tool-call`, `tool-result`, `tooltip`, `topnav`.

### Composites (12)

| Composite | Imports |
|---|---|
| `agent-timeline` | `agent-event` |
| `chat-composer` | `button` |
| `command-palette` | `dialog` |
| `deployment-row` | `badge` |
| `domain-config` | `badge`, `button`, `input` |
| `env-var-editor` | `badge`, `button`, `input` |
| `permission-modal` | `button`, `dialog` |
| `preview-env-card` | `badge` + `DeploymentStatus` type from `deployment-row` |
| `preview-panel` | `browser-controls` |
| `project-card` | `badge` + `DeploymentStatus` type from `deployment-row` |
| `rollback-ui` | `badge`, `button` |
| `task-header` | `badge` |

### Notes
- `Sidebar`, `TopNav`, `LoginSplit`, `Card`, `Badge`, `Dialog`, `Tabs`,
  `Tooltip`, `ScrollArea` have **internal subparts** (`Sidebar.Item`,
  `Card.Header`, etc.). These are private — they don't count as cross-component
  imports because they live in the same source file.
- The `DeploymentStatus` *type* import in `project-card` / `preview-env-card`
  is structural data, not a component dependency. We tolerate type imports
  across primitives/composites because they don't add code at runtime.

---

## How to add a new component

1. Decide the **public API** (props + composition shape) first. Sketch a quick
   example in plain JSX before opening an editor.
2. **Implement as a primitive** by default. If you can do the job with Radix +
   `cn` + lucide, do it there.
3. If you find yourself reaching for `Button` or `Badge`, **stop**: the
   component belongs in `composites/`. Move it.
4. Create the folder under the right layer:
   `src/components/<layer>/<kebab-name>/`
5. Required files:
   - `<name>.tsx` — implementation.
   - `index.ts` — barrel re-export.
   - `<name>.test.tsx` — at minimum: smoke render, props matrix, key behaviors.
   - `<name>.stories.tsx` — Ladle story under title `<Layer> / <Name>`
     (e.g. `Primitives / Badge`, `Composites / DeploymentRow`).
6. Add the export to `src/index.ts` in the right section.
7. Add a `registry/<name>.json` descriptor with the correct `path`
   (`components/<layer>/<name>/<name>.tsx`).
8. Run `pnpm typecheck && pnpm lint && pnpm test && pnpm build && pnpm registry:build`.

---

## Anti-patterns

- **Domain-folded "Compostos" buckets**: grouping atomic components in
  `composites/agent/` just because they belong to the agent domain. Wrong —
  let the import graph decide.
- **Inline Radix copies**: never copy a Radix primitive into our codebase
  "to customize it". Always re-export Radix and add Theo styling on top.
- **Implicit coupling via context**: a primitive should not require a parent
  to mount a context provider. If the context is needed, the consumer must
  be a composite (or document the requirement loudly).
- **Side effects on import**: primitives must be pure ES modules with no
  top-level state, network calls, or DOM mutation.

---

## Renaming, deprecation, deletion

- **Renaming**: keep the old name as a re-export from the new path with a
  `@deprecated` JSDoc tag, and remove only in the next major version.
- **Moving primitive → composite**: announced via CHANGELOG entry; the public
  import from `@usetheo/ui` does NOT change (the barrel is the only stable
  surface). Internal callers (other composites) must be migrated in the same
  PR.
- **Deletion**: must wait one major version after the deprecation tag lands.
