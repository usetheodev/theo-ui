import { AlertTriangle, FolderOpen, ShieldAlert } from "lucide-react";
import type { ReactNode } from "react";
import type { PermissionDecision, PermissionRequest } from "../../../types/permission.js";
import { Button } from "../../primitives/button/button.js";
import { Dialog } from "../../primitives/dialog/dialog.js";

interface PermissionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  request: PermissionRequest;
  /**
   * Fires when the user picks a decision. The modal does NOT auto-close;
   * caller decides whether the decision should dismiss the modal.
   */
  onDecide: (decision: PermissionDecision) => void;
  /**
   * Optional override of the modal copy. Defaults to localized PT-BR text matching the wiremocks.
   */
  title?: ReactNode;
  description?: ReactNode;
}

const operationLabel = {
  read: "ler",
  write: "editar",
  delete: "excluir permanentemente",
} as const;

/**
 * PermissionModal — local-files access prompt.
 *
 * Built on Dialog ✅. Three actions: Cancel (denied), Always allow, Allow once.
 * Per WIREMOCKS §5, the path is shown in the title (not hidden in body) and
 * destructive operations are listed inline.
 */
function PermissionModal({
  open,
  onOpenChange,
  request,
  onDecide,
  title,
  description,
}: PermissionModalProps) {
  const opsList = request.operations.map((op) => operationLabel[op]).join(", ");

  const defaultTitle = (
    <span className="flex items-center gap-2">
      <ShieldAlert className="size-5 text-warning" aria-hidden />
      Permitir que Theo {opsList} arquivos em{" "}
      <code className="rounded-md bg-muted px-1.5 py-0.5 font-mono text-code-md text-primary">
        {request.path}
      </code>
      ?
    </span>
  );

  const defaultDescription = (
    <>
      Isso inclui todos os arquivos e subpastas. O Theo poderá {opsList} e pode compartilhar o
      conteúdo com ferramentas de terceiros conectadas. Tenha cuidado ao expor informações
      confidenciais.
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
                Operações solicitadas: {opsList}
              </p>
            </div>
          </div>
        </Dialog.Body>
        <Dialog.Footer>
          <Button variant="secondary" onClick={() => onDecide("denied")}>
            Cancelar
          </Button>
          <Button variant="ghost" onClick={() => onDecide("always_allowed")}>
            Sempre permitir
          </Button>
          <Button onClick={() => onDecide("allowed_once")}>Permitir uma vez</Button>
        </Dialog.Footer>
      </Dialog.Content>
    </Dialog>
  );
}

export { PermissionModal };
