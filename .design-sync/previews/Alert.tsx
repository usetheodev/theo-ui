import { Button } from "@theokit/ui";
import { Alert } from "@theokit/ui";



export const Intents = () => (
  <div className="flex flex-col gap-3" style={{ width: 480 }}>
    <Alert intent="info" title="Heads up" description="A new version is available." />
    <Alert intent="success" title="Saved" description="Your changes have been published." />
    <Alert
      intent="warning"
      title="Verify your email"
      description="Click the link we sent to unlock all features."
    />
    <Alert
      intent="destructive"
      title="Deploy failed"
      description="Build exited with code 1. Check the logs."
    />
  </div>
);

export const TitleOnly = () => (
  <div style={{ width: 480 }}>
    <Alert intent="info" title="System will be in maintenance Friday 2-4am UTC" />
  </div>
);

export const WithDescription = () => (
  <div style={{ width: 480 }}>
    <Alert intent="warning" description="You're at 90% of your monthly build minutes." />
  </div>
);

export const WithAction = () => (
  <div style={{ width: 480 }}>
    <Alert
      intent="warning"
      title="Verify your email"
      description="We sent a link to your email. Click it to unlock all features."
      action={
        <Button size="sm" onClick={() => undefined}>
          Resend
        </Button>
      }
    />
  </div>
);

export const Dismissible = () => (
  <div style={{ width: 480 }}>
    <Alert
      intent="info"
      title="New plan available"
      description="The Team plan now includes audit log retention."
      onDismiss={() => undefined}
    />
  </div>
);
