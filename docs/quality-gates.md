# Quality Gates — Theo UI

> Normative gates for `@theokit/ui`.
> Reference model: `referencia/ui` for organization, registry rigor, documentation
> and release discipline. We do not copy its visual identity.

Theo UI serves two product surfaces:

1. **AI coworker local-first**: chat, cowork tasks, permissions, local files,
   agent timeline, code workspace, artifacts.
2. **PaaS components**: deployments, preview environments, domains, env vars,
   metrics, rollback, project cards.

Both surfaces share the same component library, tokens, registry and quality
bar. Domain-specific value gates are separate because a useful local agent UI is
not judged by the same criteria as a deployment dashboard.

---

## Gate 0 — Definition of Ready

A component or screen can start only when these are true:

- The component has a clear owner layer: `primitive`, `composite`, or `screen`.
- The target user job is stated in one sentence.
- Required states are listed before implementation: empty, loading/running,
  success, error, disabled, permission-required when applicable.
- Required interactions are listed before implementation: keyboard, pointer,
  async callbacks, destructive confirmation, copy/open actions.
- If the component enters the registry, its install target and dependencies are
  known upfront.

Failing this gate means the work is still product/design exploration, not
implementation.

---

## Gate 1 — Taxonomy and Componentization

This extends `docs/architecture.md`.

### Primitive gate

A primitive passes only if:

- It imports no other Theo component.
- It may import React, Radix, lucide, CVA, `cn`, shared types and same-file
  subparts.
- It is stateless by default unless local UI state is intrinsic to the control
  (`open`, keyboard roving, filter text, selected tab).
- It exposes semantic props instead of leaking implementation details where a
  stable API is obvious.
- It forwards refs when it renders a concrete interactive or layout element.
- It has no fetch, filesystem, IPC, agent, deploy or auth side effects.

### Composite gate

A composite passes only if:

- It composes primitives through public APIs.
- It has domain props typed from `src/types` or local exported interfaces.
- It accepts callbacks for mutations instead of performing them internally.
- It does not import screens or app-specific code.
- It handles all required user-visible states without relying on consumers to
  invent layout around missing states.

### Screen/story gate

A screen story passes only if:

- It demonstrates a real workflow, not a decorative layout.
- It uses realistic data, long labels, empty/error states when relevant.
- It is not exported from the library barrel.
- It proves how primitives and composites should be assembled.

---

## Gate 2 — Registry Compatibility

`referencia/ui` is strongest here: every registry item must install cleanly into
a consumer project.

A registry item passes only if:

- `registry/<name>.json` exists for every public item intended for copy/paste
  distribution.
- `registry/r/<name>.json` is generated from source, not hand-edited.
- `files[].target` matches the import paths inside the copied file.
- Relative imports in generated content resolve in the consumer project.
- `dependencies`, `devDependencies` and `registryDependencies` are complete.
- Registry dependencies are acyclic.
- The item can be installed alone into a clean fixture app.
- The item does not require private Theo app code.

**Resolved (2026-05)**: `scripts/build-registry.ts` rewrites relative imports
into consumer-app `@/...` paths via `sourceImportMap`, so descriptors targeting
`components/ui/*.tsx` install cleanly even though source uses `../../../lib/cn.js`.
A failing fixture-install test (`scripts/test-registry-install.ts`) keeps this
honest by running `tsc --noEmit` against a real consumer fixture.

### Registry copy-paste preconditions (T2.3)

The copy-paste install path (`npx shadcn@latest add https://usetheodev.github.io/theo-ui/r/<name>.json` — branded `ui.usetheo.dev` URL pending DNS CNAME)
requires the consumer project to satisfy these environmental preconditions:

