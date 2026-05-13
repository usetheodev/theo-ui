import type { Story } from "@ladle/react";
import { Input } from "../input/input.js";
import { Label } from "./label.js";

export default { title: "Primitives / Foundations / Label" };

export const Variants: Story = () => (
  <div className="grid max-w-sm gap-4">
    <div className="grid gap-2">
      <Label htmlFor="name">Project name</Label>
      <Input id="name" placeholder="acme-api" />
    </div>
    <div className="grid gap-2">
      <Label htmlFor="email" required>
        Email
      </Label>
      <Input id="email" type="email" placeholder="you@usetheo.dev" />
    </div>
    <div className="grid gap-2 opacity-60">
      <Label htmlFor="readonly">Disabled field</Label>
      <Input id="readonly" placeholder="read-only" disabled />
    </div>
  </div>
);
