import { useState } from "react";
import { Select } from "@theokit/ui";



export const Grouped = () => {
  const [v, setV] = useState("");
  return (
    <div className="max-w-xs">
      <Select value={v} onValueChange={setV}>
        <Select.Trigger>
          <Select.Value placeholder="Pick a region…" />
        </Select.Trigger>
        <Select.Content>
          <Select.Group>
            <Select.Label>Americas</Select.Label>
            <Select.Item value="iad1">Washington, DC (iad1)</Select.Item>
            <Select.Item value="gru1">São Paulo (gru1)</Select.Item>
            <Select.Item value="sfo1">San Francisco (sfo1)</Select.Item>
          </Select.Group>
          <Select.Separator />
          <Select.Group>
            <Select.Label>Europe</Select.Label>
            <Select.Item value="fra1">Frankfurt (fra1)</Select.Item>
            <Select.Item value="lhr1">London (lhr1)</Select.Item>
          </Select.Group>
          <Select.Separator />
          <Select.Group>
            <Select.Label>Asia</Select.Label>
            <Select.Item value="sin1">Singapore (sin1)</Select.Item>
            <Select.Item value="hnd1" disabled>
              Tokyo (hnd1) — coming soon
            </Select.Item>
          </Select.Group>
        </Select.Content>
      </Select>
    </div>
  );
};
