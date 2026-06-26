import { Clock, Rocket, Wrench } from "lucide-react";
import { StatTile } from "@theokit/ui";



export const Simple = () => (
  <div className="w-72">
    <StatTile value="42" label="Projects" />
  </div>
);

export const WithIconAndDelta = () => (
  <div className="w-72">
    <StatTile
      value="128"
      label="Deploys this week"
      icon={Rocket}
      delta={{ value: "+12% vs last week", trend: "up" }}
    />
  </div>
);

export const Clickable = () => (
  <div className="w-72">
    <StatTile
      value="1m 24s"
      label="Avg build duration"
      icon={Clock}
      delta={{ value: "−8s", trend: "down" }}
      onClick={() => alert("open builds")}
    />
  </div>
);

export const GridOfThree = () => (
  <div className="grid w-full max-w-4xl grid-cols-3 gap-4">
    <StatTile value="42" label="Projects" icon={Rocket} />
    <StatTile
      value="128"
      label="Deploys"
      icon={Wrench}
      delta={{ value: "+12%", trend: "up" }}
      onClick={() => undefined}
    />
    <StatTile
      value="1m 24s"
      label="Avg build"
      icon={Clock}
      delta={{ value: "−8s", trend: "down" }}
    />
  </div>
);
