# ROADMAP — `@theokit/ui`

> Per-repo macro roadmap for the post-v1.0 (post-pivot) era. Created 2026-07-07 to enable
> `/roadmap-feature`-driven milestone tracking (`rules/cycle-roadmap.md`). The AI-exclusive
> pivot itself (M-A..M-E) was a **two-repo** effort tracked hand-written in
> `.claude/knowledge-base/pivot-roadmap.md` — all five milestones shipped as
> `@theokit/ui@1.0.0` (2026-07-03). It is recorded here as M0 for continuity; new
> milestones append as M1, M2, … via `/roadmap-feature`.

## M0 — [x] AI-exclusive pivot (v1.0.0)

**Objective:** narrow `@theokit/ui` to the 82-component AI-exclusive library (coding
agents + chat); extract the 54 generic/cloud-ops components + Violet Forge foundation to
`@usetheo/ui` and depend on it; breaking major + codemod; AI-native repositioning.

**Definition of done:** shipped — see `.claude/knowledge-base/pivot-roadmap.md` for the
full per-milestone record (M-A classification manifest, M-B `@usetheo/ui` bootstrap,
M-C dependency cutover, M-D registry split, M-E narrative repositioning). Published as
npm `@theokit/ui@1.0.0` + `@usetheo/ui@0.14.0`.

**Dependencies:** —

---

### Explicitly out of scope

- **Generic primitives / auth / cloud-ops components** — `@usetheo/ui` territory
  (two-scope split locked 2026-07-06; see CLAUDE.md § Locked names).
- **Editor capabilities for the view-only engines** — Whiteboard / Slide / SlideDeck are
  render engines (JSON/Markdown → surface), not editors (no toolbar / selection / undo).
- **Runtime coupling to any specific SDK** — the UI ↔ Harness bridge stays structural
  (`useAgentStream` consumes a structural `SdkStreamMessage`); `@theokit/sdk` remains a
  devDependency only.

---

## M1 — [ ] Voice-agent surface cluster

> Added 2026-07-07 by `/roadmap-feature` (slug: `voice-agent-surface`). See CHANGELOG `[Unreleased] § Added`.

**Objective:** ship the 5 voice-surface components (`speech-input`, `transcription`,
`audio-player`, `mic-selector`, `voice-selector`) — closing the biggest SOTA gap vs
Vercel AI Elements — as UI-only components with structural contracts (no STT/TTS
provider coupling), validated in both first-party consumers (TheoCode Desktop + web chat).

**Definition of done:**

- [ ] Design RFC approved in `docs/rfcs/` (scope, component API, peer-dep strategy, a11y contract) — implementation MUST NOT start before the RFC is merged.
- [ ] 5 components shipped — `speech-input`, `transcription`, `audio-player`, `mic-selector`, `voice-selector` — each with test + story + registry entry.
- [ ] `pnpm quality:gates` green (incl. a11y + bundle — no barrel bloat; optional peer-deps if an audio dep is needed).
- [ ] Real-consumer validation: working in TheoCode Desktop (Tauri) AND a web surface — dogfood evidence recorded.
- [ ] README/registry updated; CHANGELOG `[Unreleased]` entries present.

**Dependencies:** M0 (satisfied) + design RFC approved (gate inside this milestone — first DoD bullet).

**Top risks (new — pre-existing risks documented elsewhere in roadmap):**

1. **Platform fragmentation** — `MediaRecorder`/`getUserMedia`/`AudioContext` differ across browsers and the Tauri web view (Desktop mic permissions go through the OS). A component green in Ladle can fail in the real consumer — mitigated by the dogfood DoD bullet (Desktop AND web).
2. **Scope creep into STT/TTS provider coupling** — the library stays UI-only (visual states, waveform, transcript display) with structural contracts, mirroring the `useAgentStream` zero-runtime-coupling precedent.

**Why now (from grill Q1):**

