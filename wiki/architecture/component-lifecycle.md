---
type: Runbook
title: Component lifecycle — adding, renaming, deprecating, deleting
description: The procedure for introducing a component and the deprecation windows that govern removing one.
tags: [architecture, runbook, lifecycle, deprecation, semver]
sources:
  - id: arch-doc
    resource: "git:94d9b11:docs/architecture.md"
  - id: gates-doc
    resource: "git:94d9b11:docs/quality-gates.md"
generated:
  by: "claude-code/opus-5"
  at: "2026-08-11"
status: stable
---

# Adding a component

Clear [Gate 0 — Definition of Ready](/quality-gates/gate-catalog.md) first. Work that
cannot state the layer, the user job in one sentence, the required states, and the
required interactions is still product exploration, not implementation.

- [ ] **Decide the public API first** — props plus composition shape. Sketch it in plain
      JSX before opening an editor.
- [ ] **Implement as a primitive by default.** If Radix + `cn` + lucide can do the job, it
      belongs in `primitives/`.
- [ ] **Stop if you reach for another primitive.** Needing `CostMeter` or `ModelCard`
      means it is a composite. Move it — see
      [`/architecture/taxonomy-rule.md`](/architecture/taxonomy-rule.md).
- [ ] Create `src/components/<layer>/<kebab-name>/` with all five required files
      (implementation, barrel, test, story, registry descriptor). See
      [`/architecture/source-layout.md`](/architecture/source-layout.md).
- [ ] Add the export to `src/index.ts` in the right section.
- [ ] Add `registry/<name>.json` with the correct `path`
      (`components/<layer>/<name>/<name>.tsx`).
- [ ] Run `pnpm typecheck && pnpm lint && pnpm test && pnpm build && pnpm registry:build`,
      then the full [`pnpm quality:gates`](/quality-gates/gate-catalog.md).

# Renaming

Keep the old name as a re-export from the new path with a `@deprecated` JSDoc tag. Remove
it **only in the next major version**.

# Moving primitive → composite

- Announce via a `CHANGELOG.md` entry.
- The public import from `@theokit/ui` does **not** change — the barrel is the only stable
  surface.
- Internal callers (other composites) must be migrated in the same PR.

# Deleting

A deletion must wait **one full major version** after the `@deprecated` tag lands. Two
worked precedents:

| Case | Shape |
| --- | --- |
| `Message` → `UIMessage` ([RFC 0009](/rfcs/0009-chat-message-parts-api.md)) | Hard break in a pre-1.0 minor. Justified by: two internal callsites, zero external consumers per `npm view`, and a compile-time TypeScript error that names the replacement. |
| The 54-component `@usetheo/ui` split ([v1 migration](/migrations/v1-usetheo-ui-split.md)) | Breaking major plus a shipped codemod. |

The pattern: a break is acceptable when the failure is **loud at compile time** and the
migration is **mechanical**. A break that fails silently at runtime is not, regardless of
the version number.

# Deprecation vocabulary

| Marker | Meaning |
| --- | --- |
| `@deprecated` JSDoc | Still exported, still works. Removal scheduled for the next major. |
| `status: deprecated` in a wiki concept | The knowledge describes something no longer current. |
| Removed from `src/index.ts` | Gone from the public surface. The gate's README-drift check will fail if docs still name it. |
