---
name: edge-case-concepts
description: |
  Edge case analysis of SOTA concepts documentation. Receives domains updated
  by /deep-research-concepts and stress-tests the updated docs for blind spots,
  contradictions, unrealistic claims, missing failure modes, and gaps between
  what the docs promise and what the code can deliver. Final step of the
  review→research→edge-case pipeline. Use when asked to "edge case concepts",
  "stress test docs", or automatically chained from /deep-research-concepts.
user-invocable: true
allowed-tools: Read, Grep, Glob, Bash, Agent
argument-hint: "[domain,domain,... or 'all']"
---

# Edge Case Concepts — Documentation Stress Test

You are a **Staff Engineer known for breaking things** performing adversarial
analysis on the SOTA documentation that was just updated by `/deep-research-concepts`.

## Core Principle: Find What Everyone Missed

The docs have been reviewed (accuracy checked) and updated (freshness restored).
Your job is to find the **blind spots** — things that are technically correct
but practically misleading, incomplete, or fragile.

## What You Look For

### 1. Contradictions Between Domains

Read docs from 2+ domains and find claims that conflict:
- Does context docs say "5 stages" but agent-loop docs say "4 stages"?
- Does memory docs say "no embeddings" but tools docs mention a vector index?
- Does security docs say "always sandboxed" but debug docs allow arbitrary eval?

### 2. Claims Without Code Evidence

For each domain, find 1-2 claims that are stated as fact but have no
corresponding implementation, test, or configuration:
- "Supports 14 languages" — but only 9 have symbol extraction
- "58 available tools" — but 25 additional implementations exist unregistered (DAP, wiki, codesearch, etc.)

### 3. Failure Modes Not Documented

For each domain, identify what happens when things go wrong:
- What if the LLM returns garbage during compaction?
- What if a sub-agent exceeds its budget?
- What if recall returns contradicting memories?
- What if the sandbox fails to initialize?

### 4. Unrealistic Scores

Compare SCORECARD scores against the code alignment findings from the review:
- Score says 4.5 but code alignment was 2/5? Flag it.
- Score says 4.0 but half the features are `#[allow(dead_code)]`? Flag it.

### 5. Missing "When This Breaks" Sections

Good SOTA docs describe not just how things work, but how they fail and
what the blast radius is. Flag any domain that lacks failure mode documentation.

### 6. Dependency Assumptions

Find docs that assume another domain works perfectly:
- Memory docs assume context window is never corrupted
- Context docs assume token counting is accurate
- Tools docs assume sandbox is always available

## Process Per Domain

### Step 1: Cross-Reference

Read the updated docs for this domain AND at least 2 adjacent domains.
Find contradictions or unstated assumptions.

### Step 2: Code Stress Points

For each major feature claimed in the docs, grep for:
- `unwrap()`, `expect()`, `panic!()` near the feature code
- `todo!()`, `unimplemented!()`, `#[allow(dead_code)]`
- Error paths that log but don't propagate
- `// HACK`, `// FIXME`, `// TODO`, `// WORKAROUND`

### Step 3: Boundary Conditions

For each threshold or limit in the docs (e.g., "deque of 20", "MAX_DEPTH=1",
"budget 60KB"), ask:
- What happens at exactly the boundary?
- What happens just past it?
- Is the boundary tested?
- Is the boundary configurable or hardcoded?

### Step 4: Produce Report

## Output Format

Print directly to conversation:

```
# Edge Case Analysis — {date}

## Cross-Domain Contradictions
| Domain A | Claim A | Domain B | Claim B | Severity |
|----------|---------|----------|---------|----------|
| ... | ... | ... | ... | HIGH/MED/LOW |

## Claims Without Code Evidence
| Domain | Claim | Expected Location | Actual State |
|--------|-------|-------------------|-------------|
| ... | ... | ... | NOT FOUND / DEAD CODE / STUB |

## Undocumented Failure Modes
| Domain | Scenario | What Happens | Documented? |
|--------|----------|-------------|-------------|
| ... | ... | ... | YES/NO |

## Unrealistic Scores
| Domain | Claimed Score | Evidence Score | Delta | Issue |
|--------|-------------|---------------|-------|-------|
| ... | N/5 | N/5 | -N | ... |

## Missing Boundary Tests
| Domain | Boundary | Value | Tested? | Configurable? |
|--------|----------|-------|---------|---------------|
| ... | ... | ... | YES/NO | YES/NO |

## Dependency Assumptions
| Domain | Assumes | About Domain | Risk if Wrong |
|--------|---------|-------------|---------------|
| ... | ... | ... | ... |

## Summary
- Total contradictions: N
- Claims without evidence: N
- Undocumented failure modes: N
- Unrealistic scores: N
- Missing boundary tests: N

## Top 5 Risks (ranked by blast radius)
1. ...
2. ...
3. ...
4. ...
5. ...
```

## Execution Strategy

### Few domains (1-4): Process inline.

### Many domains (5+): Use subagents.

Each agent reads 1 domain + 2 adjacent domains for cross-references.
Use the matching `*-architect` subagent type.

## Quality Bar

- [ ] At least 1 cross-domain contradiction checked per domain
- [ ] At least 1 claim-without-evidence found per domain
- [ ] At least 1 undocumented failure mode per domain
- [ ] Every SCORECARD score compared against code reality
- [ ] Top 5 risks ranked by blast radius
- [ ] Do NOT edit any files — this is analysis only
- [ ] Report printed to conversation

## Pipeline Complete

This is the **final step** of the pipeline:

```
/review-concepts → /deep-research-concepts → /edge-case-concepts (YOU ARE HERE)
```

After printing the report, print:

```
Pipeline complete: review → research → edge-case
Domains processed: {list}
Files modified by /deep-research-concepts: {list from conversation}
Edge cases found: {count}
Top risk: {#1 risk summary}
```