| Precondition | Required value | Why |
|---|---|---|
| `tsconfig.json#compilerOptions.paths["@/*"]` | `["./src/*"]` | Inlined source contains `import { cn } from "@/lib/cn"` and similar `@/components/ui/*` imports. Without the alias mapped, TypeScript fails to resolve. Convention since shadcn-ui 2.0. |
| Vite/Webpack alias | matching `@/` alias | Build-time resolution for non-tsconfig-aware bundlers. |
| React 18.2+ | matches `peerDependencies` | Hook + ref forwarding semantics. |
| Tailwind CSS 3.x | + `tailwindcss-animate` plugin | Source uses utility classes from the Violet Forge preset. `npx shadcn add tailwind-preset` installs the preset itself. |

The shipped `registry/index.json` declares this precondition under
`metadata.requires.tsconfigPathAlias["@/*"]`. The `scripts/validate-registry.ts`
gate `metadata.requires.tsconfigPathAlias` fails the build if the field
is missing or empty, so the doc and the artifact cannot drift apart.

Consumers using a different alias convention (e.g. Vite default `~/`) need to
either configure `@/` in their tsconfig or rewrite the imports after copy-paste.
Plan to add a `shadcn`-aware bundler check in v0.2.0.

---

## Gate 3 — Design System Fidelity

A component passes only if it implements the selected Theo identity, not a
generic shadcn clone.

- Uses `tokens.css` and Tailwind theme tokens, not raw hex except for static
  assets or documented edge cases.
- Works in light and dark modes.
- Respects the Violet Forge palette and avoids unrelated gradients.
- Uses the normative typography from `docs/design-system.md`.
- Does not introduce one-off spacing, radii or shadows without documenting why.
- Keeps text inside controls at all supported widths.
- Uses lucide icons where a standard icon exists.
- Does not include decorative controls without behavior.

Design system drift is a blocking issue because the UI library is the product
surface for both AI coworker and PaaS workflows.

---

## Gate 4 — Accessibility and Interaction

A component passes only if:

- Interactive elements are reachable by keyboard.
- Focus states are visible and tokenized.
- Buttons have accessible names when icon-only.
- Dialogs trap focus, restore focus and expose title/description correctly.
- Menus, tabs, command palettes and segmented controls support expected keyboard
  behavior.
- Loading/running states are announced or represented semantically when needed.
- Disabled states are real `disabled` or `aria-disabled` with appropriate event
  handling.
- Color is not the only status indicator.

For command surfaces such as `CommandPalette`, substring filtering plus click
selection is not enough. Expected behavior includes active item, arrow keys,
Enter selection, Escape close and useful ranking.

---

## Gate 5 — Test Coverage

Minimum per component:

- Smoke render.
- Variant/prop matrix for visual or semantic branches.
- Keyboard and pointer behavior for interactive components.
- Callback payload assertions.
- Accessibility-critical assertions: labels, roles, disabled state, selected
  state, focus behavior where practical.
- Regression test for every bug fixed after release.

Broaden tests when the component is:

- A shared primitive.
- In the registry.
- Used by both AI coworker and PaaS surfaces.
- Responsible for permission, destructive action, deployment, rollback or code
  execution workflows.

