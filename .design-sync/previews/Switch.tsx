import { useState } from "react";
import { Label } from "@theokit/ui";
import { Switch } from "@theokit/ui";



export const Settings = () => {
  const [autoAccept, setAutoAccept] = useState(true);
  const [notify, setNotify] = useState(false);
  return (
    <div className="grid max-w-sm gap-4 rounded-xl border bg-card p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="grid gap-0.5">
          <Label htmlFor="autoaccept">Auto-accept edits</Label>
          <span className="text-body-sm text-muted-foreground">
            Approve every agent file change without prompting.
          </span>
        </div>
        <Switch id="autoaccept" checked={autoAccept} onCheckedChange={setAutoAccept} />
      </div>
      <div className="flex items-center justify-between gap-3">
        <div className="grid gap-0.5">
          <Label htmlFor="notify">Deploy notifications</Label>
          <span className="text-body-sm text-muted-foreground">
            Email me when a deploy succeeds or fails.
          </span>
        </div>
        <Switch id="notify" checked={notify} onCheckedChange={setNotify} />
      </div>
      <div className="flex items-center justify-between gap-3 opacity-60">
        <Label htmlFor="beta">Beta features (disabled)</Label>
        <Switch id="beta" disabled />
      </div>
    </div>
  );
};
