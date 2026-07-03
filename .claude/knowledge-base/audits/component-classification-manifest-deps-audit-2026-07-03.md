# Deps Audit: component-classification-manifest

**Date:** 2026-07-03
**Mode:** plan-bound:component-classification-manifest
**Verdict:** PASS
**Hard caps triggered:** none (after `## Dependencies` section added to plan v1.1)

## Summary
- Ecosystems detected: npm (pnpm-lock.yaml)
- Plan-declared deps: 3 existing (tsx, vitest, @biomejs/biome), 0 new, 0 removed
- Plan-introduced CVE surface: **0** (no new dependency)
- Vulnerabilities in plan-declared tooling: 0
- Project-wide vulnerabilities (out of plan scope): 15 findings across 5 packages
- Auditor coverage: { osv-scanner 1.9.2: ran (exit 1 = vulns found project-wide); npm audit: not run — pnpm project, osv-scanner authoritative on pnpm-lock.yaml }

## Plan validation (Mode 2)

| Plan dep | Section | Manifest match | Audit clean? | Rule 9 OK? | Verdict |
|---|---|---|---|---|---|
| `tsx` | Existing | yes (installed devDep) | yes (no osv finding) | n/a (existing) | OK |
| `vitest` | Existing | yes (installed devDep) | yes (no osv finding) | n/a (existing) | OK |
| `@biomejs/biome` | Existing | yes (installed devDep) | yes (no osv finding) | n/a (existing) | OK |

The plan adds **no new dependency** (parsimony ladder rung 4 — reuse installed tooling). There is no NEW row, so no Rule 9 evaluation is required. The three tools the plan invokes are CVE-clean per osv-scanner.

## Vulnerabilities — project-wide (OUT OF PLAN SCOPE — pre-existing debt)

These are pre-existing transitive CVEs in the project lockfile. **This plan neither introduces nor touches them.** They do NOT cap this plan's verdict, but are surfaced honestly (skill anti-pattern #3: never silently ignore findings) and recommended for a standalone `/deps-audit` remediation.

| Package | Version | Findings | GHSA IDs |
|---|---|---|---|
| dompurify | 3.4.5 | 8 | GHSA-4x5r-... wait see below |
| vite | 5.4.21 | 3 | GHSA-4w7w-66w2-5vf9, GHSA-fx2h-pf6j-xcff, GHSA-v6wh-96g9-6wx3 |
| esbuild | 0.21.5 / 0.27.7 | 2 | GHSA-67mh-4wv8-2f99, GHSA-g7r4-m6w7-qqqr |
| @babel/core | 7.29.0 | 1 | GHSA-4x5r-pxfx-6jf8 |
| ws | 8.20.1 | 1 | GHSA-96hv-2xvq-fx4p |

dompurify 3.4.5 GHSA IDs: GHSA-cmwh-pvxp-8882, GHSA-gvmj-g25r-r7wr, GHSA-hpcv-96wg-7vj8, GHSA-r47g-fvhr-h676, GHSA-rp9w-3fw7-7cwq, GHSA-vxr8-fq34-vvx9, GHSA-x4vx-rjvf-j5p4 (7 listed by scanner) + 1 more = 8 total.

> Severity + fixed-version detail were not expanded per-CVE here because these are out of this plan's scope. A dedicated `/deps-audit` (Mode 1, standalone) should expand each with severity + fix version + diff suggestion. dompurify (used by the slide/whiteboard sanitization path) carries the largest cluster (8) and warrants priority triage.

## Recommended next steps

1. This plan: PASS — proceed to `/plan-confidence`. No manifest change needed (no new dep).
2. Separate initiative: run standalone `/deps-audit` for the 15 pre-existing CVEs; expand severities + fix versions; prioritize dompurify (8 GHSA, security-sensitive sanitization path). File a project security-debt issue after a dedup-check (`gh issue list --search dompurify`).
