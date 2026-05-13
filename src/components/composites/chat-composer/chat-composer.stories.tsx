import type { Story } from "@ladle/react";
import { useState } from "react";
import { FolderSelector } from "../../primitives/folder-selector/folder-selector.js";
import { ModelSelector } from "../../primitives/model-selector/model-selector.js";
import { ChatComposer } from "./chat-composer.js";

export default { title: "Composites / Chat / ChatComposer" };

const MODELS = [
  { id: "opus-4-7", label: "Opus 4.7", tag: "smart" },
  { id: "sonnet-4-6", label: "Sonnet 4.6", tag: "default" },
];

export const Chat: Story = () => {
  const [v, setV] = useState("");
  const [m, setM] = useState("sonnet-4-6");
  return (
    <ChatComposer
      className="max-w-2xl"
      value={v}
      onValueChange={setV}
      onSubmit={(x) => console.log("submit", x)}
      trailingActions={<ModelSelector value={m} onChange={setM} options={MODELS} />}
    />
  );
};

export const Infra: Story = () => {
  const [v, setV] = useState("");
  const [m, setM] = useState("sonnet-4-6");
  return (
    <ChatComposer
      mode="infra"
      className="max-w-2xl"
      value={v}
      onValueChange={setV}
      contextSlot={<FolderSelector path="~/Downloads/capturas" className="w-full" />}
      trailingActions={<ModelSelector value={m} onChange={setM} options={MODELS} />}
    />
  );
};

export const Code: Story = () => {
  const [v, setV] = useState("/");
  return (
    <ChatComposer
      mode="code"
      className="max-w-2xl"
      value={v}
      onValueChange={setV}
      placeholder="Type / for commands"
    />
  );
};

export const Running: Story = () => {
  const [v, setV] = useState("Deploy to production");
  return (
    <ChatComposer
      className="max-w-2xl"
      value={v}
      onValueChange={setV}
      running
      onStop={() => undefined}
    />
  );
};
