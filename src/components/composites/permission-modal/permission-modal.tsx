import { AlertTriangle, FolderOpen, ShieldAlert } from "lucide-react";
import type { ReactNode } from "react";
import type {
  PermissionDecision,
  PermissionOperation,
  PermissionRequest,
} from "../../../types/permission.js";
import { Button } from "../../primitives/button/button.js";
import { Dialog } from "../../primitives/dialog/dialog.js";

/**
 * Friendly operation labels used by the default copy. Override with the
 * `operationLabels` prop to localize or rephrase per project.
 */
export const defaultOperationLabels: Record<PermissionOperation, string> = {
  read: "read",
  write: "edit",
  delete: "permanently delete",
};

interface PermissionModalLabels {
  /** "Cancel" button. */
  cancel: ReactNode;
  /** "Always allow" tertiary button. */
  always: ReactNode;
  /** "Allow once" primary button. */
  allow: ReactNode;
  /** Inline label rendered before the operation list inside the body card. */
  requestedOps: ReactNode;
}

const defaultLabels: PermissionModalLabels = {
  cancel: "Cancel",
  always: "Always allow",
  allow: "Allow once",
  requestedOps: "Requested operations:",
};

interface PermissionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  request: PermissionRequest;
  /**
   * Fires when the user picks a decision. The modal does NOT auto-close;
   * caller decides whether the decision should dismiss the modal.
   */
  onDecide: (decision: PermissionDecision) => void;
  /** Override the modal title. Defaults to "Allow Theo to {ops} files in {path}?". */
  title?: ReactNode;
  /** Override the modal description (body lead text). */
  description?: ReactNode;
  /** Override the verb used for each operation in the default copy. */
  operationLabels?: Partial<Record<PermissionOperation, string>>;
  /** Override button text + inline labels. Useful for i18n. */
  labels?: Partial<PermissionModalLabels>;
}

/**
 * PermissionModal — local-files access prompt built on Dialog.
 *
 * Three actions: Cancel (denied), Always allow, Allow once. Per WIREMOCKS §5,
 * the path is shown in the title (not hidden in body) and destructive
 * operations are listed inline.
 *
 * All visible text can be overridden via `title`, `description`,
 * `operationLabels`, and `labels`. Defaults are English; pass overrides for
 * other locales.
 */
function PermissionModal({
  open,
  onOpenChange,
  request,
  onDecide,
  title,
  description,
  operationLabels,
  labels,
}: PermissionModalProps) {
  const opLabels = { ...defaultOperationLabels, ...operationLabels };
  const opsList = request.operations.map((op) => opLabels[op]).join(", ");
  const text = { ...defaultLabels, ...labels };

  const defaultTitle = (
    <span className="flex items-center gap-2">
      <ShieldAlert className="size-5 text-warning" aria-hidden />
      Allow Theo to {opsList} files in{" "}
      <code className="rounded-md bg-muted px-1.5 py-0.5 font-mono text-code-md text-primary">
        {request.path}
      </code>
      ?
    </span>
  );

  const defaultDescription = (
    <>
      This includes all files and subfolders. Theo will be able to {opsList} and may share the
      contents with connected third-party tools. Be careful when exposing confidential information.
    </>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <Dialog.Content className="max-w-xl">
        <Dialog.Header>
          <Dialog.Title>{title ?? defaultTitle}</Dialog.Title>
          <Dialog.Description>{description ?? defaultDescription}</Dialog.Description>
        </Dialog.Header>
        <Dialog.Body>
          <div className="flex items-start gap-3 rounded-md border border-border/40 bg-muted/40 p-3">
            <FolderOpen className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
            <div className="grid gap-1">
              <p className="font-mono text-code-sm text-foreground">{request.path}</p>
              <p className="flex items-center gap-1.5 font-sans text-label text-warning">
                <AlertTriangle className="size-3" aria-hidden />
                {text.requestedOps} {opsList}
              </p>
            </div>
          </div>
        </Dialog.Body>
        <Dialog.Footer>
          <Button variant="secondary" onClick={() => onDecide("denied")}>
            {text.cancel}
          </Button>
          <Button variant="ghost" onClick={() => onDecide("always_allowed")}>
            {text.always}
          </Button>
          <Button onClick={() => onDecide("allowed_once")}>{text.allow}</Button>
        </Dialog.Footer>
      </Dialog.Content>
    </Dialog>
  );
}

export { PermissionModal };
