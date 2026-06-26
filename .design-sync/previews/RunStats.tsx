import { RunStats } from "@theokit/ui";



export const Default = () => (
  <div className="grid gap-3">
    <RunStats duration="24s" tokens="35.7k" filesChanged={3} />
    <RunStats duration="1m 12s" tokens="120k" />
    <RunStats tokens="540" />
  </div>
);
