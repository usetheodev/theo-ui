export type PermissionOperation = "read" | "write" | "delete";
export type PermissionDecision = "denied" | "allowed_once" | "always_allowed";

export interface PermissionRequest {
  /** Absolute path to the resource (file or folder). */
  path: string;
  /** Operations the agent wants to perform on the resource. */
  operations: PermissionOperation[];
}
