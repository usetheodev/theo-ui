import { Button } from "@theokit/ui";
import { Sheet } from "@theokit/ui";



function Demo({ side }: { side: "right" | "left" | "top" | "bottom" }) {
  return (
    <Sheet>
      <Sheet.Trigger asChild>
        <Button variant="secondary">Open {side}</Button>
      </Sheet.Trigger>
      <Sheet.Content side={side}>
        <Sheet.Header>
          <Sheet.Title>Memory</Sheet.Title>
          <Sheet.Description>
            Episodes, wiki pages and settings for the agent's durable memory.
          </Sheet.Description>
        </Sheet.Header>
        <Sheet.Body>
          <p className="text-body-md">
            This is a side panel anchored to the {side} edge. Use it for workspace overlays,
            settings, and contextual filters.
          </p>
          <ul className="mt-4 list-disc space-y-1 pl-5 text-body-sm text-muted-foreground">
            <li>Modal: blocks the main pane behind a backdrop.</li>
            <li>Slides in from the chosen edge.</li>
            <li>Closes with Esc, overlay click, or the X button.</li>
          </ul>
        </Sheet.Body>
        <Sheet.Footer>
          <Sheet.Close asChild>
            <Button variant="ghost">Cancel</Button>
          </Sheet.Close>
          <Sheet.Close asChild>
            <Button>Apply</Button>
          </Sheet.Close>
        </Sheet.Footer>
      </Sheet.Content>
    </Sheet>
  );
}

export const Sides = () => (
  <div className="flex flex-wrap gap-3">
    <Demo side="right" />
    <Demo side="left" />
    <Demo side="top" />
    <Demo side="bottom" />
  </div>
);
