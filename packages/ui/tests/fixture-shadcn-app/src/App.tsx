import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CommandPalette } from "@/components/ui/command-palette";
import { type Deployment, DeploymentRow } from "@/components/blocks/deployment-row";
import { Dialog } from "@/components/ui/dialog";
import { Tabs } from "@/components/ui/tabs";
import { Toast } from "@/components/ui/toast";
import { Toaster } from "@/components/ui/toaster";
import { cn } from "@/lib/cn";
import type { Message } from "@/types/chat";
import type { IconComponent } from "@/lib/types";
import { useState } from "react";

const sample: Deployment = {
  id: "d1",
  status: "live",
  environment: "production",
  branch: "main",
  commitSha: "abc123",
  commitMessage: "feat",
  author: { name: "you" },
  duration: "1m",
  timeAgo: "1m ago",
};

const message: Message = { id: "m1", role: "user", content: "hi" };

export function App() {
  const [open, setOpen] = useState(false);
  // Touch every type to prove the rewrites resolved.
  const icon: IconComponent | undefined = undefined;
  return (
    <Toaster>
      <Card>
        <Card.Header>
          <Card.Title>Smoke</Card.Title>
        </Card.Header>
        <Card.Body className={cn("p-4")}>
          <Avatar size="md">
            <Avatar.Fallback>YO</Avatar.Fallback>
          </Avatar>
          <Button variant="primary" size="md" onClick={() => setOpen(true)}>
            Deploy
          </Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <Dialog.Content>
              <Dialog.Title>Title</Dialog.Title>
            </Dialog.Content>
          </Dialog>
          <Tabs defaultValue="a">
            <Tabs.List>
              <Tabs.Trigger value="a">A</Tabs.Trigger>
            </Tabs.List>
            <Tabs.Content value="a">Hello {message.content}</Tabs.Content>
          </Tabs>
          <DeploymentRow deployment={sample} />
          <CommandPalette
            open={false}
            onOpenChange={() => {}}
            items={[{ id: "x", label: "X", icon }]}
            onSelect={() => {}}
          />
          <Toast.Provider>
            <Toast.Viewport />
          </Toast.Provider>
        </Card.Body>
      </Card>
    </Toaster>
  );
}
