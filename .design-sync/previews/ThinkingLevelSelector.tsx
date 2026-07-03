import { useState } from "react";

import { type ThinkingLevelOrInherited, ThinkingLevelSelector } from "@theokit/ui";



export const InheritedDefault = () => {
  const [value, setValue] = useState<ThinkingLevelOrInherited>("inherited");
  return <ThinkingLevelSelector value={value} inheritedValue="medium" onChange={setValue} />;
};

export const OverrideHigh = () => {
  const [value, setValue] = useState<ThinkingLevelOrInherited>("high");
  return <ThinkingLevelSelector value={value} inheritedValue="medium" onChange={setValue} />;
};

export const NoInheritedValue = () => {
  const [value, setValue] = useState<ThinkingLevelOrInherited>("inherited");
  return <ThinkingLevelSelector value={value} onChange={setValue} />;
};

export const Disabled = () => (
  <ThinkingLevelSelector value="medium" inheritedValue="medium" onChange={() => {}} disabled />
);
