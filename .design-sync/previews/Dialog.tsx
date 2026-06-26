import { ShieldAlert, Trash2 } from "lucide-react";
import { Button } from "@theokit/ui";
import { Dialog } from "@theokit/ui";



export const DeleteConfirmation = () => (
  <Dialog>
    <Dialog.Trigger asChild>
      <Button variant="destructive">
        <Trash2 /> Delete project
      </Button>
    </Dialog.Trigger>
    <Dialog.Content>
      <Dialog.Header>
        <Dialog.Title>Delete acme-api?</Dialog.Title>
        <Dialog.Description>
          This action is irreversible. All deployments, logs and secrets will be permanently
          removed.
        </Dialog.Description>
      </Dialog.Header>
      <Dialog.Body>
        <p>
          Type <code className="rounded-sm bg-muted px-1 font-mono">acme-api</code> to confirm.
        </p>
      </Dialog.Body>
      <Dialog.Footer>
        <Dialog.Close asChild>
          <Button variant="secondary">Cancel</Button>
        </Dialog.Close>
        <Button variant="destructive">Delete forever</Button>
      </Dialog.Footer>
    </Dialog.Content>
  </Dialog>
);

export const PermissionRequest = () => (
  <Dialog>
    <Dialog.Trigger asChild>
      <Button>
        <ShieldAlert /> Request file access
      </Button>
    </Dialog.Trigger>
    <Dialog.Content>
      <Dialog.Header>
        <Dialog.Title>
          Allow Theo to modify files in <code className="text-primary">~/Downloads/captures</code>?
        </Dialog.Title>
        <Dialog.Description>
          Includes all files and subfolders. Theo will be able to read, edit and delete files
          permanently, and may share contents with third-party tools it connects to.
        </Dialog.Description>
      </Dialog.Header>
      <Dialog.Footer>
        <Dialog.Close asChild>
          <Button variant="secondary">Cancel</Button>
        </Dialog.Close>
        <Dialog.Close asChild>
          <Button variant="ghost">Allow once</Button>
        </Dialog.Close>
        <Button>Always allow</Button>
      </Dialog.Footer>
    </Dialog.Content>
  </Dialog>
);
