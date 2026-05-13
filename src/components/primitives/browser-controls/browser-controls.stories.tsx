import type { Story } from "@ladle/react";
import { useState } from "react";
import { BrowserControls } from "./browser-controls.js";

export default { title: "Primitives / Code / BrowserControls" };

export const Default: Story = () => {
  const [url, setUrl] = useState("http://localhost:5173/");
  return (
    <div className="max-w-3xl overflow-hidden rounded-xl border bg-card">
      <BrowserControls
        url={url}
        onUrlChange={setUrl}
        onBack={() => undefined}
        onForward={() => undefined}
        onReload={() => undefined}
      />
      <div className="grid h-48 place-items-center bg-muted/30 font-mono text-muted-foreground">
        [preview iframe slot]
      </div>
    </div>
  );
};
