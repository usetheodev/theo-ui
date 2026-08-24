---
type: Architecture Decision Record
title: "ADR 0001 — /vite-plugin and /preset subpaths are a versioned public contract"
description: The producer-side contract test that blocks a publish which would break the TheoKit consumer, mirroring the checks TheoKit runs.
tags: [adr, contract, publish, cross-repo, vite]
sources:
  - id: adr
    resource: "archive:94d9b11:docs/adr/0001-vite-plugin-subpath-export-contract.md"
    author: "human:paulo"
    last_modified: "2026-05-28"
generated:
  by: "claude-code/opus-5"
  at: "2026-08-11"
status: stable
---

| Field | Value |
| --- | --- |
| Status | **Accepted** |
| Date | 2026-05-28 |
| Deciders | paulo |
| Consulted | claude |
| Informed | theokit maintainers |

# Context

`@theokit/ui` exports `./vite-plugin`, `./preset`, `./styles.css`, `./fonts.css`, and
`./fonts-cdn.css`. `theokit`'s `packages/theo/src/vite-plugin/integrate-ui.ts` consumes
them via a filesystem walk plus dynamic import.

Before this ADR there was **no producer-side contract test**. `@theokit/ui` could break its
consumer and only find out when someone ran `pnpm install` and hit an error in production.
`theokit` already operated with a contract test and a peer-dep; this record is the
UI-side mirror.

# Decision drivers

1. **Honesty** — the library must know it broke a consumer *before* publishing, not after.
2. **Don't reinvent** — a `prepublishOnly` hook plus a Vitest integration test is the
   standard npm pattern.
3. **DRY** — the plugin shape is defined once and validated on both sides by tests that are
   identical in essence.

# Options

## A — Trust the consumer-side test only (rejected)

UI publishes → breaks the `theokit` consumer → their contract test catches it → forced
rollback. Costs a publish plus an investigation. Detecting pre-publish is strictly better.

## B — Contract test on the producer, run by `prepublishOnly` (accepted)

# Outcome

`tests/contract/theokit-consumer.test.ts` with five assertions mirroring TheoKit's checks:

- [x] The default export of `dist/vite-plugin.js` is a function.
- [x] The factory with no args returns a valid shape (`Plugin` or `Plugin[]`, each with
      `name: string`).
- [x] The factory with `{ tailwind: false }` does not throw.
- [x] `dist/preset.css` exists and is a `.css` file.
- [x] `dist/styles.css` and `dist/fonts.css` exist.

Path resolution uses `PKG_ROOT` derived from `import.meta.url` — an absolute path to the
package root. The EC-1 fix: `require.resolve('./dist/...')` resolves relative to the test
file, which is the wrong base.

Hooks:

```json
"test:contract": "vitest run tests/contract",
"prepublishOnly": "pnpm build && pnpm test:contract"
```

## The contract

| Subpath | Shape | Breaking change if altered? |
| --- | --- | --- |
| `./vite-plugin` | `default: (opts?: { tailwind?: boolean }) => Plugin \| Plugin[]` with `name: string` | **Yes — minor bump requires a cross-repo PR in `theokit`** |
| `./preset` | CSS file | Yes |
| `./styles.css` | CSS file | Yes |
| `./fonts.css` | CSS file | Yes |
| `./fonts-cdn.css` | CSS file | Yes |

# Consequences

**Positive.** A broken publish becomes impossible — the hook blocks it. The contract test
doubles as executable documentation of the public shape.

**Negative.** `prepublishOnly` requires a built `dist/`, adding roughly a minute to publish
time. Accepted.

# Related

- The plugin implementation itself: [RFC 0008](/rfcs/0008-vite-plugin-and-preset.md).
- The other two pre-publish layers:
  [`/architecture/package-shape.md`](/architecture/package-shape.md).
- Mirror ADR on the consumer side: `theokit` ADR 0018.

# Provenance caveat

The original record cited a spike document at `theokit/docs/spikes/usetheo-ui-vite-plugin-shape.md`
and a plan file that were **verified absent on 2026-08-06**. The decision itself is
accepted and implemented; those two references are dead and were not restored.
