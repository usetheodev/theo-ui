import { Badge, Button, Card, Input, Select, Textarea, useDensity } from "@theokit/ui";

/**
 * DensityDemo — shows how `useDensity` toggles the global control density
 * without rewriting any `size` prop on the form controls below.
 *
 * `sm` and `lg` rows stay invariant — only `md` (the default tier) moves.
 */
export function DensityDemo() {
  const { density, setDensity } = useDensity();

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <header className="space-y-2">
        <h1 className="font-display text-title-lg tracking-tight">Density playground</h1>
        <p className="text-body-md text-muted-foreground">
          Toggle the global density. Notice that <code>sm</code> and <code>lg</code> rows do NOT
          change — only the <code>md</code> tier (which reads CSS vars) moves.
        </p>
        <div className="flex gap-2">
          {(["compact", "comfortable", "spacious"] as const).map((d) => (
            <Button
              key={d}
              size="sm"
              variant={density === d ? "primary" : "ghost"}
              onClick={() => setDensity(d)}
            >
              {d}
            </Button>
          ))}
          <span className="ml-auto text-body-sm text-muted-foreground">
            current: <code>{density}</code>
          </span>
        </div>
      </header>

      <Card>
        <Card.Header>
          <Card.Title>Form controls — three sizes</Card.Title>
          <Card.Description>
            Each row renders `sm` / `md` / `lg` side-by-side. Only `md` reacts to density.
          </Card.Description>
        </Card.Header>
        <Card.Body>
          <div className="grid grid-cols-3 gap-3">
            <Button size="sm">Save (sm)</Button>
            <Button size="md">Save (md)</Button>
            <Button size="lg">Save (lg)</Button>

            <Input size="sm" placeholder="sm" />
            <Input size="md" placeholder="md" />
            <Input size="lg" placeholder="lg" />

            <Select>
              <Select.Trigger size="sm" aria-label="region-sm">
                <Select.Value placeholder="sm" />
              </Select.Trigger>
            </Select>
            <Select>
              <Select.Trigger size="md" aria-label="region-md">
                <Select.Value placeholder="md" />
              </Select.Trigger>
            </Select>
            <Select>
              <Select.Trigger size="lg" aria-label="region-lg">
                <Select.Value placeholder="lg" />
              </Select.Trigger>
            </Select>
          </div>
        </Card.Body>
        <Card.Footer>
          <Badge variant="primary">FAANG density</Badge>
          <Badge variant="success">36px default</Badge>
        </Card.Footer>
      </Card>

      <Card>
        <Card.Header>
          <Card.Title>Textarea</Card.Title>
        </Card.Header>
        <Card.Body>
          <Textarea placeholder="md textarea — px also reacts to density" />
        </Card.Body>
      </Card>
    </div>
  );
}
