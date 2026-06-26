import { GitBranch, Rocket } from "lucide-react";
import { Badge } from "@theokit/ui";
import { Button } from "@theokit/ui";
import { Card } from "@theokit/ui";



export const Basic = () => (
  <Card className="max-w-md">
    <Card.Header>
      <Card.Title>acme-api</Card.Title>
      <Card.Description>Production · main</Card.Description>
    </Card.Header>
    <Card.Body>
      <p className="text-body-sm text-muted-foreground">
        v1.2.0 deployed 2 hours ago. Last build succeeded in 24s.
      </p>
    </Card.Body>
    <Card.Footer>
      <Button variant="ghost" size="sm">
        View logs
      </Button>
      <Button size="sm">Redeploy</Button>
    </Card.Footer>
  </Card>
);

export const ProjectListing = () => (
  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
    {[
      { name: "acme-api", branch: "main", status: "success", version: "v1.2.0" },
      { name: "acme-web", branch: "main", status: "primary", version: "v0.9.3" },
      { name: "acme-worker", branch: "feature/queue", status: "warning", version: "v0.4.1" },
      { name: "acme-cli", branch: "main", status: "destructive", version: "—" },
    ].map((p) => (
      <Card key={p.name} className="transition-shadow hover:shadow-glow">
        <Card.Header>
          <div className="flex items-center justify-between">
            <Card.Title>{p.name}</Card.Title>
            <Badge variant={p.status as never}>
              <Badge.Dot
                tone={p.status as never}
                pulse={p.status === "primary" || p.status === "warning"}
              />
              {p.status === "success"
                ? "Live"
                : p.status === "primary"
                  ? "Building"
                  : p.status === "warning"
                    ? "Queued"
                    : "Failed"}
            </Badge>
          </div>
          <Card.Description className="flex items-center gap-2 font-mono">
            <GitBranch className="size-3" /> {p.branch}
          </Card.Description>
        </Card.Header>
        <Card.Body className="font-mono text-code-sm text-muted-foreground">{p.version}</Card.Body>
        <Card.Footer>
          <Button variant="ghost" size="sm">
            Logs
          </Button>
          <Button size="sm">
            <Rocket /> Deploy
          </Button>
        </Card.Footer>
      </Card>
    ))}
  </div>
);
