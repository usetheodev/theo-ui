# Engines

View-only primitives that render structured agent output. Each ships under an isolated
subpath with optional peer-deps and stays out of the main barrel — see
[`/architecture/isolated-engines.md`](/architecture/isolated-engines.md) for the invariants
that make that work.

| Concept | Subpath | Renders |
| --- | --- | --- |
| [Whiteboard](/engines/whiteboard.md) | `@theokit/ui/whiteboard` | Declarative JSON → hand-drawn SVG diagram |
| [Slide](/engines/slide.md) | `@theokit/ui/slide` | Markdown + YAML frontmatter → themed 16:9 surface |
| [SlideDeck](/engines/slide-deck.md) | `@theokit/ui/slide-deck` | N slides → navigable, presenter-aware, printable deck |
| [Slide plugins](/engines/slide-plugins.md) | `@theokit/ui/slide/plugins/*` | Syntax highlighting, math, mermaid, emoji |
| [Slide authoring guide](/engines/slide-authoring-guide.md) | — | The grammar an LLM should emit, as a pasteable system prompt |

## What they have in common

Every engine is **view-only**. No editor, no toolbar, no undo stack. They consume tool-call
output — `{"type":"slide","markdown":"..."}` — and render it immediately, safely, and with a
consistent visual identity.

They are also **fail-soft by contract**. The parse pipeline never throws: it renders
something and reports problems in an `errors[]` array with a machine-readable code. That is
a deliberate design for agent surfaces, where the producer of the content is a model that
can read the error and reissue. A thrown exception teaches the model nothing; a
`BANNED_TAG` code teaches it exactly what to change.

## Roadmap

`Diagram` (a Mermaid-style DSL → SVG primitive reusing `dagre` or `elk` for layout) is an
Explorer-status RFC candidate. **Not implemented.** Any public surface must label it
Roadmap, never Available.
