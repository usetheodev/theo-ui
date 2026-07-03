import { X } from "lucide-react";
import { Button } from "@theokit/ui";
import { TaskHeader } from "@theokit/ui";



export const Statuses = () => (
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
