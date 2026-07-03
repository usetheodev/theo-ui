# M-E Evidence & Benchmark — AI-native repositioning

**Date:** 2026-07-03
**Repo:** theo-ui @ develop
**Purpose:** hard evidence that `@theokit/ui`'s public narrative was reframed AI-native (dropping the co-equal "cloud dashboards" wedge), with honest counts and zero references to moved components as theo-ui exports. This is a docs/narrative milestone — the "benchmark" is measured doc-consistency (gates green) + the narrative delta, NOT a throughput number (that would be theatre for a copy change).

## 1. Gates (measured, all green)

| Gate | Command | Result |
|---|---|---|
| Structure (README ↔ exports + docs typography drift) | `pnpm quality:structure` | **PASS** |
| README sync (counts/catalog/census) | `pnpm sync:readme` | **99 components (59P + 40C), 1131 tests, 96 registry items, 7 screens** |
| Public-copy lint (banned framings) | `bash .claude/hooks/public-copy-lint.sh README.md` | **clean (exit 0)** |
| Typecheck (sanity — docs edits don't touch code) | `pnpm typecheck` | **0 errors** |
| a11y (used to correct the stale story count) | `pnpm quality:a11y` | **171 passed** |
| Plan confidence | `run_structural.py m-e-…-plan.md` | **SHIPPABLE_WITH_CAVEATS (70)** — completude 100 %, risco 98 % (2 soft caps: vague-AC heuristic + concurrency false-positive on a docs-only plan) |

## 2. The reframe (verified)

| Surface | Before | After |
|---|---|---|
| README HERO (README.md:9) | "built for AI agent surfaces **and cloud dashboards**. **153 components**" | "built for **AI-agent surfaces — coding agents and chat**. **99 components**" |
| README "Built for PaaS" bullet (:38) | enumerated project cards / deployment rows / env var editors / … as theo-ui | reframed to **"Built on `@usetheo/ui`"** — those moved; pointer to the sibling package |
| README "What you'd build" (:63–66) | "cloud dashboard" + "Onboarding & auth surfaces" bullets listing moved components | dropped; kept AI bullets + a blockquote pointing generic/auth/cloud-ops to `@usetheo/ui` |
| README Option B example (:103–104) | `.../r/button.json`, `.../r/deployment-row.json` (both moved) | `.../r/agent-event.json`, `.../r/tool-call.json` (AI, kept) |
| README Status (:344) | "153 components, 1,513 tests, … 151 Ladle stories" | "**99 components, 1,131 tests**, … **171 vitest-axe checks**" |
| `package.json` description | "**framework-agnostic** … AI-agent interfaces, **cloud dashboards, and developer-tooling** surfaces" | "built for **AI-agent surfaces (coding agents and chat)**. Generic, auth, and cloud-ops primitives live in **@usetheo/ui**" |
| `CLAUDE.md` §"What this project is" (:11) | "**153 components** (99 primitive + 36 composite) … AI agent surfaces and cloud dashboards" | "**99 components** (59 primitive + 40 composite) … AI-agent surfaces … layer moved to `@usetheo/ui`" |
| `CLAUDE.md` narrative anchor (:53) | "**Built for AI agents + cloud dashboards** — the categorical wedge" (LOCKED) | "**Built for AI-agent surfaces (coding agents + chat)**" + dated strategic-review note (owner's pivot = the review; ADR D1) |
| `docs/architecture.md` | exports-map + import examples used `button` / `deployment-row` (moved); stale Notes on Sidebar/Card/Badge subparts + `DeploymentStatus` | examples use `agent-event` / `tool-call` / `chat-message` (kept); Notes rewritten to `ChatMessage` flat-export family + generic type-import tolerance |
| `docs/quality-gates.md` | "Theo UI serves **two product surfaces**: AI coworker + **PaaS components**"; "Gate 8 — **PaaS Component Value**" gating `RollbackUI`/`DomainConfig`/`PreviewEnvCard`; `CommandPalette` command-surface rule | "serves **AI-agent surfaces**"; **Gate 8 reframed** "Cloud-ops … now in `@usetheo/ui`"; `CommandPalette` → `MentionMenu` (kept) |
| `CLAUDE.md` Relationship table (:66) | Runtime row lists 8 moved cloud-ops as `@theokit/ui` PaaS-shaped primitives | only `BuildLogStream` stays; the 7 moved named as `@usetheo/ui` |
| `SECURITY.md` (:77-79) | `safeHref()` users named as moved `ProjectCard`/`PreviewEnvCard` | named as kept chat-message parts `SourceUrlPart`/`FilePart` (verified via `grep safeHref src/components` → `chat-message/parts/{source,file}-part.tsx`) |
| `CONTRIBUTING.md` (:54,:177) | forbidden-cross-import example + install example used moved `Button`/`Badge`/`Card`/`Dialog` | kept `CostMeter`/`ModelCard`/`AgentEvent` |
| `docs/screens.md` (:3-5) | screens "assembled from `@theokit/ui`" — moved shell components (`Sidebar`/`TopNav`/`LoginSplit`) had no provenance | added note: shells also compose generic/auth primitives **from `@usetheo/ui`** |

## 3. Count reconciliation (honesty note)

Three different numbers were in play; the reframe uses the gate-authoritative one:

- **82** = component *directories* (60 primitives + 22 composites) — the M-C dir count.
- **99** = exported *components* / subpaths — what `sync:readme` computes and the `components-99` badge shows; `quality:structure` enforces README ↔ exports against this. 153 (pre-pivot) − 54 moved = 99.
- The HERO said a stale **153**; the badge already said **99**. The reframe makes the prose match the badge/gate → **99** everywhere. The M-E plan Goal said "82"; corrected to 99 here because 99 is the public/gate number (documented, not silently swapped).

## 4. Grep-proof — 0 moved components as theo-ui exports (the Goal metric)

Two complementary checks. **Note (honesty):** the first pass of this bundle only ran the *phrase* + package.json-subpath checks below; the independent review round (§9) correctly flagged that a proper proof must also grep the **moved PascalCase component names** across the prose. That third check was then run and its hits adjudicated.

```
# (a) Programmatic — package.json exports (auto-generated from src/index.ts; sync:exports + quality:structure enforce it):
export subpaths: 100   moved slugs exported: NONE     (set-intersection over the 54 moved slugs)

# (b) Dual-wedge positioning phrases in README/CLAUDE.md/package.json/docs:
grep -niE "for AI agents and cloud|cloud dashboards|built for PaaS|two product surfaces|framework-agnostic|\b153\b" → 0 hits
  (only match is the intentional dated note in CLAUDE.md:53 explaining the retired "cloud dashboards" wedge)

# (c) Moved PascalCase component names (54, PascalCase) across the positioning-scope files
#     (README, package.json, CLAUDE.md, SECURITY.md, CONTRIBUTING.md, docs/{architecture,quality-gates,screens,design-system}.md):
13 raw hits — all adjudicated:
  - 6 legit @usetheo/ui pointers (CLAUDE.md:66 Relationship row, docs/quality-gates.md:246-247 Gate 8, docs/architecture.md:190 Toaster row, docs/screens.md:4-5 provenance note)
  - 2 Ladle-only example-screen composition descriptions (screens.md:12,14 — provenance established by the note at :4-5; screens are NOT exported)
  - 1 English-word false positive ("Progress is inspectable", quality-gates.md:226)
  - 4 shared Violet-Forge design-token illustrations (design-system.md:169,173,263,321 — "Card padding", "Button height", "Card entrance", "Dialog overlay" — token values, not component-export claims)
  => 0 genuine "moved component presented as a @theokit/ui export/feature"
```

Moved components (`DeploymentRow`, `EnvVarEditor`, `DomainConfig`, `RollbackUI`, `PreviewEnvCard`, `ProjectCard`, `MetricsPanel`, `Button`, `Card`, `LoginSplit`, `Toaster`, `CommandPalette`, …) now appear in the copy **only** as pointers to `@usetheo/ui`, never as `@theokit/ui` exports or examples.

## 5. Benchmark (narrative delta — appropriate to a copy milestone)

```
Positioning wedge:        "AI agents + cloud dashboards" (dual)  →  "AI-agent surfaces: coding agents + chat" (single)
Public component count:    153 (stale) / 99 (badge)              →  99 everywhere (consistent)
Test count claim:          1,513 (stale)                         →  1,131 (sync-authoritative)
a11y claim:                151 stories (stale)                   →  171 vitest-axe checks (measured)
Files reframed:            7  (README.md, package.json, CLAUDE.md, docs/architecture.md, docs/quality-gates.md, + plan + roadmap)
Moved-as-export refs:      several (button.json, deployment-row.json, exports-map, PaaS bullets)  →  0 (grep + programmatic proof)
Registry-example targets:  button / deployment-row (moved)       →  agent-event / tool-call (kept AI)
```

## 6. DoD checklist (plan m-e v1.0)

- [x] README HERO reframed AI-native (dropped co-equal cloud-dashboards; 99; @usetheo/ui pointer)
- [x] `package.json` description reframed AI-native (dropped "framework-agnostic"/"cloud dashboards")
- [x] `CLAUDE.md` §"What this project is" + narrative anchor updated + ADR/strategic-review note (D1)
- [x] `docs/` drift reconciled (architecture.md exports/notes, quality-gates.md dual-surface framing)
- [x] 0 references to moved components as theo-ui exports (grep-proof + programmatic package.json check)
- [x] `pnpm quality:structure` exit 0; public-copy lint exit 0
- [x] counts corrected to 99 (sync:readme authoritative); tests 1131; a11y 171
- [x] benchmark = narrative delta recorded (§5)
- [x] CHANGELOG `[Unreleased] § Changed` entry added
- [x] pivot-roadmap M-E → `[x]` DONE
- [x] committed locally on develop (single M-E commit; NOT released — release policy: whole pivot ships at end-of-roadmap)

## 7. Honesty notes

- **Locked-wedge change is authorized, not silent.** CLAUDE.md flags the "AI agents + cloud dashboards" anchor as requiring strategic review. The owner's explicit pivot decision (M-A..M-E, recorded in the pivot roadmap + memory) IS that review; the change carries a dated in-file note + ADR D1 rationale. Root CLAUDE.md cross-project anchor "UI pillar of Theo" is unchanged.
- **`docs/design-audit.md` intentionally untouched.** Its "PaaS"/"cards de projeto" references describe the *Vercel* design extraction (reference/exploration doc, technical-direct scope per `public-copy.md`), not `@theokit/ui` positioning.
- **99 vs 82.** The plan Goal said 82 (dir count); the reframe uses 99 (export/badge/gate count) and documents why (§3). Not a silent swap.
- **No code changed.** typecheck 0 confirms the docs edits are inert to the build.

## 9. Independent review round (2 agents, fresh eyes) — findings + resolution

Two independent read-only reviewers were spawned (cross-validation of plan↔impl + adversarial positioning/honesty audit). Both correctly caught that the **first** reframe pass was incomplete in files the bundle claimed it had reconciled — the M-B lesson (no false completion). All were fixed before this final verdict:

| Sev | Finding | Resolution |
|---|---|---|
| HIGH | `CLAUDE.md:66` Relationship table listed 7 moved cloud-ops as `@theokit/ui` primitives | Reframed — only `BuildLogStream` stays; 7 named as moved to `@usetheo/ui` |
| HIGH | `docs/quality-gates.md` Gate 8 "PaaS Component Value" + moved `RollbackUI`/`DomainConfig`/`PreviewEnvCard`/`CommandPalette` | Gate 8 reframed → "now in `@usetheo/ui`"; `CommandPalette` → `MentionMenu`; "both AI coworker and PaaS" → AI-agent |
| MEDIUM | `docs/architecture.md` taxonomy/how-to examples used moved `Button`/`Badge`/`Card`/`DeploymentRow`/`Toaster`/`Card.Header` | Swapped to kept `AgentEvent`/`CostMeter`/`ModelCard`/`ChatMessage`; Toaster row noted as `@usetheo/ui`-sourced |
| MEDIUM | `SECURITY.md` named moved `ProjectCard`/`PreviewEnvCard` as URL-rendering attack surface | Repointed to the kept, verified `SourceUrlPart`/`FilePart` |
| MEDIUM | `README.md:49,51` comparison cells said "Yes" for generic/cloud-ops rows | Changed to "Via `@usetheo/ui`" |
| LOW | `CONTRIBUTING.md` import/forbidden examples used moved components | Swapped to kept components |
| LOW | `docs/screens.md` moved shell components lacked provenance | Added `@usetheo/ui` provenance note |
| INFO | Historical docs (`docs/rfcs/*`, `docs/announcements/*`, `docs/adr/*`, `docs/audit/*`, `docs/migration/hsl-to-oklch.md`) name pre-pivot components | **Left by design** — dated records, technical-direct/historical scope (`public-copy.md` §1 excludes them, same class as the CHANGELOG's own M-C `Removed` entry). |
| BLOCKER | (cross-val) M-E was uncommitted while an earlier draft ticked "committed" | Corrected the claim; the single M-E commit is the final step of this milestone (below). |
| META | (adversarial) the bundle's "0 references" claim was based only on phrase+subpath greps, not moved PascalCase names | §4 rewritten with the proper PascalCase check (c) + adjudication; claim now matches what was actually verified. |

After the fixes, all gates re-ran green (quality:structure PASS, public-copy README+CONTRIBUTING clean, typecheck 0) and check (c) shows 0 genuine moved-as-export references.

## 8. Verdict

**READY_TO_MERGE (narrative milestone) — after the review round.** The M-E Goal metric is met: `quality:structure` + public-copy lint both exit 0, and there are 0 references to moved components as theo-ui exports (grep + programmatic proof). The locked wedge change is authorized and documented. The pivot roadmap M-A..M-E is complete — eligible for the single end-of-roadmap `/release` (which additionally swaps `@usetheo/ui: file:../usetheo-ui` → `^0.1.0`, publishes `@usetheo/ui`, and deploys both gh-pages registries — the documented release-time steps).
