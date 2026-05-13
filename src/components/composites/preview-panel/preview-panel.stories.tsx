import type { Story } from "@ladle/react";
import { BuildLogStream } from "../../primitives/build-log-stream/build-log-stream.js";
import { PreviewPanel } from "./preview-panel.js";

export default { title: "Composites / Code / PreviewPanel" };

export const WithLogs: Story = () => (
  <PreviewPanel
    className="h-[520px] w-full max-w-3xl"
    url="http://localhost:5173/"
    onReload={() => undefined}
    content={
      <div className="grid h-full place-items-center bg-muted/30 font-mono text-muted-foreground">
        [preview iframe slot]
      </div>
    }
    logsSlot={
      <BuildLogStream
        filterable={false}
        height="160px"
        lines={[
          {
            id: "1",
            timestamp: "10:01:32",
            level: "info",
            source: "vite",
            message: "ready in 312ms",
          },
          { id: "2", timestamp: "10:01:44", level: "success", source: "tsc", message: "types ok" },
          { id: "3", timestamp: "10:01:58", level: "info", source: "vite", message: "hmr update" },
        ]}
      />
    }
  />
);
