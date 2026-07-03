import { Tabs } from "@theokit/ui";



export const ProjectView = () => (
  <Tabs defaultValue="overview" className="w-full max-w-2xl">
    <Tabs.List>
      <Tabs.Trigger value="overview">Overview</Tabs.Trigger>
      <Tabs.Trigger value="deployments">Deployments</Tabs.Trigger>
      <Tabs.Trigger value="logs">Logs</Tabs.Trigger>
      <Tabs.Trigger value="env">Environment</Tabs.Trigger>
      <Tabs.Trigger value="settings">Settings</Tabs.Trigger>
    </Tabs.List>
    <Tabs.Content value="overview" className="rounded-xl border bg-card p-6">
      <h3 className="font-display text-title-lg">acme-api</h3>
      <p className="mt-2 text-body-sm text-muted-foreground">
        Production · main · v1.2.0 deployed 2 hours ago.
      </p>
    </Tabs.Content>
    <Tabs.Content value="deployments" className="rounded-xl border bg-card p-6">
      <p className="text-body-sm text-muted-foreground">3 deployments in the last 24 hours.</p>
    </Tabs.Content>
    <Tabs.Content value="logs" className="rounded-xl border bg-card p-6 font-mono text-code-sm">
      <p>10:01:32 [info] starting build…</p>
      <p>10:01:44 [info] ✓ types ok</p>
      <p className="text-success">10:01:58 [info] ✓ deploy succeeded</p>
    </Tabs.Content>
    <Tabs.Content value="env" className="rounded-xl border bg-card p-6">
      <p className="text-body-sm text-muted-foreground">
        12 environment variables across 3 environments.
      </p>
    </Tabs.Content>
    <Tabs.Content value="settings" className="rounded-xl border bg-card p-6">
      <p className="text-body-sm text-muted-foreground">Project settings, danger zone.</p>
    </Tabs.Content>
  </Tabs>
);
