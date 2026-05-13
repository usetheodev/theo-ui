import type { Story } from "@ladle/react";
import { useState } from "react";
import { Label } from "../label/label.js";
import { Checkbox } from "./checkbox.js";

export default { title: "Primitives / Foundations / Checkbox" };

export const States: Story = () => {
  const [a, setA] = useState(true);
  const [b, setB] = useState<boolean | "indeterminate">("indeterminate");
  return (
    <div className="grid gap-3">
      <div className="flex items-center gap-2">
        <Checkbox id="off" />
        <Label htmlFor="off">Unchecked</Label>
      </div>
      <div className="flex items-center gap-2">
        <Checkbox id="on" checked={a} onCheckedChange={(v) => setA(v === true)} />
        <Label htmlFor="on">Controlled · checked</Label>
      </div>
      <div className="flex items-center gap-2">
        <Checkbox id="indet" checked={b} onCheckedChange={(v) => setB(v)} />
        <Label htmlFor="indet">Tri-state · indeterminate</Label>
      </div>
      <div className="flex items-center gap-2">
        <Checkbox id="disabled" disabled />
        <Label htmlFor="disabled">Disabled</Label>
      </div>
    </div>
  );
};
