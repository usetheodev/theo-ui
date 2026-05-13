import type { Story } from "@ladle/react";
import { X } from "lucide-react";
import { Button } from "../../primitives/button/button.js";
import { TaskHeader } from "./task-header.js";

export default { title: "Composites / Agent / TaskHeader" };

export const Statuses: Story = () => (
  <div className="grid max-w-2xl gap-3">
    <TaskHeader title="Organize as capturas de tela" status="idle" />
    <TaskHeader title="Pedindo permissão de acesso" status="permission_required" />
    <TaskHeader title="Bootstrapping environment" status="starting" />
    <TaskHeader
      title="Organize as capturas de tela"
      status="running"
      onToggle={() => undefined}
      actions={
        <Button size="icon" variant="ghost" aria-label="Close">
          <X />
        </Button>
      }
    />
    <TaskHeader title="Create expense report" status="completed" />
    <TaskHeader title="Deploy failed" status="failed" />
  </div>
);
