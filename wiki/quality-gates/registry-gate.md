---
type: Quality Gate Reference
title: Registry gate — what makes a copy-paste item installable
description: The pass conditions for a registry item and the consumer-project preconditions the shadcn install path depends on.
tags: [quality-gates, registry, shadcn, install, contract]
sources:
  - id: gates-doc
    resource: "archive:94d9b11:docs/quality-gates.md"
  - id: build-registry
    resource: "scripts/build-registry.ts"
  - id: validate-registry
    resource: "scripts/validate-registry.ts"
generated:
  by: "claude-code/opus-5"
  at: "2026-08-11"
status: stable
---

# Pass conditions

A registry item passes Gate 2 only if:

- [ ] `registry/<name>.json` exists for every public item intended for copy-paste
      distribution.
- [ ] `registry/r/<name>.json` is **generated from source**, never hand-edited.
- [ ] `files[].target` matches the import paths inside the copied file.
- [ ] Relative imports in the generated content resolve in the consumer project.
- [ ] `dependencies`, `devDependencies`, and `registryDependencies` are complete.
- [ ] Registry dependencies are **acyclic**.
- [ ] The item installs alone into a clean fixture app.
- [ ] The item requires no private Theo app code.

The acyclic requirement is not incidental: it is the same constraint that makes the
[primitive/composite taxonomy rule](/architecture/taxonomy-rule.md) mechanical. A cycle in
the component import graph becomes a cycle in `registryDependencies`, and the shadcn
installer cannot resolve it.

# Import rewriting

Source uses relative imports (`../../../lib/cn.js`). Consumer projects expect the shadcn
`@/...` convention. `scripts/build-registry.ts` rewrites them via `sourceImportMap`, so a
descriptor targeting `components/ui/*.tsx` installs cleanly even though the source does
not look like the output.

A failing fixture-install test keeps that honest: `scripts/test-registry-install.ts` runs
`tsc --noEmit` against a real consumer fixture (`tests/fixture-shadcn-app/`). A rewrite
that produces unresolvable imports fails the build, not the user.

# Consumer preconditions

The copy-paste path is:

```bash
npx shadcn@latest add https://usetheodev.github.io/theokit-ui/r/<name>.json
```

(The branded `ui.usetheo.dev` URL is pending a DNS CNAME.)

It requires the consumer project to satisfy four environmental preconditions:

| Precondition | Required value | Why |
| --- | --- | --- |
| `tsconfig.json#compilerOptions.paths["@/*"]` | `["./src/*"]` | Inlined source contains `import { cn } from "@/lib/cn"` and `@/components/ui/*` imports. Without the alias, TypeScript cannot resolve them. Convention since shadcn-ui 2.0. |
| Vite/Webpack alias | matching `@/` alias | Build-time resolution for bundlers that do not read tsconfig paths. |
| React | 18.2+ | Matches `peerDependencies`. Hook and ref-forwarding semantics. |
| Tailwind CSS | 3.x + `tailwindcss-animate` | Source uses utility classes from the Violet Forge preset. `npx shadcn add tailwind-preset` installs the preset itself. |

`registry/index.json` declares this under
`metadata.requires.tsconfigPathAlias["@/*"]`, and the `validate-registry.ts` gate fails
the build if that field is missing or empty. **The documentation and the artifact cannot
drift apart** — which is the entire point of putting the precondition in the manifest
rather than only in prose.

Consumers on a different alias convention (Vite's default `~/`, for example) must either
configure `@/` in tsconfig or rewrite imports after copy-paste.

# Cross-package references

Fifteen `@theokit/ui` registry entries declare `registryDependencies` pointing at
`@usetheo/ui` items hosted at `https://usetheodev.github.io/usetheo-ui/r/*.json`. All
fifteen resolve `200`. Two registries, cross-referenced — see
[`/history/ai-exclusive-pivot.md`](/history/ai-exclusive-pivot.md) milestone M-D.
