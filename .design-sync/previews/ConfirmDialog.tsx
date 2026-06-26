import { useState } from "react";
import { Button } from "@theokit/ui";
import { ConfirmDialog } from "@theokit/ui";



export const DefaultDialog = () => {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>Open</Button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title="Discard changes?"
        description="Your changes will be lost."
        onConfirm={() => setOpen(false)}
      />
    </>
  );
};

export const Destructive = () => {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="destructive" onClick={() => setOpen(true)}>
        Delete
      </Button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title="Delete project"
        description="This will permanently delete the project and all its data."
        intent="destructive"
        confirmLabel="Delete project"
        onConfirm={() => undefined}
      />
    </>
  );
};

export const WithPhrase = () => {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="destructive" onClick={() => setOpen(true)}>
        Delete account
      </Button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title="Delete account"
        description="Permanently delete your account and all associated data."
        intent="destructive"
        confirmationPhrase="delete my account"
        confirmLabel="Delete account"
        onConfirm={() => undefined}
      />
    </>
  );
};

export const AsyncLoading = () => {
  const [open, setOpen] = useState(false);
  const handleConfirm = () =>
    new Promise<void>((resolve) => {
      window.setTimeout(resolve, 2000);
    });
  return (
    <>
      <Button onClick={() => setOpen(true)}>Process</Button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title="Process payment"
        description="Charge $42.00 to your card?"
        confirmLabel="Pay"
        onConfirm={handleConfirm}
      />
    </>
  );
};
