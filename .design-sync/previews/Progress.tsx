import { Progress } from "@theokit/ui";



export const Default = () => (
  <div className="w-72">
    <Progress value={42} max={100} aria-label="default" />
  </div>
);

export const Success = () => (
  <div className="w-72">
    <Progress value={100} intent="success" aria-label="deploy completed" />
  </div>
);

export const Warning = () => (
  <div className="w-72">
    <Progress value={92} intent="warning" aria-label="quota high" />
  </div>
);

export const Destructive = () => (
  <div className="w-72">
    <Progress value={100} intent="destructive" aria-label="failed step" />
  </div>
);

export const Indeterminate = () => (
  <div className="w-72">
    <Progress indeterminate aria-label="building" />
  </div>
);

export const Heights = () => (
  <div className="grid w-72 gap-3">
    <Progress value={60} height="h-1" aria-label="h-1" />
    <Progress value={60} height="h-1.5" aria-label="h-1.5" />
    <Progress value={60} height="h-2" aria-label="h-2" />
    <Progress value={60} height="h-3" aria-label="h-3" />
  </div>
);
