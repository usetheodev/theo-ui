# Architecture

How `@theokit/ui` is laid out, what determines a component's layer, and what the package
publishes.

| Concept | What it answers |
| --- | --- |
| [Taxonomy rule](/architecture/taxonomy-rule.md) | Is this component a primitive or a composite? The rule is mechanical and gated. |
| [Source layout](/architecture/source-layout.md) | Where does a file go in `src/`? |
| [Global provider primitives](/architecture/global-provider-primitives.md) | The closed set of primitives allowed to require a root-level provider. |
| [Subpath exports](/architecture/subpath-exports.md) | What `@theokit/ui/<name>` resolves to and what it actually saves. |
| [Package shape](/architecture/package-shape.md) | ESM-only, the exports map, and the pre-publish gate that protects it. |
| [Component lifecycle](/architecture/component-lifecycle.md) | Adding, renaming, deprecating, deleting a component. |
| [Isolated engines](/architecture/isolated-engines.md) | Why heavy primitives live outside the barrel, and the bundle-isolation invariant. |

Related: [`/registry/component-census.md`](/registry/component-census.md) counts what is
exported; [`/quality-gates/structural-validator.md`](/quality-gates/structural-validator.md)
is what enforces the rules on this page.
