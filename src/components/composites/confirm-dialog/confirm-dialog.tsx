"use client";

import { Loader2 } from "lucide-react";
import { forwardRef, useEffect, useRef, useState } from "react";
import type { KeyboardEvent, ReactNode } from "react";
import { Button } from "../../primitives/button/index.js";
import { Dialog } from "../../primitives/dialog/index.js";
import { Input } from "../../primitives/input/index.js";

/**
 * ConfirmDialog — controlled confirmation modal built on `Dialog`.
 *
 * Focuses Cancel on open (deliberate — NOT the destructive button).
 * `intent="destructive"` styles the confirm button with the destructive
 * variant. `confirmationPhrase` enables typed-confirmation guard:
 * the confirm button is disabled until the input value matches the
 * phrase exactly (case-sensitive). An empty string phrase is treated
 * as "no phrase required" (`!!confirmationPhrase`). Pressing Enter in
 * the input triggers confirm when `canConfirm` is true.
 *
 * `onConfirm` can be async. While the returned promise is pending,
 * both buttons are disabled and a `Loader2` spinner appears. On
 * resolve, the dialog closes via `onOpenChange(false)`. On reject,
 * the dialog stays open so the consumer can show their own error.
 *
 * @example
 *   <ConfirmDialog
 *     open={open} onOpenChange={setOpen}
 *     title="Delete project"
 *     description="This cannot be undone."
 *     intent="destructive"
 *     confirmationPhrase="my-project"
 *     onConfirm={async () => api.deleteProject(id)}
 *   />
 */
export interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  description: ReactNode;
  confirmLabel?: ReactNode;
  cancelLabel?: ReactNode;
  intent?: "default" | "destructive";
  confirmationPhrase?: string;
  onConfirm: () => void | Promise<void>;
  loading?: boolean;
}

const ConfirmDialog = forwardRef<HTMLDivElement, ConfirmDialogProps>(
  (
    {
      open,
      onOpenChange,
      title,
      description,
      confirmLabel = "Confirm",
      cancelLabel = "Cancel",
      intent = "default",
      confirmationPhrase,
      onConfirm,
      loading: externalLoading,
    },
    ref,
  ) => {
    const [phraseInput, setPhraseInput] = useState("");
    const [internalLoading, setInternalLoading] = useState(false);
    const cancelRef = useRef<HTMLButtonElement | null>(null);

    const phraseRequired = !!confirmationPhrase;
    const phraseMatched = phraseRequired ? phraseInput === confirmationPhrase : true;
    const showLoading = externalLoading === true || internalLoading;
    const canConfirm = phraseMatched && !showLoading;

    // Reset phrase input whenever the dialog closes.
    useEffect(() => {
      if (!open) setPhraseInput("");
    }, [open]);

    // Auto-focus Cancel on open (NOT confirm — destructive safety).
    useEffect(() => {
      if (open) {
        const id = window.setTimeout(() => cancelRef.current?.focus(), 0);
        return () => window.clearTimeout(id);
      }
    }, [open]);

    async function handleConfirm() {
      if (!canConfirm) return;
      setInternalLoading(true);
      try {
        await onConfirm();
        onOpenChange(false);
      } catch {
        // Stay open; consumer surfaces error.
      } finally {
        setInternalLoading(false);
      }
    }

    function handleInputKeyDown(e: KeyboardEvent<HTMLInputElement>) {
      if (e.key === "Enter" && canConfirm) {
        e.preventDefault();
        void handleConfirm();
      }
    }

    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <Dialog.Content ref={ref} data-slot="confirm-dialog">
          <Dialog.Header>
            <Dialog.Title>{title}</Dialog.Title>
            <Dialog.Description>{description}</Dialog.Description>
          </Dialog.Header>
          {phraseRequired ? (
            <Dialog.Body>
              <p className="mb-2 text-body-sm text-muted-foreground">
                Type{" "}
                <code className="rounded bg-muted px-1 py-0.5 font-mono text-foreground">
                  {confirmationPhrase}
                </code>{" "}
                to confirm
              </p>
              <Input
                value={phraseInput}
                onChange={(e) => setPhraseInput(e.target.value)}
                onKeyDown={handleInputKeyDown}
                autoComplete="off"
                aria-label="Confirmation phrase"
              />
            </Dialog.Body>
          ) : null}
          <Dialog.Footer>
            <Button
              ref={cancelRef}
              variant="secondary"
              onClick={() => onOpenChange(false)}
              disabled={showLoading}
            >
              {cancelLabel}
            </Button>
            <Button
              variant={intent === "destructive" ? "destructive" : "primary"}
              onClick={() => void handleConfirm()}
              disabled={!canConfirm}
              data-confirm
            >
              {showLoading ? <Loader2 aria-hidden="true" className="size-4 animate-spin" /> : null}
              {confirmLabel}
            </Button>
          </Dialog.Footer>
        </Dialog.Content>
      </Dialog>
    );
  },
);
ConfirmDialog.displayName = "ConfirmDialog";

export { ConfirmDialog };
