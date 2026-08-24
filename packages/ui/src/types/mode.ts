/**
 * Mode — top-level density / domain the agent session is operating in.
 *
 * `chat`  — conversational Q&A, lean UI.
 * `code`  — code agent: read/plan/edit/verify inside the repo.
 * `infra` — operate the deployed system: metrics, deploys, logs, rollback.
 *
 * Used everywhere resources can be scoped per-mode (Skills, Agents, Rules,
 * SystemPrompt overrides, Sessions, …). `modes?: Mode[]` on a resource means
 * "only available in these modes"; omitting `modes` means "available
 * globally".
 */
export type Mode = "chat" | "code" | "infra";

export const ALL_MODES: ReadonlyArray<Mode> = ["chat", "code", "infra"];

/** Friendly label per mode — render in chips, headers, badges. */
export const MODE_LABEL: Record<Mode, string> = {
  chat: "Chat",
  code: "Code",
  infra: "Infra",
};
