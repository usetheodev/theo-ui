# Log

Newest first.

## 2026-08-17

**The cited commit no longer exists. Read this before following any `sources[].resource`.**

The repository history was rewritten on this date. Every path that had been deleted from the
working tree was purged from every tree in history, and 68 commits that existed only to
perform those deletions were pruned. `main`, `develop` and `workspace` were recreated from
the rewritten line.

Consequences for this bundle, stated plainly:

- Commit `94d9b118b4696882e414689677ac12234513730e` (`94d9b11`) **does not exist** in this
  repository any more. Neither does its rewritten equivalent hold the cited paths, because
  `docs/` and `.claude/knowledge-base/` were purged from every tree.
- The 84 `sources[].resource` entries across 58 concepts were relabelled from
  `git:94d9b11:<path>` to `archive:94d9b11:<path>`. The `git:` prefix promised a
  `git show` that now fails; `archive:` states what these are — a record of which file and
  which commit a concept was transcribed from, which OKF permits as a scope descriptor
  rather than a followable artifact.
- The **recovery instruction in the 2026-08-11 entry below is void.** `git show 94d9b11:<path>`
  cannot work. The material deliberately not absorbed (~28 plans, 11 edge-case reviews,
  the audit/grill/implementation/discovery work products, 8 baseline dumps, 2 announcements
  — 139 files) survives only in an offline archive taken before the rewrite:
  `local-all.bundle`, a full `git bundle` of every pre-rewrite ref, held outside this
  repository. Retrieval requires that bundle; it is not reachable from any remote ref.
- What this does **not** change: the absorbed knowledge. The concepts in this bundle are
  self-contained transcriptions — they do not read their sources at runtime, and no gate
  resolves a `sources[].resource`. `okf-validate --strict` stays conformant (56 concepts,
  0 errors, 0 warnings, 0 broken links, 0 orphans), because those citations were never
  markdown links.

The honest summary: the provenance trail still tells you where each concept came from, but
it is now a citation you must trust rather than one you can verify against this repository.

## 2026-08-11

**Creation.**

Created the `wiki/` bundle from the repository's `docs/` tree and `.claude/knowledge-base/`
tree, then removed both. 56 concepts across 9 sections, plus 10 navigation indexes.

**Bundle fingerprint at creation:** `94d9b118b4696882e414689677ac12234513730e`
(`94d9b11`, branch `workspace`). Every `sources[].resource` of the form
`archive:94d9b11:<path>` named a file that existed at that commit and no longer existed in
the working tree.

> **Superseded 2026-08-17.** That commit no longer exists — the history was rewritten and the
> cited trees were purged. The citations are now scope descriptors only. See the
> 2026-08-17 entry above before relying on anything in this section.

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

**Deliberately not absorbed** (spent process artifacts; readable at `94d9b11` when this entry
was written, and since 2026-08-17 only in the offline pre-rewrite bundle):

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
— anything the omitted files uniquely held is recoverable only from the offline pre-rewrite
bundle described in the 2026-08-17 entry. `git show 94d9b11:<path>` no longer works.

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
