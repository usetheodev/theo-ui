import type { Story } from "@ladle/react";
import { useState } from "react";

import { type ThinkingLevelOrInherited, ThinkingLevelSelector } from "./thinking-level-selector.js";

export default { title: "Primitives / Agent / ThinkingLevelSelector" };

export const InheritedDefault: Story = () => {
  const [value, setValue] = useState<ThinkingLevelOrInherited>("inherited");
  return <ThinkingLevelSelector value={value} inheritedValue="medium" onChange={setValue} />;
};

export const OverrideHigh: Story = () => {
  const [value, setValue] = useState<ThinkingLevelOrInherited>("high");
  return <ThinkingLevelSelector value={value} inheritedValue="medium" onChange={setValue} />;
};

export const NoInheritedValue: Story = () => {
  const [value, setValue] = useState<ThinkingLevelOrInherited>("inherited");
  return <ThinkingLevelSelector value={value} onChange={setValue} />;
};

export const Disabled: Story = () => (
  <ThinkingLevelSelector value="medium" inheritedValue="medium" onChange={() => {}} disabled />
);
