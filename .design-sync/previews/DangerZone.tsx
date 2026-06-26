import { Button, DangerZone } from "@theokit/ui";

export const SingleAction = () => (
  <div className="w-full max-w-2xl">
    <DangerZone>
      <DangerZone.Action
        title="Delete project"
        description="Permanently delete this project and all of its data. This cannot be undone."
        action={<Button variant="destructive">Delete project</Button>}
      />
    </DangerZone>
  </div>
);

export const MultipleActions = () => (
  <div className="w-full max-w-2xl">
    <DangerZone>
      <DangerZone.Action
        title="Delete project"
        description="Permanently delete this project and all its data."
        action={<Button variant="destructive">Delete</Button>}
      />
      <DangerZone.Action
        title="Transfer ownership"
        description="Move this project to another organization."
        action={<Button variant="secondary">Transfer</Button>}
      />
      <DangerZone.Action
        title="Reset all data"
        description="Wipe deployments, environments, and logs (keep the project shell)."
        action={<Button variant="destructive">Reset</Button>}
      />
    </DangerZone>
  </div>
);

export const CustomTitle = () => (
  <div className="w-full max-w-2xl">
    <DangerZone title="Irreversible Actions">
      <DangerZone.Action
        title="Cancel subscription"
        description="Your plan downgrades at the end of the billing cycle."
        action={<Button variant="destructive">Cancel</Button>}
      />
    </DangerZone>
  </div>
);
