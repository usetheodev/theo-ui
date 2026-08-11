# Migrations

Consumer-facing upgrade guides. Each states what breaks, what is optional, and what
requires no action at all.

| Guide | From → to | Shape |
| --- | --- | --- |
| [HSL → OKLCH](/migrations/hsl-to-oklch.md) | 0.13.0 → next | Mostly automatic. Pre-built themes need nothing; raw `Theme` authors must add 8 keys. |
| [v1 `@usetheo/ui` split](/migrations/v1-usetheo-ui-split.md) | 0.x → 1.0.0 | **Breaking major.** 54 components moved to a separate package. A codemod ships with the release. |

## The convention

A migration guide here always opens with a table of **who has to do what**, so a reader can
find their own row and stop. "Nothing — runtime cascade unchanged" is a legitimate and
common answer, and saying it explicitly is more useful than a guide that implies everyone
must act.

Every guide also names its **rollback path**. Both migrations above are single npm version
cuts with no data migration, which is what makes rollback a pin rather than a project.
