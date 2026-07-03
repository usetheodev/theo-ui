import { BrowserControls } from "@theokit/ui";
import { useState } from "react";

export const Default = () => {
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