Automated baseline:

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm build
pnpm registry:build
```

---

## Gate 6 — Documentation and Examples

A public component passes only if:

- It has a Ladle story under the correct group.
- The story shows realistic data and at least one edge state.
- Props are typed and exported when consumers need them.
- The component is exported from `src/index.ts` only when it is public API.
- Registry items include clear title, description and dependency metadata.
- Docs explain when to use it and when not to use it when the choice is not
  obvious.

Avoid docs that merely restate JSX. Show product intent and integration shape.

---

## Gate 7 — AI Coworker Local-First Value

AI coworker components pass only if they increase user trust, control or task
completion.

Required product qualities:

- **Local context is visible**: selected folder, files touched, paths, scope.
- **Permission is explicit**: read/write/execute actions clearly ask or show
  authorization state.
- **Progress is inspectable**: timeline, commands, tool calls, files read/written
  and current step are visible.
- **Results are verifiable**: created files, diffs, artifact previews and
  validation rows are available when applicable.
- **The user can intervene**: stop, retry, edit instruction, approve, deny,
  rollback or open result.
- **No fake affordances**: mic, attach, model, folder, PR, deploy and copy
  controls either work through callbacks or are not rendered.

Examples:

- `ChatComposer` must not show attach/mic by default unless those actions are
  wired or intentionally disabled with accessible state.
- `PermissionModal` must show operation, path, risk, duration/scope and choices.
- `AgentTimeline` must distinguish planned, running, succeeded and failed work.

---

## Gate 8 — PaaS Component Value

PaaS components pass only if they help a user operate software in production.

Required product qualities:

- Status is precise: queued, building, deploying, live, failed, cancelled.
- The next action is obvious: view logs, open preview, retry, rollback, set
  primary, copy DNS, edit env var.
- Risky operations require confirmation or clear state transition.
- Operational metadata is visible: branch, commit, author, region, duration,
  service, URL, TLS/DNS state.
- Components handle degraded states: no logs, pending DNS, failed deploy, empty
  project list, missing metric data.
- Copyable values use monospace and preserve long content with wrapping or
  truncation plus accessible labels.

Examples:

- `RollbackUI` must communicate target version and consequence before callback.
- `DomainConfig` must surface DNS verification records and TLS state.
- `PreviewEnvCard` must make service URLs and statuses scannable.

---

## Gate 9 — Release Readiness

A PR touching public UI passes release readiness only if:

- `pnpm quality:gates` passes.
- New public items are exported intentionally.
- Registry output is regenerated when descriptors or source registry files
  change.
- Docs/stories are updated for changed behavior.
- No unrelated generated churn is included.
- Breaking API changes include migration notes.
- Known warnings are either fixed or documented with owner and reason.

### Sub-gates added 2026-05-25

The `quality:gates` chain ran originally with format/lint/typecheck/test/
build/structure/bundle/a11y/ladle/dogfood. Three additive sub-gates landed
on 2026-05-25 to close gaps a manual audit surfaced:

- **`quality:knip`** — runs [knip](https://knip.dev/) against `src/`,
  `scripts/`, `playground/`, `.ladle/`. Hard-fails on unused dependencies,
  unresolved imports, missing binaries, and duplicate exports. Soft-warns
  on unused files, exports, and types (intended to surface drift without
  blocking merges). Config in [`knip.json`](../knip.json).
- **`quality:publint`** — runs [publint](https://publint.dev/) with
  `--strict` on the package shape. Validates `exports` map, `types`
  fields, dual-package shape, license metadata, npm-publish hygiene.
  No config file needed; reads `package.json` + tarball contents.
- **`quality:attw`** — runs [@arethetypeswrong/cli](https://arethetypeswrong.github.io/)
  against the packed tarball. **NOT in the `quality:gates` chain by
  default** — the tool currently crashes on `@theokit/ui`'s intentional
  package shape (per Brief #4 / RFC subpath-exports-per-component: ~130
  per-component subpath exports share the root `dist/index.d.ts` rather
  than generating per-component DTS files, which would OOM the tsup
  worker pool). The script is kept available for opt-in manual runs
  (`pnpm quality:attw`) when investigating type-resolution issues.
  Revisit when upstream stabilizes or when we adopt a per-component DTS
  strategy.

---

## Review Checklist

Use this checklist in PR review:

- Layer is correct: primitive, composite, or screen.
- Public API is stable and typed.
- Visuals follow Violet Forge tokens and typography.
- Light/dark modes are covered.
- Keyboard and focus behavior are correct.
- Empty/loading/error/running states exist where needed.
- AI coworker trust gates are met, if applicable.
- PaaS operational gates are met, if applicable.
- Registry install path is valid, if applicable.
- Tests cover behavior, not only rendering.
- Story demonstrates a realistic workflow.
- `pnpm quality:gates` passes.

