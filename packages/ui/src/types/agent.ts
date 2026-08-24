import type { ReactNode } from "react";

export type AgentEventType =
  | "command"
  | "file_read"
  | "file_write"
  | "edit"
  | "lint"
  | "typecheck"
  | "build"
  | "tool";

export type AgentEventStatus = "pending" | "running" | "success" | "failed";

export interface AgentEvent {
  id: string;
  type: AgentEventType;
  label: string;
  /** File path when the event is file-related. */
  path?: string;
  /** Diff stats for edit/write events. */
  diff?: { added: number; removed: number };
  status: AgentEventStatus;
  timestamp?: string;
  /** Optional expandable detail (e.g. command output, diff snippet). */
  detail?: ReactNode;
}
