import type { Story } from "@ladle/react";
import { useState } from "react";
import { Button } from "../../primitives/button/index.js";
import { PermissionModal } from "./permission-modal.js";

export default { title: "Composites / Infra / PermissionModal" };

export const Default: Story = () => {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>Open permission modal</Button>
      <PermissionModal
        open={open}
        onOpenChange={setOpen}
        request={{
          path: "C:\\Users\\AlfredoAraujo\\Downloads\\capturas",
          operations: ["read", "write", "delete"],
        }}
        onDecide={(d) => {
          console.warn("decision", d);
          setOpen(false);
        }}
      />
    </>
  );
};
