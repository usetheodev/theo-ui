# Log

Newest first.

## 2026-08-11

**Creation.**

Created the `wiki/` bundle from the repository's `docs/` tree and `.claude/knowledge-base/`
tree, then removed both. 56 concepts across 9 sections, plus 10 navigation indexes.

**Bundle fingerprint at creation:** `94d9b118b4696882e414689677ac12234513730e`
(`94d9b11`, branch `workspace`). Every `sources[].resource` of the form
`git:94d9b11:<path>` names a file that exists at that commit and no longer exists in the
working tree.

### Crawl boundary — what was absorbed and what was not

This is the part a reader needs in order to trust the bundle. The source trees held roughly
**38,000 lines across 137 files**. The bundle does not contain all of it, and the split was
made deliberately.

**Absorbed in full** (the knowledge still governs the library):

| Source | Landed as |
| --- | --- |
| `docs/architecture.md` | [`/architecture/*`](/architecture/index.md), [`/registry/component-census.md`](/registry/component-census.md) |
| `docs/design-system.md` | [`/design-system/*`](/design-system/index.md) |
| `docs/quality-gates.md` | [`/quality-gates/*`](/quality-gates/index.md) |
| `docs/adr/0001`–`0009` | [`/decisions/adr-*`](/decisions/index.md) |
| `docs/rfcs/0001`–`0009` | [`/rfcs/*`](/rfcs/index.md) |
| `docs/slide-llm-guide.md` | [`/engines/slide-authoring-guide.md`](/engines/slide-authoring-guide.md) |
| `docs/migration/*` | [`/migrations/*`](/migrations/index.md) |
| `docs/audit/2026-05-decisions.md`, `docs/design-audit.md` | [`/history/*`](/history/index.md) |
| `docs/screens.md`, `docs/branch-protection.md` | [`/history/example-screens.md`](/history/example-screens.md), [`/quality-gates/branch-protection.md`](/quality-gates/branch-protection.md) |
| `.claude/knowledge-base/adrs/`, `decisions/` | [`/decisions/*`](/decisions/index.md) |
| `.claude/knowledge-base/pivot-roadmap.md`, `releases/` | [`/history/*`](/history/index.md) |
| `.claude/knowledge-base/architecture/` baselines | Measured figures cited inside the relevant concepts |

**Deliberately not absorbed** (spent process artifacts, still readable at `94d9b11`):

| Source | Volume | Why not |
| --- | --- | --- |
| `.claude/knowledge-base/plans/` | ~28 files, ~20,000 lines | Execution plans whose work has shipped. Their durable output — the ADRs they produced and the invariants they established — is in the concepts above. The step-by-step task lists describe work already done. |
| `.claude/knowledge-base/reviews/edge-cases/` | 11 files | Per-cycle edge-case reviews. The edge cases that changed a design (EC-1 specificity, EC-7 clamps, EC-12 listener cleanup, EC-15 WHCM collapse, and others) are named inside the concept they shaped. The remainder were closed and verified at the time. |
| `.claude/knowledge-base/audits/`, `grills/`, `implementations/`, `discoveries/` | ~20 files | Per-cycle work products. |
| `.claude/knowledge-base/baselines/` | 8 `.txt` dumps | Raw `dist-tree` and size snapshots from 2026-05. Superseded by the current bundle baseline JSON. |
| `docs/announcements/` | 2 files | Point-in-time release announcements, superseded by `CHANGELOG.md`. |
| `docs/audit/2026-05-screens-history.md` | 353 lines | Already marked historical and superseded by `docs/screens.md`, which was itself absorbed. |

**Not absorbed and worth knowing:** none of the omitted material was found to contain a rule
or invariant absent from the concepts. That is a judgment made while reading, not a guarantee
— anything the omitted files uniquely held is recoverable with
`git show 94d9b11:<path>`.

### Load-bearing wiring

Three build scripts read files in this bundle. They were re-pointed from `docs/` in the same
change:

| Consumer | Reads | Was |
| --- | --- | --- |
| `validateArchitectureCensus` | `/registry/component-census.md` | `docs/architecture.md` |
| `validateDocsTypography` | `/design-system/typography.md` | `docs/design-system.md` |
| `validateScriptsAndCi` | `/quality-gates/index.md` | `docs/quality-gates.md` |
| `pnpm sync:readme` | writes `/registry/component-census.md` | wrote `docs/architecture.md` |

Deleting or renaming any of those three files breaks `pnpm quality:gates`.

### Trust posture

Every concept carries `generated: { by: "claude-code/opus-5" }`. **No concept carries a
`verified` event**, because no human has reviewed the transcription. Concepts are
faithful-but-unreviewed. Adding `verified: { by: "human:<id>", at: … }` to a concept after a
real review is the intended next step, and materially changing a concept afterwards drops
that verification.