Concrete first-party consumers are asking for it — TheoCode Desktop (Tauri + web view)
and the Theo web chat surface. The 2026-07-07 gap analysis (our 82 components vs
ai-elements' 48) surfaced voice as the largest missing cluster; consumer demand makes it
the first post-pivot milestone rather than a someday item.

---

## M2 — [ ] Code-agent Builder gap components

> Added 2026-07-16 by `/roadmap-feature` (slug: `code-agent-builder-parity`). See CHANGELOG `[Unreleased] § Added`. Source: cross-validation `theokit-studio/builder` × `@theokit/ui` (grill: `.claude/knowledge-base/grills/code-agent-builder-parity-feature-grill.md`).

**Objective:** implement the agent-surface components the code-agent **Builder** (theokit-studio, `packages/studio/src/pages/builder/`) hand-rolls today but `@theokit/ui` does not yet provide — so the Builder can adopt the library **keeping EXACTLY the same experience**. The Builder's markup / tokens / behavior is the fidelity spec.

**Definition of done:**

- [ ] 4 new components shipped — `code-review-panel` (composite: file tree + multi-file diff + toolbar with aggregate counters + Commit), `approval-mode-selector` (3-state ask / auto-edits / read-only), `work-log` ("Worked for X" collapsible + steps), and a `model` + `effort` picker (compose `model-selector` + `thinking-level-selector` into the Builder's single dropdown) — each with test + story + registry entry.
- [ ] Fidelity: each reproduces the Builder's DOM / design tokens / behavior (`review.tsx`, `session-view.tsx`, `model-picker.tsx`); validated by a Ladle story + preserved `data-testid` semantics.
- [ ] `pnpm quality:gates` green (incl. a11y + bundle — heavy composites go to a subpath if the baseline blows); the 82 existing components untouched.
- [ ] README/registry updated; CHANGELOG `[Unreleased]` entries present.

**Dependencies:** M0 (satisfied).

**Top risks (new):**

1. **"Exactly the same experience" fidelity** — a component that renders slightly differently breaks the contract. Mitigated by moving the Builder's exact markup/tokens into the components (parametrized) and validating before/after.
2. **`code-review-panel` bundle weight** — a multi-file diff panel may blow the `quality:bundle` baseline; mitigated by subpath isolation if needed.

**Why now:** the 2026-07-16 cross-validation (`theokit-studio/builder` × `@theokit/ui`) found 0% adoption of `@theokit/ui` in the Builder despite `@theokit/ui@1.0.4` being an installed dependency, with ~11 hand-rolled surfaces and 2-3 real gaps. `@theokit/ui` is declaredly the library for code-agent surfaces — the Builder is the proof consumer.

---

## M3 — [ ] Code-agent Builder parity extensions + publish

> Added 2026-07-16 by `/roadmap-feature` (slug: `code-agent-builder-parity`). See CHANGELOG `[Unreleased] § Added`. Same grill as M2.

**Objective:** extend the existing `@theokit/ui` components so they cover 1:1 the remaining Builder surfaces, then publish the minor that unblocks the studio Fase B (substituting the Builder's hand-rolled UI).

**Definition of done:**

- [ ] 4 extensions shipped — `diff-viewer` (accept a unified `diff: string` via a `parseUnifiedDiff → hunks` helper, in addition to structured hunks), `created-files-card` ("edited" semantics: per-file +/- , Review + Undo actions), `chat-message` (bubble user / plain assistant variants for the Builder thread), `intent-selector` (2×2 tiles with a colored icon for build intents) — each with test + story + updated registry, **no breaking change** to the 82.
- [ ] Fidelity validated against the Builder (`session-view.tsx`, `review.tsx`, `index.tsx`).
- [ ] `pnpm quality:gates` green.
- [ ] `@theokit/ui` published to npm (minor) carrying M2 + M3; CHANGELOG released entry.
- [ ] README/registry updated.

**Dependencies:** M2.

**Top risks (new):**

1. **Breaking the 82 via extension** — new props/variants must be additive; mitigated by additive-only API + `pnpm quality:gates`.
2. **Publish coordination** — the studio consumes `@theokit/ui` from npm (separate repo, no workspace link), so the minor must be published and version-bumped before the studio Fase B can integrate.

**Why now:** prerequisite of the studio Fase B — the studio Builder consumes `@theokit/ui` as a published npm package, so the parity components must ship on npm before the hand-rolled UI can be replaced.

---

## State-of-the-art references

| Peer | Path | License | Supports milestone(s) |
| --- | --- | --- | --- |
| Vercel AI Elements | `referencia/ai-elements/` (also `.claude/knowledge-base/references/ai-elements/`) | Apache-2.0 | M0 (gap analysis 2026-07-07) |
| shadcn/ui | `referencia/ui/` (also `.claude/knowledge-base/references/shadcn-ui/`) | MIT | M0 (registry compatibility) |
| Excalidraw | `referencia/excalidraw/` | MIT | M0 (Whiteboard engine, RFC 0001) |
| Marp | `referencia/marp/` | MIT | M0 (Slide/SlideDeck engines, RFCs 0002-0004) |
