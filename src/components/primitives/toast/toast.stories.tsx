import type { Story } from "@ladle/react";
import { Button } from "../button/button.js";
import { Toaster, useToast } from "./toaster.js";

export default { title: "Primitives / Foundations / Toast" };

function Trigger() {
  const { toast } = useToast();
  return (
    <div className="flex flex-wrap gap-2">
      <Button variant="secondary" onClick={() => toast({ title: "Plain notification" })}>
        Default
      </Button>
      <Button
        onClick={() =>
          toast({
            variant: "info",
            title: "New deployment available",
            description: "main · v1.4.2 ready to ship.",
          })
        }
      >
        Info
      </Button>
      <Button
        variant="accent"
        onClick={() =>
          toast({
            variant: "success",
            title: "Deploy succeeded",
            description: "Live at acme-api.usetheo.dev (24s).",
          })
        }
      >
        Success
      </Button>
      <Button
        variant="ghost"
        onClick={() =>
          toast({
            variant: "warning",
            title: "Permission required",
            description: "Theo wants to write to ~/Downloads/capturas.",
            action: { label: "Allow", onClick: () => undefined },
          })
        }
      >
        Warning + action
      </Button>
      <Button
        variant="destructive"
        onClick={() =>
          toast({
            variant: "destructive",
            title: "Deploy failed",
            description: "Build error on commit a2e9301.",
          })
        }
      >
        Destructive
      </Button>
    </div>
  );
}

export const Playground: Story = () => (
  <Toaster>
    <Trigger />
  </Toaster>
);
