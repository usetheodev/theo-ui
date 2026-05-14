import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";

export function App() {
  return (
    <div className={cn("p-4")}>
      <Button variant="primary" size="md">
        Deploy
      </Button>
    </div>
  );
}
