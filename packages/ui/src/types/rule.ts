import type { Mode } from "./mode.js";

/**
 * Rule — a user-authored behavior instruction injected into the system prompt.
 *
 * Equivalent to a single markdown file under `.claude/rules/` in Claude Code:
 * short imperative text the user writes once and the agent follows always.
 * Rules can be scoped (`global` = applies to every session; `project` = only
 * inside the current workspace) and toggled on/off without deletion.
 */

export type RuleScope = "global" | "project";
export type RuleState = "enabled" | "disabled";

export interface Rule {
  id: string;
  /** Short title shown in the list. */
  title: string;
  /** Markdown body — the actual instruction injected into the prompt. */
  body: string;
  /** Where this rule applies. */
  scope: RuleScope;
  /** Whether the rule is currently active. */
  state: RuleState;
  /** Optional tags for grouping ("testing", "style", "security"). */
  tags?: string[];
  /** Modes this rule applies to. Omit / empty = global (every mode). */
  modes?: Mode[];
  /** ISO timestamp / friendly label of last edit. */
  updatedAt?: string;
}
