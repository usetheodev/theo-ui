export type TaskStatus =
  | "idle"
  | "permission_required"
  | "starting"
  | "running"
  | "verifying"
  | "completed"
  | "failed";

export type TaskStepStatus = "pending" | "running" | "done" | "skipped";

export interface TaskStep {
  id: string;
  label: string;
  status: TaskStepStatus;
  /** 0..1 progress for in-flight steps. */
  progress?: number;
}
